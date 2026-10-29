# Panduan Arsitektur Voice Agents & Kerangka Kerja Evaluasi (Voice Evaluation Framework)

Dokumen ini mendokumentasikan komparasi arsitektur **Voice Agents** OpenAI (GPT-Live vs Realtime API vs Chained Pipeline), pemilihan arsitektur untuk sistem **INFERA (Intelligent Fraud & Risk Analysis Agent)** BPJS Kesehatan, serta metodologi pengujian dan pengukuran latensi (*Voice Agent Evaluation & Benchmarking*) berbasis standar industri.

---

## 1. Tiga Paradigma Arsitektur Voice Agents

OpenAI mengidentifikasi tiga pola arsitektur utama untuk menghubungkan ucapan (*speech*) dengan penalaran (*reasoning*) dan pemanggilan fungsi (*tool calling*):

| Paradigma Arsitektur | Karakteristik Utama | Kelebihan & Alasan Memilih | Skenario Terbaik |
| :--- | :--- | :--- | :--- |
| **1. GPT-Live (`gpt-live-1`)** | **Full-Duplex** dengan backend terpisah (*delegation*). Model suara mendengarkan dan berbicara simultan sementara backend menjalankan investigasi. | Percakapan tidak pernah macet (*never freezes*), interupsi alami, model backend independen (`gpt-6-astra`), dan alur teks tetap utuh. | **Pilihan Utama INFERA:** Asisten audit interaktif FERA BPJS di mana auditor dapat berbicara saat data klaim sedang diproses. |
| **2. Realtime API (`gpt-realtime`)** | Model tunggal terpadu (*single speech-to-speech model*) untuk interpretasi audio, logika, dan suara. | Sangat sederhana diimplementasikan untuk sesi browser langsung tanpa pipeline backend berlapis. | Sesi dialog tanya-jawab cepat tanpa beban komputasi analitik database yang rumit. |
| **3. Chained Voice Pipeline** | Pipeline modular 3 tahap terpisah: **STT** (Whisper) -> **Agent Workflow** (LLM + Tools + Guardrails) -> **TTS**. | Kendali absolut atas teks antara (*intermediate text*), audit kepatuhan (*policy checks*) sebelum suara diproduksi, dan komponen dapat diganti independen. | Jalur audit forensik dengan regulasi kepatuhan ketat di mana setiap kalimat harus divalidasi sebelum disuarakan. |

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                               PERBANDINGAN ALUR EKSEKUSI DATA                                    │
├──────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                  │
│  A. GPT-Live (Dual-Track Full-Duplex):                                                           │
│     Auditor ──[Audio]──► GPT-Live (Live Model) ──[Delegation]──► Backend Engine (gpt-6-astra)    │
│                            │                                           │                         │
│                            └──◄──[Commentary/Thinking]─────────────────┘                         │
│                                                                                                  │
│  B. Chained Pipeline (Sequential Stages):                                                        │
│     Auditor ──[Audio]──► STT ──[Teks]──► Guardrails ──► LLM ──► Policy Check ──► TTS ──► [Audio] │
│                                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Implementasi Pipeline Suara Bertahap (*Chained Voice Pipeline*)

Untuk skenario audit kepatuhan di mana hasil investigasi penipuan klaim harus diverifikasi oleh *guardrails* internal sebelum disuarakan ke publik, INFERA menyediakan arsitektur cadangan berbasis **Chained Voice Pipeline**:

