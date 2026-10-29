# Manajemen Sesi GPT-Live & Siklus Hidup Percakapan (Session Lifecycle & Operations)

Dokumen ini mendokumentasikan secara mendalam operasional, siklus hidup (*lifecycle*), dan manajemen runtime **GPT-Live (`gpt-live-1`)** pada sistem **INFERA (Intelligent Fraud & Risk Analysis Agent)** BPJS Kesehatan. Dokumen ini menjadi rujukan teknis untuk inisialisasi sesi, injeksi riwayat awal (*seed history*), transkripsi dwiarah, penanganan percakapan panjang (*128k window auto-compaction*), forking sesi evaluasi, serta pengunduhan rekaman audio audit resmi.

---

## 1. Matriks Konfigurasi: Startup vs Runtime Update

Pada sesi GPT-Live, parameter konfigurasi dibagi menjadi parameter yang harus ditentukan saat inisialisasi awal (*startup-only*) dan parameter yang dapat diperbarui saat sesi sedang berjalan (*runtime-updatable*):

| Parameter Sesi | Konfigurasi Saat Startup (`POST /live/sessions` / `session.start`) | Perubahan Saat Sesi Aktif (*Runtime Update*) |
| :--- | :--- | :--- |
| **Model** | Wajib disetel ke `"gpt-live-1"`. | **Immutable.** Harus membuat sesi baru untuk mengganti model. |
| **Instruksi Suara** | `session.instructions` (maks. 16.384 token) untuk persona FERA dan gaya bicara. | Tambahkan instruksi dinamis via `session.instructions.append`. |
| **Riwayat Awal** | `session.input` (maks. 128 pesan teks, batas 8.192 token). | Tambahkan konteks runtime via `thinking.append` / `commentary.append`. |
| **Suara Avatar** | `audio.output.voice` (pilihan 31 suara resmi atau custom ID). Default: `"marin"`. | **Immutable.** Pilihan suara terkunci sepanjang sesi. |
| **Mode Delegasi** | `delegation.type` (`"responses"`, `"client"`, atau `"decisions"`). | **Jenis delegasi immutable.** Hanya pengaturan model/tools Responses yang dapat diperbarui via `session.update`. |
| **Penyimpanan Sesi** | `store: true` untuk mengaktifkan forking dan unduh rekaman audio. Default: `false`. | **Immutable.** Harus ditentukan saat pembuatan sesi awal. |
| **Format Audio** | Khusus Primary WebSocket: `audio.format` (PCM16LE 16k/24k atau PCMU/PCMA 8k). | **Immutable.** WebRTC menegosiasikan codec Opus otomatis. |

---

## 2. Katalog 31 Suara Resmi & Karakteristik Vokal

OpenAI menyediakan 31 ragam vokal alami (*natural*) dan tergenerasi (*generated*) dengan variasi gaya regional untuk menyesuaikan persona asisten:

