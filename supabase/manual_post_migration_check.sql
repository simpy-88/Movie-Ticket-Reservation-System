-- ==============================================================================
-- MOVIE TICKET RESERVATION SYSTEM (MTRS)
-- File: supabase/manual_post_migration_check.sql
-- Description: Read-Only Post-Migration Verification Script.
--              Execute in Supabase SQL Editor AFTER applying Phase 1 Migration.
--              GUARANTEE: Modifies ZERO rows, advances NO sequences, burns NO IDs.
-- ==============================================================================

-- 1. VERIFY 'status' COLUMN ON public.movies
SELECT
    column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'movies'
  AND column_name = 'status';
-- Expected: status | character varying | 'Active'::character varying | NO

-- 2. VERIFY ALL MOVIES DEFAULTED TO 'Active'
SELECT
    status, COUNT(*) AS movie_count
FROM public.movies
GROUP BY status;
-- Expected: Active | count matching existing catalog

-- 3. NON-CONSUMING SEQUENCE INSPECTION (Does not advance or call nextval)
-- NOTE: pg_sequences does NOT have an 'is_called' column. We inspect last_value directly.
SELECT
    s.schemaname,
    s.sequencename,
    s.start_value,
    s.min_value,
    s.max_value,
    s.increment_by,
    s.last_value,
    CASE
        WHEN s.last_value IS NOT NULL AND (s.last_value + s.increment_by) < 100
            THEN 'M' || LPAD((s.last_value + s.increment_by)::TEXT, 2, '0')
        WHEN s.last_value IS NOT NULL
            THEN 'M' || (s.last_value + s.increment_by)::TEXT
        WHEN s.start_value < 100
            THEN 'M' || LPAD(s.start_value::TEXT, 2, '0')
        ELSE 'M' || s.start_value::TEXT
    END AS projected_next_id,
    (
        SELECT COALESCE(MAX(NULLIF(SUBSTRING(movie_id FROM '^M([0-9]+)$'), '')::INT), 0)
        FROM public.movies
    ) AS current_max_numeric_movie_id
FROM pg_sequences s
WHERE s.schemaname = 'public'
  AND s.sequencename = 'movie_id_seq';
-- Expected:
-- last_value equals GREATEST(current_max_numeric_movie_id, 6).
-- projected_next_id equals 'M' || (last_value + 1) (formatted with 2 digits below 100, exact digits at or above 100).

-- 4. VERIFY COLUMN DEFAULT ON movies.movie_id
SELECT
    column_name, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'movies'
  AND column_name = 'movie_id';
-- Expected: column_default contains 'generate_movie_id()'

-- 5. VERIFY RLS ENFORCEMENT ON ALL CATALOGUE & ADMIN TABLES
SELECT
    c.relname AS table_name,
    c.relrowsecurity AS rls_enabled,
    c.relforcerowsecurity AS rls_forced
FROM pg_class c
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public'
  AND c.relname IN ('movies', 'shows', 'screens', 'theaters', 'admin_users')
ORDER BY c.relname;
-- Expected: 5 rows (admin_users, movies, screens, shows, theaters), each with rls_enabled = true.

-- 6. VERIFY is_admin() FUNCTION SECURITY SETTINGS
SELECT
    p.proname AS function_name,
    p.prosecdef AS is_security_definer,
    p.provolatile AS volatility, -- 's' for STABLE
    pg_get_function_identity_arguments(p.oid) AS signature,
    proconfig AS search_path_config
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname = 'is_admin';
-- Expected: is_admin | true | s | "" | {search_path=public, auth, pg_temp}

-- 7. AUDIT ALL INSTALLED RLS POLICIES ON CATALOGUE & ADMIN TABLES
SELECT
    tablename, policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('movies', 'shows', 'screens', 'theaters', 'admin_users')
ORDER BY tablename, cmd, policyname;

-- 7b. AUDIT EVERY SELECT POLICY ON public.movies (Ensures NO unrestricted SELECT policies remain)
SELECT
    policyname,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'movies'
  AND cmd = 'SELECT'
