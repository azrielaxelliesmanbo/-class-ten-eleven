# CLASS TEN_ELEVEN — Portal X-11

website kelas dengan:
- register/login siswa
- password di-hash menggunakan Node crypto (scrypt)
- role siswa & admin
- admin panel untuk mengubah identitas website, motto, deskripsi
- CRUD pengumuman
- edit jadwal
- tambah/hapus foto gallery via URL
- lihat & hapus akun siswa
- responsive untuk HP/laptop

## Jalankan di komputer

1. Install Node.js.
2. Buka terminal di folder project.
3. Jalankan:
   npm install
   npm start
4. Buka http://localhost:3000

## Akun admin awal

Email: admin@teneleven.local
Password: AdminX11!2026

**PENTING:** ganti password admin sebelum website dipakai sungguhan. Cara yang lebih aman:
set environment variable `ADMIN_EMAIL` dan `ADMIN_PASSWORD` sebelum menjalankan server.

Contoh:
ADMIN_EMAIL=admin@kelasmu.id ADMIN_PASSWORD="password-ku-yang-kuat" npm start

## Catatan

Versi ini sudah punya backend dan database JSON lokal sehingga berbeda dengan HTML statis.
Untuk dipakai online oleh banyak siswa, deploy project ini ke hosting Node.js yang mendukung persistent storage. Database JSON sebaiknya diganti PostgreSQL/SQLite/DB hosting untuk penggunaan produksi dan session sebaiknya dipindah ke session store.
