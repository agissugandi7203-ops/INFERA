# OpenAI Reasoning Models & Agentic Workflows

Dokumen ini mendokumentasikan panduan integrasi dan best practice implementasi **OpenAI Reasoning Models** (keluarga `gpt-6-astra`, `gpt-6.1-sol`, `gpt-6-luna`, `gpt-5.6`) pada engine analitik **INFERA (Intelligent Fraud & Risk Analysis Agent)** menggunakan **Responses API**.

---

## 1. Konsep & Arsitektur Model Penalaran (*Reasoning Models*)

Model penalaran (*Reasoning Models*) menggunakan **internal reasoning tokens** sebelum menghasilkan respons akhir yang terlihat (*visible output tokens*). Proses ini memungkinkan AI untuk:
1. **Perencanaan Audit Multi-Langkah (*Planning*):** Memecah kasus klaim anomali yang rumit ke dalam hipotesis investigasi.
2. **Penggunaan Tools Efektif (*Tool-Chaining*):** Mengevaluasi output dari algoritma analitik (Haversine, DSI, POR) dan memutuskan apakah perlu memanggil tools verifikasi tambahan.
3. **Penyelidikan Alternatif (*Alternative Exploration*):** Mempertimbangkan apakah lonjakan klaim merupakan fraud sengaja atau anomali wajar (misal: KLB wabah atau rujukan massal faskes).
4. **Pemulihan dari Ambiguitas (*Error Recovery*):** Menangani inkonsistensi data rekam medis peserta secara logis.

```
[ Input Audit / Kasus Klaim ]
               │
               ▼
┌────────────────────────────────────────────────────────┐
│             Internal Reasoning Phase                   │
│  (Reasoning Tokens: Opaque / Dioptimalkan Otomatis)     │
│  - Analisis Regulasi Permenkes 16/2019                 │
│  - Verifikasi Kalkulasi Kecepatan & Rasio POR          │
│  - Evaluasi Pola Impossible Travel vs Doctor Shopping   │
└────────────────────────────────────────────────────────┘
               │
               ▼
[ Output Jawaban Final / Structured Dossier Terverifikasi ]
```

---

## 2. Pilihan Model Reasoning

OpenAI menyediakan beberapa opsi model penalaran untuk berbagai trade-off latensi, kecerdasan, dan biaya:

| Nama Model | Karakteristik Utama | Rekomendasi Penggunaan pada INFERA |
| :--- | :--- | :--- |
| **`gpt-6-astra`** | Model penalaran utama dengan kecerdasan tinggi, penalaran sains/logika mendalam. | **Default untuk audit forensik komprehensif**, analisis fraud lintas faskes, dan pembuktian hukum. |
| **`gpt-6.1-sol`** | Mendukung penalaran multi-turn `all_turns`, mode reasoning `pro`, default effort `medium`. | **Investigasi investigatif mendalam** dengan histori percakapan panjang dan rantai tool kompleks. |
| **`gpt-6-luna`** / **`gpt-5.6-luna`** | Latensi terendah dan biaya paling ekonomis di kelas model reasoning. | **Pemeriksaan cepat (*triage screening*)**, verifikasi klaim real-time saat penerbitan SEP di faskes. |
| **`gpt-5.6-terra`** | Biaya menengah dengan keseimbangan performa optimal. | Analisis batch klaim bulanan atau evaluasi klaster faskes. |

---

## 3. Parameter `reasoning.effort`

Parameter `reasoning.effort` menginstruksikan model seberapa mendalam ia harus "berpikir" sebelum merespons. Model secara adaptif menggunakan token lebih sedikit untuk tugas sederhana dan berpikir lebih keras untuk tugas yang kompleks.

### Matriks Pilihan Effort:
| Nilai Effort | Karakteristik & Latensi | Best For pada Kasus INFERA |
| :--- | :--- | :--- |
| `none` | Tanpa token penalaran sama sekali. Sangat cepat. *(Tidak didukung oleh `gpt-6-astra` & `gpt-6.1-sol`)* | Task klasifikasi teks sederhana atau streaming suara berlatensi instan. |
| `low` | Penalaran efisien dengan kenaikan latensi minimal. Mengoptimalkan kecepatan & biaya. | **Chat asisten harian FERA**, pencarian data klaim peserta, dan sintesis ringkasan cepat. |
| `medium` *(Default)* | Titik optimal kurva Pareto antara latensi, kecerdasan, dan biaya. | **Audit standar kasus anomali**, verifikasi indikasi *doctor shopping*, validasi resep PRB. |
| `high` | Penalaran intensif dan pengujian hipotesis ganda. Latensi lebih tinggi. | **Kasus sindikat kejahatan terorganisir**, analisis fraud multi-entitas faskes, audit forensik BPK. |
| `xhigh` / `max` | Pemikiran maksimal untuk tugas paling rumit dan riset mendalam. | Perancangan kebijakan pencegahan kecurangan nasional atau simulasi skenario hukum perdata/pidana. |

