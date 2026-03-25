# CatatUang - Technical Implementation Plan (v2.0)

**Based on:** Context7 Documentation Research  
**Date:** 25 Maret 2026  
**Status:** ✅ Research-Backed & Verified

---

## 📚 Research Sources Consulted

| Source | Library ID | Topics Covered |
|---|---|---|
| Supabase Docs | `/supabase/supabase` | RLS policies, TypeScript types, schema design, multi-tenant patterns |
| Next.js Docs | `/vercel/next.js` | App Router structure, Tailwind CSS setup, typed environment variables |
| grammY Docs | `/grammyjs/website` | Vercel webhook deployment, serverless bot setup |
| Research Papers | N/A | Financial data extraction, structured JSON output, LLM best practices |

---

## 🎯 Key Findings & Design Decisions

### 1. Database Schema (Supabase)

**Finding:** Supabase recommends **database-enforced RLS** over application-level filtering for multi-tenant security.

**Design Decision:**
```sql
-- ✅ CORRECT: Database-enforced RLS
alter table transactions enable row level security;

create policy "Group members can view transactions" 
on transactions for all 
to authenticated 
using (
  group_id in (
    select group_id from group_members 
    where user_id = auth.uid()
  )
);

-- ❌ WRONG: Application-level filtering only
select * from transactions where group_id = $current_group_id;
```

**Updated Schema Design:**

```sql
-- Core Tables (in order of creation)
1. profiles (extends auth.users)
   - id (uuid, PK, references auth.users)
   - email (text)
   - full_name (text, nullable)
   - avatar_url (text, nullable)
   - created_at (timestamptz)

2. groups (workspace/keluarga)
   - id (bigint, PK, identity)
   - name (text)
   - created_by (uuid, FK → profiles.id)
   - created_at (timestamptz)

3. group_members (many-to-many junction)
   - user_id (uuid, FK → profiles.id)
   - group_id (bigint, FK → groups.id)
   - role (text: 'owner' | 'admin' | 'member')
   - joined_at (timestamptz)
   - PRIMARY KEY (user_id, group_id)

4. wallets
   - id (bigint, PK, identity)
   - name (text) -- FREE TEXT: "BCA", "GoPay", "Cash"
   - group_id (bigint, FK → groups.id)
   - created_by (uuid, FK → profiles.id)
   - created_at (timestamptz)

5. categories
   - id (bigint, PK, identity)
   - name (text)
   - group_id (bigint, FK → groups.id, nullable for global defaults)
   - is_default (boolean) -- "Umum" category
   - created_at (timestamptz)

6. transactions
   - id (bigint, PK, identity)
   - type (text: 'income' | 'expense' | 'transfer')
   - amount (numeric)
   - description (text)
   - transaction_date (timestamptz)
   - -- For income/expense:
   - wallet_id (bigint, FK → wallets.id)
   - category_id (bigint, FK → categories.id, nullable → defaults to "Umum")
   - -- For transfer:
   - from_wallet_id (bigint, FK → wallets.id, nullable)
   - to_wallet_id (bigint, FK → wallets.id, nullable)
   - -- Metadata:
   - created_by (uuid, FK → profiles.id)
   - group_id (bigint, FK → groups.id)
   - created_at (timestamptz)

7. ai_confirmations (pending AI-parsed transactions)
   - id (uuid, PK)
   - user_id (uuid, FK → profiles.id)
   - group_id (bigint, FK → groups.id)
   - original_message (text)
   - parsed_data (jsonb) -- {type, amount, wallet, category, description}
   - status (text: 'pending' | 'confirmed' | 'rejected')
   - expires_at (timestamptz)
   - created_at (timestamptz)
```

**RLS Policies (Critical):**

