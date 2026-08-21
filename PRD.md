# Product Requirements Document (PRD)
## LinkSense AI (LinkTrack-App)
*AI-Powered Universal Resource & Knowledge Hub with Smart Export*

---

## 1. Executive Summary

### 1.1 Visi Produk
**LinkSense AI (LinkTrack-App)** adalah platform manajemen dan kurasi aset digital berbasis web cerdas yang mengotomatisasi pengumpulan, ekstraksi konten, dan pengkategorian bertingkat dari berbagai jenis tautan (Google Drive, GitHub Repositories, dan URL Web umum). Dengan mengintegrasikan Google Gemini API (model `gemini-3.7-flash` / `gemini-2.5-flash`) dengan Structured Outputs serta parser berbasis API dan scraper cerdas, LinkSense AI mengubah tumpukan tautan pasif menjadi basis pengetahuan terstruktur yang dapat dicari secara semantik, difilter multi-dimensi, dan diekspor ke format dokumen kerja profesional (Excel interaktif, CSV, dan PDF siap cetak) dalam satu klik.

### 1.2 Latar Belakang & Pernyataan Masalah
- **Passive Link Hoarding**: Pengguna sering menyimpan tautan penting di bookmark browser, grup WhatsApp/Telegram, atau sticky notes tanpa konteks, sehingga cepat terlupakan dan sulit ditemukan kembali.
- **Opacity of Rich Assets**: 
  - Tautan *Google Drive* tidak memperlihatkan isi folder (daftar file, ekstensi, MIME type, ukuran) tanpa pengguna membuka tautan dan menavigasi manual.
  - Tautan *GitHub* memerlukan pembacaan manual terhadap deskripsi, bahasa pemrograman, rilis, dan file `README.md`.
  - Tautan *Web Artikel/Dokumentasi* sering tertimbun iklan, navigasi berat, atau boilerplate teks.
- **Ketiadaan Taksonomi Otomatis**: Pengguna enggan mengkategorikan dan memberi tag manual pada setiap tautan.
- **Hambatan Kolaborasi & Portabilitas Data**: Sulit membagikan katalog link yang sudah terorganisir ke rekan kerja atau klien dalam format dokumen yang rapi (misalnya spreadsheet terstruktur dengan hyperlink aktif).

### 1.3 Nilai Tambah Utama (Unique Value Proposition)
1. **Universal Multi-Platform Ingestion**: Memahami karakteristik khas Google Drive (file/folder traversal), GitHub (metadata + README parse), dan Web (Scraping + Readability extraction).
2. **AI Hierarchical Categorization & Semantic Tagging**: Taksonomi 3 lapis otomatis (*Platform $\rightarrow$ Main Category $\rightarrow$ Subcategory / Use Case*) + Ringkasan 1–2 kalimat instan via Gemini LLM.
3. **Contextual & Semantic Search**: Pencarian cerdas berbasis intent dan keyword secara real-time.
4. **Professional Multi-Format Export**: Ekspor spreadsheet ber-formula, styling modern, hyperlink aktif, dan PDF berformat katalog rapi.

---

## 2. Target User Persona

### Persona 1: Tech Lead / Software Engineer ("Budi")
- **Karakteristik**: Sering mengoleksi repositori GitHub open-source, pustaka UI, template backend, dan dokumentasi arsitektur.
- **Pain Point**: Memiliki ratusan bookmark GitHub, lupa tujuan masing-masing repositori, sulit membagikan daftar referensi arsitektur ke tim.
- **Kebutuhan di LinkSense AI**: Otomatisasi pembacaan GitHub README, klasifikasi tech stack (frontend, AI/ML, DevOps), ekspor ke Excel untuk laporan evaluasi library internal.

### Persona 2: Research Scholar / Student / Akademisi ("Siti")
- **Karakteristik**: Mengumpulkan folder Google Drive berisi dataset, PDF paper riset, slide kuliah, serta tautan jurnal web.
- **Pain Point**: Link Google Drive sering kali tidak jelas isinya sebelum dibuka; bingung melacak folder mana yang berisi materi relevan.
- **Kebutuhan di LinkSense AI**: Preview struktur folder Google Drive, ringkasan AI untuk artikel/paper ilmiah, filter per kategori mata kuliah/topik riset, ekspor ke PDF/Excel.