> **Penting untuk Latensi Cepat:** Pada aplikasi yang membutuhkan waktu cepat ke token pertama (*Time To First Token*), instruksikan model untuk membuat kalimat pembuka singkat (*preamble*) sebelum masuk ke penalaran analitis mendalam.

---

## 4. Parameter `reasoning.mode` (Standard vs Pro)

Pada model GPT-5.6 dan GPT-6, Responses API mendukung dua mode eksekusi:
- **`standard` (Default):** Mode standar yang efisien dan seimbang untuk hampir seluruh beban kerja audit operasional.
- **`pro`:** Mode penalaran lanjutan untuk tugas paling sulit yang membutuhkan kapasitas pemrosesan model lebih besar dan dapat mentoleransi latensi serta biaya token lebih tinggi.

```bash
curl https://api.openai.com/v1/responses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -d '{
    "model": "gpt-6.1-sol",
    "reasoning": {
      "mode": "pro",
      "effort": "medium"
    },
    "input": "Analisis seluruh riwayat transaksi klaim 6 bulan terakhir RSUD Bahagia untuk mengungkap skema sindikat peminjaman kartu peserta."
  }'
```

---

## 5. Menjaga Kontinuitas Penalaran Antar Percakapan (*Preserve Reasoning*)

Dalam percakapan multi-turn (misal: auditor bertanya detail kasus lalu meminta rencana mitigasi), model membutuhkan kontinuitas tidak hanya pada pesan teks, tetapi juga pada state penalaran.

Parameter `reasoning.context` mengontrol bagaimana penalaran putaran sebelumnya digunakan:
- `current_turn`: Hanya penalaran pada putaran aktif yang tersedia; putaran sebelumnya tidak dimuat ulang.
- `all_turns` *(Default pada GPT-5.6 & GPT-6.1 Sol)*: Memuat kembali item penalaran yang kompatibel dari putaran sebelumnya ke dalam konteks putaran baru.

### A. Pola Stateful menggunakan `previous_response_id` (Paling Efisien):
```typescript
import OpenAI from 'openai';
const client = new OpenAI();

// Putaran 1: Identifikasi Indikasi Fraud
const firstResponse = await client.responses.create({
  model: 'gpt-6.1-sol',
  input: 'Periksa riwayat klaim peserta P-10294 dan temukan anomali kecepatan tempuh.',
  reasoning: { context: 'current_turn', effort: 'medium' },
});

console.log('Temuan Awal:', firstResponse.output_text);

// Putaran 2: Tindak Lanjut Rencana Penindakan Hukum (Menjaga State Penalaran Penuh)
const secondResponse = await client.responses.create({
  model: 'gpt-6.1-sol',
  previous_response_id: firstResponse.id,
  input: 'Berdasarkan temuan di atas, rumuskan berkas dossier penolakan klaim sesuai Permenkes 16/2019.',
  reasoning: { context: 'all_turns' },
});

console.log('Dossier Final:', secondResponse.output_text);
```

### B. Pola Stateless (`store: false` / Zero Data Retention):
Jika organisasi BPJS menerapkan kebijakan privasi data ketat di mana percakapan tidak boleh disimpan di cloud OpenAI (`store: false`), gunakan array history yang memuat seluruh output item (termasuk `encrypted_content`):

```typescript
import OpenAI from 'openai';
import { toResponseInputItems } from 'openai/lib/responses/ResponseInputItems';

const client = new OpenAI();
const history: any[] = [
  { role: 'user', content: 'Audit klaim obat PRB peserta P-99120.' }
];

const first = await client.responses.create({
  model: 'gpt-6.1-sol',
  store: false,
  input: history,
  reasoning: { context: 'current_turn' },
});

// Masukkan output lengkap (termasuk token penalaran terenkripsi)
history.push(...toResponseInputItems(first.output));
history.push({ role: 'user', content: 'Rekomendasikan langkah pembekuan faskes apotek penyedia.' });

const second = await client.responses.create({
  model: 'gpt-6.1-sol',
  store: false,
  input: history,
  reasoning: { context: 'all_turns' },
});

console.log(second.output_text);
```

---

## 6. Mengubah Tingkat Penalaran di Tengah Percakapan (`configuration_update`)

