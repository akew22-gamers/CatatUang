# Telegram Bot Setup Guide

## 🤖 Create Bot via @BotFather

1. Buka Telegram dan cari [@BotFather](https://t.me/BotFather)
2. Kirim command: `/newbot`
3. Follow instructions:
   - **Bot name:** `CatatUang Bot`
   - **Bot username:** `CatatUangBot` (harus berakhiran `bot`)
4. Copy **Bot Token** yang diberikan (format: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)

## 🔧 Setup Environment Variables

Tambahkan ke `.env.local`:

```bash
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
NEXT_PUBLIC_APP_URL=https://catatuang.vercel.app
```

## 🚀 Deploy ke Vercel

```bash
vercel deploy --prod
```

Atau via Vercel Dashboard:
1. Connect GitHub repository
2. Set environment variables di Vercel dashboard
3. Deploy

## 📡 Set Webhook URL

Setelah deploy, set webhook dengan membuka URL berikut di browser:

```
https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook?url=<VERCEL_URL>/api/telegram
```

**Contoh:**
```
https://api.telegram.org/bot123456789:ABCdefGHIjklMNOpqrsTUVwxyz/setWebhook?url=https://catatuang.vercel.app/api/telegram
```

**Response yang diharapkan:**
```json
{
  "ok": true,
  "result": true,
  "description": "Webhook was set"
}
```

## ✅ Test Bot

1. Cari bot Anda di Telegram (contoh: `@CatatUangBot`)
2. Klik **Start** atau kirim `/start`
3. Bot akan reply dengan welcome message
4. Test dengan kirim: `"Beli makan siang 50rb pakai gopay"`

## 📋 Available Commands

| Command | Description |
|---------|-------------|
| `/start` | Mulai bot dan tampilkan welcome message |
| `/help` | Tampilkan panduan penggunaan |
| `/hari_ini` | Ringkasan transaksi hari ini |
| `/minggu_ini` | Ringkasan transaksi minggu ini |
| `/bulan_ini` | Ringkasan transaksi bulan ini |
| `/export` | Export laporan PDF/XLSX |

## 🔍 Webhook Status

Cek status webhook:

```
https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/getWebhookInfo
```

## 🐛 Troubleshooting

### Bot tidak response
- Cek webhook URL dengan `/getWebhookInfo`
- Pastikan `TELEGRAM_BOT_TOKEN` benar di Vercel
- Cek Vercel function logs

### Webhook error
- Pastikan URL menggunakan HTTPS
- URL harus publicly accessible (tidak localhost)
- Restart webhook: `/deleteWebhook` lalu `/setWebhook` lagi

### Parse error
- Cek format input user
- Pastikan AI parser API berjalan normal

## 📊 Bot Commands Setup (Optional)

Setup command list di @BotFather:

1. `/setcommands`
2. Pilih bot Anda
3. Kirim list commands:

```
start - Mulai bot
help - Bantuan
hari_ini - Laporan hari ini
minggu_ini - Laporan minggu ini
bulan_ini - Laporan bulan ini
export - Export laporan PDF
```

## 🎯 Next Steps

Setelah bot berjalan:
1. ✅ Test transaction parsing
2. ✅ Integrate dengan database Supabase
3. ✅ Implement `/hari_ini`, `/minggu_ini`, `/bulan_ini`
4. ✅ Setup user authentication (link Telegram user ke Supabase)
5. ✅ Implement export PDF/XLSX