### Persona 3: Product Manager / Digital Curator ("Rian")
- **Karakteristik**: Mengkurasi resource desain (Figma/Drive), artikel benchmark kompetitor, dan tool produktivitas.
- **Pain Point**: Butuh waktu lama untuk merapikan link resource saat onboarding anggota tim baru.
- **Kebutuhan di LinkSense AI**: Input batch link, pengelompokan otomatis use case, pencarian cepat, ekspor katalog aset tim siap pakai.

---

## 3. End-to-End User Journey

```
+-----------------------------------------------------------------------------------+
| 1. INGESTION                                                                      |
| Pengguna memasukkan 1 atau beberapa URL (GDrive / GitHub / Web) ke Input Box      |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼
+-----------------------------------------------------------------------------------+
| 2. EXTRACTION ENGINE                                                              |
| Sistem mengenali platform:                                                        |
| • GDrive  -> Deteksi Folder/File ID, query metadata & struktur file via API       |
| • GitHub  -> Query REST API (Repo metadata, topics, language, README content)     |
| • Web     -> Scraping HTTP, ekstraksi meta OpenGraph, Title, Main Body Text       |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼
+-----------------------------------------------------------------------------------+
| 3. AI REASONING & CATEGORIZATION (Gemini 3.7 / 2.5 Flash)                         |
| Prompt terstruktur dengan JSON Schema menghasilkan:                               |
| • Primary Category, Subcategory, Use Case                                         |
| • 1-2 kalimat Concise Executive Summary                                           |
| • 3-6 Semantic Tags                                                               |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼
+-----------------------------------------------------------------------------------+
| 4. INTERACTIVE DASHBOARD & MANAGEMENT                                             |
| Data muncul di Data Table / Grid Card secara instan:                              |
| • Filter Tab Platform (All, Google Drive, GitHub, Web)                            |
| • Filter Dropdown Kategori & Tags                                                 |
| • Real-time Instant Search & Sort (A-Z, Tanggal, Ukuran)                          |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼
+-----------------------------------------------------------------------------------+
| 5. SMART EXPORT ENGINE                                                            |
| Pengguna memilih format ekspor:                                                   |
| • Excel (.xlsx) dengan Sheet khusus / All, format rapi, hyperlink hidup           |
| • CSV untuk integrasi data pipeline                                               |
| • PDF Catalog untuk preview & dokumen cetak profesional                           |
+-----------------------------------------------------------------------------------+
```

---

## 4. Rincian Fitur & Prioritas (MoSCoW / P0, P1, P2)

### 4.1 Prioritas P0 (Must Have - Core MVP)
1. **Universal Ingestion Parser**:
   - Deteksi otomatis domain URL (Google Drive, GitHub, dan Universal Web).
   - Ekstraksi metadata spesifik platform (GDrive folder/file explorer, GitHub repo & README, Web Title/Description/Body).
2. **AI Categorization Engine**:
   - Integrasi Google Gemini API dengan Structured JSON Outputs.
   - Ekstraksi: Platform, Title, Primary Category, Subcategory, Summary (Bahasa Indonesia/Inggris), Tags, Key Topics.
3. **Interactive Local/Cloud Database**:
   - Penyimpanan persistent (SQLite / Local Storage / In-Memory Store yang persisten).
   - Operasi CRUD dasar (Create, Read, Search, Delete item).
4. **Responsive Data Dashboard**:
   - Tampilan Grid Card & Data Table dengan toggle view.
   - Filter Platform tabs (`Semua`, `Google Drive`, `GitHub`, `Web`).
   - Live Search bar (pencarian instan pada judul, deskripsi, summary, dan tags).
   - Sorting multi-kolom (Tanggal Ditambahkan, Nama A-Z, Platform).
5. **Smart Excel & CSV Exporter**:
   - Generate `.xlsx` profesional dengan styling header, auto-fit lebar kolom, format teks rapi, dan kolom `URL` dengan hyperlink aktif yang dapat diklik.
   - Generate `.csv` UTF-8 standar.

