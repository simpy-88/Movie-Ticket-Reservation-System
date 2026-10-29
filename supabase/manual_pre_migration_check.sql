-- ==============================================================================
-- MOVIE TICKET RESERVATION SYSTEM (MTRS)
-- File: supabase/manual_pre_migration_check.sql
-- Description: Read-Only Pre-Flight Inspection Script.
--              Execute in Supabase SQL Editor BEFORE applying Phase 1 Migration.
--              GUARANTEE: Modifies ZERO rows, creates ZERO objects, advances NO sequences.
-- ==============================================================================

-- 1. BASE TABLE EXISTENCE CHECK (Verify all 9 operational tables exist)
SELECT
    expected.table_name,
    CASE WHEN t.table_name IS NOT NULL THEN 'EXISTS' ELSE 'MISSING' END AS status
FROM (
    VALUES
        ('movies'), ('shows'), ('screens'), ('theaters'),
        ('customers'), ('bookings'), ('booked_seats'), ('payments'),
        ('booking_notifications')
) AS expected(table_name)
LEFT JOIN information_schema.tables t
    ON t.table_schema = 'public' AND t.table_name = expected.table_name
ORDER BY expected.table_name;

-- 2. INSPECT ALL EXISTING COLUMNS & DATA TYPES ON public.movies
SELECT
    column_name,
    ordinal_position,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'movies'
ORDER BY ordinal_position;

-- 3. INSPECT MOVIE ID PATTERNS AND CURRENT MAXIMUM NUMERIC SUFFIX (READ-ONLY)
-- Formats projected candidate safely for IDs below and beyond M99.
SELECT
    COUNT(*) AS total_movies_count,
    COUNT(CASE WHEN movie_id ~ '^M[0-9]+$' THEN 1 END) AS standard_pattern_count,
    COUNT(CASE WHEN movie_id !~ '^M[0-9]+$' THEN 1 END) AS non_standard_pattern_count,
    COALESCE(MAX(NULLIF(SUBSTRING(movie_id FROM '^M([0-9]+)$'), '')::INT), 0) AS max_numeric_suffix,
    CASE
        WHEN (GREATEST(COALESCE(MAX(NULLIF(SUBSTRING(movie_id FROM '^M([0-9]+)$'), '')::INT), 6), 6) + 1) < 100
            THEN 'M' || LPAD((GREATEST(COALESCE(MAX(NULLIF(SUBSTRING(movie_id FROM '^M([0-9]+)$'), '')::INT), 6), 6) + 1)::TEXT, 2, '0')
        ELSE 'M' || (GREATEST(COALESCE(MAX(NULLIF(SUBSTRING(movie_id FROM '^M([0-9]+)$'), '')::INT), 6), 6) + 1)::TEXT
    END AS projected_first_migration_candidate
FROM public.movies;

-- 4. CHECK IF 'movie_id_seq' SEQUENCE ALREADY EXISTS
SELECT
    sequence_name, start_value, minimum_value, maximum_value, increment
FROM information_schema.sequences
WHERE sequence_schema = 'public'
  AND sequence_name = 'movie_id_seq';

-- 5. CHECK EXISTING COLUMN DEFAULT ON movies.movie_id (CRITICAL FOR ROLLBACK RECORD)
SELECT
    table_name, column_name, column_default,
    CASE
        WHEN column_default IS NULL THEN 'NO_EXISTING_DEFAULT'
        ELSE 'HAS_EXISTING_DEFAULT'
    END AS baseline_default_state
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'movies'
  AND column_name = 'movie_id';

-- 6. CHECK IF 'admin_users' TABLE OR COLUMNS ALREADY EXIST
SELECT
    table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'admin_users';

-- 7. CHECK IF 'is_admin()' FUNCTION ALREADY EXISTS
SELECT
    routine_name, routine_type, security_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'is_admin';

-- 8. AUDIT EVERY CURRENT SELECT POLICY ON public.movies
SELECT
    schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'movies'
  AND cmd = 'SELECT'
ORDER BY policyname;

-- 8b. AUDIT ALL RLS POLICIES ACROSS CATALOG AND BOOKING TABLES
SELECT
    schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('movies', 'shows', 'screens', 'theaters', 'bookings', 'booked_seats', 'payments')
ORDER BY tablename, cmd;

