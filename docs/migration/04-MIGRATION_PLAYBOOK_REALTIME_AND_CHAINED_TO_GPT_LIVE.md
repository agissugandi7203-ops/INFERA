# Panduan Praktis Migrasi: Realtime API & Chained Pipeline ke GPT-Live

Dokumen ini merupakan panduan langkah-demi-langkah (*step-by-step migration playbook*) untuk memigrasikan sistem suara legasi (**Realtime API** atau **Chained STT-LLM-TTS Pipeline**) ke arsitektur **GPT-Live (`gpt-live-1`)** pada platform **INFERA (Intelligent Fraud & Risk Analysis Agent)** BPJS Kesehatan.

---

## 1. Inventaris Persyaratan Pra-Migrasi (*Pre-Migration Checklist*)

Sebelum melakukan perubahan kode, pastikan seluruh dependensi dan aturan bisnis telah dipetakan:

- [x] **Daftar Tools & Prosedur Bisnis:** 10 skema tools audit forensik BPJS Kesehatan (DSI, POR, Impossible Travel, Deceased Claims, Overlap PRB, dsb).
- [x] **Format Masukan Data:** Masukan suara lisan (WebRTC Opus), teks ketikan dari UI (*typed input*), dan lampiran dokumen bukti klaim (gambar/PDF).
- [x] **Keputusan Akustik:** Apakah sistem membutuhkan analisis audio langsung selain teks transkrip (misal: intonasi keraguan penelepon atau deteksi mesin penjawab).
- [x] **Pemisahan Instruksi:** Pisahkan aturan pembawaan percakapan (*Live Prompt*) dari aturan hukum audit Permenkes No. 16 Tahun 2019 (*Backend Prompt*).
- [x] **Status Persisten (*Durable State*):** Nomor registrasi investigasi audit, riwayat revisi kasus, dan log rekaman audio 30 hari.

---

## 2. Matriks Komparasi Adaptasi: Realtime API vs GPT-Live

Berikut adalah perubahan mendasar saat beralih dari OpenAI Realtime API lama ke GPT-Live:

| Alur Kerja Operasional | Implementasi Realtime API (Lama) | Adaptasi GPT-Live (Baru & Modern) |
| :--- | :--- | :--- |
| **Kirim Audio Input** | `input_audio_buffer.append` | `session.input_audio.append` (atau WebRTC audio track) |
| **Terima Audio Output** | `response.output_audio.delta` | `session.output_audio.delta` (atau WebRTC audio track) |
| **Kontrol Giliran Bicara** | Memerlukan commit audio manual atau `response.create` | **Otomatis & Full-Duplex:** Model menentukan kapan harus bicara dan mendengarkan. |
| **Penanda Akhir Bicara** | Event `response.output_audio.done` & `response.done` | Tidak ada penanda audio done; status bicara dipantau via audio player RMS Web Audio klien. |
| **Transkrip Suara Pengguna** | `conversation.item.input_audio_transcription.delta` | `session.input_transcript.delta` (dilengkapi `start_ms` & `end_ms`) |
| **Transkrip Suara Asisten** | `response.output_audio_transcript.delta` | `session.output_transcript.delta` (dilengkapi `start_ms` & `end_ms`) |
| **Penerimaan Tool Call** | Membaca `response.output_item.done` di top level | Membuka bungkus `response.event`, lalu membaca inner `response.output_item.done` |
| **Pengembalian Tool Result** | Mengirimkan `conversation.item.create` | Mengirimkan `response.item.create` lalu memicu kelanjutan via `response.create` |

---

## 3. Strategi Pemisahan Prompt (*Prompt Splitting Architecture*)

Kesalahan umum saat migrasi ke GPT-Live adalah menyalin prompt lama secara utuh ke dalam model suara. Prompt harus dipecah menjadi dua:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ 1. LIVE CONVERSATION PROMPT (session.instructions): Maksimal 16.384 Token              │
│    - Identitas & Persona: FERA, Asisten Cerdas BPJS Kesehatan.                         │
│    - Gaya Vokal: Hangat, sopan, formal, bahasa Indonesia jernih.                       │
│    - Backchannel Policy: Berikan pengakuan singkat saat mendengarkan ("Ya Dok", dll).  │
│    - Interruption Policy: Segera berhenti bicara jika auditor memotong kalimat.        │
│    - Delegation Policy:                                                                │
│      * Backend Tools: Validasi SEP, Audit Faskes, Hitung Skor Risiko, Cek Anomali.     │
│      * Delegasikan KETIKA: Auditor menyebut NIK, nomor SEP, nama faskes, atau data.   │
│      * JANGAN Delegasikan: Sapaan awal, terima kasih, atau pengulangan fakta lama.     │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │
                                 DELEGATION (Konteks Tugas)
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ 2. BACKEND REASONING PROMPT (delegation.responses.instructions):                       │
│    - Aturan Hukum Mutlak: Permenkes No. 16 Tahun 2019 tentang Pencegahan Kecurangan.   │
│    - Formula Analitik: Rumus Haversine (Jarak), Days Supply Index, Prescription Ratio. │
│    - Eksekusi 10 Tools Forensik: Menjalankan parameter fungsi secara ketat (Strict).   │
│    - Output Terstruktur: Mengembalikan fakta ringkas yang siap disuarakan ke FERA.     │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Adaptasi Handler Pemanggilan Fungsi (*Function Tool Execution*)

