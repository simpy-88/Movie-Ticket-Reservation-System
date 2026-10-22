# Supabase PostgreSQL Integration Guide for MTRS

## Overview

This directory (`supabase/`) provides the configuration, schema migration, and seed dataset to connect the **Movie Ticket Reservation System (MTRS)** with a **Supabase PostgreSQL** cloud or local database instance.

> **Status:** Preparation & Validation Phase.
> The existing application is currently running against its client-side relational engine (`js/db-engine.js`). **The application has not yet been switched over to Supabase.**

---

## Directory Structure

```
supabase/
├── config.toml                              # Supabase CLI project configuration
├── seed.sql                                 # Chennai cinema seed data (destinations, screens, shows, BK01-BK08)
├── README.md                                # Setup, migration, and connection guide
└── migrations/
    └── 20261022000001_initial_schema.sql    # BCNF tables, sequences, triggers, RPC, & strict RLS
```

---

## Key Relational Problems Solved

1. **Resolution of the `BK07` Duplicate-ID Issue:**
   - In the legacy client engine, booking IDs were generated via `bookings.length + 1`. If bookings were cancelled, the counter decremented/regressed, causing collisions with existing records (specifically `BK07` held by customer `CU05`).
   - The PostgreSQL migration implements a persistent sequence `booking_id_seq START WITH 9` paired with the monotonic function `generate_booking_id()`. Even if bookings are cancelled or deleted, sequence counters never regress.

2. **Index-Level Double-Booking Prevention & Rebooking Safety:**
   - `booked_seats` includes `show_id` and `status` (`CONFIRMED` or `CANCELLED`).
   - A PostgreSQL partial unique index enforces uniqueness at the hardware level:
     ```sql
     CREATE UNIQUE INDEX uq_active_show_seat ON booked_seats (show_id, seat_id) WHERE status = 'CONFIRMED';
     ```
   - If a booking is cancelled, its seats become immediately available for legitimate rebooking without violating constraints.
   - The stored procedure `sp_book_ticket_transaction` obtains row locks (`SELECT ... FOR UPDATE` on `shows`), completely eliminating race conditions.

3. **Cinema Scheduling Rules Enforced at Database Level:**
   - Start window: First show on any date cannot start before 09:00 AM.
   - Cleaning turnover: Mandatory 15-minute turnover interval between consecutive shows on the same screen.
   - Curfew: No movie may end past 02:00 AM the following day.
   - Enforced automatically by trigger `trg_validate_show_schedule` on `shows` and available as an automated procedure `sp_auto_generate_screen_schedule`.

4. **Non-Duplicating E-Ticket Details View:**
   - `ticket_details_view` pre-aggregates all reserved seats into `STRING_AGG(seat_number, ', ')` grouped by booking ID, providing instant, non-duplicating ticket rendering data for the UI.

5. **Row Level Security (RLS) & Secure Functions:**
   - Public users can read movie catalogs, screens, theaters, shows, and seat availability.
   - Customers are strictly isolated: they can only view and modify their own bookings and payments.
   - All `SECURITY DEFINER` functions explicitly set `search_path = public, extensions, pg_temp;` to prevent privilege escalation.

---

## Required Configuration Before Connecting

Before switching frontend code to Supabase, the following variables and prerequisites are needed:

### 1. Environment / Credentials Needed
- **Supabase Project URL:** e.g., `https://<project-ref>.supabase.co`
- **Supabase Anon / Public Key:** Publicly safe API key with Row Level Security (RLS) enforcement.
- **NEVER expose in frontend:**
  - Database password / connection string (`postgres://postgres:...`)
  - `service_role` key (bypasses RLS).

### 2. Remote Project Deployment Instructions (Once Approved)
1. In the Supabase Dashboard, link your GitHub repository or use Supabase CLI:
   ```bash
   # Link project
   supabase link --project-ref <your-project-ref>

   # Push migration
   supabase db push
   ```
2. Or in the Supabase Dashboard SQL Editor, review and run [`supabase/migrations/20261022000001_initial_schema.sql`](migrations/20261022000001_initial_schema.sql) followed by [`supabase/seed.sql`](seed.sql).

---

## Client-Side Integration Roadmap (Next Stage)

When ready to switch the frontend from `localStorage` to Supabase:
1. Include `@supabase/supabase-js` via CDN in `index.html`.
2. Initialize `supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)`.
3. Wrap `confirmBookingAndPay` to call `supabase.rpc('sp_book_ticket_transaction', { ... })`.
4. Convert synchronous data retrieval calls in `js/app.js` and `js/admin.js` to async calls.
