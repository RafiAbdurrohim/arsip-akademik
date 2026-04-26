# ArsipKu — Sistem Arsip Akademik Digital

Platform manajemen arsip dan dokumen akademik berbasis Next.js + Supabase.

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Supabase

1. Buat akun gratis di [supabase.com](https://supabase.com)
2. Buat project baru
3. Copy URL & anon key dari **Settings > API**
4. Buat file `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

### 3. Setup Database

1. Buka **Supabase Dashboard > SQL Editor**
2. Copy & paste isi file `src/lib/supabase/schema.sql`
3. Klik **Run**

### 4. Setup Storage

1. Buka **Supabase Dashboard > Storage**
2. Buat bucket baru bernama `arsip-files`
3. Set sebagai **Private**

### 5. Run Development Server

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000)

---

## 📁 Struktur Project

```
src/
├── app/
│   ├── auth/
│   │   ├── login/          → Halaman login
│   │   └── register/       → Halaman register
│   └── dashboard/
│       ├── admin/          → Dashboard admin
│       ├── dosen/          → Dashboard dosen
│       ├── mahasiswa/      → Dashboard mahasiswa
│       ├── kaprodi/        → Dashboard kaprodi
│       ├── perpustakaan/   → Dashboard perpustakaan
│       ├── upload/         → (Fase 2)
│       ├── pencarian/      → (Fase 2)
│       ├── preview/        → (Fase 2)
│       ├── arsip/          → (Fase 2)
│       ├── pengguna/       → (Fase 2 - admin only)
│       ├── laporan/        → (Fase 3)
│       ├── notifikasi/     → (Fase 3)
│       └── profil/         → Edit profil user
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx     → Navigasi sidebar
│   │   └── Header.tsx      → Top header
│   └── ui/
│       └── index.tsx       → Komponen reusable
├── lib/
│   ├── auth.ts             → Helper autentikasi
│   ├── utils.ts            → Utility functions
│   └── supabase/
│       ├── client.ts       → Supabase browser client
│       ├── server.ts       → Supabase server client
│       └── schema.sql      → Database schema
├── middleware.ts            → Route protection
└── types/
    └── index.ts            → TypeScript types
```

---

## 👥 User Roles

| Role | Akses |
|------|-------|
| **Admin** | Akses penuh, kelola pengguna & sistem |
| **Dosen** | Upload materi, lihat arsip |
| **Mahasiswa** | Upload tugas, cari & preview dokumen |
| **Kaprodi** | Lihat laporan & arsip prodi |
| **Perpustakaan** | Kelola & kategorikan arsip |

---

## 🔧 Tech Stack

- **Frontend**: Next.js 14 (App Router)
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL via Supabase
- **Auth**: Supabase Auth (JWT)
- **Storage**: Supabase Storage
- **Styling**: Tailwind CSS
- **Language**: TypeScript

---

## 📋 Fase Pengembangan

- [x] **Fase 1**: Auth, Role System, Dashboard per role
- [ ] **Fase 2**: Upload file, Pencarian, Preview dokumen, Arsip
- [ ] **Fase 3**: Enkripsi AES-256, Plagiarism check
- [ ] **Fase 4**: Notifikasi, Laporan & statistik

---

## 🌐 Deploy ke Vercel

```bash
npm install -g vercel
vercel --prod
```

Tambahkan environment variables di Vercel Dashboard.
