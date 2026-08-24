# LinkSense AI (LinkTrack-App)

*Universal Digital Resource & Knowledge Hub with Gemini AI Reasoning & Smart Export*

![LinkSense AI](<https://img.shields.io/badge/Gemini%20API-gemini--3.7--flash-emerald?style=for-the-badge&logo=google>)
![Python](<https://img.shields.io/badge/Backend-FastAPI%20%7C%20Python-blue?style=for-the-badge&logo=fastapi>)
![React](<https://img.shields.io/badge/Frontend-React%2018%20%7C%20Vite%20%7C%20Tailwind-cyan?style=for-the-badge&logo=react>)
![Export](<https://img.shields.io/badge/Export-Excel%20%7C%20CSV%20%7C%20PDF-green?style=for-the-badge>)

---

## 🌟 Ringkasan Produk

**LinkSense AI** adalah platform manajemen dan kurasi aset digital berbasis web cerdas yang mengotomatisasi pengumpulan, ekstraksi konten, dan pengkategorian bertingkat dari berbagai jenis tautan:

1. **Google Drive:** Mengekstrak nama folder/file, tipe MIME, ukuran berkas, dan traversal subfolder/daftar file via Google Drive API atau public metadata scraper.
2. **GitHub Repositories:** Membaca nama repositori, deskripsi, bintang, forks, bahasa utama, topik/tag, dan mengurai file `README.md` via GitHub REST API.
3. **Situs Web Umum:** Melakukan *scraping* otomatis dengan pembersihan iklan/skrip dan mengekstrak meta-tag (OpenGraph), judul, serta teks inti artikel.
4. **AI Reasoning & Categorization:** Memproses data mentah ke Google Gemini API (`gemini-3.7-flash` / `gemini-2.5-flash`) dengan **Structured Outputs (JSON Schema)** untuk klasifikasi bertingkat: *Platform $\rightarrow$ Kategori Utama $\rightarrow$ Sub-kategori / Use Case*, ringkasan 1–2 kalimat, dan tag cerdas.
5. **Smart Document Export:** Ekspor seluruh atau subset data hasil filter ke format spreadsheet **Excel (.xlsx)** dengan hyperlink aktif, **CSV (UTF-8 BOM)**, dan **PDF Catalog** siap cetak.

---

## 📁 Struktur Direktori Proyek

```
LinkTrack-app/
├── PRD.md                        # Product Requirements Document
├── SRS.md                        # Software Requirements Specification
├── README.md                     # Panduan Lengkap Instalasi & Penggunaan
├── backend/                      # Backend Service (Python FastAPI)
│   ├── app/
│   │   ├── api/                  # REST API Routes (links, export, analytics)
│   │   ├── database/             # SQLite Async Engine & Session (WAL mode)
│   │   ├── extractors/           # GDrive, GitHub, & Web Scraper Modules
│   │   ├── models/               # SQLAlchemy ORM Models & Pydantic Schemas
│   │   ├── services/             # AIService (Gemini), ExportService, Orchestrator
│   │   ├── config.py             # Pydantic Settings & Environment Variables
│   │   └── main.py               # FastAPI App & Lifespan Hooks
│   ├── pyproject.toml            # Backend Dependencies & Hatch Configuration
│   ├── test_backend.py           # Integration Test Suite
│   └── .env.example              # Template Environment Variables
└── frontend/                     # Modern Single Page Application (React + Vite)
    ├── src/
    │   ├── components/           # Navbar, HeroSection, IngestionBar, LinkCard, Table, etc.
    │   ├── services/             # Axios API Client
    │   ├── types/                # TypeScript Interface Models
    │   ├── App.tsx               # Main Dashboard Orchestrator
    │   ├── main.tsx              # React DOM Entrypoint
    │   └── index.css             # Tailwind Directives & Glassmorphism Styles
    ├── package.json              # Frontend NPM Dependencies
    ├── tailwind.config.js        # Custom Theme & Styling Tokens
    └── vite.config.ts            # Vite Dev Server & Reverse Proxy
```

---

## 🚀 Panduan Menjalankan Aplikasi Secara Lokal

### 1. Prasyarat Sistem

- **Python:** Versi 3.10 ke atas
- **Node.js:** Versi 18 ke atas (npm / pnpm / yarn)
- **uv** (opsional tapi disarankan): Package manager Python berkecepatan tinggi

---

### 2. Menjalankan Backend (FastAPI)

1. Buka terminal di folder `backend/`:
   ```bash
   cd backend
   ```
2. Buat virtual environment dan install dependensi:
   ```bash
   # Menggunakan uv (sangat cepat):
   uv venv .venv
   uv pip install -e .

   # Atau menggunakan pip standar:
   python -m venv .venv
   .venv\Scripts\activate      # Windows
   # source .venv/bin/activate # Linux/Mac
   pip install -e .
   ```
3. Konfigurasi file `.env`:
   Salin `.env.example` menjadi `.env`:
   ```env
   # Masukkan Google Gemini API Key Anda dari Google AI Studio:
   # https://aistudio.google.com/
   GEMINI_API_KEY=your_actual_gemini_api_key_here

   # Pilihan model default:
   GEMINI_MODEL=gemini-3.7-flash
   GEMINI_FALLBACK_MODEL=gemini-2.5-flash

   # (Opsional) Google Drive API Key:
   GOOGLE_DRIVE_API_KEY=

   # (Opsional) GitHub Token:
   GITHUB_TOKEN=
   ```
4. Jalankan backend server:
   ```bash
   .venv\Scripts\uvicorn app.main:app --reload --port 8000
   ```

   > Backend API akan berjalan di: `http://127.0.0.1:8000`
   > Dokumentasi Swagger OpenAPI interaktif: `http://127.0.0.1:8000/docs`
   >

---

### 3. Menjalankan Frontend (React + Vite)

1. Buka terminal baru di folder `frontend/`:
   ```bash
   cd frontend
   ```
2. Install paket node:
   ```bash
   npm install
   ```
3. Jalankan Vite development server:
   ```bash
   npm run dev
   ```

   > Antarmuka web akan terbuka di: `http://localhost:5173`
   >

---

## 🧪 Menjalankan Pengujian Terintegrasi (Test Suite)

Untuk memvalidasi bahwa seluruh komponen ekstraksi (GitHub, GDrive, Web Scraper), pipeline database, dan generator file Excel/CSV/PDF berjalan normal:

```bash
cd backend
.venv\Scripts\python test_backend.py
```

Output pengujian:

```text
[1/5] Inisialisasi Database SQLite...
[SUCCESS] Database & tabel berhasil diinisialisasi.

[2/5] Test GitHub Extractor (fastapi/fastapi)...
[SUCCESS] GitHub Extracted: fastapi/fastapi: FastAPI framework ... | Lang: Python | Stars: 101728

[3/5] Test Web Scraper (python.org)...
[SUCCESS] Web Extracted: Welcome to Python.org... | Favicon: https://www.python.org/static/favicon.ico

[4/5] Test End-to-End Orchestrator Pipeline...
[SUCCESS] Link Saved: ID=... | Category=Frontend Development | Subcategory=UI Component Library
   Summary: FastAPI framework, high performance, easy to learn ...
   Tags: ['link', 'resource', 'frontend', 'ui', 'web-dev', 'python']
[SUCCESS] GDrive Saved: Title=Google Drive Folder | Category=Dokumen & Arsip

[5/5] Test Export Service (Excel, CSV, PDF)...
[SUCCESS] Excel generated: 6124 bytes (Active Hyperlinks verified)
[SUCCESS] CSV generated: 668 bytes (UTF-8 BOM verified)
[SUCCESS] PDF generated: 2911 bytes (Printable Catalog verified)

[ALL TESTS PASSED] SEMUA TEST BACKEND BERHASIL 100%!
```

---

## 📊 Fitur Utama & Cara Penggunaan

### 1. Ingestion Tautan Tunggal (Single URL)

- Tempel tautan Google Drive folder, file, repositori GitHub, atau artikel web ke input box utama.
- Sistem otomatis mendeteksi platform dan menampilkan ikon interaktif.
- Klik **"Analisis & Kurasi AI"** atau tekan `Enter`.

### 2. Ingestion Massal (Batch Input)

- Klik tombol **"Batch Input"** di navbar.
- Tempel hingga 20 URL (satu tautan per baris).
- Sistem memproses setiap tautan secara berurutan dan menampilkan laporan status berhasil/gagal.

### 3. Filter & Pencarian Cerdas (Smart Search)

- **Tab Platform:** Filter instan `Semua`, `Google Drive`, `GitHub`, atau `Web`.
- **Dropdown Kategori:** Filter berdasarkan kategori utama yang diidentifikasi AI.
- **Tag Cloud:** Klik tag `#react`, `#dataset`, dll pada kartu untuk menyaring link secara instan.
- **Live Search:** Cari kata kunci pada judul, deskripsi, summary, atau URL secara real-time.

### 4. Ekspor Dokumen Kerja (Smart Export Engine)

- Klik tombol **"Ekspor Dokumen"** di filter bar dan pilih format yang diinginkan:
  - **Spreadsheet Excel (.xlsx):** Dilengkapi kolom terstruktur, format rapi, zebra striping, dan kolom URL dengan **hyperlink aktif yang dapat diklik langsung di Microsoft Excel & Google Sheets**.
  - **File CSV (.csv):** Format standar UTF-8 BOM untuk integrasi ke data pipeline atau Python Pandas.
  - **Katalog PDF (.pdf):** Dokumen katalog visual rapi siap cetak dan siap bagikan.
- Ekspor secara otomatis mengikuti **filter aktif** di dashboard (misalnya hanya mengekspor hasil pencarian atau platform tertentu).

---

## 🔒 Keamanan & Ketahanan Sistem (Security & Resilience)

- **SSRF Prevention:** Memeriksa dan memblokir request ke jaringan internal (`127.0.0.1`, `10.0.0.0/8`, `192.168.0.0/16`, `169.254.169.254`).
- **AI Heuristic Fallback:** Tetap mengkategorikan dan meringkas tautan secara cerdas menggunakan rule-based fallback engine apabila kunci API Gemini belum dikonfigurasi atau kuota rate limit tercapai.
- **SQLite Concurrency:** Dikonfigurasi dengan `PRAGMA journal_mode=WAL;` dan `PRAGMA synchronous=NORMAL;` untuk performa tinggi tanpa data locking.
