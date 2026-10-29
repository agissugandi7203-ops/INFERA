# Panduan Teknis: WebSocket Events & Persistent Connection Architecture

Dokumen ini mendokumentasikan implementasi koneksi WebSocket persisten (**Persistent Responses API WebSocket**) dan protokol event real-time pada platform **INFERA (Intelligent Fraud & Risk Analysis Agent)**. Dokumen ini menjadi pedoman arsitektural untuk komunikasi dua arah latensi rendah, *stream multiplexing*, dan sinkronisasi status investigasi forensik BPJS Kesehatan secara *stateful* maupun *stateless*.

---

## 1. Ikhtisar Arsitektur WebSocket Persisten

Koneksi WebSocket persisten memungkinkan pertukaran event client-ke-server dan server-ke-client melalui satu socket TCP yang tahan lama (*long-lived connection*), menghilangkan overhead *handshake* HTTPS berulang pada skenario audit beruntun (*rapid multi-query audit*).

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                               INFERA Persistent WebSocket Client                                 │
└────────────────────────────────┬────────────────────────────────┬────────────────────────────────┘
                                 │                                │
                       response.create (Lane A)         response.create (Lane B)
                       stream_id: "audit_tx_01"         stream_id: "chat_ui_01"
                                 │                                │
                                 ▼                                ▼
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                     Persistent WebSocket Gateway: wss://api.openai.com/v1/responses              │
│                                                                                                  │
│   - Multiplexing Antrean Independen (stream_id FIFO Lanes)                                       │
│   - Prompt Cache Options (Explicit Breakpoints + TTL 30m/12h)                                    │
│   - Server-Side Compaction Trigger & Context Management                                          │
│   - Replay State via previous_response_id / encrypted_content                                   │
└────────────────────────────────┬────────────────────────────────┬────────────────────────────────┘
                                 │                                │
                                 ▼                                ▼
                  [ Stream A: Forensic Tool Execution ]   [ Stream B: Assistant Text Response ]
```

### Karakteristik Kunci Mode WebSocket:
1. **Streaming Implisit (`stream: true`):**
   - Pada koneksi WebSocket, streaming selalu aktif secara implisit. Klien **tidak boleh** menyertakan parameter `stream: true` dalam payload `response.create`.
2. **`stream_id` Khusus WebSocket:**
   - Parameter `stream_id` adalah pengidentifikasi kanal *multiplexing* independen di atas satu koneksi WebSocket. Ini memisahkan pesan stream yang berbeda secara FIFO tanpa tumpang tindih.
3. **Tanpa Background Execution:**
   - Parameter `background` tidak didukung pada mode WebSocket karena soket bersifat interaktif sinkron.
4. **Efisiensi Caching & Zero Retention:**
   - Mendukung opsi `prompt_cache_options` dan penyimpanan tanpa data tersimpan (`store: false`) dengan memanfaatkan `include: ["reasoning.encrypted_content"]`.

---

## 2. Spesifikasi Client Event: `response.create`

Klien mengirimkan event `response.create` untuk memulai generasi respon atau mengeksekusi pipeline tool forensik.

### Skema Event: `ResponsesClientEventResponseCreate`

```typescript
export interface ResponsesClientEventResponseCreate {
  /** Jenis client event, selalu "response.create" */
  type: "response.create";

  /** Pengidentifikasi stream lane unik untuk multiplexing FIFO pada WebSocket */
  stream_id?: string;

  /** Model reasoning/generasi yang digunakan */
  model: "gpt-6-astra" | "gpt-6.1-sol" | "gpt-6-luna" | "gpt-5.6-terra" | string;

  /** Instruksi pengarah sistem atau developer */
  instructions?: string;

  /** Input percakapan atau pesan baru */
  input?: Array<ResponseInputItem>;

  /** ID respon sebelumnya untuk menjaga kontinuitas konteks percakapan */
  previous_response_id?: string;

  /** Konfigurasi reasoning untuk model penalaran */
  reasoning?: {
    effort?: "none" | "minimal" | "low" | "medium" | "high" | "xhigh" | "max";
    mode?: "standard" | "pro";
    summary?: "auto" | "concise" | "detailed";
  };

