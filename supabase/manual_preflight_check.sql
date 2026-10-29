-- ==============================================================================
-- MOVIE TICKET RESERVATION SYSTEM (MTRS)
-- File: supabase/manual_preflight_check.sql
-- Description: Read-Only Pre-Flight Inspection Script.
--              Execute in Supabase SQL Editor BEFORE applying Phase 1 Migration.
--              GUARANTEE: Modifies ZERO rows, creates ZERO objects, advances NO sequences.
-- ==============================================================================

-- 1. BASE TABLE EXISTENCE CHECK
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
    ON t.table_schema = 'public' AND t.table_name = expected.table_name;

-- 2. CHECK IF 'status' COLUMN ALREADY EXISTS ON public.movies
SELECT 
    column_name, data_type, column_default, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'movies' 
  AND column_name = 'status';

-- 3. INSPECT MOVIE ID PATTERNS AND CURRENT MAXIMUM NUMERIC SUFFIX (READ-ONLY)
SELECT 
    COUNT(*) AS total_movies_count,
    COUNT(CASE WHEN movie_id ~ '^M[0-9]+$' THEN 1 END) AS standard_pattern_count,
    COUNT(CASE WHEN movie_id !~ '^M[0-9]+$' THEN 1 END) AS non_standard_pattern_count,
    COALESCE(MAX(NULLIF(SUBSTRING(movie_id FROM '^M([0-9]+)$'), '')::INT), 0) AS max_numeric_suffix,
    -- Projected next candidate string based purely on current table contents:
    'M' || LPAD((GREATEST(COALESCE(MAX(NULLIF(SUBSTRING(movie_id FROM '^M([0-9]+)$'), '')::INT), 6), 6) + 1)::TEXT, 2, '0') AS projected_first_migration_candidate
FROM public.movies;

-- 4. CHECK IF 'movie_id_seq' SEQUENCE ALREADY EXISTS
SELECT 
    sequence_name, start_value, minimum_value, maximum_value, increment
FROM information_schema.sequences 
WHERE sequence_schema = 'public' 
  AND sequence_name = 'movie_id_seq';

-- 5. CHECK EXISTING COLUMN DEFAULT ON movies.movie_id (CRITICAL FOR ROLLBACK RECORD)
-- If this returns NULL, no default existed before migration.
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

-- 8. AUDIT EXISTING RLS POLICIES ON CATALOG TABLES
-- Crucial: Check if any unexpected permissive write policy exists that could conflict.
SELECT 
    schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('movies', 'shows', 'screens', 'theaters', 'bookings', 'booked_seats', 'payments')
ORDER BY tablename, cmd;

-- 9. AUDIT TABLE-LEVEL GRANTS FOR 'authenticated' AND 'anon'
SELECT 
    table_name, grantee, privilege_type
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
  AND grantee IN ('anon', 'authenticated')
  AND table_name IN ('movies', 'shows', 'screens', 'theaters', 'customers', 'bookings', 'booked_seats', 'payments')
ORDER BY table_name, grantee, privilege_type;

-- 10. AUDIT COLUMN-LEVEL GRANTS (Confirm zero unexpected column write grants)
SELECT 
    table_name, column_name, grantee, privilege_type
FROM information_schema.column_privileges 
WHERE table_schema = 'public' 
  AND grantee IN ('anon', 'authenticated')
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

-- 12. AUDIT COMPATIBILITY VIEW "MOVIE" DEFINITION
SELECT 
    column_name, ordinal_position, data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'MOVIE'
ORDER BY ordinal_position;

-- 13. AUDIT BOOKING STORED PROCEDURES (Confirm existence and security definer status)
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