```python
import asyncio
import numpy as np
from agents import Agent, function_tool
from agents.voice import AudioInput, SingleAgentVoiceWorkflow, VoicePipeline

@function_tool
def audit_claim_validity(no_sep: str) -> str:
    """Verifikasi keabsahan klaim berdasarkan nomor SEP."""
    # Contoh fungsi eksekusi analitik internal
    return f"Klaim {no_sep} dinyatakan valid dan bebas anomali DSI."

# Agent cerdas dengan model penalaran gpt-6-astra
audit_agent = Agent(
    name="InferaComplianceAuditor",
    instructions="Anda adalah auditor kepatuhan BPJS Kesehatan. Selalu verifikasi regulasi Permenkes 16/2019 sebelum memberikan kesimpulan.",
    model="gpt-6-astra",
    tools=[audit_claim_validity],
)

async def run_voice_pipeline() -> None:
    # Mengikat alur kerja agen ke dalam pipeline suara bertahap
    pipeline = VoicePipeline(workflow=SingleAgentVoiceWorkflow(audit_agent))
    
    # Masukan audio PCM16 24kHz
    audio_input = AudioInput(buffer=np.zeros(24000 * 3, dtype=np.int16))
    result = await pipeline.run(audio_input)
    
    async for event in result.stream():
        if event.type == "voice_stream_event_audio":
            # Potongan audio sintesis siap diputar ke pengguna
            print("Received synthesized audio bytes:", event.data.nbytes)

if __name__ == "__main__":
    asyncio.run(run_voice_pipeline())
```

---

## 3. Metodologi Evaluasi: Kerangka Kerja "Crawl, Walk, Run"

Menguji Voice Agent membutuhkan verifikasi ganda: **keberhasilan tugas (*task completion*)** dan **kenyamanan percakapan (*conversational dynamics*)**. OpenAI menetapkan metodologi bertingkat **Crawl, Walk, Run**:

```
           ┌───────────────────────────────────────────────┐
           │                     RUN                       │
           │  Simulated Caller Interaktif Multi-Turn,      │
           │  Interupsi Spontan & Perubahan Kebutuhan      │
           └───────────────────────┬───────────────────────┘
                                   │
           ┌───────────────────────┴───────────────────────┐
           │                    WALK                       │
           │  Rekaman Asli Suara Manusia, Uji Aksen,       │
           │  Kebisingan Lingkungan & Variasi Mikrofon     │
           └───────────────────────┬───────────────────────┘
                                   │
           ┌───────────────────────┴───────────────────────┐
           │                    CRAWL                      │
           │  Single-Turn Terkontrol, Audio Sintetis,      │
           │  Verifikasi Deterministik Tool Output         │
           └───────────────────────────────────────────────┘
```

### Tahapan Uji Rinci:

1. **Tahap 1: Crawl (Single-Turn Terkontrol):**
   - Menggunakan audio sintetis yang konsisten untuk perintah satu putaran (misal: *"Cek status kepesertaan NIK 32010199200192"*).
   - Memastikan tool `audit_nik_eligibility` terpanggil dengan argumen yang presisi dan output teks akurat.
2. **Tahap 2: Walk (Kondisi Akustik Dunia Nyata):**
   - Memutar rekaman suara manusia asli dari berbagai latar belakang kebisingan (ruang RS yang ramai, mikrofon laptop berjarak jauh, suara latar keyboard).
   - Mengukur tingkat ketahanan ASR (*Automatic Speech Recognition*) dan kestabilan VAD (*Voice Activity Detection*).
3. **Tahap 3: Run (Simulasi Dialog Multi-Turn Dinamis):**
   - Menggunakan agen pemanggil sintetis (*simulated caller*) yang melakukan percakapan multi-turn berkelanjutan.
   - Menguji skenario auditor memotong pembicaraan FERA saat penjelasan berlangsung (*yielding to interruptions*), meralat nomor klaim di tengah jalan, dan meminta investigasi tambahan saat komputasi backend belum selesai.

---

## 4. Empat Dimensi Pengukuran Kualitas Voice Agent

Untuk GPT-Live dan Realtime Voice pada INFERA, evaluasi dilakukan pada 4 pilar independen:

