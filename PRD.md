# PRODUCT REQUIREMENTS DOCUMENT (PRD)
**Nama Produk:** CatatUang (Web App & Telegram Bot)
**Pengembang:** EAS Creative Studio
**Versi Dokumen:** 1.0
**Tanggal Pembuatan:** 25 Maret 2026

## 1. Ringkasan Eksekutif
**CatatUang** adalah aplikasi pencatatan keuangan berbasis *Omnichannel* (Telegram Bot dan Web App) yang ditenagai oleh Kecerdasan Buatan (AI). Aplikasi ini memecahkan masalah pencatatan keuangan yang kaku dengan mengizinkan pengguna mencatat pemasukan dan pengeluaran menggunakan bahasa natural (chat santai). AI akan bertugas sebagai *parser* untuk menerjemahkan teks tersebut menjadi data keuangan terstruktur.

## 2. Tujuan Produk
* Memberikan kemudahan input data keuangan tanpa perlu mengisi formulir manual yang rumit.
* Menyediakan dua jalur akses yang tersinkronisasi: Telegram (untuk input cepat saat *mobile*) dan Web App (untuk visualisasi data dan laporan komprehensif).
* Mendukung kolaborasi/multi-user dalam satu ruang lingkup pencatatan (maksimal 10 pengguna pada fase awal) dengan pelacakan ID pengguna yang jelas.

## 3. Spesifikasi Teknologi (Tech Stack)
* **Framework Utama:** Next.js (Fullstack: Frontend & API/Backend)
* **Database & Autentikasi:** Supabase (PostgreSQL & Supabase Auth)
* **Kecerdasan Buatan (NLP Parser):** Groq API / OpenRouter (LLM)
* **Integrasi Telegram:** `grammY` (Library Node.js)
* **Antarmuka Web (UI/UX):** Tailwind CSS + shadcn/ui
* **Deployment & Hosting:** Vercel (Serverless)

## 4. Fitur Utama

### A. Fitur Asisten AI (Tersedia di Telegram & Web)
* **Natural Language Processing:** Pengguna dapat mengetik kalimat seperti *"Beli makan siang 50rb pakai gopay"*. AI akan mengekstrak metadatanya menjadi format JSON (`jenis`, `nominal`, `kategori`, `dompet`, `keterangan`).
* **Sistem Konfirmasi Interaktif:** Sebelum data disimpan ke *database*, sistem akan menampilkan rincian hasil terjemahan AI beserta tombol konfirmasi `[ ✅ Simpan ]` atau `[ ❌ Batal ]`.
* **Tanya Jawab Laporan:** Pengguna dapat menanyakan ringkasan keuangan via chat (misal: *"Berapa pengeluaran saya minggu ini?"*), dan sistem akan merangkum data dari *database* menjadi teks natural.

### B. Fitur Manajemen Data (Slash Commands & Web UI)
* **Manajemen Kategori:** Pengguna dapat menambah kategori pengeluaran/pemasukan kustom via perintah Telegram (contoh: `/tambah_kategori Makanan`) atau melalui pengaturan di Web App.
* **Manajemen Dompet:** Pengguna dapat menambah sumber dana/dompet baru (contoh: `/tambah_dompet BCA`).

### C. Fitur Web Dashboard
* **Sistem Login:** Autentikasi pengguna untuk mengakses dasbor pribadi.
* **Tampilan Chatbot:** Antarmuka mirip ChatGPT untuk interaksi langsung dengan asisten CatatUang.
* **Visualisasi Data:** Grafik batang/lingkaran (*pie chart*) untuk membedah persentase pengeluaran per kategori atau saldo per dompet.
* **Tabel Riwayat:** Daftar seluruh transaksi dengan fitur filter (berdasarkan tanggal, pengguna, kategori, dompet).
* **Ekspor Laporan:** Tombol untuk mengunduh laporan keuangan dalam format dokumen (PDF) dan *spreadsheet* (XLSX).

## 5. Alur Pengguna (User Flow) Utama
1. **Input Transaksi:** User mengirim pesan ➔ Next.js API menerima pesan ➔ Mengirim ke Groq AI ➔ AI membalas JSON ➔ Sistem menampilkan konfirmasi ➔ User klik "Simpan" ➔ Data masuk ke Supabase.
2. **Akses Web App:** User buka web ➔ Login via Supabase Auth ➔ Masuk ke Dashboard ➔ Sistem menarik data riwayat transaksi dari Supabase ➔ Menampilkan grafik dan tabel laporan.
3. **Pembuatan Laporan (Telegram):** User ketik `/export_bulan_ini` ➔ Sistem menarik data ➔ Membuat *file* PDF/XLSX ➔ Mengirim dokumen langsung ke ruang obrolan Telegram pengguna.

## 6. Persyaratan Keamanan & Privasi
* Data setiap pengguna (atau grup pengguna) diisolasi berdasarkan `user_id` yang terdaftar.
* *Environment Variables* (Token Telegram, API Key Groq, URL Supabase) disimpan secara aman di sisi server (Vercel) dan tidak diekspos ke sisi klien.
* Autentikasi Web App menggunakan sesi aman (*secure cookies/tokens*) yang dikelola oleh Supabase Auth.