```sql
-- Profiles: Users can view their own profile
create policy "Users can view own profile"
on profiles for select
to authenticated
using (auth.uid() = id);

-- Groups: Members can view groups they belong to
create policy "Members can view their groups"
on groups for select
to authenticated
using (
  id in (
    select group_id from group_members 
    where user_id = auth.uid()
  )
);

-- Transactions: Group members can view/create transactions
create policy "Group members can manage transactions"
on transactions for all
to authenticated
using (
  group_id in (
    select group_id from group_members 
    where user_id = auth.uid()
  )
);

-- Same pattern for wallets, categories, ai_confirmations
```

---

### 2. TypeScript Types Generation

**Finding:** Supabase recommends generating types from schema for type-safe queries.

**Implementation:**

```bash
# After creating migrations, generate types
npx supabase gen types typescript \
  --project-id ecjedovrkcsdnslycmfi \
  --schema public \
  > types/database.types.ts
```

**Usage in Next.js:**

```typescript
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database.types'

export const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Type-safe queries:
const { data } = await supabase
  .from('transactions')
  .select('*, wallets(name), categories(name)')
  .eq('group_id', groupId)
```

---

### 3. Next.js Project Structure

**Finding:** Next.js App Router recommends `/src` folder organization with clear separation.

**Structure:**

```
CatatUang/
├── .github-token          # ⚠️ NEVER COMMIT
├── .gitignore
├── .sisyphus/             # Work plans
├── prd.md
├── package.json
├── tsconfig.json
├── next.config.ts
├── tailwind.config.ts
├── .env.local
├── .env.example
│
├── src/
│   ├── app/               # App Router pages
│   │   ├── (auth)/        # Route group for auth pages
│   │   │   ├── login/
│   │   │   └── signup/
│   │   ├── (dashboard)/   # Route group for authenticated pages
│   │   │   ├── layout.tsx # Dashboard layout with sidebar
│   │   │   ├── page.tsx   # Dashboard home
│   │   │   ├── transactions/
│   │   │   ├── chat/
│   │   │   └── settings/
│   │   ├── api/           # API routes
│   │   │   ├── parse-transaction/
│   │   │   ├── confirmations/
│   │   │   └── reports/
│   │   ├── layout.tsx     # Root layout
│   │   └── page.tsx       # Landing page
│   │
│   ├── components/
│   │   ├── ui/            # shadcn/ui components
│   │   ├── charts/        # Recharts components
│   │   ├── transactions/  # Transaction-specific components
│   │   └── layout/        # Sidebar, Header, etc.
│   │
│   ├── lib/
│   │   ├── supabase/      # Supabase clients
│   │   │   ├── client.ts  # Browser client
│   │   │   ├── server.ts  # Server client
│   │   │   └── middleware.ts
│   │   ├── ai/            # AI/Groq client
│   │   ├── utils.ts       # CN helper, formatters
│   │   └── constants.ts   # App constants
│   │
│   ├── hooks/             # Custom React hooks
│   │   ├── use-transactions.ts
│   │   ├── use-categories.ts
│   │   └── use-wallets.ts
│   │
│   └── types/
│       └── database.types.ts  # Generated from Supabase
│
├── public/
│   └── logo.svg
│
└── supabase/
    ├── migrations/        # SQL migrations
    │   ├── 0001_create_profiles.sql
    │   ├── 0002_create_groups.sql
    │   ├── 0003_create_group_members.sql
    │   ├── 0004_create_wallets.sql
    │   ├── 0005_create_categories.sql
    │   ├── 0006_create_transactions.sql
    │   ├── 0007_create_ai_confirmations.sql
    │   └── 0008_setup_rls_policies.sql
    └── config.toml
```

---

### 4. Environment Variables (Typed)

**Finding:** Next.js 14+ supports typed environment variables with `experimental.typedEnv`.

**Implementation:**

```typescript
// next.config.ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    typedEnv: true,
  },
}

export default nextConfig
```

```typescript
// .env.local
NEXT_PUBLIC_SUPABASE_URL=https://ecjedovrkcsdnslycmfi.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
GROQ_API_KEY=<groq-key>
OPENROUTER_API_KEY=<openrouter-key>
TELEGRAM_BOT_TOKEN=<bot-token>
NEXT_PUBLIC_APP_URL=https://catatuang.vercel.app
```