### 4.2 Prioritas P1 (Should Have - High Value)
1. **Batch URL Ingestion**:
   - Input textarea multi-baris untuk memproses hingga 20 URL sekaligus dengan progress bar & asynchronous queue.
2. **Smart PDF Catalog Exporter**:
   - Generate dokumen PDF modern dengan cover, ringkasan eksekutif, tabel aset ber-link, dan badge kategori warna-warni.
3. **Google Drive Deep Traversal (Public/Key-based)**:
   - Preview hierarki isi folder (menampilkan list file di dalam folder publik Google Drive beserta ukuran dan ekstensinya).
4. **Editable Metadata**:
   - Pengguna dapat mengedit kategori, tag, atau ringkasan yang dihasilkan AI jika ingin melakukan kustomisasi.

### 4.3 Prioritas P2 (Could Have - Future Enhancements)
1. **Semantic Vector Search (Embeddings)**:
   - Pencarian berbasis kesamaan makna menggunakan Gemini Text Embeddings.
2. **Multi-User Collaboration & Cloud Sync**:
   - Autentikasi pengguna & sinkronisasi workspace link antar perangkat.
3. **Browser Extension Companion**:
   - Ekstensi Chrome/Firefox 1-klik "Save to LinkSense".

---

## 5. Acceptance Criteria (Gherkin Style)

### Skenario 1: Ingestion Tautan Google Drive Publik
```gherkin
Feature: Ekstraksi dan Kategorisasi Tautan Google Drive
  Scenario: Pengguna memasukkan link folder Google Drive publik
    Given Pengguna berada di halaman Dashboard LinkSense AI
    When Pengguna memasukkan URL "https://drive.google.com/drive/folders/1aBcDeFgHiJkLmNoP" ke Input Box
    And Menekan tombol "Analisis & Simpan"
    Then Sistem mengidentifikasi platform sebagai "Google Drive"
    And Sistem mengekstrak nama folder, daftar file anak, total ukuran, dan tipe MIME
    And Gemini API memproses metadata dan mengembalikan JSON terstruktur
    And Kartu aset baru muncul di Dashboard dengan badge "Google Drive", Kategori yang relevan, Ringkasan isi folder, dan Tag
```

### Skenario 2: Ingestion Tautan Repositori GitHub
```gherkin
Feature: Ekstraksi Repositori GitHub
  Scenario: Pengguna memasukkan link repo GitHub publik
    Given Pengguna memasukkan URL "https://github.com/facebook/react"
    When Sistem menjalankan github_extractor
    Then Sistem memanggil GitHub REST API untuk mengambil nama repo, bintang, bahasa utama "JavaScript/TypeScript", dan konten README.md
    And Gemini AI menganalisis README untuk menyimpulkan use case (misal: "Frontend Library", "UI Framework")
    And Data disimpan ke database dan ditampilkan di tabel dengan badge bahasa pemrograman dan link repositori aktif
```

### Skenario 3: Ingestion Situs Web Umum
```gherkin
Feature: Scraping dan Analisis Web Umum
  Scenario: Pengguna memasukkan tautan artikel atau landing page
    Given Pengguna memasukkan URL "https://kubernetes.io/docs/concepts/"
    When Sistem menjalankan web_scraper
    Then Sistem mengambil HTML, mengekstrak Title, Meta Description, dan teks artikel utama (membersihkan tag script/style)
    And Gemini AI mengkategorikan situs sebagai Platform "Web", Kategori "DevOps/Infrastruktur", Subkategori "Container Orchestration"
    And Ringkasan 2 kalimat menjelaskan konsep dokumentasi Kubernetes
```

### Skenario 4: Pencarian Cerdas & Multi-Filtering
```gherkin
Feature: Filter dan Pencarian Dashboard
  Scenario: Pengguna menyaring tautan berdasarkan platform dan kata kunci
    Given Dashboard memuat 25 tautan terkurasi dari berbagai platform
    When Pengguna mengklik tab filter "GitHub"
    And Mengetik kata kunci "database" di kolom pencarian
    Then Dashboard hanya menampilkan tautan ber-platform "GitHub" yang memiliki kata "database" pada judul, summary, atau tags
    And Total counter hasil pencarian diperbarui secara real-time
```

