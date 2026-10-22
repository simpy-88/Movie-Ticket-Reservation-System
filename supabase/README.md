# Supabase PostgreSQL Integration Guide for MTRS

## Overview

This directory (`supabase/`) provides the configuration, schema migration, and seed dataset to connect the **Movie Ticket Reservation System (MTRS)** with a **Supabase PostgreSQL** cloud or local database instance.

> **Status:** Preparation Phase.
> The existing application is currently running against its client-side relational engine (`js/db-engine.js`). **The application has not yet been switched over to Supabase.**

---

## Directory Structure

```
supabase/
├── config.toml                              # Supabase CLI project configuration
├── seed.sql                                 # Chennai cinema seed data (destinations, screens, shows, BK01-BK08)
├── README.md                                # Setup, migration, and connection guide
└── migrations/
    └── 20261022000001_initial_schema.sql    # 3NF/BCNF relational tables, sequences, triggers, RPC, & RLS
```

---

## What the Schema Solves

1. **Resolution of the `BK07` Duplicate-ID Issue:**
   - In the legacy client engine, booking IDs were generated via `bookings.length + 1`. If bookings were cancelled, the counter decremented/regressed, causing collisions with existing records (specifically `BK07` held by customer `CU05`).
   - The PostgreSQL migration implements a persistent sequence `booking_id_seq START WITH 9` paired with the monotonic function `generate_booking_id()`. Even if bookings are cancelled or deleted, sequence counters never regress.

2. **Concurrency & Double-Booking Prevention:**
   - Employs an ACID transaction procedure `sp_book_ticket_transaction(...)` with row-level locks (`SELECT ... FOR UPDATE` on `shows`) and the `trg_prevent_double_booking` trigger on `booked_seats`.
   - Prevents two concurrent users from reserving the same seat for the same showtime.

3. **Domain & Technical Specification Integrity:**
   - Enforces format checks: `'2D'`, `'3D'`, `'IMAX 2D'`, `'IMAX 3D'`, `'P[XL] 2D'`, `'P[XL] 3D'`, `'BIGPIX 2D'`, `'BIGPIX 3D'`.
   - Ensures `trg_validate_seat_screen` verifies the booked seat belongs to the screen mapped to that show.

---

## Required Configuration Before Connecting

Before switching frontend code to Supabase, the following variables and prerequisites are needed:

### 1. Environment / Credentials Needed
- **Supabase Project URL:** e.g., `https://<project-ref>.supabase.co`
- **Supabase Anon / Public Key:** Publicly safe API key with Row Level Security (RLS) enforcement.
- **NEVER expose in frontend:**
  - Database password / connection string (`postgres://postgres:...`)
  - `service_role` key (bypasses RLS).

### 2. Local CLI Testing (Optional)
If using Supabase CLI locally with Docker:
```bash
# 1. Start local Supabase stack (uses supabase/config.toml)
supabase start

# 2. Reset and apply migrations + seed data
supabase db reset

# 3. Check status
supabase status
```

### 3. Remote Project Migration
To push the migration to an actual remote Supabase project:
```bash
# 1. Link project
supabase link --project-ref <your-project-ref>

# 2. Push migration
supabase db push
```

---

## Client-Side Integration Roadmap (Next Stage)

When ready to switch the frontend from `localStorage` to Supabase:
1. Include `@supabase/supabase-js` via CDN in `index.html`.
2. Initialize `supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)`.
3. Wrap `confirmBookingAndPay` to call `supabase.rpc('sp_book_ticket_transaction', { ... })`.
4. Maintain `MTRSRelationalEngine` as an offline fallback if network connectivity drops.