```typescript
// .env.example (COMMIT THIS)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GROQ_API_KEY=
OPENROUTER_API_KEY=
TELEGRAM_BOT_TOKEN=
NEXT_PUBLIC_APP_URL=
```

---

### 5. AI Parser Implementation (Groq)

**Finding:** Research shows **constrained decoding** (JSON schema enforcement) is critical for reliable structured output. Groq supports JSON mode.

**Implementation:**

```typescript
// lib/ai/parser.ts
import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

const SYSTEM_PROMPT = `
You are CatatUang AI, a financial transaction parser for Indonesian users.
Extract transaction information from natural language input.

SUPPORTED TRANSACTION TYPES:
- "income" (pemasukan)
- "expense" (pengeluaran)  
- "transfer" (transfer antar dompet)

REQUIRED OUTPUT JSON SCHEMA:
{
  "type": "income" | "expense" | "transfer",
  "amount": number,
  "description": string,
  "wallet": string | null,        // For income/expense
  "category": string | null,      // For income/expense, default "Umum"
  "from_wallet": string | null,   // For transfer
  "to_wallet": string | null,     // For transfer
  "date": string | null,          // ISO format, default now
  "confidence": number,           // 0-1, how confident in parsing
  "missing_fields": string[],     // Fields AI is unsure about
  "clarification_needed": boolean // Whether to ask user for confirmation
}

LANGUAGE: Indonesian (including slang like "beli makan", "topup", "transfer")

AMBIGUOUS INPUT HANDLING:
- If type unclear → set "clarification_needed": true
- If amount unclear → set "clarification_needed": true
- If wallet/category not mentioned → use null, AI will use defaults
- Use Indonesian context: "gopay" → wallet, "makan" → category "Makanan"

EXAMPLES:

Input: "Beli makan siang 50rb pakai gopay"
Output: {
  "type": "expense",
  "amount": 50000,
  "description": "Beli makan siang",
  "wallet": "gopay",
  "category": "Makanan",
  "confidence": 0.95,
  "missing_fields": [],
  "clarification_needed": false
}

Input: "Transfer 500ribu dari BCA ke GoPay"
Output: {
  "type": "transfer",
  "amount": 500000,
  "description": "Transfer dana",
  "from_wallet": "BCA",
  "to_wallet": "GoPay",
  "confidence": 0.98,
  "missing_fields": [],
  "clarification_needed": false
}

Input: "Kemarin beli kopi"
Output: {
  "type": "expense",
  "amount": null,
  "description": "Beli kopi",
  "wallet": null,
  "category": "Makanan",
  "confidence": 0.6,
  "missing_fields": ["amount"],
  "clarification_needed": true
}
`

export async function parseTransaction(message: string) {
  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile', // Fast, good for structured extraction
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: message },
      ],
      response_format: { type: 'json_object' }, // Constrained decoding
      temperature: 0.1, // Low temp for consistency
    })

    const parsed = JSON.parse(completion.choices[0].message.content!)
    
    return {
      success: true,
      data: parsed,
    }
  } catch (error) {
    // Fallback to OpenRouter
    return parseWithOpenRouter(message)
  }
}

async function parseWithOpenRouter(message: string) {
  // Fallback implementation with OpenRouter
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'meta-llama/llama-3-70b-instruct',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: message },
      ],
      response_format: { type: 'json_object' },
    }),
  })

  const data = await response.json()
  const parsed = JSON.parse(data.choices[0].message.content)
  
  return {
    success: true,
    data: parsed,
  }
}
```

---

### 6. Telegram Bot (grammY + Vercel Webhook)

**Finding:** grammY docs show **webhookCallback** pattern for Vercel serverless deployment.

**Implementation:**

