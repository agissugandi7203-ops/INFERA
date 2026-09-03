# HealthAthon BPJS — Fullstack Monorepo Starter Template

Arsitektur monorepo modern, bersih, dan mudah dirawat untuk pengembangan sistem fullstack dengan standar industri tinggi dan bebas *AI slop*.

---

## 🏛️ Arsitektur Sistem

Monorepo ini memisahkan aplikasi menjadi modul-modul independen dengan kontrak tipe data terpadu:

```
HealthAthon BPJS/
├── apps/
│   ├── api/                    # Backend: Node.js + Express + TypeScript
│   │   ├── src/
│   │   │   ├── config/         # Konfigurasi & validasi ENV (Zod)
│   │   │   ├── controllers/    # Handler HTTP tipis
│   │   │   ├── middleware/     # Auth, Zod validator, Error handler
│   │   │   ├── routes/         # Definisi route terisolasi (/api/v1)
│   │   │   ├── services/       # Logika bisnis (Supabase, OpenRouter)
│   │   │   ├── utils/          # AppError, response envelope, logger
│   │   │   ├── app.ts          # Setup Express middleware
│   │   │   └── server.ts       # Entrypoint & graceful shutdown
│   │   └── package.json
│   │
│   └── web/                    # Frontend: React 18 + Vite + TypeScript + Tailwind
│       ├── src/
│       │   ├── components/     # Komponen UI umum & layout (Navbar, Footer)
│       │   ├── features/       # Feature-sliced modules (landing, auth)
│       │   ├── lib/            # Singleton client (api-client, supabase)
│       │   ├── routes/         # React Router v6 & route guards
│       │   ├── App.tsx
│       │   └── main.tsx
│       └── package.json
│
├── packages/
│   └── shared/                 # Single Source of Truth (Types & Contracts)
│       ├── src/
│       │   ├── types.ts        # Format Response, DTO User, Payload AI
│       │   ├── constants.ts    # Error codes & status
│       │   └── index.ts
│       └── package.json
│
├── rules.md                    # Panduan desain & standar anti-AI slop
├── .gitignore                  # Production gitignore
└── package.json                # Orchestrator monorepo (workspaces)
```

---

## 🚀 Panduan Memulai (Quick Start)

### 1. Prasyarat
- **Node.js**: v20 atau lebih baru (disarankan v22 LTS)
- **npm** atau **pnpm**

### 2. Instalasi Dependensi
Cukup jalankan satu perintah dari root folder:
```bash
npm install
```

### 3. Setup Environment Variables
Salin berkas `.env.example` pada masing-masing app jika ingin menghubungkan kredensial asli:
- Backend: `apps/api/.env.example` -> `apps/api/.env`
- Frontend: `apps/web/.env.example` -> `apps/web/.env`

*(Catatan: Aplikasi sudah memiliki fallback sandbox otomatis, sehingga dapat langsung dijalankan tanpa mengisi kredensial terlebih dahulu).*

### 4. Menjalankan Server Development
Jalankan Frontend dan Backend secara bersamaan:
```bash
npm run dev
```

- **Frontend (Web):** [http://localhost:5173](http://localhost:5173)
- **Backend (API):** [http://localhost:4000](http://localhost:4000)
- **API Health Check:** [http://localhost:4000/api/v1/health](http://localhost:4000/api/v1/health)

---

## 📜 Perintah yang Tersedia (Scripts)

| Perintah | Deskripsi |
| :--- | :--- |
| `npm run dev` | Menjalankan Frontend (`apps/web`) dan Backend (`apps/api`) secara bersamaan. |
| `npm run dev:api` | Hanya menjalankan backend Express dengan *hot-reload* (`tsx`). |
| `npm run dev:web` | Hanya menjalankan frontend Vite dev server. |
| `npm run build` | Melakukan build produksi seluruh paket dan aplikasi secara berurutan. |
| `npm run typecheck` | Menjalankan pemeriksaan tipe data TypeScript (`tsc --noEmit`) pada semua modul. |

---

## 🛡️ Standar Kualitas & Anti-AI Slop (`rules.md`)

Sebelum menambahkan kode baru, pastikan membaca panduan [rules.md](./rules.md). Panduan ini memastikan:
1. **Tidak ada tipe `any` yang tidak terkontrol.**
2. **Semua input API divalidasi dengan Zod schema.**
3. **Format respons konsisten menggunakan Envelope:**
   ```json
   {
     "success": true,
     "data": { ... },
     "meta": { "timestamp": "...", "version": "v1" }
   }
   ```
4. **Error handling terpusat** dengan kelas `AppError` tanpa penekanan error tersembunyi.
5. **Frontend modular** dengan pembagian fitur terstruktur dan performa tinggi tanpa *unnecessary re-renders*.
