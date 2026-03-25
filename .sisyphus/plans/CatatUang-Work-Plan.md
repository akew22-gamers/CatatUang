# CatatUang - Development Work Plan

**Repository:** https://github.com/akew22-gamers/CatatUang.git  
**Project Ref:** ecjedovrkcsdnslycmfi  
**Tech Stack:** Next.js, Supabase, Groq AI, grammY, Tailwind CSS + shadcn/ui  
**Start Date:** 25 Maret 2026

---

## 📋 Development Phases Overview

| Phase | Focus | Estimated Tasks | Priority |
|---|---|---|---|
| **Phase 1** | Foundation (DB + Next.js) | 8 tasks | P0 - Critical |
| **Phase 2** | Core AI (NLP Parser) | 6 tasks | P0 - Critical |
| **Phase 3** | Telegram Bot | 7 tasks | P1 - High |
| **Phase 4** | Web Dashboard | 8 tasks | P1 - High |
| **Phase 5** | Polish & Deploy | 5 tasks | P2 - Medium |

**Total:** ~34 tasks  
**Estimated Duration:** 10-14 days (depending on complexity)

---

## 🎯 Phase 1: Foundation (Database + Next.js Core)

**Goal:** Establish solid foundation with database schema and Next.js project structure.

### 1.1 Database Schema Design
- [ ] Create Supabase migrations for:
  - `profiles` table (extends Supabase Auth)
  - `wallets` table (user's wallets/accounts)
  - `categories` table (transaction categories)
  - `transactions` table (income/expense records)
  - `ai_confirmations` table (pending AI-parsed transactions)
- [ ] Setup Row Level Security (RLS) policies
- [ ] Create database indexes for performance
- [ ] Test migrations locally

**Deliverable:** SQL migration files in `/supabase/migrations/`

### 1.2 Next.js Project Initialization
- [ ] Initialize Next.js 14+ with App Router
- [ ] Configure TypeScript (`tsconfig.json`)
- [ ] Setup Tailwind CSS
- [ ] Install and configure shadcn/ui
- [ ] Setup ESLint + Prettier
- [ ] Create `.env.local` template

**Deliverable:** Working Next.js project with UI framework

### 1.3 Supabase Client Setup
- [ ] Install `@supabase/supabase-js` and `@supabase/ssr`
- [ ] Create Supabase client utilities (browser + server)
- [ ] Setup Supabase Auth helpers
- [ ] Generate TypeScript types from database schema
- [ ] Test database connection

**Deliverable:** Typed Supabase client ready for use

### 1.4 Project Structure & Git
- [ ] Create folder structure (`/app`, `/components`, `/lib`, `/hooks`, etc.)
- [ ] Setup gitignore for Next.js + Supabase
- [ ] Initial commit with project structure
- [ ] Push to GitHub

**Deliverable:** Clean git history with initial setup

---

## 🤖 Phase 2: Core AI (NLP Parser)

**Goal:** Build AI-powered transaction parser that converts natural language to structured data.

### 2.1 AI Integration Setup
- [ ] Create Groq API / OpenRouter account
- [ ] Store API keys in environment variables
- [ ] Create AI client utility function
- [ ] Test API connectivity

**Deliverable:** Working AI client with API key management

### 2.2 Prompt Engineering
- [ ] Design system prompt for transaction parsing
- [ ] Define JSON output schema (jenis, nominal, kategori, dompet, keterangan)
- [ ] Test with various Indonesian natural language inputs
- [ ] Handle edge cases (ambiguous input, missing info)

**Deliverable:** Robust prompt that consistently returns valid JSON

### 2.3 Parser API Endpoint
- [ ] Create `/api/parse-transaction` endpoint
- [ ] Implement request validation
- [ ] Call Groq API with user input
- [ ] Parse and validate AI response
- [ ] Return structured JSON

**Deliverable:** API endpoint that converts text → structured data

### 2.4 Confirmation Flow API
- [ ] Create `/api/confirmations` POST endpoint (create pending transaction)
- [ ] Create `/api/confirmations/:id` PATCH endpoint (approve/reject)
- [ ] Implement database insert on approval
- [ ] Add expiration logic (pending items auto-delete after X hours)

**Deliverable:** Two-step confirmation flow API

### 2.5 Report Query API
- [ ] Create `/api/reports/summary` endpoint
- [ ] Implement date range filtering
- [ ] Calculate totals by category, wallet, type
- [ ] Support natural language query parsing (optional stretch goal)

**Deliverable:** Summary report endpoint for dashboard

### 2.6 Parser Testing & Validation
- [ ] Create test cases for common inputs
- [ ] Test edge cases (multiple transactions, unclear amounts)
- [ ] Validate JSON schema consistently
- [ ] Document prompt limitations

**Deliverable:** Tested parser with known accuracy rate

---

## 📱 Phase 3: Telegram Bot

**Goal:** Build Telegram bot interface for quick transaction input on mobile.

### 3.1 Bot Setup
- [ ] Create Telegram Bot via @BotFather
- [ ] Store bot token in environment variables
- [ ] Install `grammY` library
- [ ] Setup basic bot initialization

**Deliverable:** Bot that responds to `/start` command

### 3.2 Webhook Configuration
- [ ] Deploy bot to Vercel (serverless function)
- [ ] Setup webhook URL in Telegram
- [ ] Handle webhook verification
- [ ] Test message receiving

**Deliverable:** Bot receives messages via webhook

### 3.3 Message Handler
- [ ] Create message processing pipeline
- [ ] Call AI parser API for normal messages
- [ ] Send confirmation message with inline buttons
- [ ] Handle button callbacks (✅ Save / ❌ Cancel)

**Deliverable:** User can send message → get confirmation → save transaction

### 3.4 Command Handlers
- [ ] `/start` - Welcome message and instructions
- [ ] `/help` - Show available commands
- [ ] `/tambah_kategori` - Add new category
- [ ] `/tambah_dompet` - Add new wallet
- [ ] `/kategori` - List categories
- [ ] `/dompet` - List wallets

**Deliverable:** Basic CRUD commands via Telegram

### 3.5 Report Commands
- [ ] `/hari_ini` - Today's summary
- [ ] `/minggu_ini` - This week's summary
- [ ] `/bulan_ini` - This month's summary
- [ ] `/export` - Generate and send PDF/XLSX

**Deliverable:** On-demand reports via Telegram

### 3.6 User Authentication
- [ ] Link Telegram user_id to Supabase user
- [ ] Handle first-time user registration
- [ ] Store Telegram chat_id in profiles table
- [ ] Implement multi-user support (for group chats)

**Deliverable:** Secure user mapping between Telegram and Supabase

### 3.7 Error Handling & Logging
- [ ] Handle API failures gracefully
- [ ] Log all bot interactions
- [ ] Implement retry logic for failed requests
- [ ] Add admin notification for critical errors

**Deliverable:** Production-ready bot with error resilience

---

## 🌐 Phase 4: Web Dashboard

**Goal:** Build comprehensive web dashboard for data visualization and management.

### 4.1 Authentication UI
- [ ] Create login page (`/login`)
- [ ] Create signup page (`/signup`)
- [ ] Implement Supabase Auth with email/password
- [ ] Add protected routes middleware
- [ ] Create user profile page

**Deliverable:** Secure authentication flow

### 4.2 Dashboard Layout
- [ ] Create main dashboard layout with sidebar
- [ ] Implement responsive navigation
- [ ] Add header with user info
- [ ] Create mobile-friendly menu

**Deliverable:** Professional dashboard layout

### 4.3 Chatbot Interface
- [ ] Create `/chat` page (ChatGPT-like UI)
- [ ] Implement message input with send button
- [ ] Display conversation history
- [ ] Show parsed transaction preview
- [ ] Add confirmation buttons in chat

**Deliverable:** Web-based chat interface for AI assistant

### 4.4 Transaction History
- [ ] Create `/transactions` page with data table
- [ ] Implement pagination
- [ ] Add filters (date range, category, wallet, type)
- [ ] Add search functionality
- [ ] Implement sort by columns

**Deliverable:** Comprehensive transaction list with filtering

### 4.5 Data Visualization
- [ ] Install charting library (recharts or chart.js)
- [ ] Create spending by category pie chart
- [ ] Create income vs expense bar chart
- [ ] Create monthly trend line chart
- [ ] Create wallet balance overview

**Deliverable:** Visual financial insights

### 4.6 Settings Page
- [ ] Create `/settings` page
- [ ] Manage categories (add, edit, delete)
- [ ] Manage wallets (add, edit, delete)
- [ ] Update profile information
- [ ] Change password

**Deliverable:** Self-service settings management

### 4.7 Export Feature
- [ ] Install PDF generation library (pdfmake or @react-pdf/renderer)
- [ ] Install XLSX library (xlsx or exceljs)
- [ ] Create export API endpoint
- [ ] Add export buttons to transactions page
- [ ] Support custom date range for export

**Deliverable:** Download reports in PDF and Excel formats

### 4.8 Responsive Design & Polish
- [ ] Test on mobile devices
- [ ] Test on tablets
- [ ] Fix responsive issues
- [ ] Add loading states
- [ ] Add error boundaries
- [ ] Implement toast notifications

**Deliverable:** Polished, responsive web app

---

## 🚀 Phase 5: Polish & Deployment

**Goal:** Prepare for production deployment with monitoring and documentation.

### 5.1 Environment Configuration
- [ ] Create `.env.example` with all required variables
- [ ] Document environment setup in README
- [ ] Setup Vercel project with environment variables
- [ ] Configure Supabase production project

**Deliverable:** Reproducible environment setup

### 5.2 Testing
- [ ] Write unit tests for AI parser
- [ ] Write integration tests for API endpoints
- [ ] Test user flows end-to-end
- [ ] Performance testing (API response times)

**Deliverable:** Test suite with good coverage

### 5.3 Monitoring & Analytics
- [ ] Setup Vercel Analytics
- [ ] Add error tracking (Sentry or similar)
- [ ] Monitor API usage and costs
- [ ] Setup uptime monitoring

**Deliverable:** Production monitoring in place

### 5.4 Documentation
- [ ] Write comprehensive README.md
- [ ] Document API endpoints
- [ ] Create user guide for Telegram bot
- [ ] Add deployment guide
- [ ] Document database schema

**Deliverable:** Complete project documentation

### 5.5 Launch Preparation
- [ ] Final security review
- [ ] Test all features in production
- [ ] Create demo account for testing
- [ ] Prepare launch announcement
- [ ] Setup feedback collection

**Deliverable:** Production-ready application

---

## 📊 Dependency Map

```
Phase 1 (Foundation)
├── 1.1 Database Schema → Required by ALL phases
├── 1.2 Next.js Setup → Required by ALL phases
├── 1.3 Supabase Client → Required by Phase 2, 3, 4
└── 1.4 Git Setup → Required for collaboration

Phase 2 (Core AI)
├── 2.1-2.3 AI Parser → Required by Phase 3, 4
├── 2.4 Confirmation Flow → Required by Phase 3, 4
└── 2.5-2.6 Reports → Used by Phase 3, 4

Phase 3 (Telegram)
├── Depends on: Phase 1 + Phase 2
├── 3.1-3.3 Core Bot → MVP for Telegram
├── 3.4-3.5 Commands → Enhanced features
└── 3.6-3.7 Auth & Errors → Production ready

Phase 4 (Web Dashboard)
├── Depends on: Phase 1 + Phase 2
├── 4.1-4.2 Auth + Layout → Foundation
├── 4.3-4.5 Features → Core functionality
├── 4.6-4.8 Settings + Polish → Complete product

Phase 5 (Deploy)
└── Depends on: ALL previous phases
```

---

## 🎯 Milestone Definitions

| Milestone | Completion Criteria | Target Date |
|---|---|---|
| **M1: Foundation Complete** | Phase 1 all tasks done, git pushed | Day 2 |
| **M2: AI Parser Working** | Phase 2 tested, API returns valid JSON | Day 4 |
| **M3: Telegram MVP** | Can send message → save transaction via Telegram | Day 6 |
| **M4: Web Dashboard Beta** | Login, view transactions, basic charts | Day 9 |
| **M5: Production Ready** | All phases complete, deployed to Vercel | Day 12-14 |

---

## 📝 Git Branch Strategy

```
main (protected)
├── develop (integration branch)
│   ├── feature/database-schema
│   ├── feature/ai-parser
│   ├── feature/telegram-bot
│   └── feature/web-dashboard
└── hotfix/* (production fixes)
```

**Commit Convention:**
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `style:` Formatting, missing semi-colons, etc.
- `refactor:` Code refactoring
- `test:` Adding tests
- `chore:` Maintenance tasks

---

## 🔐 Required Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://ecjedovrkcsdnslycmfi.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>

# AI (choose one)
GROQ_API_KEY=<your-groq-key>
# OR
OPENROUTER_API_KEY=<your-openrouter-key>

# Telegram
TELEGRAM_BOT_TOKEN=<your-bot-token>

# App
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

---

## 📈 Success Metrics

| Metric | Target |
|---|---|
| AI Parser Accuracy | >90% correct extraction |
| API Response Time | <2 seconds (P95) |
| Telegram Bot Uptime | >99% |
| Web App Lighthouse Score | >90 |
| Time to First Transaction | <30 seconds (new user) |

---

## 🚨 Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| AI Parser inaccurate | Medium | High | Extensive prompt testing, fallback to manual input |
| Telegram rate limits | Low | Medium | Implement queuing, exponential backoff |
| Vercel serverless timeout | Low | Medium | Optimize functions, use streaming |
| Supabase costs | Medium | Medium | Monitor usage, implement caching |
| Scope creep | High | High | Strict adherence to PRD, phase features |

---

**Last Updated:** 25 Maret 2026  
**Document Version:** 1.0  
**Status:** Ready for execution
