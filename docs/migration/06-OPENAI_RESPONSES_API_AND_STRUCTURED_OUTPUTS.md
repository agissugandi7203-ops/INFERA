# OpenAI Responses API & Structured Model Outputs

Dokumen ini mendokumentasikan spesifikasi implementasi **OpenAI Responses API** dan **Structured Outputs** pada platform **INFERA (Intelligent Fraud & Risk Analysis Agent)**. Dokumen ini menjadi acuan teknis transisi dari Chat Completions API warisan (*legacy*) menuju Responses API modern untuk generasi teks, penalaran (*reasoning*), serta ekstraksi data analitik terstruktur berkecepatan tinggi.

---

## 1. Evolusi: Chat Completions API vs Responses API

OpenAI memperkenalkan **Responses API** (`/v1/responses`) sebagai antarmuka generasi teks standar masa depan, dirancang khusus untuk memaksimalkan kapabilitas model *reasoning* (seperti `gpt-6-astra`) dan model teks berlatensi rendah (`gpt-6-luna`).

### Perbandingan Arsitektur:

```
Legacy (Chat Completions):
[User Input] ──► POST /v1/chat/completions ──► { choices: [{ message: { content } }] }

Modern (Responses API):
[User Input] ──► POST /v1/responses ──► { output: [ { type: "message", content: [...] } ], output_text }
                                      └── Dukungan Native Reasoning Tokens & Strict JSON Schema
```

### Keunggulan Utama Responses API:
1. **Performa Penalaran Optimal:** Model *reasoning* menunjukkan kecerdasan dan kepatuhan instruksi lebih tinggi saat diakses melalui Responses API dibanding endpoint chat biasa.
2. **Properti `output_text` Terpadu:** SDK resmi menyediakan shortcut `output_text` yang menggabungkan seluruh teks tergenerasi secara otomatis tanpa perlu parsing manual array chunk yang rapuh.
3. **Pemisahan Instruksi Tingkat Sistem (`instructions`):** Parameter `instructions` memiliki hierarki otoritas lebih tinggi daripada `input` pengguna, memastikan aturan investigasi dan kepatuhan hukum BPJS (Permenkes 16/2019) tidak dapat di-*bypass* oleh prompt injection.
4. **Version Prompts in Code:** OpenAI mendepresiasi objek prompt yang tersimpan di cloud (penghentian penuh `v1/prompts` per November 2026). Semua prompt audit INFERA kini dikelola secara *type-safe* langsung di dalam repositori kode.

---

## 2. Inisiasi Panggilan Respons Dasar

### A. Contoh Node.js / TypeScript:
```typescript
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const response = await client.responses.create({
  model: 'gpt-6-astra',
  input: 'Tuliskan kesimpulan 1 kalimat mengenai anomali klaim RSUD Dr. Soetomo.',
});

console.log(response.output_text);
```

### B. Contoh cURL REST API:
```bash
curl "https://api.openai.com/v1/responses" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -d '{
    "model": "gpt-6-astra",
    "input": "Tuliskan kesimpulan 1 kalimat mengenai anomali klaim RSUD Dr. Soetomo."
  }'
```

### Struktur Objek `output`:
Array `output` dapat berisi lebih dari satu elemen (termasuk *tool calls*, token reasoning, dan pesan teks). Tidak aman mengasumsikan teks selalu berada pada `output[0].content[0].text`. Gunakan helper SDK `output_text` atau lakukan pencarian elemen ber-tipe `message`.

```json
[
  {
    "id": "msg_67b73f697ba4819183a15cc17d011509",
    "type": "message",
    "role": "assistant",
    "content": [
      {
        "type": "output_text",
        "text": "Berdasarkan audit forensik, RSUD Dr. Soetomo terdeteksi memiliki lonjakan klaim phantom billing pada poli jantung sebesar 42%.",
        "annotations": []
      }
    ]
  }
]
```

---

## 3. Hierarki Instruksi & Parameter `instructions`

Responses API memisahkan instruksi developer dari input pengguna melalui parameter `instructions` dan hierarki pesan:

```typescript
const response = await client.responses.create({
  model: 'gpt-6-astra',
  reasoning: { effort: 'low' },
  instructions: `Anda adalah FERA, auditor forensik AI resmi BPJS Kesehatan RI. 
Patuhi Permenkes No. 16 Tahun 2019 dan fokus pada 4 modus kecurangan. Jawab secara tegas, objektif, dan berbasis data.`,
  input: 'Apakah pasien P-10294 boleh mengambil obat PRB hipertensi di dua apotek berbeda dalam selang 3 hari?',
});

console.log(response.output_text);
```

### Matriks Otoritas Peran Pesan:
| Peran (*Role*) | Otoritas | Deskripsi Fungsi |
| :--- | :--- | :--- |
| `developer` / `instructions` | **Tertinggi** | Aturan bisnis, logika hukum, persona auditor, batasan kepatuhan. |
| `user` | **Menengah** | Pertanyaan, parameter masukan, kueri filter dari pengguna atau auditor. |
| `assistant` | **Generatif** | Hasil penalaran dan sintesis jawaban yang dikeluarkan oleh model AI. |

