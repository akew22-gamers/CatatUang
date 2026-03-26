```text
=============================================================================
                          ALUR CHAT "CATATUANG"
=============================================================================

  +-----------------------------------------------------------------------+
  | 1. USER MENGIRIM PESAN AWAL                                           |
  |    - Pemasukan  : "Gaji 5jt"                                          |
  |    - Pengeluaran: "Beli kopi 20rb"                                    |
  +-----------------------------------+-----------------------------------+
                                      |
                                      v
  +-----------------------------------------------------------------------+
  | 2. PROSES PARSING OLEH AI (EKSTRAKSI DATA)                            |
  |    AI membedah chat menjadi format baku:                              |
  |    [Tanggal] | [Nominal] | [Keterangan/Reasoning] | [Dompet/Sumber]   |
  +-----------------------------------+-----------------------------------+
                                      |
                                      v
  +-----------------------------------------------------------------------+
  | 3. VALIDASI KELENGKAPAN DATA (LOGIKA BACKEND)                         |
  |    Apakah semua 4 elemen data di atas sudah terisi?                   |
  +-----------------------------------+-----------------------------------+
                                      |
              +-----------------------+-----------------------+
              |                                               |
      [TIDAK LENGKAP]                                     [LENGKAP]
              |                                               |
              v                                               |
  +-----------------------+                                   |
  | 4a. APA YANG KURANG?  |                                   |
  +---+---------------+---+                                   |
      |               |                                       |
  [Dompet]        [Nominal/Keterangan]                        |
      |               |                                       |
      v               v                                       |
+-----------+   +-----------+                                 |
| BALASAN   |   | BALASAN   |                                 |
| REKAP     |   | TANYA     |                                 |
| PARTIAL + |   | TEKS      |                                 |
| TOMBOL    |   | BEBAS     |                                 |
| DOMPET    |   |           |                                 |
+-----+-----+   +-----+-----+                                 |
      |               |                                       |
      v               v                                       |
+---------------------------+                                 |
| 5. USER MEMBERIKAN RESPON |                                 |
|    - Klik tombol dompet   |                                 |
|    - Balas chat teks      |                                 |
+-------------+-------------+                                 |
              |                                               |
              |   (Looping kembali ke proses validasi data)   |
              +-----------------------+                       |
                                      |                       |
                                      v                       v
                          +---------------------------------------+
                          | 4b. TAMPILKAN REKAP LENGKAP           |
                          |     "Pemasukan Gaji Rp5.000.000       |
                          |      ke dompet BCA. Simpan?"          |
                          |                                       |
                          |     [ ✅ Simpan ]     [ ❌ Batal ]    |
                          +-------------------+-------------------+
                                              |
                                              v
                          +---------------------------------------+
                          | 6. EKSEKUSI DATABASE                  |
                          |    - Klik Simpan -> Masuk Supabase    |
                          |    - Klik Batal  -> Hapus Cache       |
                          +---------------------------------------+
```

### Penjelasan Titik Kritis pada Alur:

1. **State Management (Ingatan Sementara):** Saat masuk ke tahap **4a (Tidak Lengkap)**, *backend* (misalnya Node.js) harus menyimpan data "Gaji 5jt" ke dalam memori sementara (*cache* atau variabel *state*). Sehingga, saat *user* mengklik tombol dompet "BCA" pada tahap 5, *backend* masih ingat bahwa BCA ini adalah untuk uang 5 juta tersebut, bukan transaksi baru.
2. **Fleksibilitas Tombol (Inline Keyboard):** Saat bot menanyakan "Dompet", pilihan dompet yang muncul di bawah *chat* tidak boleh di-*hardcode*. Sistem harus menarik data dompet milik *user* tersebut langsung dari *database* (misal: BCA, Gopay, Tunai) agar sesuai dengan pengaturan masing-masing pengguna.
3. **Looping Validasi:** Jika *user* chat "Gaji" saja (tanpa nominal, tanpa dompet). Maka alur akan berputar dua kali:
   * Putaran 1: Bot tanya "Berapa nominalnya?" -> User jawab "5jt".
   * Putaran 2: Bot tanya "Masuk ke dompet mana?" -> User klik "BCA".
   * Setelah dua putaran, data lengkap, baru tahap **4b (Rekap Lengkap)** muncul.


