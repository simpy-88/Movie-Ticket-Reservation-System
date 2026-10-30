-- ==============================================================================
-- MOVIE TICKET RESERVATION SYSTEM (MTRS)
-- Migration: 20261030000002_storage_artwork.sql
-- Description: Centralized Supabase Storage Bucket & Storage Security Policies
--              for Theatrical Posters and Hero Backdrops.
--
-- Features:
--   1. Idempotently configures public Storage bucket 'movie-artwork'.
--   2. Enforces 25 MB max file size limit (26,214,400 bytes) and restricts allowed
--      MIME types to JPEG, PNG, and WebP.
--   3. Installs Permissive Row Level Security (RLS) policies:
--      - Public SELECT: Unauthenticated visitors & customers can read/download images.
--      - Admin INSERT: Only authenticated administrators can upload.
--      - Admin UPDATE: Only authenticated administrators can modify metadata/replace.
--      - Admin DELETE: Only authenticated administrators can delete.
--   4. Installs Restrictive (AS RESTRICTIVE) Row Level Security policies:
--      - Guarantees that no existing broad permissive policy on storage.objects
--        can bypass administrator-only write restrictions for 'movie-artwork'.
--      - Scoped with (bucket_id <> 'movie-artwork' OR public.is_admin()) so it
--        NEVER interferes with or restricts any other existing or future buckets.
--   5. Retains existing storage.objects table grants unchanged without blindly
--      altering global privileges, relying entirely on targeted RLS enforcement.
--
-- Security Guarantees:
--   - Public users can read artwork without login.
--   - Anonymous users and non-admin customers CANNOT upload, update, or delete.
--   - Fully idempotent: safe to execute multiple times without error.
-- ==============================================================================

BEGIN;

-- ------------------------------------------------------------------------------
-- 1. CONFIGURE DEDICATED STORAGE BUCKET: 'movie-artwork'
--    - Public bucket for CDN-backed asset delivery without user login
--    - 25 MB file size limit (26,214,400 bytes)
--    - Allowed MIME types: image/jpeg, image/png, image/webp
-- ------------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'movie-artwork',
    'movie-artwork',
    true,
    26214400, -- 25 MB in bytes
    ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ------------------------------------------------------------------------------
-- 2. DROP EXISTING POLICIES FOR IDEMPOTENCY
--    Specifically drop ONLY policies scoped to movie-artwork to prevent
--    interfering with any other storage buckets.
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "mtrs_artwork_public_select" ON storage.objects;
DROP POLICY IF EXISTS "mtrs_artwork_admin_insert" ON storage.objects;
DROP POLICY IF EXISTS "mtrs_artwork_admin_update" ON storage.objects;
DROP POLICY IF EXISTS "mtrs_artwork_admin_delete" ON storage.objects;
DROP POLICY IF EXISTS "mtrs_artwork_enforce_admin_insert" ON storage.objects;
DROP POLICY IF EXISTS "mtrs_artwork_enforce_admin_update" ON storage.objects;
DROP POLICY IF EXISTS "mtrs_artwork_enforce_admin_delete" ON storage.objects;

-- ------------------------------------------------------------------------------
-- 3. INSTALL TARGETED PERMISSIVE ROW LEVEL SECURITY POLICIES
-- ------------------------------------------------------------------------------

-- Policy 1: Public Read Access (Permissive)
-- All visitors (unauthenticated anonymous visitors and authenticated customers)
-- can view and download posters and backdrops from the 'movie-artwork' bucket.
CREATE POLICY "mtrs_artwork_public_select"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'movie-artwork');

-- Policy 2: Admin Upload Access (Permissive)
-- Authenticated administrators registered in public.admin_users (verified via
-- the SECURITY DEFINER function public.is_admin()) are permitted to upload artwork.
CREATE POLICY "mtrs_artwork_admin_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'movie-artwork'
    AND public.is_admin()
);

-- Policy 3: Admin Update Access (Permissive)
-- Authenticated administrators can replace artwork or update its Storage metadata.
CREATE POLICY "mtrs_artwork_admin_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'movie-artwork'
    AND public.is_admin()
)
WITH CHECK (
    bucket_id = 'movie-artwork'
    AND public.is_admin()
);

-- Policy 4: Admin Delete Access (Permissive)
-- Authenticated administrators can delete artwork files from the 'movie-artwork' bucket.
CREATE POLICY "mtrs_artwork_admin_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'movie-artwork'
    AND public.is_admin()
);

-- ------------------------------------------------------------------------------
-- 4. INSTALL RESTRICTIVE POLICIES TO PREVENT PERMISSIVE POLICY BYPASS
--    PostgreSQL combines permissive policies with OR. An existing broad policy
--    (e.g., INSERT TO authenticated WITH CHECK (true)) could bypass admin checks.
--    RESTRICTIVE policies are combined with AND across all policies.
--    These policies guarantee that any write to 'movie-artwork' requires is_admin(),
--    while evaluating to TRUE for any other bucket (so other buckets are untouched).
-- ------------------------------------------------------------------------------

-- Restrictive Policy 1: Restrict INSERT to movie-artwork strictly to administrators
CREATE POLICY "mtrs_artwork_enforce_admin_insert"
ON storage.objects
AS RESTRICTIVE
FOR INSERT
TO public
WITH CHECK (
    bucket_id <> 'movie-artwork'
    OR public.is_admin()
);

-- Restrictive Policy 2: Restrict UPDATE to movie-artwork strictly to administrators
CREATE POLICY "mtrs_artwork_enforce_admin_update"
ON storage.objects
AS RESTRICTIVE
FOR UPDATE
TO public
USING (
    bucket_id <> 'movie-artwork'
    OR public.is_admin()
)
WITH CHECK (
    bucket_id <> 'movie-artwork'
    OR public.is_admin()
);

-- Restrictive Policy 3: Restrict DELETE to movie-artwork strictly to administrators
CREATE POLICY "mtrs_artwork_enforce_admin_delete"
ON storage.objects
AS RESTRICTIVE
FOR DELETE
TO public
USING (
    bucket_id <> 'movie-artwork'
    OR public.is_admin()
);

-- ------------------------------------------------------------------------------
-- 5. VERIFICATION OF TABLE PRIVILEGES & LEAST-PRIVILEGE RLS ENFORCEMENT
--    In standard Supabase Storage, table-level privileges on storage.objects
--    (SELECT, INSERT, UPDATE, DELETE for authenticated/anon and ALL for service_role)
--    are pre-configured by the native storage extension.
--    No table-wide GRANT or REVOKE statements are added here to avoid modifying
--    global or unrelated bucket privileges.
--    All storage access is strictly governed by the seven RLS policies above:
--    - SELECT: Only allowed for objects where bucket_id = 'movie-artwork'.
--    - INSERT/UPDATE/DELETE: Strictly gated by public.is_admin() and enforced
--      against permissive policy bypass via the three AS RESTRICTIVE policies.
-- ------------------------------------------------------------------------------

-- ------------------------------------------------------------------------------
-- 6. RELOAD POSTGREST SCHEMA CACHE
-- ------------------------------------------------------------------------------
NOTIFY pgrst, 'reload schema';

COMMIT;
