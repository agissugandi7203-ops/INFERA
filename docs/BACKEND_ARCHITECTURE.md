# INFERA: Backend Architecture Specification
## Modul Deteksi Efisiensi Risiko pada Peserta (Healthkathon BPJS 2026)

Dokumen ini mendokumentasikan spesifikasi arsitektur backend, algoritma analitik, dan kontrak API untuk platform **INFERA** (Intelligent Fraud & Risk Analysis Agent), dengan fokus khusus pada kategori lomba **"Efisiensi Risiko pada Peserta"**.

---

## 1. Latar Belakang & Domain Masalah
Dalam penyelenggaraan Program Jaminan Kesehatan Nasional (JKN), inefisiensi risiko dari sisi peserta menimbulkan kebocoran Dana Jaminan Sosial (DJS) yang masif dan distorsi mutu pelayanan. Healthkathon 2026 membagi tantangan ini ke dalam 4 modus:

1. **Modus 1: Pemalsuan data/identitas peserta**
   - Pendaftaran fiktif, manipulasi data keluarga, NIK tidak valid, rekayasa status iuran/upah.
2. **Modus 2: Penyalahgunaan identitas peserta (Kartu Pinjaman)**
   - Peminjaman kartu BPJS ke kerabat/orang lain, penyewaan kartu, pemakaian simultan di lokasi berbeda (*impossible travel*).
3. **Modus 3: Pelayanan yang tidak perlu (*Unnecessary Services*)**
   - *Doctor shopping* (berpindah-pindah dokter/faskes dalam rentang < 7 hari untuk keluhan yang sama), *frequent flyer* IGD non-darurat.
4. **Modus 4: Penyalahgunaan obat & alat kesehatan (*Resale / Arbitrage*)**
   - *Resale arbitrage* obat kronis Program Rujuk Balik (PRB) melalui tumpang tindih resep (*prescription overlap*), klaim alkes berulang sebelum masa tunggu.

---

## 2. Formulasi Matematis Algoritma Deteksi

### A. Algoritma 1: Impossible Travel Velocity ($V_{\text{travel}}$)
Mendeteksi apakah kartu peserta yang sama digunakan pada dua faskes dengan jarak geografis yang mustahil ditempuh dalam selang waktu antara dua penerbitan SEP:

$$V_{\text{travel}} = \frac{d(\text{lat}_1, \text{lng}_1, \text{lat}_2, \text{lng}_2)}{\Delta t}$$

Dimana:
- $d$: Jarak Haversine antar faskes dalam kilometer (km).
- $\Delta t$: Selisih waktu penerbitan SEP dalam jam ($|t_2 - t_1|$).
- **Rule Matrix**:
  - Jika $\Delta t \le 2\text{ jam}$ dan $d > 50\text{ km}$ ($V_{\text{travel}} > 100\text{ km/jam}$): **HIGH RISK** (Indikasi kuat kartu pinjaman).
  - Jika $\Delta t \le 1\text{ jam}$ dan $d > 80\text{ km}$ ($V_{\text{travel}} > 150\text{ km/jam}$): **CRITICAL RISK** (Pasti anomali fisik / duplikasi kartu).

### B. Algoritma 2: Doctor Shopping Index ($DSI$)
Mengukur intensitas pencarian pelayanan redundan oleh peserta dalam jendela waktu 30 hari:

$$DSI = \frac{\sum_{i=1}^{N} \mathbb{I}(\Delta t_i \le 7 \land \text{ICD}_{i} \sim \text{ICD}_{i-1} \land \text{PPK}_i \ne \text{PPK}_{i-1})}{N_{\text{total}}}$$

Dimana:
- $\mathbb{I}$: Fungsi indikator yang bernilai 1 jika kunjungan terjadi dalam $\le 7$ hari ke faskes berbeda dengan diagnosa ICD-10 pada bab/blok yang sama.
- **Rule Matrix**:
  - $DSI \ge 0.5$ dan frekuensi kunjungan $\ge 4$ faskes dalam 14 hari: **HIGH RISK** (*Doctor Shopping / Unnecessary Services*).