### Skenario 5: Ekspor Excel dengan Hyperlink Aktif
```gherkin
Feature: Ekspor Data ke Excel (.xlsx)
  Scenario: Pengguna mengunduh database tautan ke spreadsheet
    Given Pengguna telah memfilter 10 link di dashboard
    When Pengguna mengklik tombol "Export" dan memilih "Excel (.xlsx)"
    Then Server membuat file spreadsheet dengan format styling profesional
    And Setiap baris memiliki hyperlink fungsional di kolom URL yang membuka tautan saat diklik di Microsoft Excel / Google Sheets
    And File .xlsx terunduh ke perangkat lokal pengguna
```

---

## 6. Metrik Keberhasilan (Success Metrics)

| Metrik | Target | Definisi & Pengukuran |
|--------|--------|-----------------------|
| **Extraction Success Rate** | $\ge 96\%$ | Persentase tautan valid yang berhasil diekstrak tanpa error parser |
| **AI Categorization Accuracy** | $\ge 92\%$ | Kesesuaian kategori & summary yang dievaluasi pengguna tanpa edit manual |
| **Average End-to-End Latency** | $< 3.5$ detik | Waktu dari submit URL hingga kartu muncul di UI |
| **Export Integrity** | $100\%$ | File Excel/CSV/PDF valid, format tabel presisi, hyperlink tidak corrupt |
| **UI Usability Score (SUS)** | $\ge 85$ | Kemudahan navigasi, kejelasan informasi, dan kecepatan respon antarmuka |

---

## 7. Edge Cases & Resilience Strategy

### 7.1 Private / Restricted Links (Google Drive & GitHub)
- **Kondisi**: Pengguna memasukkan link Google Drive yang terkunci ("Access Denied") atau repo GitHub private.
- **Respon Sistem**: 
  - GDrive: Fallback ke metadata dasar dari URL params, tandai status `[Akses Privat / Butuh Izin]`, prompt pengguna untuk membuka akses share link atau input judul manual.
  - GitHub: Tangani HTTP 404/403 dari GitHub API, beri notifikasi ramah: *"Repositori tidak ditemukan atau bersifat privat"*.

### 7.2 Rate Limits & Token Limits
- **Gemini API Rate Limit (429)**: Implementasikan exponential backoff retry (1s, 2s, 4s). Jika limit tercapai, fallback sementara ke model alternatif (`gemini-2.5-flash` / `gemini-3.5-flash-lite`).
- **Input Content Truncation**: Batasi panjang README/Web Scrape teks maksimal 12.000 karakter sebelum dikirim ke LLM untuk menjaga efisiensi token dan kecepatan respon.

### 7.3 Web Anti-Scraping / Cloudflare Protection
- **Kondisi**: Situs target memblokir bot request (HTTP 403 / 503 / Captcha).
- **Respon Sistem**:
  - Gunakan HTTP Client dengan rotasi User-Agent browser modern standar.
  - Fallback ke ekstraksi metadata via Google Favicon API / DNS meta fallback jika body scraping terblokir.

### 7.4 Network Failures & Invalid URLs
- Validasi URL regex sebelum request dijalankan.
- Menampilkan toast notification dengan pesan error spesifik yang mudah dipahami (*User-friendly error messages*).

---

## 8. Persyaratan Non-Fungsional (NFR)
1. **Performance**: Beban CPU/Memori ringan, rendering tabel lancar hingga 5.000 records di sisi client.
2. **Security**: Sanitasi URL input untuk mencegah SSRF (Server-Side Request Forgery) ke jaringan internal (misal memblokir `localhost`, `127.0.0.1`, `169.254.169.254`).
3. **Cross-Platform Compatibility**: Berjalan mulus di Chrome, Firefox, Safari, Edge, dan peramban mobile (responsive design).
4. **Data Privacy**: Kunci API (Gemini API Key, GDrive Key) tersimpan aman di environment server (`.env`), tidak pernah bocor ke client bundle.
