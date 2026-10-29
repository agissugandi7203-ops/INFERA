# Panduan Deployment & Checklist Verifikasi API v2

Dokumen ini menyediakan panduan operasional langkah demi langkah untuk melakukan deployment, konfigurasi environment variables, serta verifikasi kelayakan sistem INFERA API v2 baik pada lingkungan lokal (*development*) maupun produksi (*production/Vercel*).

---

## 1. Konfigurasi Environment Variables

Berikut adalah konfigurasi variabel lingkungan yang wajib disiapkan:

### A. Backend (`apps/api/.env` dan Root `.env`):
```ini
# Port Server Backend
PORT=3001
NODE_ENV=production

# OpenAI API Key (Wajib untuk v2 Realtime WebRTC, SSE Streaming, dan Responses API)
OPENAI_API_KEY=your_openai_api_key_here

# Model Default untuk Chat & Investigasi
OPENAI_CHAT_MODEL=gpt-6-luna

# Keamanan & JWT
JWT_SECRET=super_secret_jwt_infera_bpjs_2026_production_key_random_hash
JWT_EXPIRES_IN=7d

# CORS (Izinkan domain frontend)
CORS_ORIGIN=https://infera.vercel.app,http://localhost:5173,http://localhost:3000

# Redis Cache (Opsional, fallback ke MemoryCache otomatis jika kosong)
REDIS_URL=
```

### B. Frontend (`apps/web/.env`):
```ini
# URL Backend API (Untuk Vercel / Production menggunakan relative /api atau domain backend)
VITE_API_URL=/api/v1
```

*Catatan Penting:* Pada `RealtimeVoiceService.ts`, URL backend secara otomatis membersihkan sufiks `/api/v1` dan menyambungkannya ke `/api/v2/voice/realtime-session`, sehingga tidak merusak konfigurasi routing yang sudah ada.

---

## 2. Checklist Verifikasi Langkah Demi Langkah (Pre-Flight)

Sebelum merilis perubahan ke juri atau lingkungan produksi:

- [x] **1. Type Checking & Shared Contracts:**
  Jalankan build pada workspace shared:
  ```bash
  npm --workspace=@healthathon/shared run build
  ```
  *Ekspektasi:* Berhasil tanpa error tipe.

- [x] **2. Backend Build:**
  Jalankan kompilasi TypeScript backend:
  ```bash
  npm --workspace=@healthathon/api run build
  ```
  *Ekspektasi:* Folder `apps/api/dist` terbentuk bersih.

- [x] **3. Frontend Build:**
  Jalankan bundler Vite frontend:
  ```bash
  npm --workspace=@healthathon/web run build
  ```
  *Ekspektasi:* Folder `apps/web/dist` terbentuk tanpa galat kompilasi atau variabel tak terpakai.

- [x] **4. Full Monorepo Build:**
  Jalankan perintah build root:
  ```bash
  npm run build
  ```
  *Ekspektasi:* Exit code `0` untuk semua package.

---

## 3. Uji Coba Endpoint via cURL

### A. Uji Sesi Ephemeral WebRTC Suara:
```bash
curl -X POST "http://localhost:3001/api/v2/voice/realtime-session" \
  -H "Content-Type: application/json" \
  -d '{"voice":"voice_6ae35f4fc2388191a0b2f21060b4e417"}'
```
**Respons Sukses:**
```json
{
  "success": true,
  "data": {
    "clientSecret": "ek_live_...",
    "expiresAt": 1729900000,
    "model": "gpt-realtime",
    "voice": "voice_6ae35f4fc2388191a0b2f21060b4e417"
  },
  "timestamp": "2026-10-29T22:49:00.000Z",
  "meta": { "version": "v2" }
}
```

---

### B. Uji SSE Token Streaming:
```bash
curl -N -X POST "http://localhost:3001/api/v2/ai/chat/stream" \
  -H "Content-Type: application/json" \
  -H "Accept: text/event-stream" \
  -d '{
    "messages": [
      { "role": "user", "content": "Jelaskan definisi Doctor Shopping dalam 1 kalimat!" }
    ],
    "model": "gpt-6-luna"
  }'
```
**Output Streaming Terminal:**
```http
event: chunk
data: {"delta":"Doctor"}

event: chunk
data: {"delta":" shopping"}

event: chunk
data: {"delta":" adalah"}

event: chunk
data: {"delta":" praktik"}

event: done
data: {"finishReason":"stop"}
```

---

### C. Uji Deterministic SHA-256 Cache Hit:
Jalankan perintah cURL yang sama persis untuk kedua kalinya. Perhatikan waktu respons (*latency*):
- Panggilan 1 (Cache Miss): Respons ~300ms (panggilan ke server OpenAI).
- Panggilan 2 (Cache Hit): Respons `< 5ms` seketika (mengambil dari cache in-memory tanpa kuota token).

---

### D. Uji Endpoint INFERA MCP Server (`tools/list`):
```bash
curl -X POST "http://localhost:3001/api/v2/mcp" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```
**Respons Sukses:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "tools": [
      { "name": "audit_impossible_travel" },
      { "name": "audit_doctor_shopping" },
      { "name": "propose_participant_suspension" }
    ]
  }
}
```

---

### E. Uji Action Approval Dispatcher:
```bash
curl -X POST "http://localhost:3001/api/v2/ai/action/approval" \
  -H "Content-Type: application/json" \
  -d '{
    "approvalRequestId": "mcpr_demo_123",
    "approve": true,
    "auditorNotes": "Disetujui untuk investigasi lanjutan"
  }'
```
**Respons Sukses:**
```json
{
  "success": true,
  "data": {
    "status": "EXECUTED",
    "ticketId": "BPJS-SUSP-2026-9912"
  }
}
```

---

## 4. Panduan Deployment Vercel

1. Buka dashboard proyek di **Vercel**.
2. Masuk ke **Settings > Environment Variables**.
3. Tambahkan variabel berikut:
   - `OPENAI_API_KEY`: Masukkan nilai API Key aktif OpenAI.
   - `OPENAI_CHAT_MODEL`: `gpt-6-luna`
   - `JWT_SECRET`: Isi dengan kunci acak yang aman.
4. Lakukan **Redeploy** (atau git push ke branch `main`).
5. Uji langsung URL produksi di browser:
   - Klik floating avatar FERA di pojok kanan bawah.
   - Ucapkan *"Halo FERA, periksa kasus impossible travel terbaru"*.
   - Amati avatar merespons melalui suara real-time WebRTC dengan bibir bergerak sinkron (lip-sync 60 FPS).
