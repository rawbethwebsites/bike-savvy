# Bike Savvy Dashboard Design System

## Purpose

The dashboard is an operations command centre. It should answer four questions immediately:

1. What needs attention now?
2. What is happening today?
3. What money is outstanding?
4. What action should staff take next?

The homepage must not be a passive analytics screen. Every actionable item links to the workspace where the action can be completed.

## Visual direction

**Style:** precision operations UI — Linear-like information hierarchy combined with Bike Savvy’s angular motorcycle brand language.

**Principles:**

- Dark-mode native, compact, operational, and calm.
- Cards must be visibly lighter than the page background.
- Sharp or lightly rounded geometry; no inflated pill-heavy SaaS styling.
- Lime is reserved for the primary action, active navigation, and healthy states.
- Status never relies on color alone; always pair color with text or an icon.
- No emoji as interface icons. Use one consistent SVG stroke family.
- No decorative charts on the homepage. Prioritize queues, schedules, money, and availability.

## Tokens

### Color

| Token | Value | Role |
|---|---:|---|
| `--dashboard-bg` | `#0b0d0c` | Main application canvas |
| `--dashboard-sidebar` | `#111311` | Navigation surface |
| `--dashboard-surface` | `#191c19` | Cards and panels; deliberately lighter than background |
| `--dashboard-surface-raised` | `#222622` | Hover, selected, and elevated rows |
| `--dashboard-border` | `rgba(255,255,255,.10)` | Standard divider and card border |
| `--dashboard-text` | `#f4f6f2` | Primary text |
| `--dashboard-muted` | `#9ba39b` | Secondary labels and metadata |
| `--dashboard-accent` | `#c9ff32` | Bike Savvy primary action and active state |
| `--dashboard-accent-ink` | `#0b0d0c` | Text/icons on lime |
| `--dashboard-success` | `#75d69c` | Confirmed, paid, available |
| `--dashboard-warning` | `#f4c95d` | Pending, awaiting action |
| `--dashboard-danger` | `#ff7b72` | Failed, overdue, urgent |
| `--dashboard-info` | `#8ab4f8` | Informational states |

### Typography

- Family: existing Geist Sans stack.
- Page title: 28px / 600 / `-0.03em`.
- Section title: 16px / 600.
- KPI value: 30px / 600 / tabular numerals.
- Body: 14px / 1.5.
- Metadata: 12px / 500.
- Eyebrow: 11px / 700 / uppercase / `0.12em` tracking.
- Use tabular numerals for time, counts, and money.

### Spacing

Use an 8px rhythm: `4, 8, 12, 16, 24, 32, 40`.

- Desktop page gutter: 32px.
- Tablet gutter: 24px.
- Mobile gutter: 16px.
- Card padding: 20–24px desktop, 16px mobile.
- Main grid gap: 16px.

### Shape and depth

- Card radius: 10px.
- Control radius: 8px.
- Pills only for statuses: 999px.
- Standard border: 1px solid `--dashboard-border`.
- Avoid broad drop shadows; create hierarchy through visibly different surface luminance.

## Homepage information architecture

### 1. Command header

- Current date and operational greeting.
- System-health indicator.
- One primary action: **New booking**.
- Secondary search/command access can be added later.

### 2. Operational KPI strip

Each KPI is a deep link, not a dead card:

| KPI | Destination | Function |
|---|---|---|
| Bookings today | Calendar filtered to today | See today’s workload |
| New requests | Booking request inbox | Triage unconfirmed requests |
| Awaiting payment | Payment queue | Chase or record payment |
| Expected today | Reports / payments | Understand today’s cash position |

### 3. Attention queue — highest priority

Ranked, actionable items with:

- Severity and plain-language reason.
- Customer/booking context.
- Age or deadline.
- Primary action and overflow menu.
- Empty state: “All caught up” with the next upcoming lesson.

Priority order: operational conflict → customer waiting → overdue payment → incomplete details → informational reminder.

### 4. Today timeline

Chronological lesson list showing:

- Start/end time.
- Customer and course.
- Instructor and assigned bike/resource.
- Payment and booking status.
- Contextual next action: confirm, check in, complete, reschedule, or open.

### 5. Booking request inbox preview

Display the three newest requests with response age and course/date request. Link to the complete inbox. This replaces generic “issue cards” with a revenue-focused queue.

### 6. Team and resource status

Show instructors and motorcycles/resources separately:

- Available, teaching, blocked, or unavailable.
- Next assignment.
- Conflict indicator with explanatory text.

### 7. Quick create

Only show actions that work. The approved set is:

- New booking.
- Add customer.
- Block time.
- Record payment.

Until their workflows exist, the production homepage must link to an existing workspace or omit them. Never render inert buttons.

## Interaction rules

- All interactive rows and buttons: minimum 44px target.
- Visible `:focus-visible` ring using lime with a dark offset.
- Hover raises surface from `#191c19` to `#222622`; no layout movement.
- Loading over 300ms uses stable skeleton blocks.
- Errors include a retry action and preserve the surrounding layout.
- Destructive actions require confirmation and are never homepage-primary actions.
- Dates/times explicitly use `Africa/Johannesburg` and `en-ZA`.

## Responsive behavior

### Desktop ≥ 1024px

- Persistent 256px sidebar.
- KPI strip: four columns.
- Main grid: attention queue 7/12, timeline 5/12.
- Supporting grid: requests 6/12, team/resources 6/12.

### Tablet 768–1023px

- Collapsible sidebar.
- KPI strip: two columns.
- Main and supporting panels stack.

### Mobile < 768px

- Top navigation with slide-out menu.
- Single-column KPIs and panels.
- Header actions remain reachable without horizontal scrolling.
- Timeline metadata wraps; primary action remains visible.
- No table requiring horizontal scrolling on the homepage.

## Accessibility acceptance criteria

- WCAG AA contrast for text and interactive states.
- Semantic headings in order.
- Navigation and current-page state announced.
- Status includes readable labels, not color alone.
- Icon-only controls have accessible names.
- Keyboard can reach every action in visual order.
- Reduced-motion preference disables nonessential transitions.
- Empty, loading, error, and populated states are all designed.

## Scope boundary

This document and the companion wireframe define Task 2. Functional API changes, mutations, authentication, and the full production homepage implementation belong to later approved tasks.