```typescript
// src/app/api/telegram/route.ts
import { Bot, webhookCallback } from 'grammy'
import { NextRequest } from 'next/server'

const token = process.env.TELEGRAM_BOT_TOKEN
if (!token) throw new Error('TELEGRAM_BOT_TOKEN is not set')

const bot = new Bot(token)

// Handle messages
bot.on('message:text', async (ctx) => {
  const userId = ctx.from?.id.toString()
  const message = ctx.message.text
  
  // Call AI parser
  const parsed = await parseTransaction(message)
  
  if (parsed.data.clarification_needed) {
    // Ask clarifying questions
    await ctx.reply(
      `🤔 Saya kurang yakin. Bisa konfirmasi:\n\n` +
      `- Nominal: ${parsed.data.amount || '❓'}\n` +
      `- Kategori: ${parsed.data.category || 'Umum'}\n` +
      `- Dompet: ${parsed.data.wallet || 'Cash'}\n\n` +
      `Ketik "ya" untuk simpan, atau detailkan transaksi Anda.`
    )
    return
  }
  
  // Show confirmation with inline buttons
  await ctx.reply(
    `✅ Konfirmasi Transaksi:\n\n` +
    `Type: ${parsed.data.type}\n` +
    `Amount: Rp ${parsed.data.amount?.toLocaleString('id-ID')}\n` +
    `Description: ${parsed.data.description}\n` +
    `Category: ${parsed.data.category || 'Umum'}\n` +
    `Wallet: ${parsed.data.wallet || 'Cash'}\n\n` +
    `Klik tombol di bawah untuk menyimpan:`,
    {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '✅ Simpan', callback_data: `confirm_${parsed.data.id}` },
            { text: '❌ Batal', callback_data: `cancel_${parsed.data.id}` },
          ],
        ],
      },
    }
  )
})

// Handle button callbacks
bot.on('callback_query:data', async (ctx) => {
  const data = ctx.callbackQuery.data
  
  if (data.startsWith('confirm_')) {
    // Save transaction to database
    // ... implementation
    await ctx.answerCallbackQuery()
    await ctx.editMessageText('✅ Transaksi berhasil disimpan!')
  } else if (data.startsWith('cancel_')) {
    await ctx.answerCallbackQuery()
    await ctx.editMessageText('❌ Transaksi dibatalkan.')
  }
})

// Commands
bot.command('start', async (ctx) => {
  await ctx.reply(
    `👋 Halo! Saya CatatUang Bot.\n\n` +
    `Cara pakai:\n` +
    `1. Ketik transaksi: "Beli makan 50rb pakai gopay"\n` +
    `2. AI akan parse dan konfirmasi\n` +
    `3. Klik "Simpan" untuk menyimpan\n\n` +
    `Commands:\n` +
    `/start - Mulai bot\n` +
    `/help - Bantuan\n` +
    `/hari_ini - Laporan hari ini\n` +
    `/kategori - List kategori\n` +
    `/dompet - List dompet`
  )
})

bot.command('help', async (ctx) => {
  await ctx.reply('...help message...')
})

bot.command('hari_ini', async (ctx) => {
  // Fetch today's transactions from Supabase
  // Send summary
})

// Export webhook handler
const handler = webhookCallback(bot, 'https')

export async function POST(req: NextRequest) {
  return handler(req)
}
```

**Vercel Deployment Steps:**

```bash
# 1. Deploy to Vercel
vercel deploy --prod

# 2. Set webhook URL (after getting production URL)
# Visit in browser:
https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook?url=https://catatuang.vercel.app/api/telegram

# Should return:
# {"ok": true, "result": true, "description": "Webhook was set"}
```

---

### 7. File Upload Handling (PDF/XLSX Export)

**Finding:** Vercel serverless has 10MB limit, 60s timeout. Use streaming for large exports.

**Implementation:**

