-- ==============================================================================
-- MOVIE TICKET RESERVATION SYSTEM (MTRS)
-- Migration: 20261030000001_admin_and_shared_management.sql
-- Description: Corrected, Idempotent, Non-Destructive Cinema Management Migration.
--              1. Adds status column to public.movies ('Active', 'Archived').
--              2. Installs monotonic sequence, admin registry & generator (dependency-ordered).
--              3. Configures admin registry isolation and view policies.
--              4. Installs targeted RLS policies (active movie catalogue, admin writes, show checks).
--              5. Installs safe administrative archival procedures with strict input validation.
--              6. Enforces booking lifecycle integrity (rejects reservations for archived movies).
--              7. Extends compatibility view "MOVIE" (preserves positions 1-8).
--              8. Grants minimal least-privilege PostgREST API permissions.
-- ==============================================================================

BEGIN;

-- ------------------------------------------------------------------------------
-- 1. EXTEND MOVIES TABLE WITH STATUS COLUMN FOR SAFE ARCHIVING
-- ------------------------------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'movies'
          AND column_name = 'status'
    ) THEN
        ALTER TABLE public.movies
        ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'Active'
        CHECK (status IN ('Active', 'Archived'));

        COMMENT ON COLUMN public.movies.status IS
            'Lifecycle state: Active releases appear in public catalogue; Archived releases preserve past bookings.';
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_movies_status ON public.movies(status);

-- ------------------------------------------------------------------------------
-- 2. MONOTONIC MOVIE ID SEQUENCE, ADMIN REGISTRY & GENERATOR
--    - Guarantees atomic, collision-free M07, M08... IDs matching existing schema pattern.
--    - Dependency order: admin_users -> is_admin() -> generate_movie_id().
--    - Idempotent: Never rewinds an already-advanced sequence upon re-execution.
-- ------------------------------------------------------------------------------
CREATE SEQUENCE IF NOT EXISTS public.movie_id_seq START WITH 7;

DO $$
DECLARE
    v_max_id INT;
    v_seq_last_val INT;
BEGIN
    -- Extract highest numeric ID matching standard '^M[0-9]+$' pattern
    SELECT COALESCE(MAX(NULLIF(SUBSTRING(movie_id FROM '^M([0-9]+)$'), '')::INT), 6)
    INTO v_max_id
    FROM public.movies;

    -- Read current sequence state if sequence already exists and was called
    SELECT last_value INTO v_seq_last_val
    FROM pg_sequences
    WHERE schemaname = 'public' AND sequencename = 'movie_id_seq';

    -- Set sequence to highest of: max existing movie ID, current sequence value, or baseline 6
    -- Setting is_called = true ensures nextval() returns GREATEST(...) + 1
    PERFORM setval('public.movie_id_seq', GREATEST(v_max_id, COALESCE(v_seq_last_val, 6), 6), true);
END $$;