| Dimensi Evaluasi | Metrik Utama yang Diukur | Kriteria Keberhasilan INFERA |
| :--- | :--- | :--- |
| **1. Luaran Tugas & Tools (*Task & Tools*)** | - Preservasi intensi pengguna<br/>- Ketepatan argumen function calling<br/>- Kecocokan konfirmasi lisan dengan data riil | 100% parameter tools valid sesuai skema JSON Zod; tidak ada halusinasi data peserta BPJS. |
| **2. Waktu Percakapan (*Conversational Timing*)** | - Latensi jawaban bersuara pertama (*TTFS*)<br/>- Responsivitas jeda bicara (*unwanted silence*)<br/>- Kelancaran saat diinterupsi (*yielding speed*) | Pengakuan verbal spontan (*verbal acknowledgement*) < 400ms; penghentian bicara saat diinterupsi < 200ms. |
| **3. Akustik & Bahasa (*Speech & Language*)** | - Pengenalan istilah medis (ICD-10, CBG, SEP)<br/>- Kejelasan intonasi bahasa Indonesia formal<br/>- Pengucapan angka/rupiah secara natural | Transkripsi nomor SEP dan nominal rupiah tanpa salah sebut digit. |
| **4. Reliabilitas Sesi (*Session Reliability*)** | - Rasio kegagalan koneksi WebRTC/SIP<br/>- Paket audio drop (*jitter buffer underrun*)<br/>- Sesi terputus sebelum tuntas | > 99.5% keberhasilan sesi stabil tanpa terputus selama 15 menit audit intensif. |

---

## 5. Metrik Pengukuran Latensi (*Latency Measurement & Profiling*)

Latensi yang dirasakan pengguna (*audible response latency*) dipecah menjadi beberapa titik pengukuran observasi aplikasi:

```
[ Auditor Berhenti Bicara ]
            │
            ├──► t0: Deteksi Akhir Bicara (Server VAD) ─────────── (~150ms)
            ├──► t1: Respon Pengakuan Lisan ("Baik, saya cek...") ─ (< 400ms)
            ├──► t2: Permintaan Delegasi Dikirim ke Backend ───── (~20ms)
            ├──► t3: Tool Forensik Mulai Berjalan (DB Query) ───── (~80ms)
            ├──► t4: Tool Forensik Selesai & Kirim Hasil ───────── (~120ms)
            ├──► t5: Stream Commentary Disuntikkan ke Live ─────── (~15ms)
            └──► t6: Audio Jawaban Substantif Tiba di Klien ─────── (~600ms - 800ms)
```

### Panduan Optimasi Latensi:
1. **Pisahkan Pengukuran Respon Pengakuan vs Jawaban Final:**
   - Gunakan `acknowledgement_delay_ms: 0` pada konfigurasi `delegation.responses`. Pengguna langsung mendengar respon awal instan, menghilangkan kesan sistem "membeku".
2. **Pantau P50 dan P95 Latensi:**
   - Pertahankan median (P50) latensi audio di bawah **600ms**, dan batas persentil ke-95 (P95) di bawah **1.200ms** untuk kueri database yang kompleks.
3. **Eliminasi Transcoding:**
   - Pertahankan format audio native 24 kHz Opus pada WebRTC untuk menghindari overhead decoding-encoding berulang di sisi server aplikasi.

---

## 6. Fondasi Workflow Inti Agen (*Core Agent Building Blocks*)

Meskipun antarmuka suara mengubah cara transportasi data (WebRTC/SIP), arsitektur workflow inti agen tetap berpegang pada standar tata kelola:

- **Using Tools:** 10 skema tools audit kecurangan BPJS diikat secara ketat (*strict mode*).
- **Running Agents:** Sesi audio mendukung streaming token dan kontinuitas multi-turn via `encrypted_content`.
- **Orchestration & Handoffs:** Kemampuan mengalihkan sesi investigasi dari FERA (Auditor Umum) ke spesialis audit medis saat terdeteksi indikasi anomali klinis berat (Modus 3: Unnecessary Services).
- **Guardrails & Human Review:** Skenario rekomendasi penjatuhan sanksi faskes mewajibkan konfirmasi manual dari auditor manusia (*Human-in-the-Loop*).
- **Integrasi MCP & Observabilitas:** Menggunakan protokol Model Context Protocol untuk menghubungkan agent ke sistem data internal BPJS Kesehatan.