---

## 4. Structured Outputs: Kepatuhan Mutlak Skema JSON

JSON adalah standar pertukaran data utama dalam analitik forensik INFERA. Fitur **Structured Outputs** menjamin model **selalu menghasilkan JSON yang 100% patuh pada skema** (`strict: true`), mengeliminasi risiko field yang hilang, kesalahan tipe data, atau nilai enum yang tidak valid.

### Kapan Menggunakan Structured Outputs via `text.format` vs Function Calling?
- **Function Calling (`tools`):** Digunakan ketika model perlu memanggil fungsi lokal di backend (misal: query database klaim, hitung Haversine distance, atau kirim alert ke verifikator).
- **Structured Outputs (`text.format`):** Digunakan ketika model menghasilkan data terstruktur langsung untuk konsumsi antarmuka pengguna (UI), widget kartu anomali, tabel investigasi, atau laporan audit formal.

### Structured Outputs vs JSON Mode Klasik:
| Fitur | Structured Outputs | JSON Mode Klasik |
| :--- | :--- | :--- |
| **Output JSON Valid** | Ya | Ya |
| **Pasti Patuh Skema JSON** | **Ya (100% Strict Garansi)** | Tidak (bisa halusinasi field/tipe) |
| **Tipe Data SDK Terintegrasi** | Zod (`zodTextFormat`) / Pydantic | Validasi manual pasca-respons |
| **Penanganan Refusal Eksplisit** | Tersedia properti `refusal` terpisah | Tercampur dalam string JSON |
| **Model yang Didukung** | `gpt-6-astra`, `gpt-6-luna` | Model legasi (`gpt-3.5-turbo`, dsb) |

---

## 5. Implementasi Structured Outputs pada Kasus INFERA

### A. Ekstraksi Analisis Forensik Kasus (Zod Schema)
Berikut implementasi skema forensik INFERA menggunakan pustaka `zod`:

```typescript
import OpenAI from 'openai';
import { zodTextFormat } from 'openai/helpers/zod';
import { z } from 'zod';

const client = new OpenAI();

// Definisi skema penelusuran kecurangan 4 modus
const ForensicAuditDossier = z.object({
  participantId: z.string().describe('ID unik peserta BPJS'),
  riskScore: z.number().min(0).max(1).describe('Skor risiko agregat 0.0 - 1.0'),
  riskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  identifiedModuses: z.array(
    z.enum([
      'MODUS_1_IDENTITY_FALSIFICATION',
      'MODUS_2_CARD_SHARING_IMPOSSIBLE_TRAVEL',
      'MODUS_3_DOCTOR_SHOPPING_UNNECESSARY_SERVICES',
      'MODUS_4_MEDICATION_DEVICE_ARBITRAGE',
    ])
  ),
  findings: z.array(
    z.object({
      evidenceTitle: z.string(),
      description: z.string(),
      metricValue: z.number().nullable(),
      violatesRegulation: z.string().describe('Pasal Permenkes 16/2019 atau aturan BPJS terkait'),
    })
  ),
  recommendedAction: z.enum(['APPROVE_CLAIM', 'REQUEST_MEDICAL_RESUME', 'FIELD_VERIFICATION', 'REJECT_AND_FREEZE']),
  financialRiskExposureRp: z.number().describe('Estimasi potensi kerugian finansial Dana Jaminan Sosial'),
});

const response = await client.responses.parse({
  model: 'gpt-6-astra',
  input: [
    {
      role: 'system',
      content: 'Anda adalah sistem analisis forensik otomatis INFERA. Ekstrak data kasus klaim ke dalam format audit terstruktur.',
    },
    {
      role: 'user',
      content: `Peserta P-89211 tercatat melakukan klaim rawat jalan di RS Hermina Depok pukul 08:30 WIB (Diagnosa I10 - Hipertensi primer). 
Pada hari yang sama pukul 09:15 WIB, kartu yang sama digunakan di RSUP Hasan Sadikin Bandung untuk layanan poli jantung. Jarak antar faskes 148 km. Nilai klaim total Rp 4.850.000.`,
    },
  ],
  text: {
    format: zodTextFormat(ForensicAuditDossier, 'forensic_audit_dossier'),
  },
});

const auditResult = response.output_parsed;
console.log('Tingkat Risiko:', auditResult.riskLevel);
console.log('Modus Terdeteksi:', auditResult.identifiedModuses);
console.log('Tindakan Rekomendasi:', auditResult.recommendedAction);
```

