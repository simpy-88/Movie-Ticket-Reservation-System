-- ==============================================================================
-- MOVIE TICKET RESERVATION SYSTEM (MTRS)
-- Migration: 20261023000001_booking_notifications.sql
-- Description: Transactional Booking Notification Log & Outbox Table
-- Stores transactional email delivery audit logs, prevents duplicate notifications
-- (idempotency), and ensures caller ownership verification.
-- ==============================================================================

-- 1. Create booking_notifications table
CREATE TABLE IF NOT EXISTS public.booking_notifications (
    notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id VARCHAR(10) NOT NULL REFERENCES public.bookings(booking_id) ON DELETE CASCADE,
    recipient_email TEXT NOT NULL,
    provider VARCHAR(30) NOT NULL DEFAULT 'resend',
    provider_message_id TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SENT', 'FAILED')),
    error_message TEXT,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_booking_notification UNIQUE (booking_id)
);

-- Index for fast lookup by booking_id and status
CREATE INDEX IF NOT EXISTS idx_booking_notifications_booking ON public.booking_notifications(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_notifications_status ON public.booking_notifications(status);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.booking_notifications ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
-- Authenticated customers can view delivery status of notifications for their own bookings
DROP POLICY IF EXISTS "Customers can view their own booking notifications" ON public.booking_notifications;
CREATE POLICY "Customers can view their own booking notifications"
    ON public.booking_notifications
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.bookings b
            JOIN public.customers c ON b.customer_id = c.customer_id
            WHERE b.booking_id = booking_notifications.booking_id
              AND c.auth_user_id = auth.uid()
        )
    );

-- Grant select to authenticated role
GRANT SELECT ON public.booking_notifications TO authenticated;

-- Service role bypasses RLS for edge function worker insert/update
GRANT ALL ON public.booking_notifications TO service_role;

-- Revoke from public and anon
REVOKE ALL ON public.booking_notifications FROM anon, PUBLIC;
