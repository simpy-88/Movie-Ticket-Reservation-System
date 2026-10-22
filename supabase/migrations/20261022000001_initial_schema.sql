-- ==============================================================================
-- MOVIE TICKET RESERVATION SYSTEM (MTRS)
-- Migration: 20261022000001_initial_schema.sql
-- Description: PostgreSQL / Supabase Relational Schema (BCNF)
--              Preserves full compatibility with Chennai cinema destinations,
--              PLF formats ('IMAX', 'P[XL]', 'BIGPIX'), high-res poster telemetry,
--              hardware-level double-booking prevention, monotonic ID generation,
--              cinema scheduling rules (9 AM open, 15-min clean, 2 AM curfew),
--              secure verified account-linking, and least-privilege PostgREST grants.
-- ==============================================================================

-- Enable UUID and Cryptographic extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 1. THEATERS TABLE
-- Represents physical cinema destinations across Chennai.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS theaters (
    theater_id VARCHAR(10) PRIMARY KEY,
    theater_name VARCHAR(100) NOT NULL,
    city VARCHAR(50) NOT NULL,
    state VARCHAR(50) NOT NULL,
    country VARCHAR(50) NOT NULL DEFAULT 'India',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 2. SCREENS TABLE
-- Physical auditoriums inside a theater, including technical specifications.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS screens (
    screen_id VARCHAR(10) PRIMARY KEY,
    theater_id VARCHAR(10) NOT NULL REFERENCES theaters(theater_id) ON DELETE CASCADE ON UPDATE CASCADE,
    screen_number INT NOT NULL,
    screen_name VARCHAR(50) NOT NULL DEFAULT '',
    screen_type VARCHAR(30) NOT NULL DEFAULT 'Standard',
    capacity INT NOT NULL CHECK (capacity > 0),
    projection_tech VARCHAR(50) NOT NULL DEFAULT '2K Digital',
    audio_tech VARCHAR(50) NOT NULL DEFAULT 'Dolby 7.1',
    verification_status VARCHAR(50) NOT NULL DEFAULT 'Published - Unverified',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_theater_screen UNIQUE (theater_id, screen_number)
);

-- ------------------------------------------------------------------------------
-- 3. MOVIES TABLE
-- Catalog of movies including poster and backdrop asset telemetry.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS movies (
    movie_id VARCHAR(10) PRIMARY KEY,
    movie_name VARCHAR(100) NOT NULL,
    genre VARCHAR(50) NOT NULL,
    rating DECIMAL(3,1) NOT NULL DEFAULT 0.0 CHECK (rating >= 0.0 AND rating <= 10.0),
    duration INT NOT NULL CHECK (duration > 0), -- Duration in minutes
    language VARCHAR(30) NOT NULL,
    synopsis TEXT,
    cast_members TEXT,
    poster_url TEXT,
    poster_hires_url TEXT,
    backdrop_url TEXT,
    tmdb_id INT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 4. SHOWS TABLE
-- Scheduled screening of a movie in a specific auditorium.
-- Supports standard and PLF formats with strict check constraints.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS shows (
    show_id VARCHAR(10) PRIMARY KEY,
    movie_id VARCHAR(10) NOT NULL REFERENCES movies(movie_id) ON DELETE CASCADE ON UPDATE CASCADE,
    screen_id VARCHAR(10) NOT NULL REFERENCES screens(screen_id) ON DELETE CASCADE ON UPDATE CASCADE,
    show_date DATE NOT NULL,
    show_time TIME NOT NULL,
    format VARCHAR(20) NOT NULL DEFAULT '2D' CHECK (
        format IN ('2D', '3D', 'IMAX 2D', 'IMAX 3D', 'P[XL] 2D', 'P[XL] 3D', 'BIGPIX 2D', 'BIGPIX 3D')
    ),
    ticket_price DECIMAL(8,2) NOT NULL CHECK (ticket_price > 0.0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 5. SEATS TABLE
-- Individual seats belonging to a specific screen auditorium.
-- Accommodates up to 20-character generated IDs (e.g. S_SC42_AA28).
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS seats (
    seat_id VARCHAR(20) PRIMARY KEY,
    screen_id VARCHAR(10) NOT NULL REFERENCES screens(screen_id) ON DELETE CASCADE ON UPDATE CASCADE,
    seat_number VARCHAR(10) NOT NULL,
    seat_type VARCHAR(20) NOT NULL DEFAULT 'Regular' CHECK (
        seat_type IN ('VIP', 'Balcony', 'Premium', 'Regular')
    ),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_screen_seat UNIQUE (screen_id, seat_number)
);

-- ------------------------------------------------------------------------------
-- 6. CUSTOMERS TABLE
-- Customer account profiles with foreign reference to Supabase auth.users.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS customers (
    customer_id VARCHAR(10) PRIMARY KEY,
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    customer_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(15),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 7. BOOKINGS TABLE
-- Header records for confirmed ticket reservation transactions.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bookings (
    booking_id VARCHAR(10) PRIMARY KEY,
    customer_id VARCHAR(10) NOT NULL REFERENCES customers(customer_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    show_id VARCHAR(10) NOT NULL REFERENCES shows(show_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    booking_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ticket_price DECIMAL(8,2) NOT NULL CHECK (ticket_price >= 0.0),
    format VARCHAR(20) NOT NULL CHECK (
        format IN ('2D', '3D', 'IMAX 2D', 'IMAX 3D', 'P[XL] 2D', 'P[XL] 3D', 'BIGPIX 2D', 'BIGPIX 3D')
    ),
    status VARCHAR(20) NOT NULL DEFAULT 'CONFIRMED' CHECK (
        status IN ('CONFIRMED', 'CANCELLED', 'REFUNDED')
    ),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 8. BOOKED_SEATS TABLE
-- Bridge table representing reserved seats for a booking.
-- Includes direct show_id reference and status for index-level double-booking prevention.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS booked_seats (
    booking_id VARCHAR(10) NOT NULL REFERENCES bookings(booking_id) ON DELETE CASCADE ON UPDATE CASCADE,
    seat_id VARCHAR(20) NOT NULL REFERENCES seats(seat_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    show_id VARCHAR(10) NOT NULL REFERENCES shows(show_id) ON DELETE CASCADE ON UPDATE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'CONFIRMED' CHECK (
        status IN ('CONFIRMED', 'CANCELLED')
    ),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (booking_id, seat_id)
);

-- ------------------------------------------------------------------------------
-- 9. PAYMENTS TABLE
-- 1-to-1 payment transaction records linked to bookings.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payments (
    payment_id VARCHAR(10) PRIMARY KEY,
    booking_id VARCHAR(10) NOT NULL REFERENCES bookings(booking_id) ON DELETE CASCADE ON UPDATE CASCADE,
    payment_mode VARCHAR(30) NOT NULL CHECK (
        payment_mode IN ('Credit Card', 'Debit Card', 'UPI', 'Net Banking', 'Cash')
    ),
    amount DECIMAL(8,2) NOT NULL CHECK (amount > 0.0),
    payment_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status VARCHAR(20) NOT NULL DEFAULT 'SUCCESS' CHECK (
        status IN ('SUCCESS', 'REFUNDED', 'FAILED')
    ),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_payment_booking UNIQUE (booking_id)
);

-- ------------------------------------------------------------------------------
-- 10. INDEXES & HARDWARE-LEVEL CONCURRENCY GUARDS
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_shows_movie_date ON shows(movie_id, show_date);
CREATE INDEX IF NOT EXISTS idx_shows_screen ON shows(screen_id);
CREATE INDEX IF NOT EXISTS idx_seat_screen ON seats(screen_id);
CREATE INDEX IF NOT EXISTS idx_booking_customer ON bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_booking_show ON bookings(show_id);
CREATE INDEX IF NOT EXISTS idx_booked_seat_seat ON booked_seats(seat_id);
CREATE INDEX IF NOT EXISTS idx_booked_seat_show ON booked_seats(show_id);
CREATE INDEX IF NOT EXISTS idx_payment_date ON payments(payment_date);

-- Partial Unique Index: Guarantees that a seat cannot be booked twice for the same show
-- while status is 'CONFIRMED'. Allows instant rebooking if a previous booking is cancelled!
CREATE UNIQUE INDEX IF NOT EXISTS uq_active_show_seat 
ON booked_seats (show_id, seat_id) 
WHERE status = 'CONFIRMED';

-- ------------------------------------------------------------------------------
-- 11. MONOTONIC SEQUENCES & ID GENERATORS
-- Prevents duplicate BK07 / PAY07 collisions by using server-enforced sequences.
-- ------------------------------------------------------------------------------
CREATE SEQUENCE IF NOT EXISTS booking_id_seq START WITH 9;
CREATE SEQUENCE IF NOT EXISTS payment_id_seq START WITH 9;
CREATE SEQUENCE IF NOT EXISTS customer_id_seq START WITH 6;
CREATE SEQUENCE IF NOT EXISTS show_id_seq START WITH 19;

CREATE OR REPLACE FUNCTION generate_booking_id() 
RETURNS VARCHAR(10) AS $$
DECLARE
    next_val INT;
    candidate VARCHAR(10);
BEGIN
    LOOP
        next_val := nextval('booking_id_seq');
        candidate := 'BK' || LPAD(next_val::TEXT, 2, '0');
        IF NOT EXISTS (SELECT 1 FROM bookings WHERE booking_id = candidate) THEN
            RETURN candidate;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp;

CREATE OR REPLACE FUNCTION generate_payment_id() 
RETURNS VARCHAR(10) AS $$
DECLARE
    next_val INT;
    candidate VARCHAR(10);
BEGIN
    LOOP
        next_val := nextval('payment_id_seq');
        candidate := 'PAY' || LPAD(next_val::TEXT, 2, '0');
        IF NOT EXISTS (SELECT 1 FROM payments WHERE payment_id = candidate) THEN
            RETURN candidate;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp;

CREATE OR REPLACE FUNCTION generate_customer_id() 
RETURNS VARCHAR(10) AS $$
DECLARE
    next_val INT;
    candidate VARCHAR(10);
BEGIN
    LOOP
        next_val := nextval('customer_id_seq');
        candidate := 'CU' || LPAD(next_val::TEXT, 2, '0');
        IF NOT EXISTS (SELECT 1 FROM customers WHERE customer_id = candidate) THEN
            RETURN candidate;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp;

CREATE OR REPLACE FUNCTION generate_show_id() 
RETURNS VARCHAR(10) AS $$
DECLARE
    next_val INT;
    candidate VARCHAR(10);
BEGIN
    LOOP
        next_val := nextval('show_id_seq');
        candidate := 'SH' || LPAD(next_val::TEXT, 2, '0');
        IF NOT EXISTS (SELECT 1 FROM shows WHERE show_id = candidate) THEN
            RETURN candidate;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp;

-- ------------------------------------------------------------------------------
-- 12. TRIGGERS: DOUBLE-BOOKING & SEAT DOMAIN INTEGRITY
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_trg_prevent_double_booking()
RETURNS TRIGGER AS $$
DECLARE
    v_already_booked INT;
BEGIN
    SELECT COUNT(*) INTO v_already_booked
    FROM booked_seats
    WHERE show_id = NEW.show_id
      AND seat_id = NEW.seat_id
      AND status = 'CONFIRMED'
      AND booking_id <> NEW.booking_id;

    IF v_already_booked > 0 THEN
        RAISE EXCEPTION 'Trigger trg_prevent_double_booking fired: Seat % is already booked for this show.', NEW.seat_id
            USING ERRCODE = '23505';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public, extensions, pg_temp;

DROP TRIGGER IF EXISTS trg_prevent_double_booking ON booked_seats;
CREATE TRIGGER trg_prevent_double_booking
BEFORE INSERT OR UPDATE ON booked_seats
FOR EACH ROW
EXECUTE FUNCTION fn_trg_prevent_double_booking();

CREATE OR REPLACE FUNCTION fn_trg_validate_seat_screen()
RETURNS TRIGGER AS $$
DECLARE
    v_show_screen VARCHAR(10);
    v_seat_screen VARCHAR(10);
BEGIN
    SELECT screen_id INTO v_show_screen
    FROM shows
    WHERE show_id = NEW.show_id;

    SELECT screen_id INTO v_seat_screen
    FROM seats
    WHERE seat_id = NEW.seat_id;

    IF v_show_screen IS NOT NULL AND v_seat_screen IS NOT NULL THEN
        IF v_show_screen <> v_seat_screen THEN
            RAISE EXCEPTION 'Trigger trg_validate_seat_screen fired: The booked seat % does not belong to screen %.',
                NEW.seat_id, v_show_screen
                USING ERRCODE = '23514';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public, extensions, pg_temp;

DROP TRIGGER IF EXISTS trg_validate_seat_screen ON booked_seats;
CREATE TRIGGER trg_validate_seat_screen
BEFORE INSERT OR UPDATE ON booked_seats
FOR EACH ROW
EXECUTE FUNCTION fn_trg_validate_seat_screen();

-- ------------------------------------------------------------------------------
-- 13. CINEMA SCHEDULING TIMING VALIDATION TRIGGER (Fix 1: Midnight Scheduling)
-- Enforces:
-- 1. Operational Day: First show starts at or after 09:00 AM on show_date
-- 2. Post-midnight showtimes (< 06:00 AM) are treated as part of the business
--    day starting on show_date and must end by 02:00 AM the following day.
-- 3. Mandatory 15-minute cleaning interval between consecutive shows on same screen
-- 4. No movie ending after 02:00 AM closing deadline
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_trg_validate_show_schedule()
RETURNS TRIGGER AS $$
DECLARE
    v_duration INT;
    v_new_start TIMESTAMP;
    v_new_end TIMESTAMP;
    v_day_start TIMESTAMP;
    v_day_curfew TIMESTAMP;
    v_conflict RECORD;
    v_conflict_start TIMESTAMP;
    v_conflict_end TIMESTAMP;
BEGIN
    -- Query duration of movie
    SELECT duration INTO v_duration FROM movies WHERE movie_id = NEW.movie_id;
    IF v_duration IS NULL OR v_duration <= 0 THEN
        v_duration := 120;
    END IF;

    -- Compute timeline coordinates without timezone distortion.
    -- Cinema business day starts at 09:00 AM on show_date and ends at 02:00 AM next day.
    -- Showtimes before 06:00 AM belong to the business day that began on show_date.
    IF NEW.show_time < '06:00:00'::TIME THEN
        v_new_start := (NEW.show_date + INTERVAL '1 day')::DATE + NEW.show_time;
    ELSE
        v_new_start := NEW.show_date + NEW.show_time;
    END IF;

    v_new_end := v_new_start + (v_duration || ' minutes')::INTERVAL;
    v_day_start := NEW.show_date + '09:00:00'::TIME;
    v_day_curfew := (NEW.show_date + INTERVAL '1 day')::DATE + '02:00:00'::TIME;

    -- 1. Enforce opening start window (cannot start before 9:00 AM on the show date)
    IF v_new_start < v_day_start THEN
        RAISE EXCEPTION 'Scheduling Conflict: Show % starts at %, before the 09:00 AM cinema opening window.',
            COALESCE(NEW.show_id, 'NEW'), NEW.show_time
            USING ERRCODE = '23514';
    END IF;

    -- 2. Enforce closing curfew (cannot end after 02:00 AM the following day)
    IF v_new_end > v_day_curfew THEN
        RAISE EXCEPTION 'Scheduling Conflict: Show % ends at %, past the 02:00 AM next-day closing curfew.',
            COALESCE(NEW.show_id, 'NEW'), v_new_end::TEXT
            USING ERRCODE = '23514';
    END IF;

    -- 3. Enforce 15-minute turnover cleaning interval against shows on the same screen
    -- Check across contiguous operational days (-1 day to +1 day) to catch midnight crossings
    FOR v_conflict IN
        SELECT s.show_id, s.show_date, s.show_time, m.duration
        FROM shows s
        JOIN movies m ON s.movie_id = m.movie_id
        WHERE s.screen_id = NEW.screen_id
          AND s.show_id <> COALESCE(NEW.show_id, '')
          AND s.show_date BETWEEN (NEW.show_date - INTERVAL '1 day')::DATE AND (NEW.show_date + INTERVAL '1 day')::DATE
    LOOP
        -- Calculate physical coordinates of conflicting screening
        IF v_conflict.show_time < '06:00:00'::TIME THEN
            v_conflict_start := (v_conflict.show_date + INTERVAL '1 day')::DATE + v_conflict.show_time;
        ELSE
            v_conflict_start := v_conflict.show_date + v_conflict.show_time;
        END IF;
        v_conflict_end := v_conflict_start + (COALESCE(v_conflict.duration, 120) || ' minutes')::INTERVAL;

        -- Conflict exists if either show starts within the other's runtime + 15-min cleaning window
        IF (v_new_start < (v_conflict_end + INTERVAL '15 minutes')) AND 
           (v_conflict_start < (v_new_end + INTERVAL '15 minutes')) THEN
            RAISE EXCEPTION 'Scheduling Conflict: Show % overlaps with existing Show % on screen % (requires 15-minute cleaning turnover).',
                COALESCE(NEW.show_id, 'NEW'), v_conflict.show_id, NEW.screen_id
                USING ERRCODE = '23514';
        END IF;
    END LOOP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public, extensions, pg_temp;

DROP TRIGGER IF EXISTS trg_validate_show_schedule ON shows;
CREATE TRIGGER trg_validate_show_schedule
BEFORE INSERT OR UPDATE ON shows
FOR EACH ROW
EXECUTE FUNCTION fn_trg_validate_show_schedule();

-- ------------------------------------------------------------------------------
-- 14. ATOMIC STORED PROCEDURE: sp_book_ticket_transaction
-- Callable via Supabase RPC (supabase.rpc('sp_book_ticket_transaction', ...))
-- Handles atomic row-level locks, rollback, and guaranteed-unique ID assignment.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_book_ticket_transaction(
    p_customer_id VARCHAR(10),
    p_show_id VARCHAR(10),
    p_format VARCHAR(20),
    p_ticket_price DECIMAL(8,2),
    p_payment_mode VARCHAR(30),
    p_amount DECIMAL(8,2),
    p_seat_ids TEXT[],
    p_booking_id VARCHAR(10) DEFAULT NULL,
    p_payment_id VARCHAR(10) DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_booking_id VARCHAR(10);
    v_payment_id VARCHAR(10);
    v_seat_id TEXT;
    v_show RECORD;
    v_user_auth_id UUID;
BEGIN
    -- 1. Authorization & Identity Validation
    v_user_auth_id := auth.uid();
    IF v_user_auth_id IS NOT NULL THEN
        -- If invoked by an authenticated Supabase user, ensure they can only book for their linked profile
        IF NOT EXISTS (
            SELECT 1 FROM customers 
            WHERE customer_id = p_customer_id 
              AND (auth_user_id = v_user_auth_id OR auth_user_id IS NULL)
        ) THEN
            RAISE EXCEPTION 'Authorization Error: You do not have permission to book for customer %.', p_customer_id;
        END IF;
    END IF;

    -- Validate customer existence
    IF NOT EXISTS (SELECT 1 FROM customers WHERE customer_id = p_customer_id) THEN
        RAISE EXCEPTION 'Integrity Error: Customer % does not exist.', p_customer_id;
    END IF;

    -- 2. Validate show existence and lock show row for update (prevents concurrent race conditions)
    SELECT * INTO v_show FROM shows WHERE show_id = p_show_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Integrity Error: Show % does not exist.', p_show_id;
    END IF;

    -- 3. Validate seat selection
    IF p_seat_ids IS NULL OR array_length(p_seat_ids, 1) = 0 THEN
        RAISE EXCEPTION 'Validation Error: At least one seat must be selected for booking.';
    END IF;

    -- 4. Resolve unique Booking_ID and Payment_ID
    IF p_booking_id IS NOT NULL AND TRIM(p_booking_id) <> '' THEN
        IF EXISTS (SELECT 1 FROM bookings WHERE booking_id = p_booking_id) THEN
            RAISE EXCEPTION 'Primary Key Violation: Booking ID % already exists.', p_booking_id;
        END IF;
        v_booking_id := TRIM(p_booking_id);
    ELSE
        v_booking_id := generate_booking_id();
    END IF;

    IF p_payment_id IS NOT NULL AND TRIM(p_payment_id) <> '' THEN
        IF EXISTS (SELECT 1 FROM payments WHERE payment_id = p_payment_id) THEN
            RAISE EXCEPTION 'Primary Key Violation: Payment ID % already exists.', p_payment_id;
        END IF;
        v_payment_id := TRIM(p_payment_id);
    ELSE
        v_payment_id := generate_payment_id();
    END IF;

    -- 5. Insert Booking
    INSERT INTO bookings (booking_id, customer_id, show_id, booking_date, ticket_price, format, status)
    VALUES (v_booking_id, p_customer_id, p_show_id, NOW(), p_ticket_price, p_format, 'CONFIRMED');

    -- 6. Insert Booked Seats (Includes show_id; Triggers & Unique Index guard against double booking)
    FOREACH v_seat_id IN ARRAY p_seat_ids LOOP
        INSERT INTO booked_seats (booking_id, seat_id, show_id, status)
        VALUES (v_booking_id, v_seat_id, p_show_id, 'CONFIRMED');
    END LOOP;

    -- 7. Insert Payment
    INSERT INTO payments (payment_id, booking_id, payment_mode, amount, payment_date, status)
    VALUES (v_payment_id, v_booking_id, p_payment_mode, p_amount, NOW(), 'SUCCESS');

    -- Return JSON composite result
    RETURN jsonb_build_object(
        'success', true,
        'booking_id', v_booking_id,
        'payment_id', v_payment_id,
        'customer_id', p_customer_id,
        'show_id', p_show_id,
        'seat_ids', p_seat_ids,
        'amount', p_amount,
        'status', 'CONFIRMED'
    );
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp;

-- ------------------------------------------------------------------------------
-- 15. ATOMIC CANCELLATION PROCEDURE: sp_cancel_booking
-- Releases seats immediately for future rebooking while preserving ticket history.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_cancel_booking(
    p_booking_id VARCHAR(10),
    p_customer_id VARCHAR(10)
)
RETURNS JSONB AS $$
DECLARE
    v_booking RECORD;
    v_user_auth_id UUID;
BEGIN
    SELECT * INTO v_booking FROM bookings WHERE booking_id = p_booking_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Error: Booking % does not exist.', p_booking_id;
    END IF;

    IF v_booking.customer_id <> p_customer_id THEN
        RAISE EXCEPTION 'Security Error: You are not authorized to cancel this booking.';
    END IF;

    v_user_auth_id := auth.uid();
    IF v_user_auth_id IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1 FROM customers 
            WHERE customer_id = v_booking.customer_id 
              AND auth_user_id = v_user_auth_id
        ) THEN
            RAISE EXCEPTION 'Security Error: You do not have permission to cancel this booking.';
        END IF;
    END IF;

    -- Update seat status to CANCELLED (frees seats for rebooking while keeping ticket details)
    UPDATE booked_seats SET status = 'CANCELLED' WHERE booking_id = p_booking_id;
    
    -- Update payment status to REFUNDED
    UPDATE payments SET status = 'REFUNDED' WHERE booking_id = p_booking_id;

    -- Update booking status to CANCELLED
    UPDATE bookings SET status = 'CANCELLED' WHERE booking_id = p_booking_id;

    RETURN jsonb_build_object(
        'success', true,
        'booking_id', p_booking_id,
        'message', 'Booking cancelled successfully and seats released for rebooking.'
    );
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp;

-- ------------------------------------------------------------------------------
-- 16. SERVER-SIDE AUTO-SCHEDULE GENERATOR PROCEDURE: sp_auto_generate_screen_schedule
-- Implements exact cinema scheduling algorithm from js/admin.js:
-- Starts 09:00 AM, movie runtime, 15-min cleaning turnover, 02:00 AM next-day curfew.
-- Preserves existing shows that have confirmed bookings.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_auto_generate_screen_schedule(
    p_screen_id VARCHAR(10),
    p_movie_id VARCHAR(10),
    p_date DATE,
    p_format VARCHAR(20) DEFAULT '2D',
    p_ticket_price DECIMAL(8,2) DEFAULT 350.00,
    p_replace_existing BOOLEAN DEFAULT false
)
RETURNS JSONB AS $$
DECLARE
    v_duration INT;
    v_cur_start_minutes INT := 540;   -- 09:00 AM (9 * 60)
    v_close_deadline INT := 1560;     -- 02:00 AM next day (26 * 60)
    v_cleaning_interval INT := 15;     -- 15 minutes turnover
    v_cur_end_minutes INT;
    v_start_norm INT;
    v_start_h INT;
    v_start_m INT;
    v_time_str TIME;
    v_new_show_id VARCHAR(10);
    v_generated_count INT := 0;
BEGIN
    SELECT duration INTO v_duration FROM movies WHERE movie_id = p_movie_id;
    IF v_duration IS NULL OR v_duration <= 0 THEN
        v_duration := 120;
    END IF;

    -- If replace_existing is requested, delete unbooked shows for screen & date
    IF p_replace_existing THEN
        DELETE FROM shows
        WHERE screen_id = p_screen_id
          AND show_date = p_date
          AND NOT EXISTS (SELECT 1 FROM bookings WHERE bookings.show_id = shows.show_id);
    END IF;

    WHILE (v_cur_start_minutes + v_duration) <= v_close_deadline LOOP
        v_cur_end_minutes := v_cur_start_minutes + v_duration;
        v_start_norm := v_cur_start_minutes % 1440;
        v_start_h := FLOOR(v_start_norm / 60);
        v_start_m := v_start_norm % 60;
        v_time_str := (LPAD(v_start_h::TEXT, 2, '0') || ':' || LPAD(v_start_m::TEXT, 2, '0') || ':00')::TIME;

        -- Check if a booked show already occupies this time slot
        IF NOT EXISTS (
            SELECT 1 FROM shows 
            WHERE screen_id = p_screen_id 
              AND show_date = p_date 
              AND show_time = v_time_str
        ) THEN
            v_new_show_id := generate_show_id();
            INSERT INTO shows (show_id, movie_id, screen_id, show_date, show_time, format, ticket_price)
            VALUES (v_new_show_id, p_movie_id, p_screen_id, p_date, v_time_str, p_format, p_ticket_price);
            v_generated_count := v_generated_count + 1;
        END IF;

        -- Advance start time by runtime + 15 minutes cleaning turnover
        v_cur_start_minutes := v_cur_end_minutes + v_cleaning_interval;
    END LOOP;

    RETURN jsonb_build_object(
        'success', true,
        'screen_id', p_screen_id,
        'movie_id', p_movie_id,
        'show_date', p_date,
        'shows_generated', v_generated_count
    );
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp;

-- ------------------------------------------------------------------------------
-- 17. SECURE AUTHENTICATION LINKAGE (Fix 3: Verified Account Linking)
-- Links an authenticated user to an existing pre-seeded customer record ONLY IF:
-- 1. The user's email is confirmed (verified) in Supabase Auth.
-- 2. The customer profile has not already been linked to a different auth account.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_link_current_user_profile()
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_user_email TEXT;
    v_email_confirmed TIMESTAMPTZ;
    v_cust RECORD;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication Error: You must be signed in to link your profile.';
    END IF;

    -- Query verified email status directly from auth.users
    SELECT email, email_confirmed_at INTO v_user_email, v_email_confirmed
    FROM auth.users
    WHERE id = v_user_id;

    IF v_user_email IS NULL THEN
        RAISE EXCEPTION 'Security Error: User account email could not be resolved.';
    END IF;

    -- Strict verification gate: Prevents unverified account spoofing / takeover
    IF v_email_confirmed IS NULL THEN
        RAISE EXCEPTION 'Verification Required: You must verify your email address (%) before linking to your customer profile.', v_user_email;
    END IF;

    v_user_email := LOWER(TRIM(v_user_email));

    SELECT * INTO v_cust FROM customers WHERE LOWER(TRIM(email)) = v_user_email;
    IF NOT FOUND THEN
        -- Auto-register new customer profile for verified user
        INSERT INTO customers (customer_id, auth_user_id, customer_name, email, phone)
        VALUES (
            generate_customer_id(),
            v_user_id,
            COALESCE((SELECT raw_user_meta_data->>'full_name' FROM auth.users WHERE id = v_user_id), 'Customer'),
            v_user_email,
            COALESCE((SELECT raw_user_meta_data->>'phone' FROM auth.users WHERE id = v_user_id), '')
        )
        RETURNING * INTO v_cust;
    ELSE
        -- Profile exists: check if already claimed by another user
        IF v_cust.auth_user_id IS NOT NULL AND v_cust.auth_user_id <> v_user_id THEN
            RAISE EXCEPTION 'Security Violation: This customer profile is already linked to another verified account.';
        END IF;

        -- Securely link profile
        UPDATE customers
        SET auth_user_id = v_user_id
        WHERE customer_id = v_cust.customer_id AND auth_user_id IS NULL;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'customer_id', v_cust.customer_id,
        'email', v_user_email,
        'linked', true
    );
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp;

-- ------------------------------------------------------------------------------
-- 18. COMPREHENSIVE TICKET DETAILS VIEW (Non-Duplicating with Security Invoker)
-- Pre-aggregates seats into a comma-separated string to avoid row duplication.
-- Uses security_invoker = true so RLS policies are enforced for the caller.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE VIEW ticket_details_view 
WITH (security_invoker = true) AS
SELECT
    b.booking_id,
    b.customer_id,
    c.customer_name,
    c.email AS customer_email,
    b.show_id,
    m.movie_id,
    m.movie_name,
    m.duration AS movie_duration,
    m.language AS movie_language,
    m.poster_url,
    m.poster_hires_url,
    t.theater_id,
    t.theater_name,
    t.city AS theater_city,
    sc.screen_id,
    sc.screen_name,
    sc.screen_type,
    sh.show_date,
    sh.show_time,
    b.format,
    b.ticket_price,
    p.payment_id,
    p.amount AS total_amount,
    p.payment_mode,
    p.status AS payment_status,
    b.status AS booking_status,
    b.booking_date,
    COUNT(bs.seat_id) AS total_seats_count,
    COALESCE(STRING_AGG(st.seat_number, ', ' ORDER BY st.seat_number), '') AS booked_seat_numbers,
    COALESCE(ARRAY_AGG(bs.seat_id ORDER BY st.seat_number), '{}') AS booked_seat_ids
FROM bookings b
JOIN customers c ON b.customer_id = c.customer_id
JOIN shows sh ON b.show_id = sh.show_id
JOIN movies m ON sh.movie_id = m.movie_id
JOIN screens sc ON sh.screen_id = sc.screen_id
JOIN theaters t ON sc.theater_id = t.theater_id
LEFT JOIN booked_seats bs ON b.booking_id = bs.booking_id
LEFT JOIN seats st ON bs.seat_id = st.seat_id
LEFT JOIN payments p ON b.booking_id = p.booking_id
GROUP BY
    b.booking_id, b.customer_id, c.customer_name, c.email,
    b.show_id, m.movie_id, m.movie_name, m.duration, m.language, m.poster_url, m.poster_hires_url,
    t.theater_id, t.theater_name, t.city,
    sc.screen_id, sc.screen_name, sc.screen_type,
    sh.show_date, sh.show_time, b.format, b.ticket_price,
    p.payment_id, p.amount, p.payment_mode, p.status, b.status, b.booking_date;

-- ------------------------------------------------------------------------------
-- 19. BACKWARD-COMPATIBLE RELATIONAL VIEWS (with security_invoker = true)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE VIEW "THEATER" WITH (security_invoker = true) AS SELECT theater_id AS "Theater_ID", theater_name AS "Theater_Name", city AS "City", state AS "State", country AS "Country" FROM theaters;
CREATE OR REPLACE VIEW "SCREEN" WITH (security_invoker = true) AS SELECT screen_id AS "Screen_ID", theater_id AS "Theater_ID", screen_number AS "Screen_Number", screen_name AS "Screen_Name", screen_type AS "Screen_Type", capacity AS "Capacity", projection_tech AS "Projection_Tech", audio_tech AS "Audio_Tech", verification_status AS "Verification_Status" FROM screens;
CREATE OR REPLACE VIEW "MOVIE" WITH (security_invoker = true) AS SELECT movie_id AS "Movie_ID", movie_name AS "Movie_Name", genre AS "Genre", rating AS "Rating", duration AS "Duration", language AS "Language", synopsis AS "Synopsis", cast_members AS "Cast" FROM movies;
CREATE OR REPLACE VIEW "SHOWS" WITH (security_invoker = true) AS SELECT show_id AS "Show_ID", movie_id AS "Movie_ID", screen_id AS "Screen_ID", show_date AS "Show_Date", show_time AS "Show_Time", format AS "Format", ticket_price AS "Ticket_Price" FROM shows;
CREATE OR REPLACE VIEW "SEAT" WITH (security_invoker = true) AS SELECT seat_id AS "Seat_ID", screen_id AS "Screen_ID", seat_number AS "Seat_Number", seat_type AS "Seat_Type" FROM seats;
CREATE OR REPLACE VIEW "CUSTOMER" WITH (security_invoker = true) AS SELECT customer_id AS "Customer_ID", customer_name AS "Customer_Name", email AS "Email", phone AS "Phone" FROM customers;
CREATE OR REPLACE VIEW "BOOKING" WITH (security_invoker = true) AS SELECT booking_id AS "Booking_ID", customer_id AS "Customer_ID", show_id AS "Show_ID", booking_date AS "Booking_Date", ticket_price AS "Ticket_Price", format AS "Format", status AS "Status" FROM bookings;
CREATE OR REPLACE VIEW "BOOKED_SEAT" WITH (security_invoker = true) AS SELECT booking_id AS "Booking_ID", seat_id AS "Seat_ID", show_id AS "Show_ID", status AS "Status" FROM booked_seats;
CREATE OR REPLACE VIEW "PAYMENT" WITH (security_invoker = true) AS SELECT payment_id AS "Payment_ID", booking_id AS "Booking_ID", payment_mode AS "Payment_Mode", amount AS "Amount", payment_date AS "Payment_Date", status AS "Status" FROM payments;
CREATE OR REPLACE VIEW "TICKET_DETAILS" WITH (security_invoker = true) AS SELECT * FROM ticket_details_view;

-- ------------------------------------------------------------------------------
-- 20. ROW LEVEL SECURITY (RLS) POLICIES
-- Strict isolation: public can read catalog, customers can only access their own data.
-- ------------------------------------------------------------------------------
ALTER TABLE theaters ENABLE ROW LEVEL SECURITY;
ALTER TABLE screens ENABLE ROW LEVEL SECURITY;
ALTER TABLE movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE shows ENABLE ROW LEVEL SECURITY;
ALTER TABLE seats ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE booked_seats ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Public Anonymous Browsing Policies (Read catalog & showtimes)
CREATE POLICY "Public theaters are readable by everyone" ON theaters FOR SELECT USING (true);
CREATE POLICY "Public screens are readable by everyone" ON screens FOR SELECT USING (true);
CREATE POLICY "Public movies are readable by everyone" ON movies FOR SELECT USING (true);
CREATE POLICY "Public shows are readable by everyone" ON shows FOR SELECT USING (true);
CREATE POLICY "Public seats are readable by everyone" ON seats FOR SELECT USING (true);
CREATE POLICY "Public booked_seats readable for availability" ON booked_seats FOR SELECT USING (true);

-- Customer Specific Policies (Strict User Isolation)
CREATE POLICY "Customers can view their own profile" ON customers
    FOR SELECT TO authenticated 
    USING (auth.uid() = auth_user_id);

CREATE POLICY "Customers can update their own profile" ON customers
    FOR UPDATE TO authenticated 
    USING (auth.uid() = auth_user_id);

CREATE POLICY "Customers can view their own bookings" ON bookings
    FOR SELECT TO authenticated 
    USING (
        customer_id IN (SELECT customer_id FROM customers WHERE auth_user_id = auth.uid())
    );

CREATE POLICY "Customers can view their own payments" ON payments
    FOR SELECT TO authenticated 
    USING (
        booking_id IN (
            SELECT b.booking_id FROM bookings b 
            JOIN customers c ON b.customer_id = c.customer_id 
            WHERE c.auth_user_id = auth.uid()
        )
    );

-- ------------------------------------------------------------------------------
-- 21. POSTGREST API ROLE GRANTS (Fix 2: Principle of Least Privilege)
-- Grants only the minimal permissions required for legitimate client workflows.
-- ------------------------------------------------------------------------------
-- Grant schema access
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Public Catalog: Readable by both anonymous visitors and authenticated users
GRANT SELECT ON theaters, screens, movies, shows, seats, booked_seats TO anon, authenticated;
GRANT SELECT ON "THEATER", "SCREEN", "MOVIE", "SHOWS", "SEAT" TO anon, authenticated;

-- Private Data: Strictly restricted to authenticated users (RLS enforced)
GRANT SELECT, UPDATE ON customers TO authenticated;
GRANT SELECT ON bookings, payments TO authenticated;
GRANT SELECT ON ticket_details_view, "TICKET_DETAILS", "CUSTOMER", "BOOKING", "BOOKED_SEAT", "PAYMENT" TO authenticated;

-- Stored Procedures:
-- sp_book_ticket_transaction is callable by both guest and authenticated checkout flows
GRANT EXECUTE ON FUNCTION sp_book_ticket_transaction TO anon, authenticated;

-- sp_cancel_booking and sp_link_current_user_profile are strictly restricted to authenticated users
GRANT EXECUTE ON FUNCTION sp_cancel_booking, sp_link_current_user_profile TO authenticated;

-- Revoke privileged functions from public and anonymous callers
REVOKE EXECUTE ON FUNCTION sp_auto_generate_screen_schedule FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION generate_booking_id, generate_payment_id, generate_customer_id, generate_show_id FROM PUBLIC, anon, authenticated;

-- Sequences: Access is handled entirely through SECURITY DEFINER procedures; no direct sequence grants
REVOKE USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public FROM PUBLIC, anon, authenticated;
