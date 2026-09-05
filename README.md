# 🛡️ INFERA
### *Integrated Fraud Early-Warning & Risk Analytics*
**HealthAthon BPJS Kesehatan**

INFERA adalah platform analitik dan pengawasan integritas klaim kesehatan berbasis AI yang dirancang untuk mendeteksi anomali, indikasi fraud, dan profil risiko peserta BPJS Kesehatan secara *real-time*, dilengkapi dengan **Interactive AI Voice Assistant (Vera & Luna)**.

---

## 🏛️ Arsitektur Monorepo

```text
infera/
├── apps/
│   ├── api/                    # Backend: Node.js + Express + TypeScript (Railway)
│   │   ├── src/
│   │   │   ├── config/         # Konfigurasi & validasi Zod (.env)
│   │   │   ├── controllers/    # Handler API (Health, AI, Risk, Modus 1-4)
│   │   │   ├── routes/         # Router Express (/api/v1)
│   │   │   ├── services/       # Supabase, OpenRouter AI, Algoritma Risiko
│   │   │   └── server.ts       # Server entrypoint
│   │   └── package.json
│   │
│   └── web/                    # Frontend: React 18 + Vite + TypeScript + Tailwind (Vercel)
│       ├── src/
│       │   ├── features/
│       │   │   └── dashboard/  # Modular pages (Overview, Report, Transactions, Modus 1-4)
│       │   │       ├── avatar/ # PixiJS Interactive Anime Avatar
│       │   │       └── layout/ # Enterprise TopNav & Sidebar
│       │   ├── lib/            # Supabase Client, API Client
│       │   └── routes/         # React Router v6 SPA
│       └── package.json
│
├── packages/
│   └── shared/                 # Single Source of Truth (Contracts, Types, Modus Rules)
├── railway.json                # Zero-config deployment untuk Railway
├── vercel.json                 # SPA routing & build configuration untuk Vercel
└── package.json                # Monorepo workspaces orchestrator
```

---

## 🚀 Fitur Utama

1. **Ringkasan Eksekutif & Stream Forensik:** Pantau rasio klaim, anomali DSI (Doctor Shopping Index), dan impossible travel secara langsung.
2. **Interactive AI Voice Avatar (Vera & Luna):**
   - **Vera (Default):** Model suara jernih dan ramah (`GgFtkxszsIQcD4MYvQax`).
   - **Luna:** Model suara kedua (`0csCu4D7iyBsmlVlf9Iu`), dapat diganti langsung via klik kanan avatar widget.
   - Menggunakan LLM `openai/gpt-oss-120b:nitro` dengan prompt ekspresif JSON.
3. **Analisis Modus Risiko:**
   - **Modus 1 & 2:** Identitas Ganda & Impossible Travel Geografis.
   - **Modus 3:** Doctor Shopping & Pelayanan Berlebih (Unnecessary Services).
   - **Modus 4:** Resep Polifarmasi PRB & Pemalsuan Klaim Alkes.
4. **Regulasi JKN Terintegrasi:** Database aturan anti-fraud Kemenkes & BPJS.

---

## ⚙️ Konfigurasi Lingkungan (.env)

Terdapat 3 berkas environment yang sudah diselaraskan:
- **`apps/api/.env`**: Untuk Backend API di Railway.
- **`apps/web/.env`**: Untuk Frontend Web di Vercel.
- **`.env` (Root)**: Master konfigurasi untuk pengembangan lokal.

### Backend Kunci (Railway)
```env
PORT=4000
NODE_ENV=production
CLIENT_URL=https://your-vercel-domain.vercel.app
SUPABASE_URL=https://exidisfsrtyzqeibedbf.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_DEFAULT_MODEL=openai/gpt-oss-120b:nitro
```

### Frontend Kunci (Vercel)
```env
VITE_API_URL=https://your-railway-domain.up.railway.app/api/v1
VITE_SUPABASE_URL=https://exidisfsrtyzqeibedbf.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_OPENROUTER_API_KEY=sk-or-v1-...
VITE_DEFAULT_MODEL=openai/gpt-oss-120b:nitro
VITE_ELEVENLABS_API_KEY=sk_d578c5c451ccb257fcf6bde2d533376acab739d6a688ec9b
VITE_ELEVENLABS_VOICE_ID=GgFtkxszsIQcD4MYvQax
```

---

## 🛠️ Menjalankan Proyek Secara Lokal

```bash
# 1. Install semua dependensi
npm install

# 2. Jalankan Backend dan Frontend bersamaan
npm run dev

# Atau jalankan secara terpisah:
npm run dev:api    # Menjalankan Express API pada port 4000
npm run dev:web    # Menjalankan Vite Web pada port 5173
```

---

## 🚢 Panduan Deploy Produksi

### 1. Frontend di Vercel
- **Root Directory:** `./` (Default / Root Monorepo)
- **Framework Preset:** `Vite`
- **Build Command:** `npm run build:web`
- **Output Directory:** `apps/web/dist`
- **Install Command:** *Biarkan default (Toggle OFF)*
- Masukkan variabel lingkungan `VITE_*` pada menu Settings -> Environment Variables.

### 2. Backend di Railway
- Hubungkan repository GitHub.
- Railway akan otomatis mengeksekusi `railway.json`:
  - **Build:** `npm run build:api`
  - **Start:** `npm run start:api`
- Masukkan variabel lingkungan backend pada menu Variables.
- Buat domain publik di menu Settings -> Networking -> Generate Domain.