ORDER BY policyname;
-- Expected: Exactly 3 SELECT policies:
-- 1. "Admins can view all movies"                          | {authenticated}       | qual contains 'is_admin()'
-- 2. "Customers can view archived movies for booked shows" | {authenticated}       | qual contains 'status = Archived' & booking check
-- 3. "Public can view active movies"                       | {anon, authenticated} | qual contains 'status = Active'
-- (Zero unrestricted policies with qual = 'true')

-- 7c. VERIFY SHOW INSERT AND UPDATE ACTIVE-MOVIE VALIDATION
SELECT
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'shows'
  AND cmd IN ('INSERT', 'UPDATE')
ORDER BY cmd;
-- Expected: Both INSERT and UPDATE with_check expressions enforce is_admin() AND status = 'Active'.

-- 8. VERIFY TABLE PRIVILEGES FOR 'anon' AND 'authenticated'
-- Confirms least-privilege API access and verifies TRUNCATE / DELETE restrictions
SELECT
    table_name, grantee, privilege_type
FROM information_schema.role_table_grants
WHERE grantee IN ('anon', 'authenticated')
  AND table_name IN ('movies', 'shows', 'screens', 'theaters', 'admin_users')
ORDER BY table_name, grantee, privilege_type;
-- Expected:
-- admin_users:  authenticated -> SELECT (Zero anon, zero INSERT/UPDATE/DELETE/TRUNCATE)
-- movies:       anon -> SELECT; authenticated -> SELECT, INSERT, UPDATE (Zero DELETE, zero TRUNCATE)
-- screens:      anon -> SELECT; authenticated -> SELECT, INSERT, UPDATE, DELETE (Zero TRUNCATE)
-- shows:        anon -> SELECT; authenticated -> SELECT, INSERT, UPDATE, DELETE (Zero TRUNCATE)
-- theaters:     anon -> SELECT; authenticated -> SELECT, INSERT, UPDATE, DELETE (Zero TRUNCATE)

-- 8b. AUDIT COLUMN PRIVILEGES (Confirm zero residual column write grants)
SELECT
    table_name, column_name, grantee, privilege_type
FROM information_schema.column_privileges
WHERE table_schema = 'public'
  AND grantee IN ('anon', 'authenticated', 'PUBLIC')
  AND table_name IN ('movies', 'shows', 'screens', 'theaters', 'admin_users');
-- Expected: 0 rows (all residual column grants successfully stripped).

-- 8c. ASSERT ZERO TRUNCATE GRANTS REMAIN ON CATALOGUE TABLES
SELECT
    COUNT(*) AS dangerous_truncate_grants_count
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND privilege_type = 'TRUNCATE'
  AND grantee IN ('anon', 'authenticated', 'PUBLIC')
  AND table_name IN ('movies', 'shows', 'screens', 'theaters', 'admin_users');
-- Expected: 0

-- 9. VERIFY SEQUENCE GENERATOR FUNCTION EXECUTION PRIVILEGES
SELECT
    p.proname AS function_name,
    has_function_privilege('anon', p.oid, 'EXECUTE') AS anon_can_execute,
    has_function_privilege('authenticated', p.oid, 'EXECUTE') AS authenticated_can_execute
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname = 'generate_movie_id';
-- Expected: generate_movie_id | false | true
-- Note: authenticated holds EXECUTE so PostgreSQL column default evaluates during admin inserts.
-- The internal public.is_admin() guard prevents sequence burn or unauthorized direct RPC calls.

-- 9b. VERIFY DIRECT SEQUENCE ACCESS IS REVOKED FROM CLIENT ROLES
SELECT
    s.relname AS sequence_name,
    has_sequence_privilege('anon', s.oid, 'USAGE') AS anon_usage,
    has_sequence_privilege('authenticated', s.oid, 'USAGE') AS auth_usage,
    has_sequence_privilege('anon', s.oid, 'SELECT') AS anon_select,
    has_sequence_privilege('authenticated', s.oid, 'SELECT') AS auth_select,
    has_sequence_privilege('anon', s.oid, 'UPDATE') AS anon_update,
    has_sequence_privilege('authenticated', s.oid, 'UPDATE') AS auth_update
