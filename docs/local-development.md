# Panduan Development Server Lokal

Dokumen ini menjelaskan cara menjalankan dan menghentikan server development lokal untuk project CatatUang.

## Daftar Isi

- [Menjalankan Server](#menjalankan-server)
- [Menghentikan Server](#menghentikan-server)
- [Menghentikan Semua Server Background](#menghentikan-semua-server-background)
- [Troubleshooting](#troubleshooting)

---

## Menjalankan Server

### Prasyarat

Pastikan dependencies sudah terinstall:

```bash
npm install --no-bin-links
```

> **Catatan:** Gunakan `--no-bin-links` karena filesystem external storage tidak mendukung symlink.

### Cara Menjalankan

Buka terminal di direktori project dan jalankan:

```bash
node node_modules/next/dist/bin/next dev
```

Server akan berjalan di: **http://localhost:3000**

### Output yang Diharapkan

```
▲ Next.js 14.2.35
  - Local:        http://localhost:3000
  - Environments: .env.local

 ✓ Starting...
 ✓ Ready in 4.4s
```

### Menjalankan di Background

Jika ingin server berjalan di background (terminal bisa digunakan untuk hal lain):

```bash
node node_modules/next/dist/bin/next dev &
```

---

## Menghentikan Server

### Jika Berjalan di Foreground

Tekan tombol:

```
Ctrl + C
```

### Jika Berjalan di Background

#### Cara 1: Mencari dan Kill Proses

```bash
# Cari proses Next.js
ps aux | grep next

# Kill proses berdasarkan PID (ganti XXXX dengan PID yang ditemukan)
kill XXXX
```

#### Cara 2: Kill Semua Proses Node

```bash
# Kill semua proses node (HATI-HATI: akan menutup semua aplikasi Node.js)
pkill -f node
```

#### Cara 3: Kill Proses di Port Tertentu

```bash
# Cari proses di port 3000
lsof -i :3000

# Kill proses di port 3000
kill -9 $(lsof -t -i:3000)
```

---

## Menghentikan Semua Server Background

### Metode 1: Kill Semua Proses Node

```bash
pkill -f node
```

> **Peringatan:** Ini akan menutup SEMUA aplikasi Node.js yang berjalan, termasuk aplikasi lain yang sedang digunakan.

### Metode 2: Kill Proses Next.js Spesifik

```bash
pkill -f "next dev"
```

### Metode 3: Menggunakan fuser (Linux)

```bash
# Kill proses di port 3000
fuser -k 3000/tcp

# Kill proses di multiple port
fuser -k 3000/tcp 3001/tcp 8080/tcp
```

### Metode 4: Script Pembersihan

Buat file `kill-servers.sh`:

```bash
#!/bin/bash

echo "Mencari proses Node.js yang berjalan..."

# Tampilkan proses Next.js
echo ""
echo "Proses Next.js:"
ps aux | grep -E "next|node" | grep -v grep

# Kill proses
echo ""
read -p "Apakah Anda ingin menghentikan semua proses di atas? (y/n): " confirm

if [ "$confirm" = "y" ] || [ "$confirm" = "Y" ]; then
    pkill -f "next dev"
    echo "✓ Semua server Next.js telah dihentikan"
else
    echo "Dibatalkan"
fi
```

Jalankan dengan:

```bash
chmod +x kill-servers.sh
./kill-servers.sh
```

### Metode 5: Cek dan Kill Interaktif

```bash
# Tampilkan semua proses Node.js dengan PID
ps aux | grep node | grep -v grep

# Kill satu per satu berdasarkan PID
kill -9 <PID>
```

---

## Troubleshooting

### Error: `next: command not found`

**Penyebab:** `node_modules` tidak terinstall atau symlink tidak didukung.

**Solusi:**

```bash
npm install --no-bin-links
```

Kemudian jalankan dengan:

```bash
node node_modules/next/dist/bin/next dev
```

### Error: `EADDRINUSE: address already in use :::3000`

**Penyebab:** Port 3000 sudah digunakan oleh proses lain.

**Solusi:**

```bash
# Cari dan kill proses di port 3000
kill -9 $(lsof -t -i:3000)

# Atau jalankan di port lain
PORT=3001 node node_modules/next/dist/bin/next dev
```

### Error: `EPERM: operation not permitted, symlink`

**Penyebab:** Filesystem tidak mendukung symlink (misal: NTFS, exFAT).

**Solusi:**

Selalu gunakan `--no-bin-links` saat install:

```bash
npm install --no-bin-links
```

### Server Tidak Bisa Diakses

**Kemungkinan:**

1. Firewall memblokir port
2. Server tidak berjalan
3. URL salah

**Solusi:**

```bash
# Cek apakah server berjalan
curl http://localhost:3000

# Cek port
netstat -tlnp | grep 3000
```

---

## Tips & Best Practices

### 1. Gunakan Terminal Terpisah

Buka 2 terminal:
- Terminal 1: Jalankan server
- Terminal 2: Git commands, editing, dll

### 2. Hot Reload

Next.js mendukung hot reload. Edit kode dan browser akan otomatis refresh.

### 3. Environment Variables

Pastikan file `.env.local` ada:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
GROQ_API_KEY=your_groq_key
```

### 4. Development vs Production

| Mode | Command | Use Case |
|------|---------|----------|
| Development | `node node_modules/next/dist/bin/next dev` | Testing lokal, hot reload |
| Production | `node node_modules/next/dist/bin/next start` | Setelah `next build` |
| Build | `node node_modules/next/dist/bin/next build` | Sebelum production |

---

## Quick Reference

```bash
# Jalankan server
node node_modules/next/dist/bin/next dev

# Hentikan server (foreground)
Ctrl + C

# Hentikan server (background)
pkill -f "next dev"

# Hentikan semua Node.js
pkill -f node

# Kill port 3000
kill -9 $(lsof -t -i:3000)

# Cek proses berjalan
ps aux | grep next
```

---

*Dokumen ini dibuat untuk project CatatUang - AI Financial Assistant*