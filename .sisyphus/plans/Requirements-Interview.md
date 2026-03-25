# CatatUang - Requirements Clarification Interview

**Date:** 25 Maret 2026  
**Purpose:** Clarify ambiguous requirements before Phase 1 implementation  
**Status:** ⏳ Pending User Responses

---

## 📋 Introduction

Dokumen ini berisi pertanyaan-pertanyaan kritis untuk memastikan pemahaman yang sama antara developer (AI) dan stakeholder (EAS Creative Studio) sebelum memulai implementasi CatatUang.

Mohon jawab pertanyaan-pertanyaan berikut. Jawaban akan menentukan arah implementasi dan mencegah refactoring di kemudian hari.

---

## 🗄️ Section 1: Database & Data Model

### 1.1 Multi-User Support (CRITICAL)

PRD menyebutkan "maksimal 10 pengguna dalam satu ruang lingkup pencatatan".

**Pertanyaan:**
- Apakah ini berarti **shared transactions** dalam satu grup/keluarga?
- Atau setiap user punya data terpisah (isolated)?

**Opsi:**
```
A. Single User Mode - Setiap user independen, tidak ada sharing
B. Group Mode - Ada "workspace" atau "group", multiple users dalam 1 group, semua bisa lihat/edit transaksi group
C. Hybrid - User bisa invite orang lain ke "workspace" mereka (max 10 orang per workspace)
```

**Pertanyaan Tambahan (jika Group Mode):**
- Siapa yang bisa add transaksi? Semua member atau hanya owner?
- Apakah perlu track "siapa yang input" setiap transaksi?
- Apakah ada role system (admin, member, view-only)?

---

### 1.2 Transaction Types

**Pertanyaan:**
- Apakah transaksi hanya **Income** dan **Expense**?
- Atau perlu support **Transfer** (antar dompet)?

**Contoh Transfer:**
```
User: "Transfer 500rb dari BCA ke GoPay"
→ Ini bukan income/expense, tapi transfer antar wallet
→ Saldo BCA berkurang, GoPay bertambah, total net worth tetap
```

**Opsi:**
```
A. Income & Expense only (sederhana)
B. Include Transfer (lebih kompleks, tapi lebih realistis)
```

---

### 1.3 Currency

**Pertanyaan:**
- Apakah hanya support **IDR (Rupiah)**?
- Atau perlu multi-currency (USD, SGD, etc.)?

**Opsi:**
```
A. IDR only (default untuk semua transaksi)
B. Multi-currency (per transaksi bisa pilih currency, ada conversion rate)
```

---

### 1.4 Categories

**Pertanyaan:**
- Apakah categories **flat** atau **hierarchical**?

**Contoh Hierarchical:**
```
📦 Food & Beverage
  ├── 🍜 Restaurant
  ├── ☕ Coffee Shop
  └── 🛒 Groceries

🚗 Transportation
  ├── ⛽ Fuel
  ├── 🚕 Ride Hailing (Grab/Gojek)
  └── 🚌 Public Transport
```

**Opsi:**
```
A. Flat categories (Makanan, Transport, Belanja - no nesting)
B. Hierarchical (Parent category + child categories)
```

**Pertanyaan Tambahan:**
- Apakah perlu provided default categories atau user mulai dari kosong?
- Jika default, mohon list categories yang diinginkan.

---

### 1.5 Wallets

**Pertanyaan:**
- Wallet types apa yang perlu disupport?

**Contoh:**
```
- Cash (Tunai)
- Bank (BCA, Mandiri, BNI, etc.)
- E-Wallet (GoPay, OVO, Dana, ShopeePay)
- Credit Card
- Investment (Reksadana, Saham)
```

**Opsi:**
```
A. Simple (nama wallet saja, bebas user input)
B. Typed (pilih type: cash/bank/ewallet/card, ada icon per type)
C. Advanced (dengan account number, expiry date untuk credit card, etc.)
```

---

## 🤖 Section 2: AI Parser

### 2.1 Language Support

**Pertanyaan:**
- AI parser support bahasa apa?

**Opsi:**
```
A. Indonesian only
B. Indonesian + English (bilingual)
C. Indonesian + regional languages (Jawa, Sunda - lebih kompleks)
```

---

### 2.2 Data Extraction Fields

**Pertanyaan:**
Dari input natural language, AI perlu extract fields apa saja?

**PRD menyebutkan:** `jenis`, `nominal`, `kategori`, `dompet`, `keterangan`

**Pertanyaan Tambahan:**
- Apakah perlu extract **tanggal**? (misal: "Kemarin beli kopi 20rb")
- Apakah perlu extract **waktu**? (misal: "Jam 10 pagi beli makan 30rb")
- Bagaimana jika user tidak sebut kategori/dompet?
  - Default category "Uncategorized"?
  - Default wallet "Cash"?
  - Minta user konfirmasi/pilih manual?

---

### 2.3 AI Provider

**Pertanyaan:**
- Preference untuk AI provider?

**Opsi:**
```
A. Groq API (fast, cheap, good for structured extraction)
B. OpenRouter (access ke multiple models: GPT-4, Claude, Llama, etc.)
C. No preference - you decide based on cost/performance
```

**Pertanyaan Tambahan:**
- Budget constraint untuk AI API calls per bulan?
- Acceptable latency untuk AI parsing? (target: <3 detik?)

---

### 2.4 Ambiguous Input Handling

**Pertanyaan:**
Bagaimana handle input yang ambiguous?

**Contoh:**
```
User: "Beli makan 50rb"
→ Tidak jelas: income atau expense? (asumsi expense?)
→ Tidak jelas: kategori apa? (makanan?)
→ Tidak jelas: bayar pakai apa? (cash?)
```

