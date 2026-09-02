# Bike Savvy Dashboard - Project Progress

**Last Updated:** 2 September 2026, 18:50 SAST  
**Current Phase:** Phase 1 - UX & Data Design / Phase 2 - Dashboard Demo (early)  
**Overall Status:** ~15% complete

---

## ✅ Completed Tasks

### 1. Project Setup (Phase 0-1)
- [x] Created project directory: `~/Documents/PROJECTS/bike-savvy`
- [x] Initialized npm package with Next.js 16, React 19, TypeScript, Tailwind CSS 4
- [x] Created project structure:
  - `app/` - Next.js App Router pages
  - `components/` - React components (empty)
  - `lib/` - Utility libraries
  - `lib/booking/` - Booking engine logic
  - `supabase/migrations/` - Database migrations
- [x] Created configuration files:
  - `tsconfig.json` - TypeScript configuration
  - `next.config.js` - Next.js configuration
  - `.env.local.example` - Environment variables template
  - `package.json` - Dependencies and scripts

### 2. Database Schema (Phase 1)
- [x] Created comprehensive PostgreSQL schema: `supabase/migrations/001_initial_schema.sql`
  - **Enums:** `booking_status`, `user_role`, `licence_stage`, `payment_status`
  - **Tables:**
    - `dashboard_users` - User accounts with roles and MFA
    - `telegram_accounts` - Telegram account linking
    - `courses` - Training courses with durations, prices, buffers
    - `instructors` - Instructor availability and qualifications
    - `resources` - Motorcycles and training areas
    - `customers` - Customer profiles and licence journey
    - `bookings` - Booking records with full lifecycle
    - `booking_resources` - Resource allocations (many-to-many)
    - `availability_blocks` - Time blocks for leave/maintenance
    - `payments` - Payment records
    - `licence_milestones` - Licence test tracking
    - `message_templates` - Communication templates
    - `sent_messages` - Message delivery log
    - `audit_events` - Append-only change log
    - `telegram_conversations` - Bot conversation log
    - `telegram_action_proposals` - Preview/confirmation flow
  - **Triggers & Constraints:**
    - `check_instructor_availability()` - Prevents instructor double-booking
    - `check_customer_availability()` - Prevents customer double-booking
    - `check_resource_availability()` - Prevents resource double-booking
    - Auto-updating `updated_at` timestamps
  - **Seed Data:** Demo courses included

### 3. Type Definitions (Phase 1)
- [x] Created TypeScript database types: `lib/booking/types.ts`
  - Full `Database` type exported from Supabase schema
  - All table Row/Insert/Update types defined
  - Enum types for status fields

### 4. Booking Engine (Phase 2)
- [x] Created core availability checking logic: `lib/booking/engine.ts`
  - `checkAvailability()` - Main collision detection function
  - `checkInstructorAvailability()` - Instructor conflict detection
  - `checkCustomerAvailability()` - Customer conflict detection
  - `checkResourcesAvailability()` - Resource conflict detection
  - `checkBusinessHours()` - Working hours validation
  - `checkBuffers()` - Setup/travel buffer validation
  - `calculatePrice()` - Price breakdown calculation
  - `validateBookingProposal()` - Complete validation workflow
  - Types: `AvailabilityCheck`, `Conflict`, `Alternative`, `BookingProposal`, `ValidationResult`

### 5. Frontend Pages (Phase 2)
- [x] Created base layout: `app/layout.tsx`
  - Geist font integration
  - Metadata configuration
- [x] Created Today dashboard: `app/page.tsx`
  - KPI cards (Bookings Today, Instructors Working, Expected Revenue, Pending Payments)
  - Today's schedule section
  - Setup checklist UI
- [x] Created global styles: `app/globals.css`

### 6. Documentation (Phase 0)
- [x] Created comprehensive README.md with:
  - Project overview and features
  - Tech stack
  - Getting started guide
  - Project structure
  - Database schema overview
  - Security requirements
  - Acceptance criteria checklist
  - Roadmap timeline

---

## 🚧 In Progress

### None currently - awaiting Supabase setup

---

## ⏳ Pending Tasks

### Phase 2 - Dashboard Demo (Weeks 3-4)
- [ ] Install Supabase client: `npm install @supabase/supabase-js @supabase/ssr`
- [ ] Create Supabase client utilities: `lib/supabase/client.ts`
- [ ] Set up Supabase project and run migrations
- [ ] Configure environment variables in `.env.local`
- [ ] **Dashboard - Calendar View** (`app/dashboard/calendar/page.tsx`)
  - Day/week/month views
  - Instructor lanes in week view
  - Drag-and-drop rescheduling
  - Before/after preview on move
  - Conflict highlighting (text/icon, not colour alone)
- [ ] **Dashboard - Bookings Workspace** (`app/dashboard/bookings/page.tsx`)
  - Booking list with search/filter
  - Create booking form
  - Edit/reschedule/cancel actions
  - Side panel for booking details
  - Complete timeline/audit history
- [ ] **Dashboard - Customers** (`app/dashboard/customers/page.tsx`)
  - Customer list and search
  - Customer profile page
  - Training history
  - Licence journey tracker
- [ ] **Dashboard - Instructors** (`app/dashboard/instructors/page.tsx`)
  - Instructor list
  - Qualifications management
  - Working hours configuration
  - Availability calendar
- [ ] **Dashboard - Resources** (`app/dashboard/resources/page.tsx`)
  - Motorcycle/resource list
  - Maintenance scheduling
  - Permitted courses configuration
- [ ] **Dashboard - Reports** (`app/dashboard/reports/page.tsx`)
  - Daily operations report
  - Booking performance metrics
  - Revenue tracking
  - Instructor utilisation
