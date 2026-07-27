# Presensi Digital - Kelompok 6 (SYS.06) 🚀

Sistem Presensi Digital Berbasis Web dengan fitur *Monitoring Realtime*, Manajemen Sesi, dan Validasi Foto (Selfie). Dibangun khusus untuk memenuhi kebutuhan administrasi presensi yang cepat, aman, dan mudah dimonitor. 

Aplikasi ini menggunakan estetika desain **Digital / Cyber Theme** dengan antarmuka yang sangat modern dan responsif.

## 🛠 Teknologi Utama

- **Framework**: [Next.js 15 (App Router)](https://nextjs.org/)
- **Database**: PostgreSQL dengan [Prisma ORM](https://www.prisma.io/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) dengan Kustomisasi Tema Digital (Neon, Grid, Glassmorphism)
- **Icons**: [Lucide React](https://lucide.dev/)
- **State & Realtime**: React Hooks (`useRealtime`)
- **Fonts**: Inter & Space Grotesk (Google Fonts)

---

## 📦 Penjelasan Per Modul (Fitur)

### 1. Modul Autentikasi (Authentication)
Mengelola akses masuk ke dalam sistem dengan pemisahan peran (*Role-Based Access Control*).
- **Endpoint API**: `/api/auth/login`, `/api/auth/logout`, `/api/auth/me`
- **Tampilan**: Halaman login menggunakan desain terminal digital. Terdapat pemisahan akses yang jelas antara **Pengguna (Mahasiswa)** dan **Administrator**. 
- **Keamanan**: Akses diproteksi sehingga pengguna yang belum login tidak dapat masuk ke dashboard, dan pengguna biasa tidak bisa mengakses panel admin.

### 2. Modul Dashboard Administrator (Admin Panel)
Pusat kontrol bagi admin (Dosen/Koordinator) untuk memantau jalannya presensi secara *realtime*.
- **Manajemen Sesi**: Admin dapat membuka (`DIBUKA`) dan menutup (`DITUTUP`) sesi presensi secara dinamis.
- **Batas Waktu (Countdown)**: Admin dapat menentukan jam tutup secara otomatis.
- **Monitoring Realtime**: Menampilkan daftar mahasiswa yang sudah Hadir, Belum Hadir, atau Tidak Hadir secara langsung tanpa perlu me-refresh halaman.
- **Monitoring Foto**: Admin bisa langsung melihat daftar bukti swafoto (*selfie*) mahasiswa yang ter-upload saat melakukan presensi.
- **Statistik Cepat**: Kartu statistik (*Stat Cards*) yang menyajikan total data pengguna, presensi hari ini, hingga total foto di database.

### 3. Modul Dashboard Pengguna (User Dashboard)
Tampilan khusus untuk mahasiswa melihat status presensi mereka.
- **Notifikasi Sesi Aktif**: Secara otomatis menampilkan indikator peringatan (`SESI AKTIF` atau `TIMEOUT`) berdasarkan status presensi yang diatur admin.
- **Judul Presensi Aktif**: Menampilkan daftar modul atau acara presensi yang sedang berlangsung hari ini.
- **Riwayat Transmisi (Log)**: Menampilkan data presensi masa lalu dari pengguna tersebut beserta foto bukti yang mereka kumpulkan.

### 4. Modul Absensi & Kamera (Camera Capture)
Modul utama untuk memvalidasi kehadiran mahasiswa.
- **Akses Kamera**: Menggunakan API browser native untuk mengambil foto secara *realtime* (via `<CameraCapture />`).
- **Koordinat Waktu**: Menyimpan *timestamp* (waktu klik presensi) secara akurat.
- **Pengiriman Data**: Mengirim foto, judul absensi, dan deskripsi/catatan melalui form presensi yang tervalidasi.

### 5. Modul Sistem (Jam & Notifikasi Realtime)
- **Realtime Clock (`<RealtimeClock />`)**: Komponen jam digital bergaya LED *neon* yang tersinkronisasi.
- **Realtime Engine (`useRealtime`)**: Memungkinkan seluruh perubahan data (seperti admin membuka sesi atau mahasiswa melakukan submit absensi) muncul ke layar pengguna lain secara instan.

---

## 💻 Cara Menjalankan Proyek Secara Lokal

1. **Clone repositori ini**:
   ```bash
   git clone <url-repo-github>
   cd presensiku
   ```

2. **Instal dependensi**:
   ```bash
   npm install
   ```

3. **Atur Environment Variables**:
   Salin file `.env.example` menjadi `.env` dan sesuaikan koneksi database PostgreSQL Anda.
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/presensi_db?schema=public"
   ```

4. **Migrasi Database**:
   Jalankan perintah Prisma untuk melakukan migrasi skema database.
   ```bash
   npx prisma migrate dev --name init
   npx prisma generate
   ```

5. **Jalankan Server Development**:
   ```bash
   npm run dev
   ```
   Aplikasi akan berjalan di `http://localhost:3000`.

---

## 🎨 Tema Desain (Cyber / Digital Aesthetic)

Aplikasi ini tidak menggunakan antarmuka standar. Desain telah dimodifikasi menyerupai "*High-Tech System Panel*" dengan:
- Latar belakang `#050505` (Hitam Pekat).
- Aksen garis grid layaknya "*blueprint*".
- Komponen membulat dengan opasitas *glassmorphism* dan border warna Cyan (`#00f0ff`) dan Pink (`#ff006a`).
- Font *Monospace* (Space Grotesk) untuk angka dan data digital yang memberikan kesan *Cyberpunk*.

---
**Dibuat dengan ❤️ oleh Kelompok 6 (SYS.06)**