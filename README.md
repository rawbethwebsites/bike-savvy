# Bike Savvy Dashboard

Operations dashboard and Telegram bot for Bike Savvy motorcycle training bookings.

## Overview

A secure operations dashboard that prevents booking clashes and a private Telegram assistant that lets the Bike Savvy owner understand and control bookings without constantly opening the dashboard.

**Location:** Cape Town, South Africa  
**Version:** 1.0 (MVP baseline)

## Features

### Dashboard
- **Today View**: Operational briefing, KPI cards, schedule, issue centre
- **Calendar**: Day/week/month views with instructor lanes
- **Bookings**: Create, edit, reschedule, cancel with collision prevention
- **Customers**: Profiles, training history, licence journey tracking
- **Instructors & Resources**: Qualifications, availability, motorcycles
- **Reports**: Bookings, revenue, utilisation, cancellations
- **Audit Log**: Complete history of all changes

### Telegram Bot
- Natural language queries: "What's happening today?", "Is Daniel free at 2 PM?"
- Booking creation and rescheduling with preview & confirmation
- Conflict resolution with guided options
- Proactive alerts and daily briefings
- Secure account linking with MFA

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS 4
- **Backend**: Supabase (PostgreSQL, Auth, Realtime)
- **Bot**: Telegram Bot API with webhook
- **Deployment**: Vercel (frontend), Supabase Edge Functions (bot)

## Getting Started

### Prerequisites

- Node.js 20+
- npm or pnpm
- Supabase account
- Telegram Bot Token (from @BotFather)

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Copy your project URL and anon key
3. Run the migration:
   ```bash
   npx supabase db push
   ```
   Or manually run `supabase/migrations/001_initial_schema.sql` in the SQL editor

### 3. Configure Environment Variables

Copy `.env.local.example` to `.env.local` and fill in:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
TELEGRAM_BOT_TOKEN=your-bot-token-from-botfather
TELEGRAM_WEBHOOK_SECRET=generate-a-random-secret
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
bike-savvy/
├── app/                    # Next.js App Router
│   ├── dashboard/         # Dashboard pages
│   ├── api/               # API routes
│   ├── layout.tsx
│   └── page.tsx
├── components/            # React components
│   ├── dashboard/        # Dashboard-specific components
│   ├── ui/               # Base UI components
│   └── telegram/         # Telegram bot components
├── lib/                   # Utilities and helpers
│   ├── supabase/         # Supabase client and types
│   ├── booking/          # Booking engine logic
│   └── telegram/         # Telegram bot logic
├── supabase/             # Supabase configuration
│   └── migrations/       # Database migrations
└── telegram/             # Telegram bot (Edge Function)
```

## Database Schema

Key tables:
- `dashboard_users` - User accounts with roles
- `customers` - Customer profiles and licence journey
- `instructors` - Instructor availability and qualifications
- `courses` - Training courses with durations and prices
- `resources` - Motorcycles and training areas
- `bookings` - Booking records with status tracking
- `booking_resources` - Resource allocations per booking
- `availability_blocks` - Time blocks for leave/maintenance
- `payments` - Payment records
- `audit_events` - Append-only change log
- `telegram_accounts` - Telegram account linking
- `telegram_action_proposals` - Preview/confirmation flow

## Security

- MFA required for all dashboard users
- Role-based permissions (owner, staff, instructor, viewer)
- Telegram account linking via single-use codes
- Signed, short-lived action tokens
- Idempotency and replay protection
- POPIA-compliant data handling

## Acceptance Criteria

See PRD for full list. Key criteria:
- [ ] AC-01: Dashboard prevents instructor/customer/resource overlaps
- [ ] AC-02: Simultaneous conflicting requests cannot both confirm
- [ ] AC-03: Owner can retrieve today/tomorrow schedule from Telegram
- [ ] AC-05: Booking create/reschedule shows preview and requires confirmation
- [ ] AC-08: Every Telegram action appears in dashboard audit log

## Roadmap

| Phase | Time | Deliverables |
|-------|------|--------------|
| 0 - Validation | Week 1 | Confirm requirements, policies, Telegram users |
| 1 - UX & Data Design | Week 2 | Dashboard flows, conversation maps, prototype |
| 2 - Dashboard Demo | Weeks 3-4 | Today, Calendar, Bookings, Customers, Reports |
| 3 - Telegram Demo | Week 5 | Private bot, read queries, guided commands |
| 4 - Production Core | Weeks 6-7 | PostgreSQL constraints, transactions, audit |
| 5 - Secure Telegram | Weeks 8-9 | Account linking, webhook, signed approvals |
| 6 - QA & UAT | Week 10 | Concurrency, security, accessibility testing |
| 7 - Pilot Launch | Week 11 | Owner + 2 staff, monitoring, fixes |

## License

Confidential - Bike Savvy Operations
