# Bike Savvy - Project Setup Guide

## Current Status ✅

### Completed (Phase 0-1)

1. **Project Repository Created**
   - Location: `~/Documents/PROJECTS/bike-savvy`
   - Next.js 16 with TypeScript and Tailwind CSS 4
   - App Router structure in place

2. **Database Schema Designed**
   - Complete PostgreSQL schema in `supabase/migrations/001_initial_schema.sql`
   - Tables: dashboard_users, telegram_accounts, courses, instructors, resources, customers, bookings, booking_resources, availability_blocks, payments, licence_milestones, message_templates, sent_messages, audit_events, telegram_conversations, telegram_action_proposals
   - Enums: user_role, booking_status, licence_stage, payment_status
   - Triggers for collision detection (instructor, customer, resource availability)
   - Audit logging infrastructure

3. **Booking Engine Implemented**
   - `lib/booking/engine.ts` - Core availability checking and collision detection
   - `lib/booking/types.ts` - TypeScript types from database schema
   - Functions: checkAvailability, validateBookingProposal, calculatePrice
   - Checks: instructor, customer, resource, business hours, buffers

4. **Supabase Client Configured**
   - `lib/supabase/client.ts` - Supabase client setup
   - Helper functions: getCurrentUser, getCurrentUserProfile, hasRole

5. **Authentication Middleware Stub**
   - `middleware.ts` - Route protection structure
   - Ready for Supabase Auth integration

6. **Documentation**
   - README.md with full project overview
   - This SETUP.md guide

## Next Steps 📋

### Immediate (Do These Now)

1. **Create Supabase Project**
   ```
   - Go to supabase.com
   - Create new project "Bike Savvy"
   - Select region closest to Cape Town (likely eu-west or africa-south if available)
   - Copy project URL and keys
   ```

2. **Configure Environment Variables**
   ```bash
   cd ~/Documents/PROJECTS/bike-savvy
   cp .env.local.example .env.local
   ```
   
   Edit `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   TELEGRAM_BOT_TOKEN=get-from-botfather
   ```

3. **Run Database Migration**
   ```
   Option A: Using Supabase CLI
   npm install -g supabase
   supabase login
   supabase link --project-ref your-project-ref
   supabase db push
   
   Option B: Manual SQL
   - Open Supabase SQL Editor
   - Copy contents of supabase/migrations/001_initial_schema.sql
   - Paste and run
   ```

4. **Create Telegram Bot**
   ```
   - Open Telegram, search for @BotFather
   - Send /newbot
   - Follow prompts to create bot
   - Copy the bot token to .env.local
   - Send /setprivacy to disable privacy mode (needed for group messages later)
   ```

5. **Test Development Server**
   ```bash
   npm run dev
   ```
   Open http://localhost:3000

### Phase 2 - Dashboard UI (Week 3-4)

Create these components:
- [ ] `app/dashboard/page.tsx` - Today view with KPIs
- [ ] `app/dashboard/calendar/page.tsx` - Calendar view
- [ ] `app/dashboard/bookings/page.tsx` - Bookings list
- [ ] `app/dashboard/bookings/[id]/page.tsx` - Booking detail/edit
- [ ] `app/dashboard/customers/page.tsx` - Customer list
- [ ] `components/dashboard/KpiCard.tsx`
- [ ] `components/dashboard/Schedule.tsx`
- [ ] `components/dashboard/Calendar.tsx`
- [ ] `components/ui/Button.tsx`, `Input.tsx`, `Modal.tsx`, etc.

### Phase 3 - Telegram Bot (Week 5)

- [ ] `telegram/bot.ts` - Telegram bot setup
- [ ] `telegram/handlers/read-queries.ts` - /today, /tomorrow, /availability
- [ ] `telegram/handlers/write-actions.ts` - /book, /block, /reschedule
- [ ] `telegram/middleware/auth.ts` - Account linking verification
- [ ] `app/api/telegram/webhook/route.ts` - Webhook endpoint

## File Structure