#### Hasil Ekstraksi JSON yang Dihasilkan:
```json
{
  "participantId": "P-89211",
  "riskScore": 0.96,
  "riskLevel": "CRITICAL",
  "identifiedModuses": [
    "MODUS_2_CARD_SHARING_IMPOSSIBLE_TRAVEL"
  ],
  "findings": [
    {
      "evidenceTitle": "Impossible Travel Velocity Anomaly",
      "description": "Penggunaan kartu simultan Depok-Bandung dalam selang 45 menit (jarak 148 km) menghasilkan kecepatan tempuh 197 km/jam.",
      "metricValue": 197.33,
      "violatesRegulation": "Permenkes No. 16 Tahun 2019 Pasal 5 (Penyalahgunaan Identitas Peserta JKN)"
    }
  ],
  "recommendedAction": "REJECT_AND_FREEZE",
  "financialRiskExposureRp": 4850000
}
```

---

### B. Penalaran Berurutan (*Chain-of-Thought Reasoning*)
Untuk memberikan transparansi audit yang dapat dipertanggungjawabkan di pengadilan atau sidang audit BPK:

```typescript
const AuditReasoning = z.object({
  steps: z.array(
    z.object({
      stepNumber: z.number(),
      analyticalHypothesis: z.string(),
      calculationOrRuleApplied: z.string(),
      intermediateConclusion: z.string(),
    })
  ),
  finalVerdict: z.string(),
});
```

---

## 6. Streaming Structured Outputs

Pada antarmuka web, menampilkan data JSON terstruktur secara streaming memungkinkan UI merender tabel atau kartu metrik field demi field secara progresif tanpa menunggu seluruh objek selesai:

```typescript
import { OpenAI } from 'openai';
import { zodTextFormat } from 'openai/helpers/zod';

const stream = client.responses.stream({
  model: 'gpt-6-astra',
  input: [{ role: 'user', content: 'Analisis potensi fraud klaim P-10294' }],
  text: {
    format: zodTextFormat(ForensicAuditDossier, 'forensic_dossier'),
  },
});

stream.on('response.output_text.delta', (event) => {
  process.stdout.write(event.delta);
});

stream.on('response.refusal.delta', (event) => {
  console.warn('Model menolak permintaan:', event.delta);
});

stream.on('response.completed', () => {
  console.log('\n[Stream Selesai]');
});

const finalData = await stream.finalResponse();
```

---

## 7. Penanganan Kasus Tepi (*Edge Cases & Refusals*)

Model AI dapat menolak memenuhi permintaan jika masukan dinilai melanggar kebijakan keselamatan, atau jika kuota token maksimum (`max_output_tokens`) terlampaui sehingga JSON terputus di tengah jalan.

### Kode Penanganan Komprehensif:
```typescript
try {
  const response = await client.responses.create({
    model: 'gpt-6-astra',
    input: [{ role: 'user', content: inputKlaim }],
    max_output_tokens: 1500,
    text: {
      format: {
        type: 'json_schema',
        name: 'forensic_audit',
        schema: rawJsonSchema,
        strict: true,
      },
    },
  });

  // 1. Periksa pemutusan akibat batas token maksimum
  if (
    response.status === 'incomplete' &&
    response.incomplete_details?.reason === 'max_output_tokens'
  ) {
    throw new Error('Respons audit terpotong: batas max_output_tokens terlampaui.');
  }

  // 2. Ekstrak pesan dan periksa apakah terjadi Refusal
  const message = response.output.find((item) => item.type === 'message');
  const content = message?.content[0];

  if (!content) {
    throw new Error('Respons kosong diterima dari OpenAI API.');
  }

  if (content.type === 'refusal') {
    console.warn('[AI Refusal]:', content.refusal);
    // Kembalikan pesan ramah kepada verifikator
    return { isRefused: true, reason: content.refusal };
  }

  if (content.type === 'output_text') {
    const parsedData = JSON.parse(content.text);
    return { isRefused: false, data: parsedData };
  }
} catch (error) {
  console.error('[Audit Error]:', error);
  throw error;
}
```

---

## 8. Aturan Wajib Skema JSON (*Schema Constraints*)

Ketika merancang skema JSON untuk Structured Outputs pada INFERA, patuhi aturan baku berikut:
1. **`additionalProperties: false`:** Wajib didefinisikan pada setiap objek agar model tidak menambahkan properti acak.
2. **Semua Field Wajib `required`:** Setiap properti yang tertera pada `properties` harus dimasukkan ke dalam array `required`. Jika suatu nilai boleh kosong, gunakan union dengan tipe `null` (misal: `type: ["string", "null"]`).
3. **Objek Akar Bukan `anyOf`:** Level teratas skema harus selalu bertipe `"type": "object"`.
4. **Batas Kompleksitas:**
   - Maksimal 5.000 properti objek secara total.
   - Maksimal 10 tingkat kedalaman sarang (*nesting levels*).
   - Maksimal 1.000 nilai enum per skema.
5. **Dukungan Format String:** Didukung validasi bawaan `date-time`, `date`, `email`, `uuid`, dan regex `pattern`.
