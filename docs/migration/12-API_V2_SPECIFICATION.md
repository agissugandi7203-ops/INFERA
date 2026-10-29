# Spesifikasi API v2: Arsitektur & Kontrak Endpoint

Dokumen ini mendefinisikan secara mendalam spesifikasi teknis dari **API v2** pada backend INFERA (`apps/api`), mencakup kontrak antarmuka (DTO), metode autentikasi, serta protokol komunikasi data.

---

## 1. Konsep & Prinsip Desain API v2

API v2 dirancang berlandaskan 4 prinsip utama:
1. **Low-Latency First:** Menghilangkan overhead multi-hop dengan menghubungkan langsung ke infrastruktur streaming OpenAI.
2. **Strict Type Safety:** Seluruh payload request dan response wajib mengacu pada tipe data dari workspace `@healthathon/shared`.
3. **Graceful Authentication (`optionalAuth`):** Endpoint dapat diakses secara publik pada mode demo atau kompetisi, namun tetap mempertahankan identitas pengguna (`req.user`) bila token JWT disertakan.
4. **SSE & WebRTC Native:** Memisahkan jalur audio real-time (WebRTC) dan jalur analisis analitik teks (Server-Sent Events).

---

## 2. Ringkasan Endpoint API v2

Prefix dasar: `/api/v2`

| Method | Endpoint Path | Middleware | Fungsi Utama |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v2/voice/realtime-session` | `optionalAuth`, `voiceLimiter` | Menginisiasi sesi WebRTC dan mengembalikan ephemeral client key (`ek_...`) dari OpenAI Realtime GA. |
| `POST` | `/api/v2/ai/chat/stream` | `optionalAuth`, `aiChatLimiter`, `validateBody` | Mengalirkan token jawaban AI secara real-time via Server-Sent Events (SSE). |
| `POST` | `/api/v2/ai/chat` | `optionalAuth`, `aiChatLimiter`, `validateBody` | Non-streaming fallback chat completion dengan automatic cache lookup. |

---

## 3. Rincian Endpoint

### A. POST `/api/v2/voice/realtime-session`

Menginisiasi sesi suara real-time interaktif antara browser pengguna dan OpenAI Realtime API melalui protokol WebRTC. Backend bertindak sebagai *gatekeeper* terpercaya yang membuat ephemeral secret tanpa membocorkan `OPENAI_API_KEY` utama ke sisi klien.

#### Header Permintaan:
```http
POST /api/v2/voice/realtime-session HTTP/1.1
Host: api.infera.local
Content-Type: application/json
Authorization: Bearer <OPTIONAL_JWT_TOKEN>
```

#### Request Body (`RealtimeSessionOptions`):
```json
{
  "voice": "voice_6ae35f4fc2388191a0b2f21060b4e417",
  "temperature": 0.6,
  "systemInstructions": "Anda adalah FERA, asisten virtual investigasi fraud BPJS Kesehatan..."
}
```

*Catatan:* Semua field pada body bersifat opsional. Jika tidak diisi, backend akan menggunakan konfigurasi baku:
- Voice: `'voice_6ae35f4fc2388191a0b2f21060b4e417'` (FERA Natural Anime Indonesian — nada anime wanita muda-dewasa yang cerah, artikulasi Indonesia baku, sopan dan ramah).
- Temperature: `0.6`.
- Model: `'gpt-realtime'` / `'gpt-live-1'`.

#### Response Body (`RealtimeSessionResponseDTO`):
```json
{
  "success": true,
  "data": {
    "clientSecret": "ek_live_abc123xyz...",
    "expiresAt": 1729900000,
    "model": "gpt-realtime",
    "voice": "voice_6ae35f4fc2388191a0b2f21060b4e417"
  },
  "timestamp": "2026-10-29T22:49:00.000Z",
  "meta": {
    "version": "v2"
  }
}
```

#### Status Code:
- `200 OK`: Sesi berhasil dibuat dan client secret siap di-handshake ke OpenAI.
- `429 Too Many Requests`: Melebihi batas frekuensi panggilan sesi suara.
- `503 Service Unavailable`: `OPENAI_API_KEY` belum terpasang di environment backend.

---

### B. POST `/api/v2/ai/chat/stream`

Menyediakan antarmuka percakapan interaktif berbasis teks dengan respons token-by-token menggunakan standar HTTP Server-Sent Events (SSE).

#### Header Permintaan:
```http
POST /api/v2/ai/chat/stream HTTP/1.1
Host: api.infera.local
Content-Type: application/json
Accept: text/event-stream
Authorization: Bearer <OPTIONAL_JWT_TOKEN>
```

#### Request Body (`AiChatInput`):
```json
{
  "messages": [
    {
      "role": "user",
      "content": "Jelaskan indikasi fraud pada faskes RSUD Bahagia dengan nilai anomaly 0.89!"
    }
  ],
  "model": "gpt-6-luna",
  "temperature": 0.3,
  "maxTokens": 2000
}
```

#### Format Streaming Response (SSE):
Respons dikembalikan dengan header:
- `Content-Type: text/event-stream; charset=utf-8`
- `Cache-Control: no-cache, no-transform`
- `Connection: keep-alive`
- `X-Accel-Buffering: no` (Mencegah proxy seperti NGINX melakukan buffering)

#### Urutan Event Stream:
1. **Token Chunks (`event: chunk`):**
   ```http
   event: chunk
   data: {"delta":"Berdasarkan"}

   event: chunk
   data: {"delta":" analisis"}

   event: chunk
   data: {"delta":" forensik"}
   ```
2. **Keep-Alive Heartbeat (Setiap 15 Detik):**
   ```http
   : keep-alive
   ```
3. **Penyelesaian Stream (`event: done`):**
   ```http
   event: done
   data: {"finishReason":"stop"}
   ```
4. **Penanganan Error (`event: error`):**
   ```http
   event: error
   data: {"message":"Batas waktu upstream terlampaui"}
   ```

---

### C. POST `/api/v2/ai/chat`

Alternatif non-streaming jika klien membutuhkan satu objek JSON utuh (misalnya untuk integrasi script pengujian atau ekspor laporan).

#### Request Body:
Sama dengan endpoint `/api/v2/ai/chat/stream`.

#### Response Body (`AiChatResponse`):
```json
{
  "success": true,
  "data": {
    "message": {
      "role": "assistant",
      "content": "Berdasarkan analisis forensik terhadap RSUD Bahagia..."
    },
    "model": "gpt-6-luna",
    "usage": {
      "promptTokens": 142,
      "completionTokens": 385,
      "totalTokens": 527
    }
  },
  "timestamp": "2026-10-29T21:30:00.000Z",
  "meta": {
    "version": "v2"
  }
}
```

---

### D. POST `/api/v2/mcp` (INFERA Model Context Protocol Server)

Endpoint resmi yang mengimplementasikan spesifikasi Model Context Protocol (MCP) Streamable HTTP / SSE JSON-RPC 2.0. Endpoint ini dapat dihubungkan langsung ke OpenAI Responses API (`type: "mcp"`) atau Secure MCP Tunnel.

#### 1. Method `tools/list`
Permintaan dari OpenAI untuk menginspeksi seluruh tools analitik dan action proposal yang tersedia.

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/list"
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "tools": [
      {
        "name": "audit_impossible_travel",
        "description": "Mendeteksi klaim berjarak jauh dalam waktu singkat...",
        "input_schema": { ... }
      },
      {
        "name": "propose_participant_suspension",
        "description": "Mengajukan penangguhan sementara kepesertaan JKN...",
        "input_schema": { ... }
      }
    ]
  }
}
```