-- 9. AUDIT TABLE-LEVEL GRANTS FOR 'authenticated' AND 'anon' (Detects TRUNCATE / write leaks)
SELECT
    table_name, grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND grantee IN ('anon', 'authenticated')
  AND table_name IN ('movies', 'shows', 'screens', 'theaters', 'customers', 'bookings', 'booked_seats', 'payments')
ORDER BY table_name, grantee, privilege_type;

-- 10. AUDIT COLUMN-LEVEL GRANTS (Detects residual column-level grants)
SELECT
    table_name, column_name, grantee, privilege_type
FROM information_schema.column_privileges
WHERE table_schema = 'public'
  AND grantee IN ('anon', 'authenticated', 'PUBLIC')
  AND table_name IN ('movies', 'shows', 'screens', 'theaters');

-- 11. AUDIT FOREIGN KEY DELETE CONSTRAINTS (Verify RESTRICT on bookings.show_id)
SELECT
    tc.constraint_name,
    tc.table_name AS source_table,
    kcu.column_name AS source_column,
    ccu.table_name AS referenced_table,
    ccu.column_name AS referenced_column,
    rc.delete_rule
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
JOIN information_schema.referential_constraints rc
    ON tc.constraint_name = rc.constraint_name AND tc.table_schema = rc.constraint_schema
JOIN information_schema.constraint_column_usage ccu
    ON rc.unique_constraint_name = ccu.constraint_name AND rc.constraint_schema = ccu.constraint_schema
WHERE tc.table_schema = 'public'
  AND tc.table_name IN ('shows', 'bookings', 'booked_seats', 'payments', 'booking_notifications')
ORDER BY tc.table_name, kcu.column_name;

-- 12. AUDIT COMPATIBILITY VIEW "MOVIE" DEFINITION (Inspect original columns, order, and view definition)
SELECT
    c.column_name,
    c.ordinal_position,
    c.data_type,
    v.view_definition IS NOT NULL AS has_definition
FROM information_schema.columns c
LEFT JOIN information_schema.views v
    ON v.table_schema = c.table_schema AND v.table_name = c.table_name
WHERE c.table_schema = 'public'
  AND c.table_name = 'MOVIE'
ORDER BY c.ordinal_position;

-- 13. AUDIT BOOKING STORED PROCEDURES (Confirm definitions, ownership, security definer)
SELECT
    p.proname AS procedure_name,
    p.prosecdef AS is_security_definer,
    pg_get_userbyid(p.proowner) AS owner_role,
    pg_get_function_identity_arguments(p.oid) AS argument_signature
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN ('sp_book_ticket_transaction', 'sp_cancel_booking', 'sp_link_current_user_profile')
ORDER BY p.proname;

-- 14. AUDIT TRIGGERS AND CONSTRAINTS INVOLVED IN BOOKING
SELECT
    t.tgname AS trigger_name,
    c.relname AS table_name,
    p.proname AS function_name,
    t.tgenabled AS is_enabled
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_proc p ON t.tgfoid = p.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public'
  AND c.relname IN ('bookings', 'booked_seats', 'shows')
  AND NOT t.tgisinternal
ORDER BY c.relname, t.tgname;

-- 14b. AUDIT UNIQUE CONSTRAINTS AND PRIMARY KEYS ON BOOKING TABLES
SELECT
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type
FROM information_schema.table_constraints tc
WHERE tc.table_schema = 'public'
  AND tc.table_name IN ('bookings', 'booked_seats', 'payments')
  AND tc.constraint_type IN ('PRIMARY KEY', 'FOREIGN KEY', 'UNIQUE')
ORDER BY tc.table_name, tc.constraint_name;

-- 15. AUDIT BASELINE RECORD COUNTS (Confirms existing booking and payment records)
SELECT
    'customers' AS entity, COUNT(*) AS live_records_count FROM public.customers
UNION ALL
SELECT 'bookings', COUNT(*) FROM public.bookings
UNION ALL
SELECT 'booked_seats', COUNT(*) FROM public.booked_seats
UNION ALL
SELECT 'payments', COUNT(*) FROM public.payments;

-- 16. AUDIT ticket_details_view DEFINITION
SELECT
    table_name, view_definition IS NOT NULL AS has_definition
FROM information_schema.views
WHERE table_schema = 'public'
  AND table_name = 'ticket_details_view';