**Opsi:**
```
A. AI assume defaults, user bisa edit di confirmation step
B. AI ask clarifying questions dalam confirmation message
C. Reject dan minta user input lebih detail
```

---

## 📱 Section 3: Telegram Bot

### 3.1 Bot Identity

**Pertanyaan:**
- Sudah buat bot via @BotFather?
- Jika sudah, apa bot username-nya? (contoh: @CatatUangBot)
- Jika belum, apakah perlu panduan membuat bot?

---

### 3.2 Group Chat Support

**Pertanyaan:**
- Apakah bot perlu support group chat?

**Contoh Use Case:**
```
Group "Keluarga" → semua member bisa add transaksi
Bot track siapa yang input apa
```

**Opsi:**
```
A. Individual chat only (bot hanya respond di private chat)
B. Group chat support (bot bisa di-add ke group, track user per chat_id)
C. Both (individual + group)
```

---

### 3.3 Webhook vs Polling

**Pertanyaan:**
- Deployment di Vercel (serverless)

**Opsi:**
```
A. Webhook (recommended for Vercel - event-driven, scalable)
   → Telegram kirim webhook ke Vercel endpoint saat ada message
   → Need public URL (vercel.app domain)

B. Polling (tidak recommended untuk serverless)
   → Bot poll Telegram API setiap X detik
   → Boros resources, tidak cocok untuk serverless
```

---

## 🌐 Section 4: Web Dashboard

### 4.1 Design Preferences

**Pertanyaan:**
- Ada preferensi design?

**Opsi:**
```
A. Minimalist & Clean (seperti Linear, Vercel dashboard)
B. Colorful & Playful (lebih casual, friendly)
C. Corporate/Professional (seperti banking app)
D. No preference - use shadcn/ui defaults
```

---

### 4.2 Dark Mode

**Pertanyaan:**
- Perlu dark mode support?

**Opsi:**
```
A. Light mode only
B. Dark mode only
C. Both (toggle dark/light mode)
```

---

### 4.3 Charts & Visualization

**Pertanyaan:**
- Charts jenis apa yang paling penting?

**Priority Ranking (1 = highest priority):**
```
__ Pie chart (spending by category)
__ Bar chart (income vs expense per month)
__ Line chart (trend over time)
__ Donut chart (wallet balance distribution)
__ Stacked bar (category breakdown per month)
```

---

### 4.4 Export Format

**Pertanyaan:**
- Export format apa yang benar-benar diperlukan?

**Opsi:**
```
A. PDF only
B. XLSX/Excel only
C. Both PDF + XLSX
D. CSV also (simple, lightweight)
```

**Pertanyaan Tambahan:**
- PDF perlu branding/logo atau simple text saja?

---

## 🚀 Section 5: Deployment & Operations

### 5.1 Vercel Setup

**Pertanyaan:**
- Sudah punya Vercel account?
- Project akan deploy sebagai:
  - Personal project (free tier)?
  - Team project?

---

### 5.2 Domain

**Pertanyaan:**
- URL akan pakai apa?

**Opsi:**
```
A. Vercel subdomain (catatuang.vercel.app) - FREE
B. Custom domain (catatuang.com atau catatuang.id) - perlu beli domain
C. Subdomain dari domain yang sudah ada
```

---

### 5.3 Environment Management

**Pertanyaan:**
- Development environment:
  - Local development dengan Supabase local (supabase start)?
  - Langsung connect ke Supabase production?

**Opsi:**
```
A. Local Supabase untuk dev, production untuk prod (recommended)
B. Langsung production (lebih simple, tapi risk data kotor)
```

---

## 📊 Section 6: Timeline & Priorities

### 6.1 MVP Definition

**Pertanyaan:**
Fitur apa yang **MUST HAVE** untuk MVP (launch pertama)?

**Candidate Features:**
```
[ ] Telegram bot - send message → AI parse → save transaction
[ ] Telegram bot - basic commands (/start, /help, /kategori, /dompet)
[ ] Telegram bot - reports (/hari_ini, /bulan_ini)
[ ] Web app - login/signup
[ ] Web app - view transactions list
[ ] Web app - charts/visualization
[ ] Web app - export to PDF/XLSX
[ ] Web app - settings (manage categories/wallets)
```

**Mohon prioritas:**
- P0 (MVP - must have for launch)
- P1 (should have - launch setelah MVP)
- P2 (nice to have - nanti)

---

### 6.2 Target Launch

**Pertanyaan:**
- Kapan target launch MVP?
- Apakah ada deadline spesifik?

---

## 🔐 Section 7: Security & Compliance

### 7.1 Data Privacy

**Pertanyaan:**
- Apakah ada concern khusus tentang data privacy?
- Perlu compliance dengan regulation tertentu?

**Opsi:**
```
A. Standard security (RLS, encrypted connection, secure auth) - default
B. Enhanced (data encryption at rest, audit logs, GDPR compliance)
C. No specific requirements
```

---

### 7.2 Backup & Recovery

**Pertanyaan:**
- Backup strategy?

**Opsi:**
```
A. Rely on Supabase automatic backups (default)
B. Additional manual backup routine
C. No backup needed (early stage)
```

---

## 📝 Response Format

Mohon jawab dengan format:

```
## Section 1: Database & Data Model
1.1: [Jawaban Anda]
1.2: [Jawaban Anda]
...

## Section 2: AI Parser
2.1: [Jawaban Anda]
...
```

Atau cukup quote pertanyaan dan jawab di bawahnya.

---

**Terima kasih!** Setelah jawaban diterima, saya akan finalize technical specifications dan mulai implementasi Phase 1.

---

**Document Version:** 1.0  
**Last Updated:** 25 Maret 2026  
**Status:** ⏳ Awaiting User Response