-- A. Administrator Registry Table (Required by is_admin())
-- Strict isolation: No public or authenticated INSERT policy.
CREATE TABLE IF NOT EXISTS public.admin_users (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    role VARCHAR(30) NOT NULL DEFAULT 'super_admin' CHECK (role IN ('super_admin', 'cinema_manager')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- B. Safe is_admin() Authorization Helper (Required by generate_movie_id())
-- STABLE + SECURITY DEFINER with fixed search_path to prevent recursion & escalation.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    IF auth.uid() IS NULL THEN
        RETURN FALSE;
    END IF;

    RETURN EXISTS (
        SELECT 1
        FROM public.admin_users
        WHERE user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public, auth, pg_temp;

-- C. Movie ID Generator Function
-- Guarantees non-truncating IDs for values below and beyond M99.
CREATE OR REPLACE FUNCTION public.generate_movie_id()
RETURNS VARCHAR(10) AS $$
DECLARE
    next_val INT;
    candidate VARCHAR(10);
BEGIN
    -- Authorization guard: Prevent non-administrators from consuming sequence numbers
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access Denied: Only authenticated administrators can generate movie IDs.'
            USING ERRCODE = '42501';
    END IF;

    LOOP
        next_val := nextval('public.movie_id_seq');
        IF next_val < 100 THEN
            candidate := 'M' || LPAD(next_val::TEXT, 2, '0');
        ELSE
            candidate := 'M' || next_val::TEXT;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM public.movies WHERE movie_id = candidate) THEN
            RETURN candidate;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp;

-- Attach as column default: inserts that omit movie_id receive candidate ID automatically
ALTER TABLE public.movies ALTER COLUMN movie_id SET DEFAULT public.generate_movie_id();

-- ------------------------------------------------------------------------------
-- 3. RLS POLICIES FOR ADMIN REGISTRY
-- Only verified administrators can query administrator identities.
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admins can view admin registry" ON public.admin_users;
CREATE POLICY "Admins can view admin registry"
    ON public.admin_users
    FOR SELECT
    TO authenticated
    USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 6. TARGETED ROW LEVEL SECURITY & LIFECYCLE ACCESS POLICIES
--    - Enforces RLS on all catalogue tables (movies, shows, screens, theaters).
--    - Excludes archived movies from public catalogue browsing and "MOVIE" view.
--    - Preserves historical booking access for authenticated customers with past reservations.
--    - Permits verified administrators (is_admin()) full catalogue visibility & write control.
--    - Prohibits assigning 'Archived' movies to shows during both INSERT and UPDATE.
-- ------------------------------------------------------------------------------

-- Explicitly ensure Row Level Security is active on all catalogue tables
ALTER TABLE public.movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.screens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.theaters ENABLE ROW LEVEL SECURITY;

-- A. MOVIES (SELECT, INSERT, UPDATE) — Hard deletion is omitted to guarantee non-destructive archival
DROP POLICY IF EXISTS "Public movies are readable by everyone" ON public.movies;
DROP POLICY IF EXISTS "Allow public read access to movies" ON public.movies;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.movies;
DROP POLICY IF EXISTS "Public can view active movies" ON public.movies;
DROP POLICY IF EXISTS "Admins can view all movies" ON public.movies;
DROP POLICY IF EXISTS "Customers can view archived movies for booked shows" ON public.movies;
DROP POLICY IF EXISTS "Admins can insert movies" ON public.movies;
DROP POLICY IF EXISTS "Admins can update movies" ON public.movies;

-- 1. Public browsing: Excludes archived movies from public catalogue and "MOVIE" view
CREATE POLICY "Public can view active movies" ON public.movies
    FOR SELECT
    TO anon, authenticated
    USING (status = 'Active');

-- 2. Administrator visibility: Complete catalogue visibility for cinema management
CREATE POLICY "Admins can view all movies" ON public.movies
    FOR SELECT
    TO authenticated
    USING (public.is_admin());

-- 3. Historical booking preservation: Customers can view archived titles for their past bookings
CREATE POLICY "Customers can view archived movies for booked shows" ON public.movies
    FOR SELECT TO authenticated
    USING (
        status = 'Archived'
        AND auth.uid() IS NOT NULL
        AND EXISTS (
            SELECT 1
            FROM public.shows sh
            JOIN public.bookings b ON b.show_id = sh.show_id
            JOIN public.customers c ON b.customer_id = c.customer_id
            WHERE sh.movie_id = movies.movie_id
              AND c.auth_user_id = auth.uid()
        )
    );

-- 4. Managed writes (admin only; deletion prohibited to ensure non-destructive archival)
CREATE POLICY "Admins can insert movies" ON public.movies
    FOR INSERT TO authenticated
    WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update movies" ON public.movies
    FOR UPDATE TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- B. SHOWS (INSERT, UPDATE, DELETE for unbooked schedule turnover)
DROP POLICY IF EXISTS "Admins can insert shows" ON public.shows;
CREATE POLICY "Admins can insert shows" ON public.shows
    FOR INSERT TO authenticated
    WITH CHECK (
        public.is_admin()
        AND EXISTS (
            SELECT 1 FROM public.movies m
            WHERE m.movie_id = shows.movie_id
              AND m.status = 'Active'
        )
    );

DROP POLICY IF EXISTS "Admins can update shows" ON public.shows;
CREATE POLICY "Admins can update shows" ON public.shows
    FOR UPDATE TO authenticated
    USING (public.is_admin())
    WITH CHECK (
        public.is_admin()
        AND EXISTS (
            SELECT 1 FROM public.movies m
            WHERE m.movie_id = shows.movie_id
              AND m.status = 'Active'
        )
    );

DROP POLICY IF EXISTS "Admins can delete shows" ON public.shows;
CREATE POLICY "Admins can delete shows" ON public.shows
    FOR DELETE TO authenticated
    USING (public.is_admin());

-- C. SCREENS (INSERT, UPDATE, DELETE)
DROP POLICY IF EXISTS "Admins can insert screens" ON public.screens;
CREATE POLICY "Admins can insert screens" ON public.screens
    FOR INSERT TO authenticated
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can update screens" ON public.screens;
CREATE POLICY "Admins can update screens" ON public.screens
    FOR UPDATE TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete screens" ON public.screens;
CREATE POLICY "Admins can delete screens" ON public.screens
    FOR DELETE TO authenticated
    USING (public.is_admin());

-- D. THEATERS (INSERT, UPDATE, DELETE)
DROP POLICY IF EXISTS "Admins can insert theaters" ON public.theaters;
CREATE POLICY "Admins can insert theaters" ON public.theaters
    FOR INSERT TO authenticated
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can update theaters" ON public.theaters;
CREATE POLICY "Admins can update theaters" ON public.theaters
    FOR UPDATE TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete theaters" ON public.theaters;
CREATE POLICY "Admins can delete theaters" ON public.theaters
    FOR DELETE TO authenticated
    USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 7. SAFE ADMINISTRATIVE MOVIE ARCHIVAL PROCEDURES
-- Completely eliminates destructive hard-deletion risk; preserves all bookings.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sp_admin_set_movie_status(
    p_movie_id VARCHAR(10),
    p_status VARCHAR(20)
)
RETURNS JSONB AS $$
DECLARE
    v_movie_name VARCHAR(100);
    v_old_status VARCHAR(20);
    v_show_count INT;
BEGIN
    -- 1. Authorization check
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access Denied: Only authenticated administrators can modify movie lifecycle status.'
            USING ERRCODE = '42501';
    END IF;

    -- 2. Input validation
    IF p_movie_id IS NULL OR TRIM(p_movie_id) = '' THEN
        RAISE EXCEPTION 'Validation Error: Movie ID is required and cannot be null or empty.'
            USING ERRCODE = '22023';
    END IF;

    IF p_status IS NULL OR TRIM(p_status) = '' THEN
        RAISE EXCEPTION 'Validation Error: Status is required and cannot be null or empty.'
            USING ERRCODE = '22023';
    END IF;

    IF p_status NOT IN ('Active', 'Archived') THEN
        RAISE EXCEPTION 'Validation Error: Status must be either "Active" or "Archived". Received: %', p_status
            USING ERRCODE = '22023';
    END IF;

    -- 3. Check movie existence and read current state
    SELECT movie_name, status
    INTO v_movie_name, v_old_status
    FROM public.movies
    WHERE movie_id = p_movie_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Entity Not Found: Movie % does not exist.', p_movie_id
            USING ERRCODE = 'P0002';
    END IF;

    -- 4. Count associated shows (audit telemetry)
    SELECT COUNT(*) INTO v_show_count
    FROM public.shows
    WHERE movie_id = p_movie_id;

    -- 5. Safe non-destructive update
    UPDATE public.movies
    SET status = p_status
    WHERE movie_id = p_movie_id;

    RETURN jsonb_build_object(
        'success', true,
        'movie_id', p_movie_id,
        'movie_name', v_movie_name,
        'previous_status', v_old_status,
        'new_status', p_status,
        'shows_preserved', v_show_count,
        'message', format('Movie "%s" (%s) status successfully updated to %s.', v_movie_name, p_movie_id, p_status)
    );
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp;

-- Dedicated shorthand procedure for archival
CREATE OR REPLACE FUNCTION public.sp_admin_archive_movie(p_movie_id VARCHAR(10))
RETURNS JSONB AS $$
BEGIN
    RETURN public.sp_admin_set_movie_status(p_movie_id, 'Archived');
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp;

-- ------------------------------------------------------------------------------
-- 8. BOOKING LIFECYCLE INTEGRITY: PREVENT NEW BOOKINGS FOR ARCHIVED MOVIES
--    - Enforces that no new reservations can be created for shows of archived movies.
--    - Preserves all historical bookings, payments, booked seats, and ticket details.
--    - Two-layer defense:
--        1. Upfront validation inside sp_book_ticket_transaction.
--        2. BEFORE INSERT trigger on public.bookings to guard any alternate insert path.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sp_book_ticket_transaction(
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
            SELECT 1 FROM public.customers
            WHERE customer_id = p_customer_id
              AND (auth_user_id = v_user_auth_id OR auth_user_id IS NULL)
        ) THEN
            RAISE EXCEPTION 'Authorization Error: You do not have permission to book for customer %.', p_customer_id;
        END IF;
    END IF;

    -- Validate customer existence
    IF NOT EXISTS (SELECT 1 FROM public.customers WHERE customer_id = p_customer_id) THEN
        RAISE EXCEPTION 'Integrity Error: Customer % does not exist.', p_customer_id;
    END IF;

    -- 2. Validate show existence and lock show row for update (prevents concurrent race conditions)
    SELECT * INTO v_show FROM public.shows WHERE show_id = p_show_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Integrity Error: Show % does not exist.', p_show_id;
    END IF;

    -- Validate that the associated movie is Active (reject bookings for archived movies)
    IF EXISTS (
        SELECT 1 FROM public.movies
        WHERE movie_id = v_show.movie_id
          AND status = 'Archived'
    ) THEN
        RAISE EXCEPTION 'Validation Error: Cannot book tickets for an archived movie.'
            USING ERRCODE = '22023';
    END IF;

    -- 3. Validate seat selection
    IF p_seat_ids IS NULL OR array_length(p_seat_ids, 1) = 0 THEN
        RAISE EXCEPTION 'Validation Error: At least one seat must be selected for booking.';
    END IF;

    -- 4. Resolve unique Booking_ID and Payment_ID
    IF p_booking_id IS NOT NULL AND TRIM(p_booking_id) <> '' THEN
        IF EXISTS (SELECT 1 FROM public.bookings WHERE booking_id = p_booking_id) THEN
            RAISE EXCEPTION 'Primary Key Violation: Booking ID % already exists.', p_booking_id;
        END IF;
        v_booking_id := TRIM(p_booking_id);
    ELSE
        v_booking_id := public.generate_booking_id();
    END IF;

    IF p_payment_id IS NOT NULL AND TRIM(p_payment_id) <> '' THEN
        IF EXISTS (SELECT 1 FROM public.payments WHERE payment_id = p_payment_id) THEN
            RAISE EXCEPTION 'Primary Key Violation: Payment ID % already exists.', p_payment_id;
        END IF;
        v_payment_id := TRIM(p_payment_id);
    ELSE
        v_payment_id := public.generate_payment_id();
    END IF;

    -- 5. Insert Booking
    INSERT INTO public.bookings (booking_id, customer_id, show_id, booking_date, ticket_price, format, status)
    VALUES (v_booking_id, p_customer_id, p_show_id, NOW(), p_ticket_price, p_format, 'CONFIRMED');

    -- 6. Insert Booked Seats (Includes show_id; Triggers & Unique Index guard against double booking)
    FOREACH v_seat_id IN ARRAY p_seat_ids LOOP
        INSERT INTO public.booked_seats (booking_id, seat_id, show_id, status)
        VALUES (v_booking_id, v_seat_id, p_show_id, 'CONFIRMED');
    END LOOP;

    -- 7. Insert Payment
    INSERT INTO public.payments (payment_id, booking_id, payment_mode, amount, payment_date, status)
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

-- Defense-in-depth trigger on public.bookings: blocks any direct or alternative insert path
CREATE OR REPLACE FUNCTION public.fn_trg_prevent_booking_archived_movie()
RETURNS TRIGGER AS $$
DECLARE
    v_movie_status VARCHAR(20);
BEGIN
    SELECT m.status INTO v_movie_status
    FROM public.shows s
    JOIN public.movies m ON s.movie_id = m.movie_id
    WHERE s.show_id = NEW.show_id;

    IF v_movie_status = 'Archived' THEN
        RAISE EXCEPTION 'Booking Rejected: The movie for show % is archived and no longer accepting bookings.', NEW.show_id
            USING ERRCODE = '22023';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp;

DROP TRIGGER IF EXISTS trg_prevent_booking_archived_movie ON public.bookings;
CREATE TRIGGER trg_prevent_booking_archived_movie
BEFORE INSERT ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.fn_trg_prevent_booking_archived_movie();

-- ------------------------------------------------------------------------------
-- 9. EXTEND COMPATIBILITY VIEW "MOVIE"
-- Preserves positions 1-8; appends new columns strictly at positions 9-13.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE VIEW "MOVIE" WITH (security_invoker = true) AS
SELECT
    movie_id AS "Movie_ID",
    movie_name AS "Movie_Name",
    genre AS "Genre",
    rating AS "Rating",
    duration AS "Duration",
    language AS "Language",
    synopsis AS "Synopsis",
    cast_members AS "Cast",
    status AS "Status",
    poster_url AS "Poster_Url",
    poster_hires_url AS "Poster_Hires_Url",
    backdrop_url AS "Backdrop_Url",
    created_at AS "Created_At"
FROM public.movies;

-- ------------------------------------------------------------------------------
-- 10. POSTGREST LEAST-PRIVILEGE API GRANTS & COMPREHENSIVE REVOCATIONS
-- Corrects live database finding: Strips residual TRUNCATE, DELETE, and anon writes.
-- ------------------------------------------------------------------------------

-- Step 1: Revoke all existing column-level privileges from catalog tables
DO $$
DECLARE
    col RECORD;
BEGIN
    FOR col IN (
        SELECT DISTINCT table_schema, table_name, column_name, grantee, privilege_type
        FROM information_schema.column_privileges
        WHERE table_schema = 'public'
          AND table_name IN ('movies', 'shows', 'screens', 'theaters', 'admin_users')
          AND UPPER(grantee) IN ('PUBLIC', 'ANON', 'AUTHENTICATED')
    ) LOOP
        IF UPPER(col.grantee) = 'PUBLIC' THEN
            EXECUTE format(
                'REVOKE %s (%I) ON TABLE %I.%I FROM PUBLIC;',
                col.privilege_type,
                col.column_name,
                col.table_schema,
                col.table_name
            );
        ELSE
            EXECUTE format(
                'REVOKE %s (%I) ON TABLE %I.%I FROM %I;',
                col.privilege_type,
                col.column_name,
                col.table_schema,
                col.table_name,
                col.grantee
            );
        END IF;
    END LOOP;
END $$;

-- Step 2: Strip ALL existing table-level privileges from catalog tables
-- Eliminates dangerous residual TRUNCATE, DELETE, and anon writes from live database
REVOKE ALL ON TABLE public.movies, public.shows, public.screens, public.theaters FROM PUBLIC, anon, authenticated;

-- Step 3: Grant read-only browsing access to public visitors and authenticated customers
GRANT SELECT ON public.movies, public.shows, public.screens, public.theaters TO anon, authenticated;

-- Step 4: Grant managed write access to authenticated users (STRICTLY GATED by RLS is_admin())
-- Note: DELETE is intentionally omitted from movies to guarantee non-destructive archival.
GRANT INSERT, UPDATE ON public.movies TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.shows, public.screens, public.theaters TO authenticated;

-- Step 5: Admin registry and compatibility view permissions
-- Strictly isolates admin_users: zero write grants to client roles
REVOKE ALL ON TABLE public.admin_users FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.admin_users TO authenticated;

REVOKE ALL ON "MOVIE" FROM PUBLIC, anon, authenticated;
GRANT SELECT ON "MOVIE" TO anon, authenticated;

-- Step 6: Procedure execution permissions with explicit signatures
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;

REVOKE ALL ON FUNCTION public.sp_admin_set_movie_status(VARCHAR, VARCHAR) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sp_admin_set_movie_status(VARCHAR, VARCHAR) TO authenticated;

REVOKE ALL ON FUNCTION public.sp_admin_archive_movie(VARCHAR) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sp_admin_archive_movie(VARCHAR) TO authenticated;

-- Step 7: Booking procedures execution permissions (Preserved)
GRANT EXECUTE ON FUNCTION public.sp_book_ticket_transaction(VARCHAR, VARCHAR, VARCHAR, DECIMAL, VARCHAR, DECIMAL, TEXT[], VARCHAR, VARCHAR) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sp_cancel_booking(VARCHAR, VARCHAR) TO authenticated;

-- Step 8: Sequence generator execution permissions (gated internally by is_admin())
REVOKE ALL ON FUNCTION public.generate_movie_id() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.generate_movie_id() TO authenticated;
REVOKE ALL ON SEQUENCE public.movie_id_seq FROM PUBLIC, anon, authenticated;

-- Step 9: Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';

COMMIT;