Pada GPT-Live dengan Responses Delegation, hasil eksekusi tool dikembalikan ke sesi Live menggunakan dua langkah beruntun:

### Langkah A: Kirim Hasil Fungsi via `response.item.create`
```typescript
await liveConnection.send({
  type: "response.item.create",
  event_id: "tool_res_nik_01",
  item: {
    type: "function_call_output",
    call_id: receivedCallId, // ID fungsi dari response.output_item.done
    output: JSON.stringify({
      status: "ANOMALY_DETECTED",
      patientName: "Tn. Sutedjo",
      causeOfDeathDate: "2026-08-14",
      claimDate: "2026-09-02",
      riskScore: 0.98,
      recommendation: "Penerbitan Surat Pemeriksaan Khusus (SPK) segera."
    })
  }
});
```

### Langkah B: Lanjutkan Respon Backend via `response.create`
```typescript
await liveConnection.send({
  type: "response.create",
  event_id: "continue_audit_01"
});
```

---

## 5. Meredam Pengakuan Verbal Spontan saat Backend Berjalan

Jika kueri analitik backend membutuhkan waktu 1-2 detik dan Anda tidak ingin FERA mengeluarkan ucapan pengakuan (*verbal acknowledgement*) yang berulang:

1. Konfigurasikan `delegation.acknowledgement_delay_ms: 800` saat pembuatan sesi.
2. Seketika setelah menerima event `session.delegation.created`, kirimkan event `session.thinking.append` dengan konten string kosong (`""`) atau status progres senyap:

```json
{
  "type": "session.thinking.append",
  "event_id": "silence_ack_01",
  "delegation_id": "del_item_982bca",
  "content": ""
}
```

*Catatan Teknis:* Setiap injeksi `thinking.append` atau `commentary.append` secara otomatis membatalkan seluruh antrean pengakuan verbal yang tertunda dalam sesi tersebut.

---

## 6. Integrasi Ekosistem Mitra (*Telephony & Voice Frameworks*)

GPT-Live dapat diintegrasikan dengan berbagai infrastruktur teleponi dan media server terkemuka melalui protokol SIP atau WebRTC:

| Penyedia / Framework | Tipe Integrasi Resmi | Kasus Penggunaan pada INFERA BPJS |
| :--- | :--- | :--- |
| **LiveKit** | `@livekit/agents-plugin-openai` | Arsitektur WebRTC multi-peserta untuk ruang sidang dengar pendapat audit (*Audit Hearing Room*). |
| **Twilio** | Twilio Agent Connect (SIP Trunking) | Saluran hotline telepon verifikasi kepesertaan langsung ke nomor seluler peserta BPJS. |
| **Telnyx** | Telnyx Voice API (Outbound SIP) | Panggilan otomatis konfirmasi klaim faskes rawat inap dengan autentikasi TLS digest. |
| **Bandwidth** | SIP Universal Platform | Integrasi trunking tingkat perusahaan untuk call center BPJS Kesehatan 165. |
| **Pipecat / Daily** | Pipecat OpenAI Live Service | Framework pipeline suara Python/Node.js fleksibel untuk orkestrasi audio lokal. |

---

## 7. Rangkuman Validasi Hasil Migrasi

Sebelum merilis sistem ke pengguna akhir, verifikasi aspek-aspek berikut:
1. **Preservasi Intensi Multi-Turn:** Saat auditor berkata *"Sebenarnya maksud saya RS Siloam, bukan Hermina"*, backend membatalkan kueri Hermina dan beralih ke Siloam tanpa melakukan klaim ganda.
2. **Kepatuhan Guardrails:** Percakapan tidak dapat dipaksa untuk membocorkan NIK peserta yang tidak terkait dengan berkas audit yang sedang dibuka.
3. **Penyimpanan Berkas Kasus:** Setiap rekaman audio tersimpan dapat diunduh kembali via `GET /v1/live/sessions/{id}/content` untuk bukti investigasi formal.
