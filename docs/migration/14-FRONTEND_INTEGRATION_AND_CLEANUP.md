# Integrasi Frontend & Pembersihan Antarmuka (UI Cleanup)

Dokumen ini menguraikan arsitektur integrasi pada sisi aplikasi web (`apps/web`), implementasi modul WebRTC & SSE streaming, serta langkah-langkah pembersihan antarmuka (eliminasi "AI Slop" dan fallback ganda yang membingungkan).

---

## 1. Arsitektur Komponen Frontend

```
[ User Action: Chat / Suara ]
            │
            ├── Suara (WebRTC Voice) ───► RealtimeVoiceService.ts
            │                                  │
            │                                  ├── 1. POST /api/v2/voice/realtime-session (Ephemeral ek_...)
            │                                  ├── 2. SDP Offer/Answer -> OpenAI WebRTC Gateway
            │                                  └── 3. AnalyserNode (RMS 60 FPS) ──► AvatarController.setMouthOpen()
            │
            └── Teks (SSE Chat Stream) ──► OpenAiStreamService.ts
                                               │
                                               ├── 1. POST /api/v2/ai/chat/stream
                                               └── 2. ReadableStream Parser ──────► DashboardPage (Append Live Token)
```

---

## 2. Layanan Suara: `RealtimeVoiceService` (WebRTC + 60 FPS Lip-Sync)

Layanan `RealtimeVoiceService` menggantikan seluruh rantai kompleks *STT -> LLM -> TTS -> Audio Blob* dengan koneksi peer-to-peer WebRTC langsung ke OpenAI Realtime API.

### A. Alur Handshake Koneksi:
1. Klien memanggil `fetchEphemeralSession()` ke backend `/api/v2/voice/realtime-session`.
2. Backend mengembalikan `clientSecret` (`ek_...`).
3. Klien membuat `RTCPeerConnection` dan meminta akses mikrofon pengguna via `navigator.mediaDevices.getUserMedia({ audio: true })`.
4. Klien membuat WebRTC SDP Offer dan mengirimkannya langsung ke OpenAI:
   `POST https://api.openai.com/v1/realtime?model=gpt-realtime` dengan header `Authorization: Bearer ek_...`.
5. OpenAI mengembalikan SDP Answer, dan koneksi P2P aktif.

### B. Sinkronisasi Bibir (Lip-Sync) Presisi Tinggi:
Untuk menggerakkan mulut avatar FERA secara alami tanpa jeda:
- Track audio masuk dari OpenAI dihubungkan ke `AudioContext` dan `AnalyserNode`.
- Loop berfrekuensi tinggi (interval ~30ms) menghitung nilai Root Mean Square (RMS) amplitudo audio:
  $$RMS = \sqrt{\frac{1}{N} \sum_{i=0}^{N-1} x_i^2}$$
- Nilai RMS dinormalisasi ke rentang $[0, 1]$ dan diteruskan ke `AvatarController.setMouthOpen(normalizedVal)`.
- Gerakan bibir sinkron secara presisi 60 FPS dengan suara yang didengar pengguna.

---

## 3. Layanan Percakapan Teks: `OpenAiStreamService`

Modul `OpenAiStreamService.ts` mengonsumsi streaming SSE dari `/api/v2/ai/chat/stream`:

```typescript
export interface StreamChunkEvent {
  delta: string;
}

export class OpenAiStreamService {
  public static async streamChat(
    messages: Array<{ role: string; content: string }>,
    callbacks: {
      onChunk: (delta: string) => void;
      onComplete: () => void;
      onError: (err: string) => void;
    },
    signal?: AbortSignal
  ): Promise<void> {
    const res = await fetch('/api/v2/ai/chat/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, model: 'gpt-6-luna' }),
      signal,
    });

    if (!res.ok || !res.body) {
      throw new Error(`Streaming request failed: ${res.statusText}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith('data: ')) {
          const jsonStr = line.replace('data: ', '');
          try {
            const data = JSON.parse(jsonStr);
            if (data.delta) callbacks.onChunk(data.delta);
            if (data.finishReason === 'stop') callbacks.onComplete();
          } catch {
            // Abaikan parsing fragment tak lengkap
          }
        }
      }
    }
  }
}
```

---

## 4. Pembersihan UI ("Anti-AI Slop")

Pada evaluasi UI sebelumnya, terdapat beberapa elemen redundan yang membebani tampilan dan membingungkan pengguna:

### Elemen yang Dieliminasi:
1. **Form Input ElevenLabs API Key:** Pengguna demo tidak boleh dibebani kewajiban memasukkan token vendor eksternal. Semua kredensial dikelola di backend.
2. **Dropdown Voice ID Multi-Pilihan:** Opsi suara acak dihilangkan; digantikan dengan suara resmi avatar FERA kustom (`voice_6ae35f4fc2388191a0b2f21060b4e417`, *FERA Natural Anime Indonesian*) yang konsisten, ramah, dan artikulatif.
3. **Banner / Modal Fallback TTS:** Peringatan teknis mengenai kegagalan TTS dihapus dari pandangan pengguna, digantikan dengan penanganan status koneksi yang halus pada badge avatar.
4. **Tombol "Test ElevenLabs Voice":** Ditiadakan karena voice avatar kini ditenagai oleh OpenAI Realtime WebRTC dengan latensi ultra rendah.

### Pengalaman Baru yang Disediakan:
- **Floating Avatar Widget Modern:** Avatar dapat diklik untuk langsung memulai percakapan suara interaktif, dengan visualizer gelombang suara real-time saat FERA mendengarkan atau berbicara.
- **Chat Window Bersih & Cepat:** Balasan FERA mengalir seketika dengan Markdown rendering dan badge verifikasi investigasi BPJS yang elegan.

---

## 5. Komponen Interaktif Baru: Action Cards & Sourced Citations

### A. `ActionApprovalCard.tsx` (Human-in-the-Loop Governance)
Ketika FERA mengajukan rekomendasi penindakan fraud (misal suspensi kartu peserta atau penerbitan SP-1 faskes) melalui event `mcp_approval_request`, frontend merender kartu persetujuan interaktif:
- Menampilkan rincian pelanggaran, nama target, NIK/No. Kartu, estimasi kerugian finansial, dan dasar hukum Permenkes 16/2019.
- Tombol **"Setujui Tindakan"** memanggil `POST /api/v2/ai/action/approval` dengan `{ approve: true }`.
- Tombol **"Tolak / Batalkan"** mengirimkan penolakan dengan catatan auditor.

### B. `CitationBadge.tsx` (Sitasi Regulasi & Web)
Setiap kali FERA mengutip regulasi JKN dari Vector Store (`file_search`) atau Surat Edaran Kemenkes terkini dari Web (`web_search`), teks respons menyertakan pill badge:
- Badge Hijau (`Globe`): Sitasi web resmi (`kemkes.go.id`, `bpjs-kesehatan.go.id`, `who.int`) dengan link eksternal aman (`target="_blank" rel="noopener noreferrer"`).
- Badge Biru (`FileText`): Sitasi pasal Permenkes 16/2019 atau UU 17/2023 lengkap dengan nomor pasal dan ayat.

---

## 6. Pembersihan TypeScript TS6133 pada Monorepo (`apps/web`)

Untuk menjamin kompilasi produksi `npm run build` berhasil dengan exit code 0 tanpa peringatan *unused variable* (`noUnusedLocals: true`):
1. **`CasesDeepDivePage.tsx`**: Bersihkan import icon atau state `searchTerm` / `filterStatus` yang tidak terpakai di template.
2. **`IdentityRiskPage.tsx`**: Hapus deklarasi variabel DTO lokal yang telah digantikan oleh store analitik terpusat.
3. **`RegulationsPage.tsx`**: Hapus import fungsi mock yang tidak lagi dipanggil setelah integrasi Vector Store RAG.
4. **`UnnecessaryServicesPage.tsx`**: Bersihkan parameter filter DSI lama yang tidak direferensikan dalam tabel render.