#### 2. Method `tools/call`
Eksekusi tool setelah mendapatkan konfirmasi atau approval dari auditor manusia.

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "propose_participant_suspension",
    "arguments": {
      "participant_id": "0001234567890",
      "reason": "Kecepatan impossible travel 450 km/jam",
      "severity": "CRITICAL"
    }
  }
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"status\":\"SUSPENSION_PROPOSED\",\"ticket_id\":\"BPJS-SUSP-2026-9912\"}"
      }
    ]
  }
}
```

---

### E. POST `/api/v2/ai/action/approval` (Human-in-the-Loop Dispatcher)

Endpoint khusus yang dipanggil oleh frontend (`apps/web`) ketika auditor mengklik tombol **"Setujui Tindakan"** atau **"Tolak"** pada kartu `ActionApprovalCard`. Endpoint ini merespons event `mcp_approval_request` dengan menyuntikkan `mcp_approval_response` ke Responses API.

#### Request Body:
```json
{
  "previousResponseId": "resp_682d498bdefc81918b4a6aa477bfafd904ad1e533afccbfa",
  "approvalRequestId": "mcpr_682d498e3bd4819196a0ce1664f8e77b04ad1e533afccbfa",
  "approve": true,
  "auditorNotes": "Disetujui berdasarkan bukti visualisasi koordinat GPS"
}
```

#### Response Body:
```json
{
  "success": true,
  "data": {
    "status": "EXECUTED",
    "ticketId": "BPJS-SUSP-2026-9912",
    "message": "Penangguhan sementara peserta berhasil dicatat dan dieksekusi di database."
  },
  "timestamp": "2026-10-29T22:49:00.000Z"
}
```

---

## 4. Keamanan & Kebijakan Autentikasi (`optionalAuth`)

Pada arsitektur terdahulu, kegagalan umum terjadi saat juri mencoba demo tanpa login, menghasilkan galat `401 Unauthorized`. Pada API v2, diadopsi pola `optionalAuth`:

```typescript
// apps/api/src/middleware/auth.middleware.ts
export const optionalAuth = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    // Pengunjung anonim diizinkan mengakses mode demonstrasi
    return next();
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    req.user = decoded;
  } catch {
    // Token kedaluwarsa atau tidak valid diabaikan agar demo tidak terputus
  }
  next();
};
```

Keuntungan:
- **Zero Barrier Demo:** Penguji dapat langsung berinteraksi dengan avatar dan AI.
- **Audit Logging Otomatis:** Bila pengguna terotentikasi (misal auditor resmi BPJS), `userId` dan instansi tetap tercatat pada log audit secara transparan.