  /** Opsi caching prompt cerdas */
  prompt_cache_options?: {
    mode?: "implicit" | "explicit";
    ttl?: "30m" | "12h";
    prewarm?: boolean;
  };

  /** Batas kompresi konteks otomatis */
  context_management?: {
    compaction_threshold?: number;
  };

  /** Field tambahan yang diminta kembali dalam respon */
  include?: Array<"reasoning.encrypted_content" | "logprobs">;

  /** Pengaturan pemanggilan tools */
  tools?: Array<ToolDefinition>;
  tool_choice?: "auto" | "none" | "required" | { type: "function"; name: string };
  parallel_tool_calls?: boolean;

  /** Kebijakan retensi server */
  store?: boolean;
}
```

### Contoh Payload Riil: Audit Kasus Klaim Fiktif (Modus 1)

```json
{
  "type": "response.create",
  "stream_id": "stream_audit_case_001",
  "model": "gpt-6-astra",
  "store": false,
  "include": [
    "reasoning.encrypted_content"
  ],
  "reasoning": {
    "effort": "high",
    "summary": "auto"
  },
  "prompt_cache_options": {
    "mode": "explicit",
    "ttl": "30m",
    "prewarm": true
  },
  "instructions": "Anda adalah Engine Forensik INFERA BPJS Kesehatan. Lakukan validasi silang NIK terhadap database kematian Capil dan riwayat eligibilitas SEP sesuai Permenkes 16/2019.",
  "input": [
    {
      "type": "message",
      "role": "user",
      "content": [
        {
          "type": "input_text",
          "text": "Audit klaim SEP-32010124-00992 atas pasien Tn. Sutedjo (NIK: 32010199200192)."
        }
      ]
    }
  ],
  "tools": [
    {
      "type": "function",
      "name": "audit_deceased_claim",
      "description": "Mendeteksi klaim fiktif atas nama peserta yang telah meninggal dunia.",
      "parameters": {
        "type": "object",
        "properties": {
          "nik": { "type": "string" },
          "tanggalPelayanan": { "type": "string" }
        },
        "required": ["nik", "tanggalPelayanan"]
      }
    }
  ]
}
```

---

## 3. Multiplexing Antrean dengan `stream_id` vs `previous_response_id`

Penting untuk membedakan peran teknis antara **`stream_id`** dan **`previous_response_id`**:

| Parameter | Lingkup & Lapisan | Tujuan Arsitektural |
| :--- | :--- | :--- |
| **`stream_id`** | **WebSocket Envelope Layer** | Mengelompokkan paket event streaming masuk dan keluar ke kanal FIFO independen. Mengizinkan frontend menerima stream penjelasan teks bersamaan dengan stream telemetry tool tanpa bentrok data. |
| **`previous_response_id`** | **Responses Lineage Layer** | Menjaga silsilah memori percakapan (*conversation lineage*) pada server. Model mengetahui riwayat percakapan sebelumnya tanpa perlu mengirimkan ulang seluruh riwayat pesan teks. |

```
Klien WebSocket Connection:
├── [stream_id: "audio_transcription"] ──► Event output transcript suara
├── [stream_id: "forensic_reasoning"]   ──► Event delta pemikiran gpt-6-astra
└── [stream_id: "ui_summary_text"]      ──► Event output_text delta final
```

---

## 4. Siklus Server Events pada Koneksi WebSocket

Setelah klien mengirim `response.create`, server merespon dengan rangkaian event berikut pada `stream_id` yang bersangkutan:

```
[ Klien Kirim response.create (stream_id: "X") ]
                       │
                       ▼
           response.created (stream_id: "X")
                       │
                       ▼
        response.output_item.added (stream_id: "X")
                       │
          ┌────────────┴────────────┐
          ▼                         ▼
response.reasoning.delta   response.output_text.delta
(stream_id: "X")           (stream_id: "X")
          │                         │
          ▼                         ▼
response.reasoning.done    response.output_text.done
(encrypted_content)        (teks final)
          │                         │
          └────────────┬────────────┘
                       │
                       ▼
        response.output_item.done (stream_id: "X")
                       │
                       ▼
           response.completed (stream_id: "X")
