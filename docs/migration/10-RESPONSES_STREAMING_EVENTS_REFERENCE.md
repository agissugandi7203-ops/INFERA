# Referensi Lengkap: Responses Streaming Events

Dokumen ini mendokumentasikan secara mendalam arsitektur dan siklus hidup (*lifecycle*) **Responses Streaming Events** pada OpenAI Responses API (`/v1/responses` dengan `stream: true`). Dokumen ini menjadi rujukan teknis utama bagi backend dan frontend INFERA dalam mengonsumsi, mengalirkan, dan menangani event streaming secara *type-safe*.

---

## 1. Siklus Hidup Event Streaming (*Event Lifecycle*)

Ketika permintaan ke Responses API dikirim dengan parameter `stream: true`, server membuka koneksi Server-Sent Events (SSE) dan memancarkan rangkaian event terstruktur seiring berjalannya proses generasi:

```
[ POST /v1/responses (stream: true) ]
               │
               ▼
       response.created
               │
               ▼
    response.output_item.added (misal: type "reasoning" atau "message")
               │
               ├──► response.content_part.added
               │           │
               │           ├──► response.reasoning.delta / response.output_text.delta
               │           │
               │           └──► response.output_text.done
               │
               └──► response.output_item.done (Membawa final encrypted_content)
               │
               ▼
        response.completed (Membawa objek Response utuh & token usage)
```

---

## 2. Taksonomi Event Server-Sent Events

Berikut adalah tabel event resmi yang dipancarkan oleh Responses API:

| Nama Event SSE | Objek Data Payload | Deskripsi & Titik Emisi |
| :--- | :--- | :--- |
| `response.created` | `ResponseCreatedEvent` | Dipancarkan seketika saat objek respons dibuat di server. Memuat `id`, `model`, dan timestamp Unix. |
| `response.output_item.added` | `ResponseOutputItemAddedEvent` | Menandai dimulainya item keluaran baru (misal: pesan asisten, tool call, atau reasoning item). |
| `response.content_part.added` | `ResponseContentPartAddedEvent` | Menandai bagian konten baru di dalam item keluaran (misal: text part atau refusal part). |
| `response.output_text.delta` | `{ delta: string }` | Potongan teks terlihat (*visible text token*) yang dialirkan ke antarmuka pengguna. |
| `response.output_text.done` | `{ text: string }` | Menandakan seluruh teks pada part tersebut telah selesai digenerasikan. |
| `response.reasoning.delta` | `{ delta: string }` | Potongan teks penalaran internal atau ringkasan reasoning yang dialirkan. |
| `response.reasoning.done` | `ReasoningItem` | Menandakan fase reasoning selesai, memuat token terenkripsi (`encrypted_content`). |
| `response.refusal.delta` | `{ delta: string }` | Potongan teks penolakan jika masukan melanggar kebijakan keselamatan. |
| `response.refusal.done` | `{ refusal: string }` | Teks penolakan lengkap dari sistem keselamatan. |
| `response.function_call_arguments.delta` | `{ delta: string }` | Potongan string JSON argumen fungsi yang sedang dirakit oleh model. |
| `response.function_call_arguments.done` | `{ arguments: string }` | String JSON argumen fungsi selesai dan siap diparsing untuk eksekusi lokal. |
| `response.compaction.compacting` | Progress Notification | Dipancarkan maksimal sekali tiap 30 detik saat sistem melakukan kompresi konteks riwayat percakapan. |
| `response.output_item.done` | `ResponseOutputItemDoneEvent` | Item keluaran selesai secara utuh. Membawa `encrypted_content` dan metadata final. |
| `response.completed` | `ResponseCompletedEvent` | Seluruh respons tuntas. Memuat rekapitulasi penggunaan token (`usage`). |
| `error` | `ResponseError` | Terjadi galat pada upstream OpenAI atau pelanggaran kebijakan kuota/keamanan. |

---

## 3. Spesifikasi Payload Kunci

### A. Event `response.created`
Dipancarkan pertama kali setelah koneksi HTTP stream terbentuk:
```json
{
  "type": "response.created",
  "response": {
    "id": "resp_01j8k9m2n4p5q6r7s8t9u0v1w2",
    "object": "response",
    "created_at": 1729900000,
    "status": "in_progress",
    "model": "gpt-6-astra",
    "error": null,
    "incomplete_details": null,
    "output": [],
    "usage": null
  }
}
```

### B. Event `response.output_text.delta`
Potongan karakter/kata yang dialirkan secara langsung ke klien web untuk render Markdown instan:
```json
{
  "type": "response.output_text.delta",
  "response_id": "resp_01j8k9m2n4p5q6r7s8t9u0v1w2",
  "item_id": "msg_01j8k9m3a4b5c6d7e8f9g0h1i2",
  "output_index": 0,
  "content_index": 0,
  "delta": "Berdasarkan audit forensik,"
}
```

