# Perbaikan respons CRUD

Perubahan ini mengurangi waktu tunggu tambah, edit, dan hapus di LinkSense AI.
Optimasi mencakup frontend dan kode backend sesuai persetujuan pengguna.
Skema, isi database asli, kredensial, model AI, dan konfigurasi deployment
tidak diubah. Perubahan belum dideploy.

## Penyebab yang ditemukan

Kecepatan unduh 300 Mbps tidak menghilangkan waktu proses AI, perjalanan
permintaan ke server/database, atau penantian yang ditambahkan aplikasi.
Audit dan pengujian menemukan empat sumber penundaan berikut.

- Frontend menunggu pemuatan ulang koleksi, kategori, statistik, dan health
  setelah operasi berhasil. Tombol masih sibuk saat data sudah tersimpan.
- Endpoint kategori menjalankan satu query daftar dan satu query hitungan
  untuk setiap kategori. Dengan 30 kategori, jumlahnya menjadi 31 query.
- Statistik memakai lima query berurutan. Edit dan tambah juga memuat ulang
  objek beserta relasinya setelah commit, meskipun datanya sudah tersedia.
- Pemanggilan Gemini sinkron berada di fungsi async. Selama panggilan tersebut
  berlangsung, event loop tidak dapat menjalankan pekerjaan lain.

## Seluruh file yang berubah

Daftar berikut mencatat perubahan kode, pengujian, dan dokumentasi pada tugas
performa ini. Tampilan dan kontrak respons API tetap dipertahankan.

| File | Perubahan |
| --- | --- |
| `frontend/src/App.tsx` | Terapkan respons tambah/kategori langsung ke state. Refresh koleksi tidak lagi menampilkan skeleton atau menahan tombol CRUD. Gabungkan refresh yang berdekatan dengan jeda 120 ms dan jalankan setelah operasi aktif selesai. Health diperiksa saat inisialisasi, bukan setiap CRUD. Abaikan respons baca sebelum mutasi, batalkan pencarian usang, cegah dua operasi pada tautan yang sama, dan pulihkan hanya item yang gagal. Hitungan hapus dipulihkan tanpa menimpa hasil operasi lain. Penghapusan kategori memperbarui referensi lokal dan mereset filter kategori yang sudah dihapus. |
| `frontend/src/services/api.ts` | Tambahkan `AbortSignal` opsional pada pembacaan koleksi agar permintaan yang usang bisa dibatalkan. URL, payload, dan tipe respons tidak berubah. |
| `frontend/src/utils/collection.ts` | Tambahkan fungsi untuk menyaring dan mengurutkan hasil baru sesuai filter aktif, menghindari ID duplikat, memperbarui dua kategori, dan menerapkan aturan pemindahan kategori lokal. |
| `backend/app/api/routes_categories.py` | Hitung seluruh penggunaan kategori dengan satu outer join/agregasi. Kategori kosong tetap muncul dan satu tautan yang memakai nama sama di kedua slot dihitung sekali. Hilangkan refresh objek kategori setelah commit. Pemindahan kategori saat force delete memakai satu UPDATE CASE, tanpa memuat tiap tautan beserta tag/berkasnya. Guard kategori sistem dan konfirmasi penggunaan tetap berlaku. |
| `backend/app/api/routes_analytics.py` | Gabungkan total tautan, distribusi platform, dan jumlah tujuh hari terakhir dalam satu query. Dua query kategori/tag tetap terpisah; total menjadi tiga query. |
| `backend/app/api/routes_links.py` | Edit tidak lagi menjalankan refresh objek lengkap setelah commit. Tag yang tidak berubah tidak dihapus/dibuat ulang. Hapus tautan membaca ID saja, lalu menghapus tag, berkas, dan induk dalam satu transaksi; tidak mengandalkan cascade SQLite aktif. |
| `backend/app/services/orchestrator.py` | Hilangkan refresh objek lengkap setelah penyimpanan. UUID, waktu, tag, dan berkas dari flush/commit dipakai langsung dengan `expire_on_commit=False`. |
| `backend/app/services/ai_service.py` | Gunakan panggilan async untuk model utama dan fallback. Batasi seluruh rangkaian AI dengan `REQUEST_TIMEOUT_SECONDS` yang sudah ada, default 12 detik. Jika melewati batas atau gagal, gunakan klasifikasi heuristik yang sebelumnya sudah tersedia. Tidak mengganti model atau menambahkan layanan AI. |
| `frontend/tests/collection.test.mjs` | Tambahkan enam tes untuk urutan, filter, deduplikasi hasil baru, dan pemindahan/penghapusan kategori. |
| `frontend/package.json` | Tambahkan perintah `npm test`; tidak menambahkan dependensi aplikasi. |
| `backend/tests/test_crud_performance.py` | Tambahkan sepuluh tes regresi API dan AI async, memakai SQLite di memori serta AI simulasi. |
| `PERFORMANCE.md` | Catat penyebab, seluruh perubahan, hasil pengukuran, dan cara menjalankan tes. |