```

---

## 5. Context Compaction & Manajemen Token Otomatis

Untuk audit investigasi mendalam yang melibatkan puluhan bukti transaksi, percakapan dapat mencapai batas konteks. Responses API menyediakan fitur **Context Compaction**:

1. **`context_management.compaction_threshold`:**
   - Dikonfigurasi dalam `response.create` (misalnya: `100000` token).
2. **Progress Notification `response.compaction.compacting`:**
   - Jika proses kompresi memakan waktu, server mengirim notifikasi setiap maksimal 30 detik untuk menandai pemadatan konteks aktif.
3. **Stateless Replay:**
   - Item keluaran tipe `compaction` memiliki `encrypted_content` yang dapat disertakan pada giliran berikutnya (`input: [{ type: "item_reference", id: "cmp_..." }]`), menjaga performa tanpa kehilangan substansi temuan audit.

---

## 6. Template Integrasi Klien WebSocket Node.js / Browser

```typescript
import WebSocket from 'ws';

export class InferaResponsesWebSocketClient {
  private ws: WebSocket | null = null;
  private readonly endpoint = 'wss://api.openai.com/v1/responses';

  constructor(private readonly apiKey: string) {}

  public async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.endpoint, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'OpenAI-Beta': 'responses=v1'
        }
      });

      this.ws.on('open', () => {
        console.log('[InferaWS] Connected to OpenAI Responses persistent socket.');
        resolve();
      });

      this.ws.on('message', (data: string) => {
        const event = JSON.parse(data);
        this.handleServerEvent(event);
      });

      this.ws.on('error', (err) => {
        console.error('[InferaWS] Socket error:', err);
        reject(err);
      });

      this.ws.on('close', (code, reason) => {
        console.log(`[InferaWS] Closed: ${code} - ${reason.toString()}`);
      });
    });
  }

  public createResponse(params: {
    streamId: string;
    instructions: string;
    userQuery: string;
    previousResponseId?: string;
  }): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket is not connected.');
    }

    const payload = {
      type: 'response.create',
      stream_id: params.streamId,
      model: 'gpt-6-astra',
      store: false,
      include: ['reasoning.encrypted_content'],
      instructions: params.instructions,
      previous_response_id: params.previousResponseId,
      prompt_cache_options: {
        mode: 'explicit',
        ttl: '30m',
        prewarm: true
      },
      input: [
        {
          type: 'message',
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: params.userQuery
            }
          ]
        }
      ]
    };

    this.ws.send(JSON.stringify(payload));
  }

  private handleServerEvent(event: any): void {
    const streamId = event.stream_id || 'default';

    switch (event.type) {
      case 'response.created':
        console.log(`[${streamId}] Response created: ${event.response.id}`);
        break;

      case 'response.reasoning.delta':
        process.stdout.write(`\x1b[33m${event.delta}\x1b[0m`);
        break;

      case 'response.output_text.delta':
        process.stdout.write(`\x1b[32m${event.delta}\x1b[0m`);
        break;

      case 'response.completed':
        console.log(`\n[${streamId}] Completed. Usage:`, event.response.usage);
        break;

      case 'error':
        console.error(`[${streamId}] Error:`, event.error);
        break;
    }
  }
}
```

---

## 7. Rangkuman Best Practices untuk INFERA

1. **Selalu gunakan `stream_id`:** Berikan tag stream yang jelas seperti `audit_<claim_id>` untuk memudahkan isolasi respon jika user melakukan audit simultan.
2. **Jangan kirim `stream: true`:** Menghindari galat validasi skema WebSocket.
3. **Aktifkan `prewarm: true` pada `prompt_cache_options`:** Memastikan cache aturan Permenkes No. 16 Tahun 2019 tetap hangat (*warmed up*) di kluster OpenAI untuk respon kilat sub-200ms.
4. **Pelihara `encrypted_content`:** Simpan token enkripsi reasoning pada sesi memori lokal Express agar multi-turn reasoning tetap cerdas tanpa menyimpan data pasien di cloud OpenAI (`store: false`).