### C. Event `response.output_item.done` (Penting untuk Stateless Reasoning)
Ketika item bertipe `reasoning` selesai diproses:
```json
{
  "type": "response.output_item.done",
  "response_id": "resp_01j8k9m2n4p5q6r7s8t9u0v1w2",
  "output_index": 0,
  "item": {
    "id": "rs_01j8k9m4j5k6l7m8n9o0p1q2r3",
    "type": "reasoning",
    "status": "completed",
    "summary": [
      {
        "type": "summary_text",
        "text": "FERA memvalidasi jarak geografis 148 km antara dua faskes dengan delta waktu 45 menit."
      }
    ],
    "encrypted_content": "gAAAAABn...[Enkripsi Token Reasoning untuk Replay]..."
  }
}
```
> **Aturan Wajib:** Jika aplikasi menggunakan mode `store: false` (Zero Data Retention), nilai `encrypted_content` dari event `response.output_item.done` ini **wajib disimpan** dan dikirimkan kembali pada `input` permintaan berikutnya agar kontinuitas penalaran tidak terputus!

### D. Event `response.completed` (Rekapitulasi Penggunaan & Biaya)
```json
{
  "type": "response.completed",
  "response": {
    "id": "resp_01j8k9m2n4p5q6r7s8t9u0v1w2",
    "status": "completed",
    "usage": {
      "input_tokens": 420,
      "input_tokens_details": {
        "cached_tokens": 128
      },
      "output_tokens": 850,
      "output_tokens_details": {
        "reasoning_tokens": 512
      },
      "total_tokens": 1270
    }
  }
}
```

---

## 4. Penanganan Alasan Pemutusan Respons (`incomplete_details`)

Jika model berhenti menghasilkan respons sebelum selesai, properti `incomplete_details.reason` akan terisi:

| Nilai `reason` | Arti & Penyebab | Tindakan Sistem INFERA |
| :--- | :--- | :--- |
| `max_output_tokens` | Jumlah token akumulasi (reasoning + output) mencapai batas `max_output_tokens`. | Naikkan parameter `max_output_tokens` (rekomendasi minimal 25.000 token untuk model reasoning). |
| `content_filter` | Konten masukan atau keluaran terblokir oleh filter keselamatan OpenAI. | Tampilkan pesan kepatuhan ramah kepada pengguna tanpa membocorkan data sensitif. |
| `steered` | Respons dihentikan secara aman di batas token setelah menerima event `response.steer` via WebSocket. | Sistem backend dapat otomatis membuat respons penerus dengan input yang telah diantrekan. |
| `max_messages` | Batas maksimum pesan dalam percakapan terlampaui. | Picu pemadatan konteks otomatis (*context compaction*). |

---

## 5. Implementasi Parser Streaming Universal (TypeScript / Browser)

Berikut adalah pola implementasi parser SSE standar untuk menangani event Responses streaming:

```typescript
export interface StreamingCallbacks {
  onTextDelta?: (delta: string) => void;
  onReasoningDelta?: (delta: string) => void;
  onReasoningSummary?: (summary: string) => void;
  onToolCall?: (toolName: string, args: Record<string, unknown>) => void;
  onCompleted?: (response: any) => void;
  onError?: (err: Error) => void;
}

export async function consumeResponsesStream(
  streamResponse: Response,
  callbacks: StreamingCallbacks
): Promise<void> {
  if (!streamResponse.body) throw new Error('ReadableStream tidak didukung.');

  const reader = streamResponse.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith(':')) continue; // Abaikan komentar/keep-alive

        if (trimmed.startsWith('data: ')) {
          const jsonStr = trimmed.slice(6);
          try {
            const eventData = JSON.parse(jsonStr);

            switch (eventData.type) {
              case 'response.output_text.delta':
                callbacks.onTextDelta?.(eventData.delta);
                break;
              case 'response.reasoning.delta':
                callbacks.onReasoningDelta?.(eventData.delta);
                break;
              case 'response.output_item.done':
                if (eventData.item?.type === 'reasoning' && eventData.item?.summary) {
                  const summaryText = eventData.item.summary.map((s: any) => s.text).join('\n');
                  callbacks.onReasoningSummary?.(summaryText);
                }
                break;
              case 'response.completed':
                callbacks.onCompleted?.(eventData.response);
                break;
              case 'error':
                callbacks.onError?.(new Error(eventData.message));
                break;
            }
          } catch {
            // Buffer fragment parsial menunggu chunk berikutnya
          }
        }
      }
    }
  } catch (error) {
    callbacks.onError?.(error instanceof Error ? error : new Error(String(error)));
  }
}
```

---

## 6. Integrasi dengan Arsitektur Caching INFERA

Pada arsitektur INFERA API v2:
1. **Cache Miss:** Server Express mengonsumsi stream dari OpenAI Responses API, memancarkan event `response.output_text.delta` langsung ke browser, sekaligus mengumpulkan teks lengkap di buffer memory.
2. **Kompilasi Selesai:** Saat event `response.completed` tiba, teks lengkap disimpan ke `cacheService` dengan kunci hash SHA-256 dan TTL 86.400 detik.
3. **Cache Hit:** Saat pertanyaan identik diajukan kembali, server langsung memancarkan urutan event sintetis (`response.created` -> deretan `response.output_text.delta` bersimulasi ~8ms -> `response.completed`) dengan biaya **\$0** dan latensi **0ms**.