```
bike-savvy/
├── app/
│   ├── dashboard/          # Dashboard pages (to create)
│   ├── api/
│   │   └── telegram/       # Telegram webhook (to create)
│   ├── layout.tsx
│   └── page.tsx            # Home page (placeholder)
├── components/
│   ├── dashboard/          # Dashboard components (to create)
│   └── ui/                 # Base UI components (to create)
├── lib/
│   ├── booking/
│   │   ├── engine.ts       # ✅ Booking validation logic
│   │   └── types.ts        # ✅ TypeScript types
│   ├── supabase/
│   │   └── client.ts       # ✅ Supabase client
│   └── index.ts            # ✅ Exports
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql  # ✅ Database schema
├── telegram/               # Telegram bot (to create)
├── middleware.ts           # ✅ Auth middleware (stub)
├── README.md               # ✅ Project overview
├── SETUP.md                # ✅ This file
├── package.json
├── tsconfig.json
└── .env.local.example      # ✅ Environment template
```

## Key Design Decisions

### Database Constraints (AC-01, AC-02)
- PostgreSQL triggers prevent overlapping bookings at database level
- Checks run BEFORE insert/update, so conflicts are caught immediately
- Concurrent requests cannot both confirm due to transactional constraints

### Booking Status Flow
```
draft → held → pending_payment → confirmed → checked_in → completed
                                ↓
                            cancelled / no_show
```

### Telegram Security (AC-04, AC-05, AC-06, AC-07)
- Account linking via single-use code from authenticated dashboard
- All write actions require preview + explicit confirmation
- Confirmation tokens are signed, short-lived, and bound to record version
- Stale confirmations are rejected if record changed after preview

### Audit Logging (AC-08)
- Every change creates an audit_events record
- before_values and after_values stored as JSONB
- Immutable (append-only) - no updates or deletes
- Queryable by entity, actor, or date

## Acceptance Criteria Coverage

| ID | Criterion | Status | Location |
|----|-----------|--------|----------|
| AC-01 | Prevent overlaps | ✅ Implemented | DB triggers, booking engine |
| AC-02 | Concurrent conflicts | ✅ Implemented | DB constraints |
| AC-03 | Telegram schedule query | ⏳ TODO | telegram/handlers/read-queries.ts |
| AC-04 | Telegram account linking | ⏳ TODO | telegram/middleware/auth.ts |
| AC-05 | Preview + confirmation | ⏳ TODO | telegram/handlers/write-actions.ts |
| AC-06 | Stale confirmation rejection | ⏳ TODO | telegram_action_proposals.expires_at |
| AC-07 | Block-time affecting bookings | ⏳ TODO | booking engine |
| AC-08 | Telegram actions in audit log | ✅ Schema ready | audit_events table |
| AC-09 | Duplicate update prevention | ⏳ TODO | telegram_conversations.update_id |
| AC-10 | Dashboard works without Telegram | ✅ Architecture | Independent systems |
| AC-11 | Sensitive data out of Telegram | ⏳ TODO | Data minimisation in handlers |
| AC-12 | Demo scenarios | ⏳ TODO | Test scripts |

## Known Issues / Notes

1. **TypeScript Errors in node_modules**: Next.js 16 has some type definition issues with webpack types. These don't affect runtime and will be resolved in future Next.js updates. Safe to ignore.

2. **Middleware Auth**: Currently a stub - will be fully implemented once Supabase project is created and tested.

3. **Timezone**: All times should use Africa/Johannes timezone. The database uses TIMESTAMPTZ which stores UTC - conversion happens at the application layer.

4. **POPIA Compliance**: The schema includes communication_consent and communication_preference fields. Ensure these are respected in all messaging code.

## Contact / Resources

- PRD: `~/Downloads/Bike_Savvy_Dashboard_Telegram_PRD_v1.pdf`
- Supabase Docs: https://supabase.com/docs
- Telegram Bot API: https://core.telegram.org/bots/api
- Next.js Docs: https://nextjs.org/docs
