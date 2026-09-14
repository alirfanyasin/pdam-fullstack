# PDAM Payment Gateway (Full Stack Dev Test)

Aplikasi Full Stack Web untuk pembayaran tagihan rekening air PDAM (PDAM Sidoarjo & PDAM Bondowoso) yang terintegrasi dengan Biller Sandbox Rajabiller, penyimpanan transaksi ke database MySQL, antarmuka responsif berbasis Tailwind CSS, serta fitur pratinjau, cetak, dan unduh struk pembayaran sah.

Proyek ini dibuat untuk memenuhi spesifikasi **Full Stack Dev Test — PT. Bimasakti Multi Sinergi (Div. Innovation & Technology, Rev 2.1.3)**.

---

## 🌟 Fitur Utama

1. **Dua Alur Transaksi Utama (Two-Flow Architecture)**:
   - **Alur Inquiry**: Memeriksa tagihan aktif pelanggan ke Biller, menghitung rincian tagihan bulanan (`air`, `denda`, `beban/nonair`, `admin`, dan `total_bayar`), lalu mencatat status `INQUIRY_SUCCESS` ke database.
   - **Alur Payment**: Melakukan pembayaran tagihan menggunakan nomor referensi inquiry, memproses ke Biller via `fastpay.pay`, lalu memperbarui status transaksi menjadi `PAYMENT_SUCCESS` atau `PAYMENT_FAILED`.
2. **Frontend Responsif & Modern (Tailwind CSS)**:
   - Tampilan bersih, intuitif, dan nyaman digunakan.
   - Dilengkapi tombol *Quick Fill* untuk mengisi nomor pelanggan pengujian dengan 1 klik.
   - Tabel rincian tagihan per bulan (`data_bill`) dinamis dan ringkasan biaya.
3. **Riwayat Transaksi (History Viewer)**:
   - Menampilkan seluruh daftar transaksi inquiry dan payment yang tersimpan di database.
   - Dilengkapi filter berdasarkan produk PDAM dan tombol refresh.
4. **Cetak & Unduh Struk Pembayaran (Thermal / Monospace)**:
   - Format struk disesuaikan persis dengan contoh spesifikasi soal (Poin 8).
   - Menghitung terbilang rupiah secara otomatis dalam bahasa Indonesia (contoh: *TIGA RATUS LIMA RIBU TIGA RATUS RUPIAH*).
   - Fitur langsung print struk (`window.print`) dan unduh file teks (`.txt`).

---

## 🛠️ Teknologi & Stack

- **Backend**: Node.js, Express.js
- **Database**: MySQL 5.7+ / 8.0+ / MariaDB (`mysql2/promise`)
- **Frontend**: HTML5, Vanilla JavaScript, Tailwind CSS (via CDN)
- **External API**: Rajabiller Partnerlink B2B Sandbox (`fastpay.inq` & `fastpay.pay`)

---

## 📋 Data Uji Coba (Test Credentials)

Sesuai tabel di dokumen soal:

| No | Produk | Kode Produk | ID Pelanggan | Keterangan |
| :---: | :--- | :---: | :---: | :--- |
| 1 | PDAM SIDOARJO | `WASDA` | `01002676` | 6 periode tagihan (Mei - Okt 2014) |
| 2 | PDAM BONDOWOSO | `WABONDO` | `09000879` | 3 periode tagihan + beban & pemakaian |

---

## 🚀 Panduan Menjalankan Program

### 1. Prasyarat
- **Node.js** (versi 16 ke atas, disarankan v18/v20/v22).
- **MySQL Server** aktif (bisa via XAMPP, Laragon, Docker, atau MySQL service lokal) pada port default `3306`.

### 2. Setup Database
1. Buat database bernama `pdam_test` di MySQL Anda.
2. Impor file skrip SQL yang telah disediakan:
   ```bash
   mysql -u root -p pdam_test < database.sql
   ```
   *(Atau buka file `database.sql` dan eksekusi query-nya melalui phpMyAdmin / DBeaver / HeidiSQL).*

### 3. Konfigurasi Lingkungan (`.env`)
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

### 4. Install Dependencies
```bash
npm install
```

### 5. Jalankan Aplikasi
- **Mode Pengembangan (Auto-reload dengan nodemon):**
  ```bash
  npm run dev
  ```
- **Mode Standar:**
  ```bash
  npm start
  ```

### 6. Buka di Browser
Akses antarmuka web di:
```text
http://localhost:3000
```

---

## 📡 Dokumentasi Endpoint API Internal

### 1. Inquiry Tagihan
- **Method:** `POST`
- **URL:** `/api/transactions/inquiry`
- **Request Body (JSON):**
  ```json
  {
    "product_code": "WASDA",
    "customer_id": "01002676"
  }
  ```
- **Response Format (Sesuai Poin 4 Soal):**
  ```json
  {
    "rc": "00",
    "ket": "sukses",
    "data": {
      "idpel": "01002676",
      "nometer": "01/II /013/0083/6D",
      "nama": "PERM. BUMI CITRA FAJ",
      "alamat": "SEKAWAN SEJUK C.16A",
      "nominal": 294500,
      "admin": 10800,
      "total_bayar": 305300,
      "jumlah_bulan": "6",
      "ref1": "TRX-1789379452327-6004",
      "ref2": "2818948259",
      "data_bill": {
        "blth1": {
          "air": 40500,
          "denda": 7500,
          "nonair": 0,
          "meter_awal": 0,
          "meter_akhir": 0,
          "bulan": "5",
          "tahun": "2014"
        }
      }
    }
  }
  ```

### 2. Pembayaran Tagihan (Payment)
- **Method:** `POST`
- **URL:** `/api/transactions/payment`
- **Request Body (JSON):**
  ```json
  {
    "ref1": "TRX-1789379452327-6004",
    "product_code": "WASDA",
    "customer_id": "01002676",
    "nominal": 294500,
    "ref2": "2818948259"
  }
  ```

### 3. Riwayat Transaksi (History)
- **Method:** `GET`
- **URL:** `/api/transactions` *(opsional parameter: `?product_code=WASDA`)*

### 4. Ambil Struk Pembayaran
- **Method:** `GET`
- **URL:** `/api/transactions/:ref1/receipt` *(tambahkan `?format=txt` untuk download langsung)*

---

## 📂 Struktur Folder

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