### C. Algoritma 3: Prescription Overlap Ratio ($POR$)
Mendeteksi penimbunan dan potensi penjualan kembali (*resale*) obat kronis Program Rujuk Balik (PRB):

$$POR = \frac{\text{Total Hari Suplai Obat Diperoleh dalam 30 Hari}}{\text{Hari Periode Terapi (30 Hari)}} \times 100\%$$

- **Rule Matrix**:
  - $POR \le 100\%$: Normal (Sesuai dosis terapi 30 hari).
  - $101\% - 130\%$: Peringatan Wajar (Toleransi pergantian jadwal kontrol).
  - $> 140\%$: **CRITICAL RISK** (Indikasi penimbunan obat kronis bernilai tinggi untuk diperjualbelikan).

### D. Algoritma 4: Alkes Cooling-off Period Violation
Validasi masa tunggu resmi alat kesehatan BPJS Kesehatan:
- **Kacamata**: Masa tunggu 2 tahun ($730\text{ hari}$).
- **Alat Bantu Dengar**: Masa tunggu 5 tahun ($1825\text{ hari}$).
- **Kursi Roda**: Masa tunggu 5 tahun ($1825\text{ hari}$).
- **Rule**: Jika tanggal klaim baru $\le (\text{Tanggal Klaim Terakhir} + \text{Masa Tunggu})$, sistem otomatis mengeluarkan penolakan pra-bayar dan tanda anomali.

---

## 3. Struktur Kontrak Data (`packages/shared`)

### A. Tipe Kategori Risiko Peserta:
```typescript
export type ParticipantRiskCategory =
  | 'IDENTITY_FALSIFICATION'  // Modus 1
  | 'IDENTITY_SHARING'        // Modus 2
  | 'UNNECESSARY_SERVICES'    // Modus 3
  | 'MEDICINE_ALKES_ABUSE'    // Modus 4
  | 'CLEAN_PARTICIPANT';      // Normal
```

### B. Objek Hasil Evaluasi Risiko Peserta:
```typescript
export interface ParticipantRiskEvaluationResult {
  noKartu: string;
  namaPeserta: string;
  nikMasked: string;
  riskScore: number; // 0 - 100
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  primaryCategory: ParticipantRiskCategory;
  detectedModuses: {
    category: ParticipantRiskCategory;
    score: number;
    title: string;
    evidence: string;
    legalGrounding: {
      regulation: string;
      article: string;
      sanction: string;
    };
  }[];
  recommendedAction: string;
  potentialDjsLoss: number;
  evaluatedAt: string;
}
```

---

## 4. Spesifikasi Endpoint REST API (`/api/v1/participant-risk`)

