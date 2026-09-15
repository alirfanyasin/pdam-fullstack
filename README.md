# PDAM  (Full Stack Dev Test)

Aplikasi Full Stack Web untuk pembayaran tagihan rekening air PDAM (PDAM Sidoarjo & PDAM Bondowoso) yang terintegrasi dengan Biller Sandbox Rajabiller, penyimpanan transaksi ke database MySQL, antarmuka responsif berbasis Tailwind CSS, serta fitur pratinjau, cetak, dan unduh struk pembayaran sah.

Proyek ini dibuat untuk memenuhi spesifikasi **Full Stack Dev Test — PT. Bimasakti Multi Sinergi

---

## Teknologi & Stack

- **Backend**: Node.js, Express.js
- **Database**: MySQL 5.7+ / 8.0+ / MariaDB (`mysql2/promise`)
- **Frontend**: HTML5, Vanilla JavaScript, Tailwind CSS (via CDN)
- **External API**: Rajabiller Partnerlink B2B Sandbox (`fastpay.inq` & `fastpay.pay`)

---

## Data Uji Coba (Test Credentials)

Sesuai tabel di dokumen soal:

| No | Produk | Kode Produk | ID Pelanggan | Keterangan |
| :---: | :--- | :---: | :---: | :--- |
| 1 | PDAM SIDOARJO | `WASDA` | `01002676` | 6 periode tagihan (Mei - Okt 2014) |
| 2 | PDAM BONDOWOSO | `WABONDO` | `09000879` | 3 periode tagihan + beban & pemakaian |

---

## Panduan Menjalankan Program

### 1. Prasyarat
- **Node.js** (versi 16 ke atas, disarankan v18/v20/v22).
- **MySQL Server** aktif (bisa via XAMPP, Laragon, Docker, atau MySQL service lokal) pada port default `3306`.

### 2. Konfigurasi Environment (`.env`)
Pastikan file `.env` di root project memiliki konfigurasi yang sesuai:
```env
PORT=3000

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=pdam_test

RAJABILLER_URL=https://c-dev-partnerlink.rajabiller.com/json/index.php
RAJABILLER_UID=SP300203
RAJABILLER_PIN=311575
```
> **Catatan**: Jika MySQL lokal Anda menggunakan password, isi pada `DB_PASSWORD`.

### 3. Install Dependencies
```bash
npm install
```

### 4. Jalankan Aplikasi
- **Mode Pengembangan (Auto-reload dengan nodemon):**
  ```bash
  npm run dev
  ```
- **Menggunakan Docker**
  ```bash
  docker compose up --build -d 
  ```

### 6. Buka di Browser
Akses web browser di:
```text
http://localhost:3000
```


## Struktur Folder

```text
pdam-fullstack/
├── .env                         # Konfigurasi environment & kredensial Biller
├── database.sql                 # Skrip skema database MySQL
├── package.json                 # Manifest dependensi & scripts
├── public/                      # Static Assets & Frontend UI
│   ├── app.js                   # Logika interaktif client-side (SPA)
│   └── index.html               # Halaman UI berbasis Tailwind CSS
├── src/
│   ├── app.js                   # Inisialisasi Express server
│   ├── config/
│   │   └── database.js          # Pool koneksi MySQL2
│   ├── controllers/
│   │   └── transaction.controller.js # Handler inquiry, payment, history, receipt
│   ├── routes/
│   │   └── transaction.routes.js     # Routing endpoint API
│   ├── services/
│   │   └── rajabiller.service.js     # Integrasi API B2B Rajabiller Sandbox
│   └── utils/
│       ├── generateRef.js       # Generator unique reference ID
│       ├── receiptGenerator.js  # Generator teks struk pembayaran
│       └── terbilang.js         # Konversi nominal ke kata terbilang rupiah
└── README.md                    # Dokumentasi lengkap program
```