| Nama Suara | Parameter API | Bahasa Utama | Pengaruh Regional & Aksen | Karakter Presentasi | Tipe Sumber |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **FERA Natural Anime** | `voice_6ae35f4fc2388191a0b2f21060b4e417` | Bahasa Indonesia | Artikulasi Baku, Jernih, Ramah | Anime Dewasa Muda (Default Resmi FERA) | Prompt-to-Voice |
| **Shimmer** | `shimmer` | Multilingual (ID/EN) | Jernih, Ramah, Empatik | Feminin Standar | Alami |
| **Marin** | `marin` | Multilingual | Netral, Profesional | Netral / Default API | Tergenerasi |
| **Quartz** | `quartz` | English | Australia | Feminin | Tergenerasi |
| **Ripple** | `ripple` | English | Australia | Maskulin | Alami |
| **Vesper** | `vesper` | English | British | Maskulin | Alami |
| **Willow** | `willow` | English | Irlandia | Feminin | Alami |
| **Stone** | `stone` | English | Irlandia | Maskulin | Alami |
| **Gleam** | `gleam` | English | Amerika Utara | Feminin | Alami |
| **Meridian** | `meridian` | English | Amerika Utara | Maskulin | Alami |
| **Bossa** | `bossa` | Portugis | Brasil | Feminin | Alami |
| **Tempo** | `tempo` | Portugis | Brasil | Maskulin | Alami |
| **Beacon** | `beacon` | English | Filipina | Maskulin | Tergenerasi |
| **Delta** | `delta` | English | Amerika Selatan (Southern US) | Feminin | Tergenerasi |
| **Cinder** | `cinder` | English | Amerika Selatan (Southern US) | Maskulin | Tergenerasi |
| **Nuri** | `nuri` | Jerman | Standar | Feminin | Alami |
| **Juni** | `juni` | Jerman | Standar | Feminin | Alami |
| **Flitz** | `flitz` | Jerman | Standar | Maskulin | Alami |
| **Brise** | `brise` | Prancis | Standar | Feminin | Alami |
| **Sillage** | `sillage` | Prancis | Standar | Maskulin | Alami |
| **Nira** | `nira` | Hindi | Standar | Feminin | Alami |
| **Harema** | `harema` | Jepang | Standar | Feminin | Alami |
| **Shida** | `shida` | Jepang | Standar | Maskulin | Alami |
| **Noeul** | `noeul` | Korea | Standar | Feminin | Alami |
| *Opsi lain:* | `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `sage`, `verse` | Ragam global | Pilihan vokal tambahan | Campuran | Tergenerasi / Alami |

> **Rekomendasi Persona INFERA:** Gunakan `audio.output.voice: "voice_6ae35f4fc2388191a0b2f21060b4e417"` (*FERA Natural Anime Indonesian*) untuk asisten FERA (avatar virtual BPJS Kesehatan) karena artikulasinya sangat manis alami, jernih, dan luwes saat melafalkan istilah bahasa Indonesia, singkatan medis (SEP, ICD-10, CBG), serta nominal rupiah.

---

## 3. Injeksi Riwayat Awal (*Seed History with Prior Conversation*)

Saat auditor membuka sesi investigasi lanjutan atau melanjutkan kasus dari berkas sebelumnya, riwayat percakapan teks dapat dimasukkan ke dalam `session.input` saat sesi dibuat:

```typescript
export const seedInferaSession = {
  model: "gpt-live-1",
  audio: {
    output: { voice: "voice_6ae35f4fc2388191a0b2f21060b4e417" }
  },
  input: [
    {
      type: "message",
      role: "developer",
      content: [
        {
          type: "input_text",
          text: "Auditor sedang memeriksa anomali klaim RS Hermina periode September 2026."
        }
      ]
    },
    {
      type: "message",
      role: "user",
      content: [
        {
          type: "input_text",
          text: "Berapa total potensi kerugian dari modus Deceased Claim di RS Hermina?"
        }
      ]
    },
    {
      type: "message",
      role: "assistant",
      content: [
        {
          type: "output_text",
          text: "Total kerugian terdeteksi adalah Rp 412.500.000 dari 34 klaim fiktif pasien meninggal dunia."
        }
      ]
    }
  ]
};
```

- **Batasan:** Maksimal 128 item pesan dan batas akumulatif 8.192 token pada saat inisialisasi.
- **Tipe Konten:** Role `developer` dan `user` menggunakan `input_text`; role `assistant` menggunakan `text` atau `output_text`.

---

## 4. Alur Ucapan Pembuka (*Pre-Speech Greeting*) & Pengungkapan Hukum (*Legal Disclosure*)

### A. Pola Pembukaan Sapaan Otomatis (Greeting Pattern)
Agar asisten FERA langsung menyapa auditor saat WebRTC tersambung tanpa menunggu pengguna berbicara lebih dulu:

1. Sisipkan instruksi sapaan ke dalam pesan `developer` di `session.input`.
2. Tunggu konfirmasi `session.started`.
3. Kirimkan perintah sapaan eksplisit via `session.commentary.append` dengan `delegation_id: null`:

```json
{
  "type": "session.commentary.append",
  "event_id": "greet_auditor_01",
  "delegation_id": null,
  "content": "Sapa auditor sekarang dengan ramah dalam bahasa Indonesia: 'Halo, saya FERA, asisten investigasi BPJS Kesehatan. Ada data klaim atau rumah sakit yang ingin dokter audit hari ini?' Kemudian berhenti bicara dan dengarkan."
}
```

### B. Pola Pengungkapan Hukum (*Mandatory Legal Disclosure*)
Untuk kepatuhan rekaman audit forensik, gunakan `session.instructions.append` agar kalimat diucapkan secara **harfiah dan mutlak** tanpa diparafrase:

```json
{
  "type": "session.instructions.append",
  "event_id": "legal_disclosure_01",
  "delegation_id": null,
  "content": "Ucapkan kalimat berikut secara persis dan lengkap sebelum menanggapi pertanyaan pengguna: 'Sesi audit investigasi ini direkam secara digital sesuai standar tata kelola data BPJS Kesehatan.'"
}
```

---

## 5. Sinkronisasi Transkripsi & Tampilan Keterangan (*Captions*)

GPT-Live beroperasi secara **full duplex**: auditor dan FERA dapat berbicara pada milidetik yang sama. Klien web harus mengelola transkrip secara independen berdasarkan event delta:

- **Suara Auditor (Input):** `session.input_transcript.delta`
- **Suara FERA (Output):** `session.output_transcript.delta`

### Struktur Payload Transkrip Delta:
```json
{
  "type": "session.output_transcript.delta",
  "event_id": "evt_tr_091",
  "delta": "Berdasarkan audit forensik,",
  "start_ms": 1420,
  "end_ms": 1780
}
```

### Aturan Penanganan Transkrip pada Frontend:
1. **Preservasi Spasi:** Rangkai string `delta` persis seperti yang diterima tanpa melakukan trim otomatis.
2. **Gunakan `start_ms` dan `end_ms`:** Gunakan selang milidetik dari awal sesi untuk menyusun urutan gelembung chat (*chat bubbles*), bukan waktu kedatangan paket jaringan HTTP/WS.
3. **Pemisahan Jalur Audio vs Teks:** Event `output_transcript.delta` tiba saat teks digenerasikan, sedangkan audio mengalir melalui track WebRTC. Animasi bibir FERA disinkronkan dengan Web Audio AnalyserNode (RMS 60 FPS), bukan dari event teks.

---

## 6. Manajemen Sesi Panjang (*Long Conversations & Context Compaction*)

Sesi percakapan investigasi forensik dapat berlangsung intensif selama puluhan menit:

1. **Jendela Konteks 128.000 Token:**
   - Jendela mencakup instruksi, histori teks, dan representasi token audio internal.
2. **Peringatan Batas 90% & Background Replacement Engine:**
   - Ketika pemakaian konteks melebihi **90%**, server OpenAI secara otomatis menjalankan mesin suara pengganti (*replacement voice engine*) di latar belakang dalam sesi yang sama.
   - Mesin pengganti menerima instruksi startup asli dan ringkasan riwayat percakapan terkini (hingga 8.192 token).
   - Percakapan suara pengguna tidak mengalami jeda atau diskoneksi selama proses peremajaan konteks berlangsung.

---

## 7. Penyimpanan Sesi, Forking, dan Pengunduhan Audio Rekaman Resmi

Fitur **Forking** memungkinkan auditor menduplikasi sesi investigasi yang telah tersimpan (*reference session*) untuk menguji skenario audit alternatif atau melanjutkan percakapan setelah sesi sebelumnya ditutup.

### A. Mengaktifkan Penyimpanan Saat Inisiasi Sesi
```json
{
  "session": {
    "model": "gpt-live-1",
    "store": true
  }
}
```
*(Catatan: Sesi tersimpan disimpan selama 30 hari di kluster OpenAI).*

### B. Membuat Fork Sesi Baru

| Transportasi | Endpoint Pembuatan Fork |
| :--- | :--- |
| **WebRTC** | `POST /v1/live/sessions/{source_session_id}/fork` dengan body `{ "transport": { "type": "webrtc", "sdp": "<offer>" } }` |
| **WebSocket** | Hubungkan ke `wss://api.openai.com/v1/live/sessions/{source_session_id}/fork` |

