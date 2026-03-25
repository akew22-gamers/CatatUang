# CatatUang - AI Financial Assistant

CatatUang adalah aplikasi pencatatan keuangan berbasis AI yang mendukung input melalui bahasa natural (chat santai) dengan integrasi Telegram Bot dan Web Dashboard.

## 🚀 Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Database:** Supabase (PostgreSQL)
- **AI Parser:** Groq API (fallback: OpenRouter)
- **Telegram Bot:** grammY
- **UI/UX:** Tailwind CSS + shadcn/ui
- **Deployment:** Vercel

## 📋 Features

### AI Assistant
- Natural Language Processing untuk input transaksi
- Support bahasa Indonesia + slang
- Interactive confirmation flow
- Multi-tenant group support

### Telegram Bot
- Input transaksi via chat
- Commands: `/start`, `/help`, `/hari_ini`, `/bulan_ini`
- Export laporan PDF/XLSX
- Group chat support

### Web Dashboard
- Real-time transaction updates
- Charts & visualizations
- Transaction history dengan filters
- Settings untuk manage categories & wallets

## 🛠️ Setup

### 1. Clone Repository

```bash
git clone https://github.com/akew22-gamers/CatatUang.git
cd CatatUang
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Environment Variables

Copy `.env.example` ke `.env.local`:

```bash
cp .env.example .env.local
```

Isi dengan kredensial Anda:
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `GROQ_API_KEY` - Groq API key (dari https://console.groq.com)
- `OPENROUTER_API_KEY` - OpenRouter API key (fallback)
- `TELEGRAM_BOT_TOKEN` - Telegram bot token (dari @BotFather)

### 4. Setup Database

Apply migrations ke Supabase:

```bash
# Install Supabase CLI
npm install -g supabase

# Link ke project
supabase link --project-ref ecjedovrkcsdnslycmfi

# Push migrations
supabase db push
```

### 5. Run Development Server

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
CatatUang/
├── src/
│   ├── app/              # Next.js App Router pages
│   │   ├── (auth)/       # Login, signup
│   │   ├── (dashboard)/  # Authenticated pages
│   │   └── api/          # API routes
│   ├── components/       # React components
│   ├── lib/              # Utilities (Supabase, AI)
│   ├── hooks/            # Custom hooks
│   └── types/            # TypeScript types
├── supabase/
│   └── migrations/       # SQL migrations
└── .env.local
```

## 🤖 Telegram Bot Setup

1. Buat bot via [@BotFather](https://t.me/BotFather)
2. Set webhook setelah deploy ke Vercel:

```bash
https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook?url=<VERCEL_URL>/api/telegram
```

## 📊 Database Schema

### Core Tables
- `profiles` - User profiles (extends Supabase Auth)
- `groups` - Workspaces/keluarga
- `group_members` - User-group membership
- `wallets` - Dompet (BCA, GoPay, Cash)
- `categories` - Kategori transaksi
- `transactions` - Transaksi (income/expense/transfer)
- `ai_confirmations` - Pending AI-parsed transactions

### Security
- Row Level Security (RLS) enabled on all tables
- Group-based multi-tenancy
- Real-time sync enabled

## 🚀 Deployment

Deploy ke Vercel:

```bash
vercel
```

Set environment variables di Vercel dashboard.

## 📝 License

MIT License - EAS Creative Studio