```typescript
// lib/export/pdf.ts
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell } from 'docx'

export async function generateTransactionPDF(transactions: any[]) {
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          children: [
            new TextRun({
              text: 'Laporan Transaksi CatatUang',
              bold: true,
              size: 32,
            }),
          ],
        }),
        new Table({
          rows: [
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph('Tanggal')] }),
                new TableCell({ children: [new Paragraph('Deskripsi')] }),
                new TableCell({ children: [new Paragraph('Tipe')] }),
                new TableCell({ children: [new Paragraph('Jumlah')] }),
              ],
            }),
            ...transactions.map(t => new TableRow({
              children: [
                new TableCell({ children: [new Paragraph(t.transaction_date)] }),
                new TableCell({ children: [new Paragraph(t.description)] }),
                new TableCell({ children: [new Paragraph(t.type)] }),
                new TableCell({ children: [new Paragraph(`Rp ${t.amount}`)] }),
              ],
            })),
          ],
        }),
      ],
    }],
  })

  const blob = await Packer.toBlob(doc)
  return blob
}
```

```typescript
// src/app/api/export/pdf/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { generateTransactionPDF } from '@/lib/export/pdf'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = createClient()
  
  // Get user's group and transactions
  const { data: { user } } = await supabase.auth.getUser()
  const { data: transactions } = await supabase
    .from('transactions')
    .select('*')
    .eq('group_id', user?.group_id)
    .order('transaction_date', { ascending: false })
  
  const pdfBlob = await generateTransactionPDF(transactions)
  
  return new NextResponse(pdfBlob, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="laporan-transaksi.pdf"',
    },
  })
}
```

---

## 📋 Updated Implementation Checklist

### Phase 1: Foundation (RESEARCH-BACKED)

- [ ] **1.1 Database Migrations** (Supabase)
  - [ ] Create 7 SQL migration files
  - [ ] Setup RLS policies
  - [ ] Create indexes for performance
  - [ ] Test migrations locally (`supabase start`)
  - [ ] Push to production (`supabase db push`)

- [ ] **1.2 Next.js Project Setup**
  - [ ] `npx create-next-app@latest` with TypeScript, Tailwind, App Router
  - [ ] Setup shadcn/ui (`npx shadcn@latest init`)
  - [ ] Configure ESLint + Prettier
  - [ ] Setup `.env.local` + `.env.example`
  - [ ] Enable `experimental.typedEnv` in next.config.ts

- [ ] **1.3 Supabase Client**
  - [ ] Install `@supabase/supabase-js` + `@supabase/ssr`
  - [ ] Create browser client (`lib/supabase/client.ts`)
  - [ ] Create server client (`lib/supabase/server.ts`)
  - [ ] Create middleware for auth (`lib/supabase/middleware.ts`)
  - [ ] Generate TypeScript types (`npx supabase gen types`)

- [ ] **1.4 Git & Initial Commit**
  - [ ] Add project structure to git
  - [ ] Commit: `feat: initial Next.js project setup`
  - [ ] Push to GitHub

---

### Phase 2: Core AI (RESEARCH-BACKED)

- [ ] **2.1 Groq API Setup**
  - [ ] Create Groq account, get API key
  - [ ] Install `groq-sdk`
  - [ ] Create AI client utility
  - [ ] Test connectivity

- [ ] **2.2 Prompt Engineering**
  - [ ] Design SYSTEM_PROMPT with JSON schema
  - [ ] Test with 20+ Indonesian inputs (including slang)
  - [ ] Handle edge cases (ambiguous, incomplete)
  - [ ] Implement fallback to OpenRouter

- [ ] **2.3 Parser API Endpoint**
  - [ ] Create `/api/parse-transaction` route
  - [ ] Implement validation
  - [ ] Call Groq API
  - [ ] Return structured JSON

- [ ] **2.4 Confirmation Flow**
  - [ ] Create AI confirmations table
  - [ ] Create POST `/api/confirmations` (create pending)
  - [ ] Create PATCH `/api/confirmations/:id` (approve/reject)
  - [ ] Implement auto-expiry logic

---

### Phase 3: Telegram Bot (RESEARCH-BACKED)

- [ ] **3.1 Bot Creation**
  - [ ] Guide user to create bot via @BotFather
  - [ ] Store BOT_TOKEN in env
  - [ ] Install `grammy`

