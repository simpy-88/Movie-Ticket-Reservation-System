-- ==============================================================================
-- MOVIE TICKET RESERVATION SYSTEM (MTRS)
-- File: supabase/repair_existing_database.sql
-- Description: Non-destructive, idempotent repair and synchronization script.
--              Aligns an existing Supabase database with the canonical MTRS schema
--              (20261022000001_initial_schema.sql) and seed dataset (seed.sql).
--
-- Safety Guarantees:
--  * NO DROP TABLE, NO TRUNCATE, NO CASCADE.
--  * Preserves existing table identities, OIDs, and all existing records.
--  * Preserves composite PK on booked_seats (booking_id, seat_id).
--  * Safe leaf-first view replacement without CASCADE.
--  * Uses DROP POLICY IF EXISTS before recreating RLS policies.
--  * Hardens anonymous checkout (cannot book for linked user accounts).
--  * Requires authentication for cancellations (ownership verified).
--  * Race-condition safe profile linking with confirmed-email gate.
--  * Installs the latest midnight scheduling, row-locking, and PLF format rules.
--  * Transactional: Wrapped in BEGIN ... COMMIT with deep pre- and post-assertions.
-- ==============================================================================

BEGIN;

-- ------------------------------------------------------------------------------
-- 1. PRE-CONDITION ASSERTIONS & EXISTING SCHEMA VALIDATION
-- Validates base table existence, column data-type compatibility, and composite PK.
-- ------------------------------------------------------------------------------
DO $$
DECLARE
    v_missing_tables TEXT;
    v_incompat_types TEXT;
    v_has_pk_booking BOOLEAN;
    v_has_pk_seat BOOLEAN;
BEGIN
    -- 1.1 Verify all 9 base tables exist in public schema
    SELECT STRING_AGG(tbl, ', ') INTO v_missing_tables
    FROM (
        SELECT UNNEST(ARRAY[
            'theaters', 'screens', 'movies', 'shows', 'seats',
            'customers', 'bookings', 'booked_seats', 'payments'
        ]) AS tbl
    ) t
    WHERE NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = t.tbl
    );

    IF v_missing_tables IS NOT NULL THEN
        RAISE EXCEPTION 'Repair Pre-condition Failed: Missing base tables in public schema: %', v_missing_tables;
    END IF;

    -- 1.2 Verify existing column data types are structurally compatible
    SELECT STRING_AGG(table_name || '.' || column_name || ' (found ' || data_type || ')', '; ')
    INTO v_incompat_types
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND (
        (table_name = 'customers' AND column_name = 'auth_user_id' AND data_type <> 'uuid') OR
        (table_name = 'booked_seats' AND column_name = 'booking_id' AND data_type NOT IN ('character varying', 'text')) OR
        (table_name = 'booked_seats' AND column_name = 'seat_id' AND data_type NOT IN ('character varying', 'text')) OR
        (table_name = 'shows' AND column_name = 'show_date' AND data_type <> 'date') OR
        (table_name = 'shows' AND column_name = 'show_time' AND data_type NOT IN ('time without time zone', 'time with time zone')) OR
        (table_name = 'movies' AND column_name = 'duration' AND data_type NOT IN ('integer', 'smallint', 'bigint'))
      );

    IF v_incompat_types IS NOT NULL THEN
        RAISE EXCEPTION 'Repair Pre-condition Failed: Incompatible column types in live database: %', v_incompat_types;
    END IF;

    -- 1.3 Verify booked_seats has a composite primary key on (booking_id, seat_id)
    SELECT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu 
          ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
        WHERE tc.table_schema = 'public' 
          AND tc.table_name = 'booked_seats' 
          AND tc.constraint_type = 'PRIMARY KEY'
          AND kcu.column_name = 'booking_id'
    ) INTO v_has_pk_booking;

    SELECT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu 
          ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
        WHERE tc.table_schema = 'public' 
          AND tc.table_name = 'booked_seats' 
          AND tc.constraint_type = 'PRIMARY KEY'
          AND kcu.column_name = 'seat_id'
    ) INTO v_has_pk_seat;

    IF NOT (v_has_pk_booking AND v_has_pk_seat) THEN
        RAISE EXCEPTION 'Repair Pre-condition Failed: booked_seats must retain composite primary key on (booking_id, seat_id).';
    END IF;

    RAISE NOTICE 'Pre-condition Check Passed: Table structures and composite keys verified.';
END $$;