Pemakaian SDK async mengikuti
[dokumentasi resmi Google Gen AI](https://googleapis.github.io/python-genai/).
Penghapusan/pembaruan massal memakai fitur
[DML ORM SQLAlchemy](https://docs.sqlalchemy.org/en/20/orm/queryguide/dml.html).

## Hasil pengukuran

Angka berikut berasal dari skenario lokal yang sama sebelum dan sesudah
perubahan. Angka ini bukan pengukuran situs produksi.

Pengujian browser mensimulasikan respons simpan 100 ms dan refresh 1.500 ms.
Baseline memakai `App.tsx` dari commit sebelum perubahan di server terisolasi.
Waktu diukur sampai kontrol input siap dipakai lagi.

| Operasi | Sebelum | Sesudah |
| --- | ---: | ---: |
| Tambah tautan | 1.719 ms | 185 ms |
| Tambah kategori | 1.695 ms | 165 ms |
| Hapus kategori | 1.705 ms | 173 ms |

Refresh koleksi tetap berjalan di latar belakang. Tambah tautan langsung
menampilkan respons server tanpa skeleton seluruh koleksi. Health tidak
dipanggil ulang setelah CRUD.

Profil backend memakai SQLite di memori dengan biaya perjalanan SQL simulasi
20 ms per query. Tidak ada koneksi ke database asli.

| Endpoint | Query sebelum | Query sesudah |
| --- | ---: | ---: |
| Daftar 30 kategori | 31 | 1 |
| Statistik | 5 | 3 |
| Edit judul tautan | 7 | 4 |
| Hapus tautan beserta relasi | 5 | 4 |

Pada AI simulasi yang menunggu 250 ms, timer event loop 20 ms sebelumnya baru
berjalan setelah 278 ms. Setelah perubahan, timer berjalan setelah 33 ms.
Ini memverifikasi respons event loop, bukan kecepatan layanan Gemini asli.

## Verifikasi

Build produksi dan seluruh tes berikut lolos.

- Enam tes frontend untuk state koleksi.
- Sepuluh tes backend untuk hitungan kategori, statistik, edit, relasi berkas
  dan tag, guard kategori, force delete, default objek baru, AI async, fallback,
  serta pembatalan saat timeout.
- Sembilan skenario browser dengan API simulasi: tambah tanpa menunggu refresh,
  edit bersamaan ketika satu gagal, hapus gagal dengan edit lain yang berhasil,
  respons lama yang tidak mengembalikan tautan terhapus, penggabungan refresh,
  pencarian terakhir yang tetap menang, CRUD kategori, kelanjutan refresh yang
  terputus operasi lain, dan retensi URL gagal.
- Tidak ada JavaScript error pada skenario browser tersebut.

Jalankan pengujian frontend dari direktori `frontend`:

```powershell
npm test
npm run build
```

Jalankan pengujian backend dari direktori `backend`:

```powershell
.venv\Scripts\python.exe -m unittest discover -s tests -v
```

Tes backend mengatur database di memori dan menonaktifkan key AI di proses
pengujian. Tes tidak menjalankan migrasi atau mengubah data asli.

## Batas pengukuran

Waktu layanan AI, situs sumber yang diekstrak, cold start hosting, dan latensi
database produksi masih memengaruhi lama penyimpanan tautan baru. Optimasi ini
menghapus penantian tambahan dan pemblokiran yang ditemukan dalam kode;
tidak menjanjikan semua proses AI selesai dalam ratusan milidetik.

Rilis frontend dan backend bersama agar situs online memakai perbaikan ini.