Ketika percakapan dimulai dengan pertanyaan umum yang ringan (`effort: "low"`), namun auditor tiba-tiba meminta analisis pembuktian hukum yang sangat kompleks, sistem tidak perlu me-restart percakapan dari awal. Gunakan item `configuration_update`:

```typescript
import OpenAI from 'openai';
const client = new OpenAI();

const first = await client.responses.create({
  model: 'gpt-6-astra',
  reasoning: { effort: 'low' },
  input: 'Tampilkan profil kepesertaan Bapak Hendra (NIK: 3201019283910002).',
});

// Tingkatkan reasoning effort ke "high" secara dinamis tanpa merusak prompt caching prefix
const next = await client.responses.create({
  model: 'gpt-6-astra',
  reasoning: { effort: 'low' }, // Tetap di request-level
  previous_response_id: first.id,
  input: [
    { type: 'configuration_update', reasoning: { effort: 'high' } },
    {
      role: 'user',
      content: 'Terdeteksi kartu Bapak Hendra digunakan di 3 RS berbeda hari ini. Analisis potensi sindikat kejahatan peminjaman kartu!',
    },
  ],
});

console.log(next.output_text);
```

---

## 7. Ringkasan Penalaran AI (*Reasoning Summaries*)

Meskipun token penalaran mentah bersifat rahasia dan tidak diekspos melalui API untuk alasan keamanan model, sistem dapat meminta ringkasan penalaran yang dapat dibaca manusia menggunakan parameter `summary: "auto"`. Fitur ini sangat bernilai untuk transparansi keputusan (*Explainable AI*) bagi auditor BPJS:

```typescript
const response = await client.responses.create({
  model: 'gpt-6-astra',
  input: 'Apakah resep obat amlodipine 10mg selama 90 hari dalam rentang 30 hari melanggar aturan PRB?',
  reasoning: {
    effort: 'medium',
    summary: 'auto',
  },
});

// Akses ringkasan proses berpikir AI
for (const item of response.output) {
  if (item.type === 'reasoning' && item.summary) {
    for (const sum of item.summary) {
      console.log('Proses Berpikir FERA:', sum.text);
    }
  }
}
console.log('Keputusan Audit:', response.output_text);
```

---

## 8. Parameter `phase` pada Pesan Asisten

Untuk investigasi berbasis agen (*agentic workflows*) yang melibatkan pemanggilan tools secara beruntun, gunakan field `phase` pada pesan asisten untuk mencegah model berhenti sebelum menyelesaikan seluruh audit:
- `phase: "commentary"`: Pesan perantara sebelum AI memanggil tool analitik (misal: *"Saya akan mengecek basis data SEP terlebih dahulu..."*).
- `phase: "final_answer"`: Kesimpulan akhir setelah semua data dianalisis secara tuntas.

```typescript
const response = await client.responses.create({
  model: 'gpt-6-astra',
  input: [
    {
      role: 'assistant',
      phase: 'commentary',
      content: 'FERA sedang menghitung Haversine Distance dan selisih waktu penerbitan SEP...',
    },
    {
      role: 'assistant',
      phase: 'final_answer',
      content: 'Hasil kalkulasi: Kecepatan tempuh 184 km/jam. Terkonfirmasi anomali Impossible Travel.',
    },
    {
      role: 'user',
      content: 'Terbitkan surat rekomendasi penghentian pembayaran sementara!',
    },
  ],
});
```

---

## 9. Manajemen Anggaran Token & Penanganan Kasus Kehabisan Token

Reasoning tokens dihitung dan ditagihkan sebagai *output tokens*. Untuk mencegah biaya tak terkendali dan menghindari pemutusan respons di tengah jalan:

1. **Alokasikan Buffer Minimal 25.000 Token:** Model penalaran membutuhkan ruang bernapas untuk berpikir sebelum memproduksi teks keluaran.
2. **Gunakan Parameter `max_output_tokens`:** Mengontrol batas akumulasi token penalaran dan teks terlihat.
3. **Deteksi `status === 'incomplete'`:**

```typescript
const response = await client.responses.create({
  model: 'gpt-6-astra',
  reasoning: { effort: 'medium' },
  input: [{ role: 'user', content: promptKasus }],
  max_output_tokens: 3000,
});

if (
  response.status === 'incomplete' &&
  response.incomplete_details?.reason === 'max_output_tokens'
) {
  if (response.output_text?.length > 0) {
    console.warn('Respons audit terpotong sebagian:', response.output_text);
  } else {
    console.error('Model kehabisan token saat tahap reasoning sebelum menghasilkan teks.');
  }
}
```