-- Enable required cryptographic and UUID extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 2. COLUMN SYNCHRONIZATION
-- Non-destructively adds any missing columns across all 9 base tables.
-- ------------------------------------------------------------------------------
-- Theaters
ALTER TABLE theaters ADD COLUMN IF NOT EXISTS theater_name VARCHAR(100);
ALTER TABLE theaters ADD COLUMN IF NOT EXISTS city VARCHAR(50);
ALTER TABLE theaters ADD COLUMN IF NOT EXISTS state VARCHAR(50);
ALTER TABLE theaters ADD COLUMN IF NOT EXISTS country VARCHAR(50) DEFAULT 'India';
ALTER TABLE theaters ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Screens
ALTER TABLE screens ADD COLUMN IF NOT EXISTS screen_number INT;
ALTER TABLE screens ADD COLUMN IF NOT EXISTS screen_name VARCHAR(50) DEFAULT '';
ALTER TABLE screens ADD COLUMN IF NOT EXISTS screen_type VARCHAR(30) DEFAULT 'Standard';
ALTER TABLE screens ADD COLUMN IF NOT EXISTS capacity INT;
ALTER TABLE screens ADD COLUMN IF NOT EXISTS projection_tech VARCHAR(50) DEFAULT '2K Digital';
ALTER TABLE screens ADD COLUMN IF NOT EXISTS audio_tech VARCHAR(50) DEFAULT 'Dolby 7.1';
ALTER TABLE screens ADD COLUMN IF NOT EXISTS verification_status VARCHAR(50) DEFAULT 'Published - Unverified';
ALTER TABLE screens ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Movies
ALTER TABLE movies ADD COLUMN IF NOT EXISTS movie_name VARCHAR(100);
ALTER TABLE movies ADD COLUMN IF NOT EXISTS genre VARCHAR(50);
ALTER TABLE movies ADD COLUMN IF NOT EXISTS rating DECIMAL(3,1) DEFAULT 0.0;
ALTER TABLE movies ADD COLUMN IF NOT EXISTS duration INT;
ALTER TABLE movies ADD COLUMN IF NOT EXISTS language VARCHAR(30);
ALTER TABLE movies ADD COLUMN IF NOT EXISTS synopsis TEXT;
ALTER TABLE movies ADD COLUMN IF NOT EXISTS cast_members TEXT;
ALTER TABLE movies ADD COLUMN IF NOT EXISTS poster_url TEXT;
ALTER TABLE movies ADD COLUMN IF NOT EXISTS poster_hires_url TEXT;
ALTER TABLE movies ADD COLUMN IF NOT EXISTS backdrop_url TEXT;
ALTER TABLE movies ADD COLUMN IF NOT EXISTS tmdb_id INT;
ALTER TABLE movies ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Shows
ALTER TABLE shows ADD COLUMN IF NOT EXISTS show_date DATE;
ALTER TABLE shows ADD COLUMN IF NOT EXISTS show_time TIME;
ALTER TABLE shows ADD COLUMN IF NOT EXISTS format VARCHAR(20) DEFAULT '2D';
ALTER TABLE shows ADD COLUMN IF NOT EXISTS ticket_price DECIMAL(8,2) DEFAULT 250.00;
ALTER TABLE shows ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Seats
ALTER TABLE seats ADD COLUMN IF NOT EXISTS seat_number VARCHAR(10);
ALTER TABLE seats ADD COLUMN IF NOT EXISTS seat_type VARCHAR(20) DEFAULT 'Regular';
ALTER TABLE seats ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Customers
ALTER TABLE customers ADD COLUMN IF NOT EXISTS auth_user_id UUID;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS customer_name VARCHAR(100);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS email VARCHAR(100);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS phone VARCHAR(15);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Bookings
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS booking_date TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS ticket_price DECIMAL(8,2) DEFAULT 250.00;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS format VARCHAR(20) DEFAULT '2D';
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'CONFIRMED';
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Booked Seats
ALTER TABLE booked_seats ADD COLUMN IF NOT EXISTS show_id VARCHAR(10);
ALTER TABLE booked_seats ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'CONFIRMED';
ALTER TABLE booked_seats ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Payments
ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_mode VARCHAR(30) DEFAULT 'UPI';
ALTER TABLE payments ADD COLUMN IF NOT EXISTS amount DECIMAL(8,2) DEFAULT 0.0;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_date TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE payments ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'SUCCESS';
ALTER TABLE payments ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- ------------------------------------------------------------------------------
-- 3. CONSTRAINT & FOREIGN KEY SYNCHRONIZATION
-- Idempotently checks underlying column definitions before adding constraints,
-- avoiding duplicate constraints or naming collisions.
-- ------------------------------------------------------------------------------
DO $$
BEGIN
    -- 3.1 Screens Unique: (theater_id, screen_number)
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_class t ON c.conrelid = t.oid
        JOIN pg_namespace n ON t.relnamespace = n.oid
        WHERE n.nspname = 'public' AND t.relname = 'screens' AND c.contype = 'u'
          AND (
              SELECT ARRAY_AGG(a.attname::TEXT ORDER BY a.attname)
              FROM UNNEST(c.conkey) k
              JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = k
          ) = ARRAY['screen_number', 'theater_id']::TEXT[]
    ) AND NOT EXISTS (
        SELECT 1 FROM pg_index i
        JOIN pg_class t ON i.indrelid = t.oid
        JOIN pg_namespace n ON t.relnamespace = n.oid
        WHERE n.nspname = 'public' AND t.relname = 'screens' AND i.indisunique
          AND (
              SELECT ARRAY_AGG(a.attname::TEXT ORDER BY a.attname)
              FROM UNNEST(i.indkey) k
              JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = k
          ) = ARRAY['screen_number', 'theater_id']::TEXT[]
    ) THEN
        ALTER TABLE screens ADD CONSTRAINT uq_theater_screen UNIQUE (theater_id, screen_number);
    END IF;

    -- 3.2 Seats Unique: (screen_id, seat_number)
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_class t ON c.conrelid = t.oid
        JOIN pg_namespace n ON t.relnamespace = n.oid
        WHERE n.nspname = 'public' AND t.relname = 'seats' AND c.contype = 'u'
          AND (
              SELECT ARRAY_AGG(a.attname::TEXT ORDER BY a.attname)
              FROM UNNEST(c.conkey) k
              JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = k
          ) = ARRAY['screen_id', 'seat_number']::TEXT[]
    ) AND NOT EXISTS (
        SELECT 1 FROM pg_index i
        JOIN pg_class t ON i.indrelid = t.oid
        JOIN pg_namespace n ON t.relnamespace = n.oid
        WHERE n.nspname = 'public' AND t.relname = 'seats' AND i.indisunique
          AND (
              SELECT ARRAY_AGG(a.attname::TEXT ORDER BY a.attname)
              FROM UNNEST(i.indkey) k
              JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = k
          ) = ARRAY['screen_id', 'seat_number']::TEXT[]
    ) THEN
        ALTER TABLE seats ADD CONSTRAINT uq_screen_seat UNIQUE (screen_id, seat_number);
    END IF;

    -- 3.3 Payments Unique: 1-to-1 booking_id
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_class t ON c.conrelid = t.oid
        JOIN pg_namespace n ON t.relnamespace = n.oid
        WHERE n.nspname = 'public' AND t.relname = 'payments' AND c.contype = 'u'
          AND (SELECT a.attname FROM pg_attribute a WHERE a.attrelid = t.oid AND a.attnum = c.conkey[1]) = 'booking_id'
    ) AND NOT EXISTS (
        SELECT 1 FROM pg_index i
        JOIN pg_class t ON i.indrelid = t.oid
        JOIN pg_namespace n ON t.relnamespace = n.oid
        WHERE n.nspname = 'public' AND t.relname = 'payments' AND i.indisunique
          AND (SELECT a.attname FROM pg_attribute a WHERE a.attrelid = t.oid AND a.attnum = i.indkey[0]) = 'booking_id'
    ) THEN
        ALTER TABLE payments ADD CONSTRAINT uq_payment_booking UNIQUE (booking_id);
    END IF;

    -- 3.4 Customers Unique: email
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_class t ON c.conrelid = t.oid
        JOIN pg_namespace n ON t.relnamespace = n.oid
        WHERE n.nspname = 'public' AND t.relname = 'customers' AND c.contype = 'u'
          AND (SELECT a.attname FROM pg_attribute a WHERE a.attrelid = t.oid AND a.attnum = c.conkey[1]) = 'email'
    ) AND NOT EXISTS (
        SELECT 1 FROM pg_index i
        JOIN pg_class t ON i.indrelid = t.oid
        JOIN pg_namespace n ON t.relnamespace = n.oid
        WHERE n.nspname = 'public' AND t.relname = 'customers' AND i.indisunique
          AND (SELECT a.attname FROM pg_attribute a WHERE a.attrelid = t.oid AND a.attnum = i.indkey[0]) = 'email'
    ) THEN
        ALTER TABLE customers ADD CONSTRAINT uq_customer_email UNIQUE (email);
    END IF;

    -- 3.5 Check constraint: shows.format (Standard & PLF formats)
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_class t ON c.conrelid = t.oid
        JOIN pg_namespace n ON t.relnamespace = n.oid
        WHERE n.nspname = 'public' AND t.relname = 'shows' AND c.contype = 'c'
          AND pg_get_constraintdef(c.oid) ILIKE '%format%IMAX%'
    ) THEN
        ALTER TABLE shows ADD CONSTRAINT chk_shows_format CHECK (
            format IN ('2D', '3D', 'IMAX 2D', 'IMAX 3D', 'P[XL] 2D', 'P[XL] 3D', 'BIGPIX 2D', 'BIGPIX 3D')
        );
    END IF;

    -- 3.6 Check constraint: shows.ticket_price > 0
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_class t ON c.conrelid = t.oid
        JOIN pg_namespace n ON t.relnamespace = n.oid
        WHERE n.nspname = 'public' AND t.relname = 'shows' AND c.contype = 'c'
          AND pg_get_constraintdef(c.oid) ILIKE '%ticket_price%0%'
    ) THEN
        ALTER TABLE shows ADD CONSTRAINT chk_shows_ticket_price CHECK (ticket_price > 0.0);
    END IF;

    -- 3.7 Check constraint: bookings.format
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_class t ON c.conrelid = t.oid
        JOIN pg_namespace n ON t.relnamespace = n.oid
        WHERE n.nspname = 'public' AND t.relname = 'bookings' AND c.contype = 'c'
          AND pg_get_constraintdef(c.oid) ILIKE '%format%IMAX%'
    ) THEN
        ALTER TABLE bookings ADD CONSTRAINT chk_bookings_format CHECK (
            format IN ('2D', '3D', 'IMAX 2D', 'IMAX 3D', 'P[XL] 2D', 'P[XL] 3D', 'BIGPIX 2D', 'BIGPIX 3D')
        );
    END IF;

    -- 3.8 Check constraint: bookings.status
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_class t ON c.conrelid = t.oid
        JOIN pg_namespace n ON t.relnamespace = n.oid
        WHERE n.nspname = 'public' AND t.relname = 'bookings' AND c.contype = 'c'
          AND pg_get_constraintdef(c.oid) ILIKE '%status%CONFIRMED%'
    ) THEN
        ALTER TABLE bookings ADD CONSTRAINT chk_bookings_status CHECK (
            status IN ('CONFIRMED', 'CANCELLED', 'REFUNDED')
        );
    END IF;

    -- 3.9 Check constraint: booked_seats.status
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_class t ON c.conrelid = t.oid
        JOIN pg_namespace n ON t.relnamespace = n.oid
        WHERE n.nspname = 'public' AND t.relname = 'booked_seats' AND c.contype = 'c'
          AND pg_get_constraintdef(c.oid) ILIKE '%status%CONFIRMED%'
    ) THEN
        ALTER TABLE booked_seats ADD CONSTRAINT chk_booked_seats_status CHECK (
            status IN ('CONFIRMED', 'CANCELLED')
        );
    END IF;

    -- 3.10 Check constraint: payments.status
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_class t ON c.conrelid = t.oid
        JOIN pg_namespace n ON t.relnamespace = n.oid
        WHERE n.nspname = 'public' AND t.relname = 'payments' AND c.contype = 'c'
          AND pg_get_constraintdef(c.oid) ILIKE '%status%SUCCESS%'
    ) THEN
        ALTER TABLE payments ADD CONSTRAINT chk_payments_status CHECK (
            status IN ('SUCCESS', 'REFUNDED', 'FAILED')
        );
    END IF;

    -- 3.11 Check constraint: payments.payment_mode
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_class t ON c.conrelid = t.oid
        JOIN pg_namespace n ON t.relnamespace = n.oid
        WHERE n.nspname = 'public' AND t.relname = 'payments' AND c.contype = 'c'
          AND pg_get_constraintdef(c.oid) ILIKE '%payment_mode%'
    ) THEN
        ALTER TABLE payments ADD CONSTRAINT chk_payments_mode CHECK (
            payment_mode IN ('Credit Card', 'Debit Card', 'UPI', 'Net Banking', 'Cash')
        );
    END IF;

    -- 3.12 Check constraint: movies.rating
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_class t ON c.conrelid = t.oid
        JOIN pg_namespace n ON t.relnamespace = n.oid
        WHERE n.nspname = 'public' AND t.relname = 'movies' AND c.contype = 'c'
          AND pg_get_constraintdef(c.oid) ILIKE '%rating%10%'
    ) THEN
        ALTER TABLE movies ADD CONSTRAINT chk_movies_rating CHECK (rating >= 0.0 AND rating <= 10.0);
    END IF;

    -- 3.13 Check constraint: movies.duration
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_class t ON c.conrelid = t.oid
        JOIN pg_namespace n ON t.relnamespace = n.oid
        WHERE n.nspname = 'public' AND t.relname = 'movies' AND c.contype = 'c'
          AND pg_get_constraintdef(c.oid) ILIKE '%duration%0%'
    ) THEN
        ALTER TABLE movies ADD CONSTRAINT chk_movies_duration CHECK (duration > 0);
    END IF;

    -- 3.14 Foreign Key: booked_seats.show_id -> shows.show_id
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_class t ON c.conrelid = t.oid
        JOIN pg_class ref ON c.confrelid = ref.oid
        JOIN pg_namespace n ON t.relnamespace = n.oid
        WHERE n.nspname = 'public' AND t.relname = 'booked_seats' AND c.contype = 'f'
          AND ref.relname = 'shows'
          AND (SELECT a.attname FROM pg_attribute a WHERE a.attrelid = t.oid AND a.attnum = c.conkey[1]) = 'show_id'
    ) THEN
        ALTER TABLE booked_seats 
        ADD CONSTRAINT fk_booked_seats_show 
        FOREIGN KEY (show_id) REFERENCES shows(show_id) ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- 3.15 Foreign Key: customers.auth_user_id -> auth.users.id
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_class t ON c.conrelid = t.oid
        JOIN pg_class ref ON c.confrelid = ref.oid
        JOIN pg_namespace n ON t.relnamespace = n.oid
        JOIN pg_namespace rn ON ref.relnamespace = rn.oid
        WHERE n.nspname = 'public' AND t.relname = 'customers' AND c.contype = 'f'
          AND rn.nspname = 'auth' AND ref.relname = 'users'
          AND (SELECT a.attname FROM pg_attribute a WHERE a.attrelid = t.oid AND a.attnum = c.conkey[1]) = 'auth_user_id'
    ) THEN
        ALTER TABLE customers 
        ADD CONSTRAINT fk_customers_auth_user 
        FOREIGN KEY (auth_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 4. HARDWARE-LEVEL CONCURRENCY GUARDS & INDEXES
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
-- while status is 'CONFIRMED'. Allows instant rebooking if a previous booking is cancelled.
CREATE UNIQUE INDEX IF NOT EXISTS uq_active_show_seat 
ON booked_seats (show_id, seat_id) 
WHERE status = 'CONFIRMED';

-- ------------------------------------------------------------------------------
-- 5. MONOTONIC SEQUENCES & PRECISE ALIGNMENT
-- Aligns sequences to prevent ID collisions while strictly preserving sequence progression:
--  * IMPORTANT CONCURRENCY NOTICE: PostgreSQL sequences operate outside transaction
--    MVCC semantics and cannot be locked via LOCK TABLE. Therefore, the application
--    MUST remain stopped / disconnected during repair and seeding to prevent concurrent
--    nextval() calls from racing with sequence realignment.
--  * Preserves existing sequence state untouched if its next natural value is already
--    safely ahead of the required minimum and existing table IDs.
--  * Advances a sequence (using setval with is_called = false) ONLY when its next natural
--    value would fall below the required seed threshold or existing table records.
--  * Required seed minimums: BK09 (after BK01-BK08), PAY09 (after PAY01-PAY08),
--    CU06 (after CU01-CU05), and SH19 (after SH01-SH18).
-- ------------------------------------------------------------------------------
CREATE SEQUENCE IF NOT EXISTS booking_id_seq START WITH 9;
CREATE SEQUENCE IF NOT EXISTS payment_id_seq START WITH 9;
CREATE SEQUENCE IF NOT EXISTS customer_id_seq START WITH 6;
CREATE SEQUENCE IF NOT EXISTS show_id_seq START WITH 19;

DO $$
DECLARE
    -- Maximum integer IDs present in tables
    v_max_bk INT;
    v_max_pay INT;
    v_max_cu INT;
    v_max_sh INT;

    -- Current sequence state (last_value and is_called)
    v_seq_last BIGINT;
    v_seq_called BOOLEAN;

    -- Next value that the sequence would naturally produce without intervention
    v_cur_next_bk INT;
    v_cur_next_pay INT;
    v_cur_next_cu INT;
    v_cur_next_sh INT;

    -- Required next minimum values
    v_needed_bk INT;
    v_needed_pay INT;
    v_needed_cu INT;
    v_needed_sh INT;
BEGIN
    -- 1. Scan maximum existing IDs from table data (0 if table is empty)
    SELECT COALESCE(MAX(SUBSTRING(booking_id FROM 3)::INT), 0) INTO v_max_bk FROM bookings WHERE booking_id ~ '^BK[0-9]+$';
    SELECT COALESCE(MAX(SUBSTRING(payment_id FROM 4)::INT), 0) INTO v_max_pay FROM payments WHERE payment_id ~ '^PAY[0-9]+$';
    SELECT COALESCE(MAX(SUBSTRING(customer_id FROM 3)::INT), 0) INTO v_max_cu FROM customers WHERE customer_id ~ '^CU[0-9]+$';
    SELECT COALESCE(MAX(SUBSTRING(show_id FROM 3)::INT), 0) INTO v_max_sh FROM shows WHERE show_id ~ '^SH[0-9]+$';

    -- 2. Determine the required next minimum ID (clearing table records and seed ranges)
    v_needed_bk := GREATEST(v_max_bk + 1, 9);
    v_needed_pay := GREATEST(v_max_pay + 1, 9);
    v_needed_cu := GREATEST(v_max_cu + 1, 6);
    v_needed_sh := GREATEST(v_max_sh + 1, 19);

    -- 3. Check and conditionally advance booking_id_seq
    SELECT last_value, is_called INTO v_seq_last, v_seq_called FROM booking_id_seq;
    IF v_seq_called THEN
        v_cur_next_bk := (v_seq_last + 1)::INT;
    ELSE
        v_cur_next_bk := v_seq_last::INT;
    END IF;

    IF v_cur_next_bk < v_needed_bk THEN
        PERFORM setval('booking_id_seq', v_needed_bk, false);
    END IF;

    -- 4. Check and conditionally advance payment_id_seq
    SELECT last_value, is_called INTO v_seq_last, v_seq_called FROM payment_id_seq;
    IF v_seq_called THEN
        v_cur_next_pay := (v_seq_last + 1)::INT;
    ELSE
        v_cur_next_pay := v_seq_last::INT;
    END IF;

    IF v_cur_next_pay < v_needed_pay THEN
        PERFORM setval('payment_id_seq', v_needed_pay, false);
    END IF;

    -- 5. Check and conditionally advance customer_id_seq
    SELECT last_value, is_called INTO v_seq_last, v_seq_called FROM customer_id_seq;
    IF v_seq_called THEN
        v_cur_next_cu := (v_seq_last + 1)::INT;
    ELSE
        v_cur_next_cu := v_seq_last::INT;
    END IF;

    IF v_cur_next_cu < v_needed_cu THEN
        PERFORM setval('customer_id_seq', v_needed_cu, false);
    END IF;

    -- 6. Check and conditionally advance show_id_seq
    SELECT last_value, is_called INTO v_seq_last, v_seq_called FROM show_id_seq;
    IF v_seq_called THEN
        v_cur_next_sh := (v_seq_last + 1)::INT;
    ELSE
        v_cur_next_sh := v_seq_last::INT;
    END IF;

    IF v_cur_next_sh < v_needed_sh THEN
        PERFORM setval('show_id_seq', v_needed_sh, false);
    END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 6. MONOTONIC ID GENERATOR FUNCTIONS (SECURITY DEFINER)
-- Hardened search_path prevents schema-injection attacks.
-- ------------------------------------------------------------------------------
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
-- 7. DOUBLE-BOOKING & AUDITORIUM INTEGRITY TRIGGERS
-- Trigger functions do NOT use SECURITY DEFINER; explicit search_path applied.
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
-- 8. CINEMA SCHEDULING VALIDATION TRIGGER (Fix 1: Midnight Scheduling)
-- Enforces:
--  1. Operational Day: Shows before 06:00 AM belong to business day started on show_date
--     and mapped to calendar date (show_date + 1).
--  2. Opening Window: First daytime show starts at or after 09:00 AM on show_date.
--  3. Closing Curfew: No movie may finish past 02:00 AM the following day.
--  4. Cleaning Turnover: Mandatory 15-minute interval between shows on same screen.
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
    SELECT duration INTO v_duration FROM movies WHERE movie_id = NEW.movie_id;
    IF v_duration IS NULL OR v_duration <= 0 THEN
        v_duration := 120;
    END IF;

    -- Compute timeline coordinates without timezone distortion
    IF NEW.show_time < '06:00:00'::TIME THEN
        v_new_start := (NEW.show_date + INTERVAL '1 day')::DATE + NEW.show_time;
    ELSE
        v_new_start := NEW.show_date + NEW.show_time;
    END IF;

    v_new_end := v_new_start + (v_duration || ' minutes')::INTERVAL;
    v_day_start := NEW.show_date + '09:00:00'::TIME;
    v_day_curfew := (NEW.show_date + INTERVAL '1 day')::DATE + '02:00:00'::TIME;

    -- 1. Enforce opening start window
    IF v_new_start < v_day_start THEN
        RAISE EXCEPTION 'Scheduling Conflict: Show % starts at %, before the 09:00 AM cinema opening window.',
            COALESCE(NEW.show_id, 'NEW'), NEW.show_time
            USING ERRCODE = '23514';
    END IF;

    -- 2. Enforce closing curfew
    IF v_new_end > v_day_curfew THEN
        RAISE EXCEPTION 'Scheduling Conflict: Show % ends at %, past the 02:00 AM next-day closing curfew.',
            COALESCE(NEW.show_id, 'NEW'), v_new_end::TEXT
            USING ERRCODE = '23514';
    END IF;

    -- 3. Enforce 15-minute turnover cleaning interval across contiguous dates (-1 to +1 day)
    FOR v_conflict IN
        SELECT s.show_id, s.show_date, s.show_time, m.duration
        FROM shows s
        JOIN movies m ON s.movie_id = m.movie_id
        WHERE s.screen_id = NEW.screen_id
          AND s.show_id <> COALESCE(NEW.show_id, '')
          AND s.show_date BETWEEN (NEW.show_date - INTERVAL '1 day')::DATE AND (NEW.show_date + INTERVAL '1 day')::DATE
    LOOP
        IF v_conflict.show_time < '06:00:00'::TIME THEN
            v_conflict_start := (v_conflict.show_date + INTERVAL '1 day')::DATE + v_conflict.show_time;
        ELSE
            v_conflict_start := v_conflict.show_date + v_conflict.show_time;
        END IF;
        v_conflict_end := v_conflict_start + (COALESCE(v_conflict.duration, 120) || ' minutes')::INTERVAL;

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
-- 9. ATOMIC BOOKING PROCEDURE: sp_book_ticket_transaction
-- Security:
--  * Authenticated callers must strictly book for their own linked customer profile.
--  * Anonymous callers (guest checkout) cannot book for registered user accounts
--    (rejects attempt if customer.auth_user_id IS NOT NULL).
--  * Row lock via SELECT ... FOR UPDATE on shows prevents race conditions.
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
    v_target_cust RECORD;
BEGIN
    -- 1. Customer Verification & Authorization Check
    SELECT * INTO v_target_cust FROM customers WHERE customer_id = p_customer_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Integrity Error: Customer % does not exist.', p_customer_id;
    END IF;

    v_user_auth_id := auth.uid();
    IF v_user_auth_id IS NOT NULL THEN
        -- Authenticated user: must only book for their own linked profile
        IF v_target_cust.auth_user_id IS NULL OR v_target_cust.auth_user_id <> v_user_auth_id THEN
            RAISE EXCEPTION 'Authorization Error: You do not have permission to book for customer %.', p_customer_id;
        END IF;
    ELSE
        -- Anonymous guest caller: cannot book for an existing registered account
        IF v_target_cust.auth_user_id IS NOT NULL THEN
            RAISE EXCEPTION 'Authorization Error: Anonymous checkout cannot book under a registered customer account. Please sign in.';
        END IF;
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

    -- 6. Insert Booked Seats (Triggers & Unique Index guard against double-booking)
    FOREACH v_seat_id IN ARRAY p_seat_ids LOOP
        INSERT INTO booked_seats (booking_id, seat_id, show_id, status)
        VALUES (v_booking_id, v_seat_id, p_show_id, 'CONFIRMED');
    END LOOP;

    -- 7. Insert Payment
    INSERT INTO payments (payment_id, booking_id, payment_mode, amount, payment_date, status)
    VALUES (v_payment_id, v_booking_id, p_payment_mode, p_amount, NOW(), 'SUCCESS');

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
-- 10. ATOMIC CANCELLATION PROCEDURE: sp_cancel_booking
-- Security:
--  * Strictly requires authenticated session (auth.uid() IS NOT NULL).
--  * Caller must own the booking via customers.auth_user_id = auth.uid().
--  * Anonymous callers are completely blocked from cancelling bookings.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_cancel_booking(
    p_booking_id VARCHAR(10),
    p_customer_id VARCHAR(10)
)
RETURNS JSONB AS $$
DECLARE
    v_booking RECORD;
    v_user_auth_id UUID := auth.uid();
BEGIN
    IF v_user_auth_id IS NULL THEN
        RAISE EXCEPTION 'Authentication Error: You must be signed in to cancel a booking.';
    END IF;

    SELECT * INTO v_booking FROM bookings WHERE booking_id = p_booking_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Error: Booking % does not exist.', p_booking_id;
    END IF;

    IF v_booking.customer_id <> p_customer_id THEN
        RAISE EXCEPTION 'Security Error: You are not authorized to cancel this booking.';
    END IF;

    -- Caller must be the verified owner of the customer profile
    IF NOT EXISTS (
        SELECT 1 FROM customers 
        WHERE customer_id = v_booking.customer_id 
          AND auth_user_id = v_user_auth_id
    ) THEN
        RAISE EXCEPTION 'Security Error: You do not have permission to cancel this booking.';
    END IF;

    -- Update seat status to CANCELLED (releases partial unique index for rebooking)
    UPDATE booked_seats SET status = 'CANCELLED' WHERE booking_id = p_booking_id;
    UPDATE payments SET status = 'REFUNDED' WHERE booking_id = p_booking_id;
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
-- 11. SCHEDULE GENERATOR PROCEDURE: sp_auto_generate_screen_schedule
-- Corrected algorithm: checks 15-minute cleaning turnover interval against any
-- preserved booked shows to prevent trigger collisions during auto-scheduling.
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
    v_cand_start TIMESTAMP;
    v_cand_end TIMESTAMP;
    v_has_conflict BOOLEAN;
BEGIN
    SELECT duration INTO v_duration FROM movies WHERE movie_id = p_movie_id;
    IF v_duration IS NULL OR v_duration <= 0 THEN
        v_duration := 120;
    END IF;

    -- If replace_existing is requested, delete only unbooked shows for screen & date
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

        -- Physical coordinates of candidate slot
        IF v_time_str < '06:00:00'::TIME THEN
            v_cand_start := (p_date + INTERVAL '1 day')::DATE + v_time_str;
        ELSE
            v_cand_start := p_date + v_time_str;
        END IF;
        v_cand_end := v_cand_start + (v_duration || ' minutes')::INTERVAL;

        -- Check whether an existing show on this screen conflicts (requires 15-min turnover)
        SELECT EXISTS (
            SELECT 1 FROM shows s
            JOIN movies m ON s.movie_id = m.movie_id
            WHERE s.screen_id = p_screen_id
              AND s.show_date BETWEEN (p_date - INTERVAL '1 day')::DATE AND (p_date + INTERVAL '1 day')::DATE
              AND (
                  v_cand_start < (
                      (CASE WHEN s.show_time < '06:00:00'::TIME THEN (s.show_date + INTERVAL '1 day')::DATE ELSE s.show_date END + s.show_time)
                      + (COALESCE(m.duration, 120) || ' minutes')::INTERVAL + INTERVAL '15 minutes'
                  )
                  AND
                  (CASE WHEN s.show_time < '06:00:00'::TIME THEN (s.show_date + INTERVAL '1 day')::DATE ELSE s.show_date END + s.show_time)
                  < (v_cand_end + INTERVAL '15 minutes')
              )
        ) INTO v_has_conflict;

        IF NOT v_has_conflict THEN
            v_new_show_id := generate_show_id();
            INSERT INTO shows (show_id, movie_id, screen_id, show_date, show_time, format, ticket_price)
            VALUES (v_new_show_id, p_movie_id, p_screen_id, p_date, v_time_str, p_format, p_ticket_price);
            v_generated_count := v_generated_count + 1;
        END IF;

        -- Advance start time by runtime + 15 minutes turnover
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
-- 12. SECURE AUTHENTICATION LINKAGE: sp_link_current_user_profile
-- Security:
--  * Requires verified email in auth.users (email_confirmed_at IS NOT NULL).
--  * Protects against race conditions via FOR UPDATE row lock and exception handling.
--  * Prevents profile takeover if already claimed by another user account.
--  * Accurately updates and returns customer profile info.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_link_current_user_profile()
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_user_email TEXT;
    v_email_confirmed TIMESTAMPTZ;
    v_cust RECORD;
    v_already_linked RECORD;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication Error: You must be signed in to link your profile.';
    END IF;

    SELECT email, email_confirmed_at INTO v_user_email, v_email_confirmed
    FROM auth.users
    WHERE id = v_user_id;

    IF v_user_email IS NULL THEN
        RAISE EXCEPTION 'Security Error: User account email could not be resolved.';
    END IF;

    -- Strict verification gate: email must be confirmed in Supabase Auth
    IF v_email_confirmed IS NULL THEN
        RAISE EXCEPTION 'Verification Required: You must verify your email address (%) before linking to your customer profile.', v_user_email;
    END IF;

    v_user_email := LOWER(TRIM(v_user_email));

    -- Ensure caller does not already hold a customer profile under a different email
    SELECT * INTO v_already_linked FROM customers WHERE auth_user_id = v_user_id;
    IF FOUND AND LOWER(TRIM(v_already_linked.email)) <> v_user_email THEN
        RAISE EXCEPTION 'Security Violation: Your authenticated account is already linked to customer profile % (%).',
            v_already_linked.customer_id, v_already_linked.email;
    END IF;

    -- Lock matching customer record if it exists
    SELECT * INTO v_cust FROM customers WHERE LOWER(TRIM(email)) = v_user_email FOR UPDATE;
    IF NOT FOUND THEN
        BEGIN
            INSERT INTO customers (customer_id, auth_user_id, customer_name, email, phone)
            VALUES (
                generate_customer_id(),
                v_user_id,
                COALESCE((SELECT raw_user_meta_data->>'full_name' FROM auth.users WHERE id = v_user_id), 'Customer'),
                v_user_email,
                COALESCE((SELECT raw_user_meta_data->>'phone' FROM auth.users WHERE id = v_user_id), '')
            )
            RETURNING * INTO v_cust;
        EXCEPTION WHEN unique_violation THEN
            -- Concurrent insert race handled: lock the row that won the race
            SELECT * INTO v_cust FROM customers WHERE LOWER(TRIM(email)) = v_user_email FOR UPDATE;
            IF v_cust.auth_user_id IS NOT NULL AND v_cust.auth_user_id <> v_user_id THEN
                RAISE EXCEPTION 'Security Violation: This customer profile is already linked to another verified account.';
            END IF;
            UPDATE customers
            SET auth_user_id = v_user_id
            WHERE customer_id = v_cust.customer_id
            RETURNING * INTO v_cust;
        END;
    ELSE
        IF v_cust.auth_user_id IS NOT NULL AND v_cust.auth_user_id <> v_user_id THEN
            RAISE EXCEPTION 'Security Violation: This customer profile is already linked to another verified account.';
        END IF;

        -- Securely link profile and retrieve updated record
        UPDATE customers
        SET auth_user_id = v_user_id
        WHERE customer_id = v_cust.customer_id
        RETURNING * INTO v_cust;
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
-- 13. NARROWLY SCOPED VIEW REPLACEMENT (WITHOUT CASCADE)
-- Drops only the specific views in leaf-first dependency order to avoid schema locks
-- or column-signature mismatch errors, then recreates with security_invoker = true.
-- ------------------------------------------------------------------------------
DROP VIEW IF EXISTS "TICKET_DETAILS";
DROP VIEW IF EXISTS ticket_details_view;

DROP VIEW IF EXISTS "THEATER";
DROP VIEW IF EXISTS "SCREEN";
DROP VIEW IF EXISTS "MOVIE";
DROP VIEW IF EXISTS "SHOWS";
DROP VIEW IF EXISTS "SEAT";
DROP VIEW IF EXISTS "CUSTOMER";
DROP VIEW IF EXISTS "BOOKING";
DROP VIEW IF EXISTS "BOOKED_SEAT";
DROP VIEW IF EXISTS "PAYMENT";

-- Canonical ticket_details_view with security_invoker = true
CREATE VIEW ticket_details_view 
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

-- Backward-compatible relational views with security_invoker = true
CREATE VIEW "THEATER" WITH (security_invoker = true) AS SELECT theater_id AS "Theater_ID", theater_name AS "Theater_Name", city AS "City", state AS "State", country AS "Country" FROM theaters;
CREATE VIEW "SCREEN" WITH (security_invoker = true) AS SELECT screen_id AS "Screen_ID", theater_id AS "Theater_ID", screen_number AS "Screen_Number", screen_name AS "Screen_Name", screen_type AS "Screen_Type", capacity AS "Capacity", projection_tech AS "Projection_Tech", audio_tech AS "Audio_Tech", verification_status AS "Verification_Status" FROM screens;
CREATE VIEW "MOVIE" WITH (security_invoker = true) AS SELECT movie_id AS "Movie_ID", movie_name AS "Movie_Name", genre AS "Genre", rating AS "Rating", duration AS "Duration", language AS "Language", synopsis AS "Synopsis", cast_members AS "Cast" FROM movies;
CREATE VIEW "SHOWS" WITH (security_invoker = true) AS SELECT show_id AS "Show_ID", movie_id AS "Movie_ID", screen_id AS "Screen_ID", show_date AS "Show_Date", show_time AS "Show_Time", format AS "Format", ticket_price AS "Ticket_Price" FROM shows;
CREATE VIEW "SEAT" WITH (security_invoker = true) AS SELECT seat_id AS "Seat_ID", screen_id AS "Screen_ID", seat_number AS "Seat_Number", seat_type AS "Seat_Type" FROM seats;
CREATE VIEW "CUSTOMER" WITH (security_invoker = true) AS SELECT customer_id AS "Customer_ID", customer_name AS "Customer_Name", email AS "Email", phone AS "Phone" FROM customers;
CREATE VIEW "BOOKING" WITH (security_invoker = true) AS SELECT booking_id AS "Booking_ID", customer_id AS "Customer_ID", show_id AS "Show_ID", booking_date AS "Booking_Date", ticket_price AS "Ticket_Price", format AS "Format", status AS "Status" FROM bookings;
CREATE VIEW "BOOKED_SEAT" WITH (security_invoker = true) AS SELECT booking_id AS "Booking_ID", seat_id AS "Seat_ID", show_id AS "Show_ID", status AS "Status" FROM booked_seats;
CREATE VIEW "PAYMENT" WITH (security_invoker = true) AS SELECT payment_id AS "Payment_ID", booking_id AS "Booking_ID", payment_mode AS "Payment_Mode", amount AS "Amount", payment_date AS "Payment_Date", status AS "Status" FROM payments;
CREATE VIEW "TICKET_DETAILS" WITH (security_invoker = true) AS SELECT * FROM ticket_details_view;

-- ------------------------------------------------------------------------------
-- 14. ROW LEVEL SECURITY (RLS) SYNCHRONIZATION
-- Drops existing policies individually and recreates canonical policies.
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

DROP POLICY IF EXISTS "Public theaters are readable by everyone" ON theaters;
DROP POLICY IF EXISTS "Public screens are readable by everyone" ON screens;
DROP POLICY IF EXISTS "Public movies are readable by everyone" ON movies;
DROP POLICY IF EXISTS "Public shows are readable by everyone" ON shows;
DROP POLICY IF EXISTS "Public seats are readable by everyone" ON seats;
DROP POLICY IF EXISTS "Public booked_seats readable for availability" ON booked_seats;
DROP POLICY IF EXISTS "Customers can view their own profile" ON customers;
DROP POLICY IF EXISTS "Customers can update their own profile" ON customers;
DROP POLICY IF EXISTS "Customers can view their own bookings" ON bookings;
DROP POLICY IF EXISTS "Customers can view their own payments" ON payments;

-- Public Catalog Browsing Policies
CREATE POLICY "Public theaters are readable by everyone" ON theaters FOR SELECT USING (true);
CREATE POLICY "Public screens are readable by everyone" ON screens FOR SELECT USING (true);
CREATE POLICY "Public movies are readable by everyone" ON movies FOR SELECT USING (true);
CREATE POLICY "Public shows are readable by everyone" ON shows FOR SELECT USING (true);
CREATE POLICY "Public seats are readable by everyone" ON seats FOR SELECT USING (true);
CREATE POLICY "Public booked_seats readable for availability" ON booked_seats FOR SELECT USING (true);

-- Customer Isolation Policies (strict auth.uid() scoping)
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
-- 15. POSTGREST API ROLE GRANTS & REVOKES
-- Principle of Least Privilege:
--  * Public visitors (anon) can read catalog, screens, shows, and seat availability.
--  * Customer personal records and views are strictly restricted to authenticated users.
--  * Direct sequence and trigger execution revoked from clients.
-- ------------------------------------------------------------------------------
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Public Catalog: Readable by everyone
GRANT SELECT ON theaters, screens, movies, shows, seats, booked_seats TO anon, authenticated;
GRANT SELECT ON "THEATER", "SCREEN", "MOVIE", "SHOWS", "SEAT" TO anon, authenticated;

-- Customer Private Data: Strictly authenticated with RLS
GRANT SELECT, UPDATE ON customers TO authenticated;
GRANT SELECT ON bookings, payments TO authenticated;
GRANT SELECT ON ticket_details_view, "TICKET_DETAILS", "CUSTOMER", "BOOKING", "BOOKED_SEAT", "PAYMENT" TO authenticated;

-- Revoke private tables & views from anon and public
REVOKE SELECT ON customers, bookings, payments FROM anon, PUBLIC;
REVOKE SELECT ON ticket_details_view, "TICKET_DETAILS", "CUSTOMER", "BOOKING", "PAYMENT" FROM anon, PUBLIC;

-- Stored Procedures:
-- sp_book_ticket_transaction is callable by anon (guest checkout) and authenticated
GRANT EXECUTE ON FUNCTION sp_book_ticket_transaction TO anon, authenticated;

-- sp_cancel_booking and sp_link_current_user_profile require authenticated session
REVOKE EXECUTE ON FUNCTION sp_cancel_booking, sp_link_current_user_profile FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION sp_cancel_booking, sp_link_current_user_profile TO authenticated;

-- Administrative schedule generator revoked from public and API clients
REVOKE EXECUTE ON FUNCTION sp_auto_generate_screen_schedule FROM PUBLIC, anon, authenticated;

-- Internal ID generators revoked from public and API clients (called via SECURITY DEFINER)
REVOKE EXECUTE ON FUNCTION generate_booking_id, generate_payment_id, generate_customer_id, generate_show_id FROM PUBLIC, anon, authenticated;

-- Trigger functions revoked from direct RPC execution
REVOKE EXECUTE ON FUNCTION fn_trg_prevent_double_booking, fn_trg_validate_seat_screen, fn_trg_validate_show_schedule FROM PUBLIC, anon, authenticated;

-- Sequences revoked from direct client selection/manipulation
REVOKE USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public FROM PUBLIC, anon, authenticated;

-- ------------------------------------------------------------------------------
-- 16. DEEP POST-CONDITION VALIDATION & ASSERTIONS
-- Validates actual object definitions: partial unique index predicate, active triggers,
-- view security_invoker options, and active policies before committing.
-- ------------------------------------------------------------------------------
DO $$
DECLARE
    v_missing_views TEXT;
    v_missing_invoker TEXT;
    v_missing_triggers TEXT;
    v_missing_policies TEXT;
    v_index_predicate_ok BOOLEAN;
BEGIN
    -- 16.1 Check View Existence
    SELECT STRING_AGG(v, ', ') INTO v_missing_views
    FROM (
        SELECT UNNEST(ARRAY[
            'ticket_details_view', 'THEATER', 'SCREEN', 'MOVIE', 'SHOWS',
            'SEAT', 'CUSTOMER', 'BOOKING', 'BOOKED_SEAT', 'PAYMENT', 'TICKET_DETAILS'
        ]) AS v
    ) t
    WHERE NOT EXISTS (
        SELECT 1 FROM information_schema.views 
        WHERE table_schema = 'public' AND table_name = t.v
    );

    IF v_missing_views IS NOT NULL THEN
        RAISE EXCEPTION 'Repair Post-condition Failed: Missing views: %', v_missing_views;
    END IF;

    -- 16.2 Check security_invoker = true option on all 11 views
    SELECT STRING_AGG(c.relname, ', ') INTO v_missing_invoker
    FROM pg_class c
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = 'public'
      AND c.relkind = 'v'
      AND c.relname IN (
          'ticket_details_view', 'THEATER', 'SCREEN', 'MOVIE', 'SHOWS',
          'SEAT', 'CUSTOMER', 'BOOKING', 'BOOKED_SEAT', 'PAYMENT', 'TICKET_DETAILS'
      )
      AND NOT (c.reloptions::TEXT ILIKE '%security_invoker=true%');

    IF v_missing_invoker IS NOT NULL THEN
        RAISE EXCEPTION 'Repair Post-condition Failed: Views lacking security_invoker=true: %', v_missing_invoker;
    END IF;

    -- 16.3 Check Partial Unique Index Predicate on booked_seats
    SELECT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE schemaname = 'public' 
          AND tablename = 'booked_seats' 
          AND indexname = 'uq_active_show_seat'
          AND indexdef ILIKE '%status%CONFIRMED%'
    ) INTO v_index_predicate_ok;

    IF NOT v_index_predicate_ok THEN
        RAISE EXCEPTION 'Repair Post-condition Failed: Partial unique index uq_active_show_seat missing or predicate invalid.';
    END IF;

    -- 16.4 Check Active Triggers
    SELECT STRING_AGG(trg, ', ') INTO v_missing_triggers
    FROM (
        SELECT UNNEST(ARRAY[
            'trg_prevent_double_booking',
            'trg_validate_seat_screen',
            'trg_validate_show_schedule'
        ]) AS trg
    ) t
    WHERE NOT EXISTS (
        SELECT 1 FROM pg_trigger tg
        JOIN pg_class c ON tg.tgrelid = c.oid
        JOIN pg_namespace n ON c.relnamespace = n.oid
        WHERE n.nspname = 'public' AND tg.tgname = t.trg AND tg.tgenabled = 'O'
    );

    IF v_missing_triggers IS NOT NULL THEN
        RAISE EXCEPTION 'Repair Post-condition Failed: Inactive or missing triggers: %', v_missing_triggers;
    END IF;

    -- 16.5 Check Active RLS Policies
    SELECT STRING_AGG(pol, ', ') INTO v_missing_policies
    FROM (
        SELECT UNNEST(ARRAY[
            'Public theaters are readable by everyone',
            'Public screens are readable by everyone',
            'Public movies are readable by everyone',
            'Public shows are readable by everyone',
            'Public seats are readable by everyone',
            'Public booked_seats readable for availability',
            'Customers can view their own profile',
            'Customers can update their own profile',
            'Customers can view their own bookings',
            'Customers can view their own payments'
        ]) AS pol
    ) t
    WHERE NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' AND policyname = t.pol
    );

    IF v_missing_policies IS NOT NULL THEN
        RAISE EXCEPTION 'Repair Post-condition Failed: Missing RLS policies: %', v_missing_policies;
    END IF;

    RAISE NOTICE 'Repair Verification Succeeded: All schemas, constraints, indexes, views, triggers, and policies verified.';
END $$;

COMMIT;