| Method | Path | Deskripsi | Parameter / Payload |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/participant-risk/evaluate` | Mengevaluasi risiko peserta dari transaksi / riwayat SEP baru secara real-time | Body: `PesertaProfile` |
| `GET` | `/api/v1/participant-risk/metrics` | Mengambil agregasi KPI risiko peserta (total kerugian dicegah, rasio 4 modus) | Query: `timeframe` |
| `GET` | `/api/v1/participant-risk/anomalies` | Daftar temuan anomali peserta terbaru terformat untuk feed & table | Query: `category`, `limit` |
| `GET` | `/api/v1/participant-risk/case-studies` | 4 Studi Kasus Riil Benchmark Healthkathon untuk demo & simulasi | Query: `category`, `riskLevel` |
| `GET` | `/api/v1/participant-risk/case-studies/:id` | Mengambil 1 studi kasus spesifik berdasarkan ID atau `caseCode` | Param: `id` |

### Contoh Request Payload `POST /api/v1/participant-risk/evaluate`:
```json
{
  "noKartu": "0001847291038",
  "nikMasked": "3374**********01",
  "fullName": "Budi Santoso",
  "gender": "L",
  "dateOfBirth": "1985-05-12",
  "faskesTingkat1": "Klinik Pratama Sehat Mandiri",
  "membershipSegment": "PBPU_MANDIRI",
  "statusIuran": "AKTIF",
  "encounters": [
    {
      "id": "ENC-01",
      "noSep": "1114R0010926V0001",
      "timestamp": "2026-09-04T08:30:00Z",
      "ppkCode": "1114R001",
      "faskesName": "RSUD Dr. Moewardi Surakarta",
      "faskesClass": "A",
      "location": { "city": "Kota Surakarta", "province": "Jawa Tengah", "lat": -7.558, "lng": 110.856 },
      "jnsPelayanan": 1,
      "diagnosaUtama": "I21.0",
      "namaDiagnosa": "Acute transmural myocardial infarction",
      "cbgTariff": 8400000
    },
    {
      "id": "ENC-02",
      "noSep": "1101R0050926V0042",
      "timestamp": "2026-09-04T09:15:00Z",
      "ppkCode": "1101R005",
      "faskesName": "RS Mitra Husada Semarang",
      "faskesClass": "B",
      "location": { "city": "Kota Semarang", "province": "Jawa Tengah", "lat": -6.993, "lng": 110.420 },
      "jnsPelayanan": 2,
      "diagnosaUtama": "M54.5",
      "namaDiagnosa": "Low back pain",
      "cbgTariff": 320000
    }
  ]
}
```

### Contoh Response Payload:
```json
{
  "success": true,
  "data": {
    "noKartu": "0001847291038",
    "namaPeserta": "Budi Santoso",
    "nikMasked": "3374**********01",
    "gender": "L",
    "age": 41,
    "membershipSegment": "PBPU_MANDIRI",
    "totalEncountersLast30Days": 2,
    "overallRiskScore": 86,
    "riskLevel": "CRITICAL",
    "primaryCategory": "IDENTITY_SHARING",
    "anomalies": [
      {
        "category": "IDENTITY_SHARING",
        "title": "Anomali Impossible Travel: Kartu Digunakan Bersamaan Lintas Kota",
        "severityScore": 86,
        "evidenceSummary": "Kartu terbit SEP di RSUD Dr. Moewardi Surakarta (Kota Surakarta) pada pk. 15.30 lalu digunakan kembali di RS Mitra Husada Semarang (Kota Semarang) pk. 16.15 (0.8 jam, jarak 63.5 km, kecepatan implisit 85 km/jam).",
        "velocityKmH": 85,
        "distanceKm": 63.5,
        "timeDeltaHours": 0.8,
        "legalGrounding": {
          "regulation": "Peraturan BPJS Kesehatan No. 6 Tahun 2020",
          "article": "Pasal Penanganan Kecurangan Peserta",
          "summary": "Larangan meminjamkan atau memperjualbelikan identitas kartu jaminan kesehatan kepada pihak lain.",
          "sanction": "Pembatalan SEP yang sedang berjalan dan pemblokiran sementara status kepesertaan."
        }
      }
    ],
    "potentialDjsLossAmount": 320000,
    "recommendedAction": "TINDAKAN SEGERA: Bekukan sementara SEP berjalan, terbitkan surat panggilan...",
    "isFlaggedForAudit": true,
    "evaluatedAt": "2026-09-04T01:41:57.000Z"
  }
}
```

---

## 5. Standar Keamanan & Ketahanan Sistem
1. **Masking NIK & Data Pribadi**: Sesuai UU No. 27 Tahun 2022 tentang Perlindungan Data Pribadi (UU PDP), NIK selalu disensor (`3374**********12`) pada seluruh response payload.
2. **Rate Limiting**: Dibatasi maksimal 120 requests/menit per IP untuk endpoint evaluasi publik.
3. **Resilient Dual-Tier**: Evaluasi analitik dijalankan secara in-memory deterministik tanpa dependensi eksternal yang lambat, menjamin waktu respons $< 30\text{ ms}$ per evaluasi transaksi.
4. **Verifikasi Validitas Algoritma**: Diverifikasi lulus 100% pada script uji `scripts/test_participant_risk.ts`.