- [ ] **Dashboard - Audit Log** (`app/dashboard/audit/page.tsx`)
  - Filterable audit event list
  - Before/after value display

### Phase 3 - Telegram Demo (Week 5)
- [ ] Create Telegram bot via @BotFather
- [ ] Set up webhook endpoint: `app/api/telegram/webhook/route.ts`
- [ ] Implement account linking flow
- [ ] Build conversation service
- [ ] Implement read queries: `/today`, `/tomorrow`, `/availability`, `/customers`
- [ ] Implement write actions: `/book`, `/block`, `/reschedule` with preview
- [ ] Add inline confirmation buttons
- [ ] Implement conflict resolution workflow

### Phase 4 - Production Core (Weeks 6-7)
- [ ] Set up Supabase Auth with MFA
- [ ] Implement role-based permissions (RLS policies)
- [ ] Add transactional booking creation
- [ ] Implement atomic availability updates
- [ ] Add admin configuration UI
- [ ] Set up audit logging for all mutations

### Phase 5 - Secure Telegram Actions (Weeks 8-9)
- [ ] Implement signed action tokens
- [ ] Add idempotency/replay protection
- [ ] Webhook secret validation
- [ ] Account revocation flow
- [ ] Production booking create/reschedule/block

### Phase 6 - QA & UAT (Week 10)
- [ ] Concurrency tests (simultaneous conflicting bookings)
- [ ] Security penetration testing
- [ ] AI evaluation for ambiguous queries
- [ ] Mobile responsiveness testing
- [ ] Accessibility audit (WCAG 2.2 AA)
- [ ] Staff UAT sessions

### Phase 7 - Pilot Launch (Week 11)
- [ ] Deploy to production (Vercel + Supabase)
- [ ] Set up monitoring and alerting
- [ ] Document manual fallback procedures
- [ ] Train owner + 2 staff members
- [ ] Daily review and bug fixes

---

## 🔑 Key Decisions Made

1. **Tech Stack:** Next.js 16 + Supabase (PostgreSQL + Auth) + Telegram Bot API
2. **Database:** PostgreSQL with row-level security, triggers for collision prevention
3. **Booking Validation:** Deterministic rules engine (not AI) for availability checking
4. **Telegram Flow:** Preview → Confirm → Commit pattern for all write actions
5. **Audit:** Append-only log with before/after values for all changes
6. **Timezone:** Africa/Johannesburg for all user-facing times

---

## 📋 Next Steps (Immediate)

1. **Set up Supabase project:**
   - Go to [supabase.com](https://supabase.com)
   - Create new project
   - Copy project URL and keys to `.env.local`
   - Run `supabase/migrations/001_initial_schema.sql` in SQL editor

2. **Install Supabase client:**
   ```bash
   npm install @supabase/supabase-js @supabase/ssr
   ```

3. **Create Supabase client utility:**
   - `lib/supabase/client.ts` - Browser client
   - `lib/supabase/server.ts` - Server client
   - `lib/supabase/middleware.ts` - Auth middleware

4. **Build Calendar page** (highest priority dashboard feature)

---

## 📁 File Reference

| File | Purpose | Status |
|------|---------|--------|
| `package.json` | Dependencies | ✅ Complete |
| `tsconfig.json` | TypeScript config | ✅ Complete |
| `next.config.js` | Next.js config | ✅ Complete |
| `app/layout.tsx` | Root layout | ✅ Complete |
| `app/page.tsx` | Today dashboard (stub) | ✅ Complete |
| `app/globals.css` | Global styles | ✅ Complete |
| `supabase/migrations/001_initial_schema.sql` | Database schema | ✅ Complete |
| `lib/booking/types.ts` | TypeScript types | ✅ Complete |
| `lib/booking/engine.ts` | Booking validation logic | ✅ Complete |
| `README.md` | Project documentation | ✅ Complete |
| `.env.local.example` | Environment template | ✅ Complete |
| `lib/supabase/*` | Supabase client | ⏳ Pending |
| `app/dashboard/*` | Dashboard pages | ⏳ Pending |
| `components/*` | React components | ⏳ Pending |
| `app/api/telegram/*` | Telegram bot | ⏳ Pending |

---

## 🚨 Known Issues / Blockers

1. **No Supabase project yet** - Need to create project and run migrations before any data operations will work
2. **No Telegram bot token** - Need to create bot via @BotFather before Telegram integration
3. **Booking engine imports types** - Fixed by creating `lib/booking/types.ts`

---

## 📞 Contact / Handoff Notes

- **Project Location:** `~/Documents/PROJECTS/bike-savvy`
- **PRD Location:** `~/Downloads/Bike_Savvy_Dashboard_Telegram_PRD_v1.pdf` (14 pages, extracted to text)
- **User Preference:** Execution over description - build actual artifacts, not just plans
- **Testing:** User (Rob) tests in Comet browser, expects immediate corrections applied
- **Deployment Target:** Vercel for frontend, Supabase Edge Functions for Telegram bot

---

## 📊 Progress Metrics

| Category | Complete | In Progress | Pending | Total |
|----------|----------|-------------|---------|-------|
| Setup | 6 | 0 | 0 | 6 |
| Database | 1 | 0 | 0 | 1 |
| Types | 1 | 0 | 0 | 1 |
| Booking Engine | 1 | 0 | 0 | 1 |
| Frontend Pages | 3 | 0 | 7 | 10 |
| Components | 0 | 0 | ~20 | ~20 |
| Telegram Bot | 0 | 0 | 8 | 8 |
| **Total** | **12** | **0** | **~35** | **~47** |

**~25% of core infrastructure complete, ~15% of total project complete**

---

*This file should be updated after each work session. Keep it current for easy handoff.*