- [ ] **3.2 Webhook Setup**
  - [ ] Create `/api/telegram` route with `webhookCallback`
  - [ ] Deploy to Vercel
  - [ ] Set webhook URL via Telegram API

- [ ] **3.3 Message Handler**
  - [ ] Handle text messages
  - [ ] Call AI parser
  - [ ] Send confirmation with inline buttons
  - [ ] Handle button callbacks

- [ ] **3.4 Command Handlers**
  - [ ] `/start` - Welcome message
  - [ ] `/help` - Help guide
  - [ ] `/tambah_kategori` - Add category
  - [ ] `/tambah_dompet` - Add wallet
  - [ ] `/kategori` - List categories
  - [ ] `/dompet` - List wallets

- [ ] **3.5 Report Commands**
  - [ ] `/hari_ini` - Today's summary
  - [ ] `/minggu_ini` - This week
  - [ ] `/bulan_ini` - This month

- [ ] **3.6 Group Chat Support**
  - [ ] Track group_id from chat
  - [ ] Link Telegram users to Supabase profiles
  - [ ] Support multi-user groups

---

### Phase 4: Web Dashboard (RESEARCH-BACKED)

- [ ] **4.1 Auth Pages**
  - [ ] `/login` - Login form
  - [ ] `/signup` - Signup form
  - [ ] Integrate Supabase Auth
  - [ ] Redirect to dashboard after login

- [ ] **4.2 Dashboard Layout**
  - [ ] Create `(dashboard)/layout.tsx` with sidebar
  - [ ] Responsive design (mobile-first)
  - [ ] Header with user info

- [ ] **4.3 Chat Interface**
  - [ ] `/chat` page with ChatGPT-like UI
  - [ ] Message input + send button
  - [ ] Conversation history
  - [ ] Transaction preview + confirmation

- [ ] **4.4 Transaction List**
  - [ ] `/transactions` page with table
  - [ ] Pagination (react-table or tanstack-table)
  - [ ] Filters (date, category, wallet)
  - [ ] Search functionality

- [ ] **4.5 Charts**
  - [ ] Install `recharts`
  - [ ] Pie chart: spending by category
  - [ ] Bar chart: income vs expense
  - [ ] Line chart: monthly trend

- [ ] **4.6 Settings**
  - [ ] `/settings` page
  - [ ] Manage categories (CRUD)
  - [ ] Manage wallets (CRUD)
  - [ ] Profile settings

- [ ] **4.7 Export**
  - [ ] Install `docx` (PDF) + `xlsx` (Excel)
  - [ ] Create export API endpoints
  - [ ] Add download buttons to UI

---

### Phase 5: Deployment

- [ ] **5.1 Vercel Setup**
  - [ ] Connect GitHub repo
  - [ ] Set environment variables
  - [ ] Deploy production

- [ ] **5.2 Testing**
  - [ ] Test all user flows
  - [ ] Performance testing
  - [ ] Mobile responsiveness check

- [ ] **5.3 Documentation**
  - [ ] Write README.md
  - [ ] Document API endpoints
  - [ ] User guide

---

## ⚠️ Critical Implementation Notes

1. **RLS is MANDATORY** - Never rely on application-level filtering alone
2. **Generate TypeScript types** after EVERY schema change
3. **Use constrained decoding** for AI JSON output (response_format: json_object)
4. **Webhook, NOT polling** for Telegram on Vercel
5. **Environment variables** - Use `.env.example` template, NEVER commit secrets
6. **Group-based multi-tenancy** - All queries must filter by group_id via RLS

---

## 📚 References

- [Supabase RLS Best Practices](https://github.com/supabase/supabase)
- [Next.js App Router Structure](https://github.com/vercel/next.js)
- [grammY Vercel Deployment](https://github.com/grammyjs/website)
- [Financial Data Extraction Research](https://arxiv.org/)

---

**Version:** 2.0 (Research-Backed)  
**Last Updated:** 25 Maret 2026  
**Ready for:** Phase 1 Implementation ✅