FROM pg_class s
JOIN pg_namespace n ON s.relnamespace = n.oid
WHERE n.nspname = 'public'
  AND s.relkind = 'S'
  AND s.relname = 'movie_id_seq';
-- Expected: All 6 privilege checks evaluate to false.

-- 10. VERIFY COMPATIBILITY VIEW "MOVIE" STRUCTURE & COLUMN ORDER
SELECT
    column_name, ordinal_position, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'MOVIE'
ORDER BY ordinal_position;
-- Expected: Exactly 13 columns; positions 1-8 match legacy view definition:
-- 1: Movie_ID, 2: Movie_Name, 3: Genre, 4: Rating, 5: Duration, 6: Language, 7: Synopsis, 8: Cast
-- Positions 9-13: Status, Poster_Url, Poster_Hires_Url, Backdrop_Url, Created_At.

-- 11. VERIFY ADMINISTRATIVE ARCHIVAL PROCEDURES
SELECT
    p.proname AS procedure_name,
    p.prosecdef AS is_security_definer,
    pg_get_function_identity_arguments(p.oid) AS signature
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN ('sp_admin_set_movie_status', 'sp_admin_archive_movie')
ORDER BY p.proname;
-- Expected: Both procedures exist, are security definers, and accept VARCHAR arguments.

-- 11b. VERIFY BOOKING REJECTION FOR ARCHIVED MOVIES (Procedure check & trigger existence)
SELECT
    p.proname AS procedure_name,
    p.prosrc LIKE '%status = ''Archived''%' AS checks_archived_status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname = 'sp_book_ticket_transaction';
-- Expected: sp_book_ticket_transaction | true

SELECT
    t.tgname AS trigger_name,
    c.relname AS table_name,
    t.tgenabled AS is_enabled
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public'
  AND t.tgname = 'trg_prevent_booking_archived_movie';
-- Expected: trg_prevent_booking_archived_movie | bookings | O (Enabled)

-- 12. VERIFY CONTINUED EXISTENCE OF BOOKING WORKFLOW OBJECTS
SELECT
    p.proname AS booking_procedure,
    p.prosecdef AS is_security_definer
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN ('sp_book_ticket_transaction', 'sp_cancel_booking');
-- Expected: Both procedures intact and functional.

-- 12b. VERIFY BOOKING TRIGGERS INTACT
SELECT
    t.tgname AS trigger_name,
    c.relname AS table_name,
    t.tgenabled AS is_enabled
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public'
  AND c.relname IN ('bookings', 'booked_seats')
  AND NOT t.tgisinternal
ORDER BY c.relname, t.tgname;
-- Expected: trg_prevent_booking_archived_movie, trg_prevent_double_booking, trg_validate_seat_screen all enabled.

-- 13. VERIFY ticket_details_view REMAINS FUNCTIONAL
SELECT
    table_name, view_definition IS NOT NULL AS has_definition
FROM information_schema.views
WHERE table_schema = 'public'
  AND table_name = 'ticket_details_view';
-- Expected: ticket_details_view | true

-- 14. VERIFY INTEGRITY OF BOOKING CONSTRAINTS AND KEYS
SELECT
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type
FROM information_schema.table_constraints tc
WHERE tc.table_schema = 'public'
  AND tc.table_name IN ('bookings', 'booked_seats', 'payments')
  AND tc.constraint_type IN ('PRIMARY KEY', 'FOREIGN KEY', 'UNIQUE')
ORDER BY tc.table_name, tc.constraint_name;
-- Expected: All constraints intact (primary keys, foreign keys, unique booking seat rules).

-- 14b. VERIFY PROCEDURE EXECUTION PRIVILEGES FOR BOOKINGS
SELECT
    p.proname AS procedure_name,
    has_function_privilege('anon', p.oid, 'EXECUTE') AS anon_can_execute,
    has_function_privilege('authenticated', p.oid, 'EXECUTE') AS authenticated_can_execute
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN ('sp_book_ticket_transaction', 'sp_cancel_booking')
ORDER BY p.proname;
-- Expected:
-- sp_book_ticket_transaction | true  | true
-- sp_cancel_booking          | false | true