Sesi fork mewarisi model suara, instruksi asli, dan riwayat kasus dari sesi sumber, tetapi mendapatkan `session_id` baru yang independen.

### C. Mengunduh Rekaman Audio Resmi Kasus (`GET /content`)
Setelah sesi selesai difinalisasi, rekaman audio dua arah dapat diunduh untuk barang bukti legal:

- **Endpoint:** `GET /v1/live/sessions/{session_id}/content`
- **Format Keluaran:** Binary Stereo WAV:
  - **Kanal Kiri (Left Channel):** Suara masukan auditor (Input Audio).
  - **Kanal Kanan (Right Channel):** Suara balasan FERA (Output Audio).

```typescript
import axios from 'axios';
import fs from 'fs';

export async function downloadInferaAuditRecording(sessionId: string, outputPath: string) {
  const response = await axios.get(`https://api.openai.com/v1/live/sessions/${sessionId}/content`, {
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
    },
    responseType: 'stream'
  });

  const writer = fs.createWriteStream(outputPath);
  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
}
```

---

## 8. Penutupan Elegan (*Graceful Close*) & Rekapitulasi Durasi Suara

Ketika auditor mengakhiri sesi audit, penutupan harus dilakukan secara teratur agar seluruh transaksi final tercatat:

1. Pasang pendengar event `session.closed`.
2. Kirim perintah penutupan `session.close`.
3. Tunggu event `session.closed` untuk membaca rekapitulasi durasi vokal:

```json
{
  "type": "session.closed",
  "event_id": "evt_cls_099",
  "reason": "close_requested",
  "usage": {
    "seconds": 245
  }
}
```

### Arti Alasan Penutupan Sesi (`reason`):
- **`close_requested`:** Ditutup normal oleh aplikasi klien atau panggilan API hangup.
- **`expired`:** Sesi mencapai durasi batas maksimal panggilan (2 jam).
- **`content`:** Filter keselamatan (*safety / content moderation*) memutus sesi.
- **`remote_hangup`:** Koneksi primer WebRTC/SIP terputus secara normal dari sisi remote.
- **`connection_lost`:** Terjadi kegagalan jaringan yang tidak terduga.
