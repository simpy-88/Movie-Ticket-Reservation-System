// ==============================================================================
// MOVIE TICKET RESERVATION SYSTEM (MTRS)
// Supabase Edge Function: send-booking-confirmation
// Description: Secure server-side transactional email sender for confirmed bookings.
// Validates caller identity (JWT), verifies booking ownership via RLS, enforces
// idempotency, and dispatches a cinematic HTML + text email via Resend API.
// ==============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS"
};

// Helper to format minutes into 12-hour AM/PM format
function formatTime12H(timeStr: string): string {
    if (!timeStr) return '';
    const parts = timeStr.split(':');
    const h = parseInt(parts[0], 10) || 0;
    const m = parseInt(parts[1], 10) || 0;
    const period = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 === 0 ? 12 : (h % 12);
    const mStr = m < 10 ? `0${m}` : `${m}`;
    return `${h12}:${mStr} ${period}`;
}

// Helper to format date nicely
function formatDate(dateStr: string): string {
    if (!dateStr) return '';
    try {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    } catch {
        return dateStr;
    }
}

// Helper to escape HTML characters in database content
function escapeHtml(str: any): string {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// Cinematic HTML Email Template Generator
function generateCinematicEmailHtml(details: any): string {
    const rawSeatList = details.booked_seat_numbers || (Array.isArray(details.booked_seat_ids) ? details.booked_seat_ids.join(', ') : 'Seats Assigned');
    const seatList = escapeHtml(rawSeatList);
    const seatCount = details.total_seats_count || 1;
    const formattedDate = escapeHtml(formatDate(details.show_date));
    const formattedTime = escapeHtml(formatTime12H(details.show_time));
    const totalAmount = parseFloat(details.total_amount || details.ticket_price || 0).toFixed(2);
    const posterUrl = escapeHtml(details.poster_hires_url || details.poster_url || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800');

    const bookingId = escapeHtml(details.booking_id);
    const customerName = escapeHtml(details.customer_name);
    const customerId = escapeHtml(details.customer_id);
    const movieName = escapeHtml(details.movie_name);
    const movieLanguage = escapeHtml(details.movie_language || 'English');
    const movieDuration = escapeHtml(details.movie_duration || '150');
    const format = escapeHtml(details.format || 'Standard');
    const theaterName = escapeHtml(details.theater_name);
    const screenName = escapeHtml(details.screen_name);
    const screenType = escapeHtml(details.screen_type || 'Auditorium');
    const theaterCity = escapeHtml(details.theater_city || 'Chennai');
    const paymentId = escapeHtml(details.payment_id || 'N/A');
    const paymentMode = escapeHtml(details.payment_mode || 'UPI');
    const paymentStatus = escapeHtml(details.payment_status || 'SUCCESS');

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Booking Confirmation - ${bookingId}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #08090d; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f0f2f8;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #08090d; padding: 30px 10px;">
        <tr>
            <td align="center">
                <!-- Main Container -->
                <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width: 600px; width: 100%; background: #11141e; border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.7);">
                    
                    <!-- Header with Branding -->
                    <tr>
                        <td style="padding: 28px 32px; background: linear-gradient(135deg, #181d2c 0%, #0c0e15 100%); border-bottom: 2px solid #e50914;">
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                                <tr>
                                    <td>
                                        <div style="font-size: 26px; font-weight: 900; letter-spacing: 2px; color: #ffffff;">
                                            <span style="color: #e50914;">MTRS</span> CINEMAS
                                        </div>
                                        <div style="font-size: 11px; letter-spacing: 3px; color: #00f0ff; text-transform: uppercase; margin-top: 4px;">
                                            Cinematic Excellence • Chennai Premier
                                        </div>
                                    </td>
                                    <td align="right">
                                        <span style="display: inline-block; padding: 6px 14px; background: rgba(0, 240, 255, 0.15); border: 1px solid #00f0ff; color: #00f0ff; font-family: monospace; font-size: 12px; font-weight: 700; border-radius: 20px;">
                                            ${bookingId}
                                        </span>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Status Hero Banner -->
                    <tr>
                        <td style="padding: 24px 32px 10px 32px;">
                            <div style="background: rgba(16, 185, 129, 0.12); border: 1px solid #10b981; border-radius: 10px; padding: 14px 18px; margin-bottom: 20px;">
                                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                                    <tr>
                                        <td width="30" valign="middle">
                                            <div style="width: 24px; height: 24px; border-radius: 50%; background: #10b981; color: #000; font-weight: 900; text-align: center; line-height: 24px; font-size: 14px;">✓</div>
                                        </td>
                                        <td valign="middle" style="padding-left: 10px;">
                                            <div style="color: #10b981; font-weight: 700; font-size: 15px;">BOOKING CONFIRMED</div>
                                            <div style="color: #a0aec0; font-size: 12px; margin-top: 2px;">Hello ${customerName}, your tickets are ready!</div>
                                        </td>
                                    </tr>
                                </table>
                            </div>
                        </td>
                    </tr>

                    <!-- Movie & Showtime Showcase -->
                    <tr>
                        <td style="padding: 10px 32px 24px 32px;">
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: #171b29; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; overflow: hidden;">
                                <tr>
                                    <!-- Poster -->
                                    <td width="140" valign="top" style="padding: 16px;">
                                        <img src="${posterUrl}" alt="${movieName}" width="140" style="width: 140px; border-radius: 8px; display: block; border: 1px solid rgba(255,255,255,0.15);" />
                                    </td>
                                    <!-- Movie Info -->
                                    <td valign="top" style="padding: 20px 20px 20px 8px;">
                                        <span style="display: inline-block; padding: 2px 8px; background: #e50914; color: #ffffff; font-size: 10px; font-weight: 800; border-radius: 4px; text-transform: uppercase; margin-bottom: 8px;">
                                            ${format}
                                        </span>
                                        <h1 style="margin: 0 0 8px 0; font-size: 22px; font-weight: 800; color: #ffffff; line-height: 1.2;">
                                            ${movieName}
                                        </h1>
                                        <div style="font-size: 13px; color: #a0aec0; margin-bottom: 14px;">
                                            ${movieLanguage} • ${movieDuration} mins
                                        </div>

                                        <div style="border-top: 1px solid rgba(255, 255, 255, 0.08); padding-top: 12px;">
                                            <div style="font-size: 14px; font-weight: 700; color: #ffffff;">
                                                📍 ${theaterName}
                                            </div>
                                            <div style="font-size: 12px; color: #00f0ff; margin-top: 2px;">
                                                ${screenName} (${screenType}) • ${theaterCity}
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Showtime & Seats Highlight Grid -->
                    <tr>
                        <td style="padding: 0 32px 24px 32px;">
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                                <tr>
                                    <!-- Date & Time -->
                                    <td width="48%" style="background: #171b29; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 10px; padding: 16px;">
                                        <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #718096; margin-bottom: 6px;">📅 Date &amp; Showtime</div>
                                        <div style="font-size: 15px; font-weight: 700; color: #ffffff;">${formattedDate}</div>
                                        <div style="font-size: 14px; font-weight: 700; color: #f5a623; margin-top: 2px;">⏰ ${formattedTime}</div>
                                    </td>
                                    <td width="4%">&nbsp;</td>
                                    <!-- Seats Reserved -->
                                    <td width="48%" style="background: #171b29; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 10px; padding: 16px;">
                                        <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #718096; margin-bottom: 6px;">🎟️ Reserved Seats (${seatCount})</div>
                                        <div style="font-size: 17px; font-weight: 900; color: #f5a623; letter-spacing: 1px;">
                                            ${seatList}
                                        </div>
                                        <div style="font-size: 11px; color: #a0aec0; margin-top: 2px;">Physical Auditorium Allocation</div>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Payment & Transaction Details -->
                    <tr>
                        <td style="padding: 0 32px 24px 32px;">
                            <div style="background: #131722; border: 1px dashed rgba(255, 255, 255, 0.15); border-radius: 10px; padding: 18px 20px;">
                                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                                    <tr>
                                        <td style="font-size: 13px; color: #a0aec0; padding-bottom: 8px;">Customer Name</td>
                                        <td align="right" style="font-size: 13px; font-weight: 600; color: #ffffff; padding-bottom: 8px;">${customerName}</td>
                                    </tr>
                                    <tr>
                                        <td style="font-size: 13px; color: #a0aec0; padding-bottom: 8px;">Customer ID</td>
                                        <td align="right" style="font-size: 13px; font-family: monospace; color: #00f0ff; padding-bottom: 8px;">${customerId}</td>
                                    </tr>
                                    <tr>
                                        <td style="font-size: 13px; color: #a0aec0; padding-bottom: 8px;">Payment ID / Mode</td>
                                        <td align="right" style="font-size: 13px; color: #ffffff; padding-bottom: 8px;">${paymentId} • ${paymentMode}</td>
                                    </tr>
                                    <tr>
                                        <td style="font-size: 13px; color: #a0aec0; padding-bottom: 8px;">Payment Status</td>
                                        <td align="right" style="font-size: 12px; font-weight: 700; color: #10b981; padding-bottom: 8px;">● ${paymentStatus}</td>
                                    </tr>
                                    <tr style="border-top: 1px solid rgba(255, 255, 255, 0.1);">
                                        <td style="font-size: 16px; font-weight: 800; color: #ffffff; padding-top: 10px;">Total Amount Paid</td>
                                        <td align="right" style="font-size: 18px; font-weight: 900; color: #f5a623; padding-top: 10px;">₹${totalAmount}</td>
                                    </tr>
                                </table>
                            </div>
                        </td>
                    </tr>

                    <!-- Instructions & Gate Pass Barcode Simulator -->
                    <tr>
                        <td style="padding: 0 32px 30px 32px; text-align: center;">
                            <div style="background: rgba(255,255,255,0.03); border-radius: 8px; padding: 14px; font-size: 12px; color: #718096; line-height: 1.5;">
                                ℹ️ Please present this confirmation email or your digital e-ticket at the cinema usher desk. Gates open 20 minutes prior to scheduled showtime. Outside food &amp; beverages are strictly prohibited.
                            </div>
                            <div style="margin-top: 20px; font-family: monospace; font-size: 11px; color: #4a5568; letter-spacing: 2px;">
                                CONFIRMATION REF: ${bookingId}-${paymentId}
                            </div>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 24px 32px; background: #0c0e15; border-top: 1px solid rgba(255, 255, 255, 0.08); text-align: center;">
                            <div style="font-size: 12px; color: #a0aec0; margin-bottom: 6px;">
                                Thank you for booking with Movie Ticket Reservation System (MTRS).
                            </div>
                            <div style="font-size: 11px; color: #4a5568;">
                                © 2026 MTRS Cinemas India Pvt Ltd. All rights reserved.
                            </div>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
}

// Plain Text Email Generator
function generatePlainTextEmail(details: any): string {
    const seatList = details.booked_seat_numbers || (Array.isArray(details.booked_seat_ids) ? details.booked_seat_ids.join(', ') : 'Seats Assigned');
    const totalAmount = parseFloat(details.total_amount || details.ticket_price || 0).toFixed(2);
    const formattedDate = formatDate(details.show_date);
    const formattedTime = formatTime12H(details.show_time);

    return `=======================================================
MOVIE TICKET RESERVATION SYSTEM (MTRS)
BOOKING CONFIRMATION - ${details.booking_id}
=======================================================

Dear ${details.customer_name},

Your ticket reservation has been confirmed! Here are your show details:

BOOKING REFERENCE: ${details.booking_id}
CUSTOMER ID:       ${details.customer_id}

MOVIE:             ${details.movie_name} (${details.format || 'Standard'})
LANGUAGE:          ${details.movie_language || 'English'}
DURATION:          ${details.movie_duration || '150'} minutes

THEATER:           ${details.theater_name}, ${details.theater_city}
AUDITORIUM:        ${details.screen_name} (${details.screen_type || 'Standard'})

SHOW DATE:         ${formattedDate}
SHOW TIME:         ${formattedTime}

RESERVED SEATS:    ${seatList}
TOTAL TICKETS:     ${details.total_seats_count || 1}

PAYMENT ID:        ${details.payment_id || 'N/A'}
PAYMENT MODE:      ${details.payment_mode || 'UPI'}
PAYMENT STATUS:    ${details.payment_status || 'SUCCESS'}
TOTAL AMOUNT:      Rs. ${totalAmount}

Please present this booking confirmation or your e-ticket at the cinema usher gate.
Gates open 20 minutes prior to showtime.

Thank you for choosing MTRS Cinemas!
=======================================================
(c) 2026 MTRS Cinemas India Pvt Ltd.`;
}

// Main Edge Function Server Handler
serve(async (req: Request) => {
    // 1. Handle CORS Preflight
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        // 2. Validate Authorization Header and Extract Bearer Token
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
            return new Response(JSON.stringify({
                success: false,
                error: "Unauthorized: Missing Authorization header."
            }), {
                status: 401,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        const authMatch = authHeader.match(/^Bearer\s+(.+)$/i);
        if (!authMatch || !authMatch[1].trim()) {
            return new Response(JSON.stringify({
                success: false,
                error: "Unauthorized: Malformed Authorization header. Expected 'Bearer <token>'."
            }), {
                status: 401,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }
        const bearerToken = authMatch[1].trim();

        const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
        const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
        const resendApiKey = Deno.env.get("RESEND_API_KEY");
        const senderEmail = Deno.env.get("MTRS_SENDER_EMAIL") || "MTRS Cinemas <onboarding@resend.dev>";

        // Create client bound to the caller's JWT for RLS security
        const userClient = createClient(supabaseUrl, supabaseAnonKey, {
            global: { headers: { Authorization: `Bearer ${bearerToken}` } }
        });

        const { data: { user }, error: userError } = await userClient.auth.getUser(bearerToken);
        if (userError || !user) {
            return new Response(JSON.stringify({
                success: false,
                error: "Unauthorized: Invalid or expired authentication session."
            }), {
                status: 401,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        // 3. Parse Request Payload
        let body: any = {};
        try {
            body = await req.json();
        } catch {
            return new Response(JSON.stringify({
                success: false,
                error: "Invalid request payload. Expected JSON body with booking_id."
            }), {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        const bookingId = body.booking_id;
        if (!bookingId || typeof bookingId !== 'string') {
            return new Response(JSON.stringify({
                success: false,
                error: "booking_id is required."
            }), {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        // 4. Admin client for notification table outbox / idempotency checks
        const adminClient = supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : userClient;

        // 5. Idempotency Check: check if email was already successfully sent for this booking
        try {
            const { data: existingNotice } = await adminClient
                .from('booking_notifications')
                .select('*')
                .eq('booking_id', bookingId)
                .eq('status', 'SENT')
                .maybeSingle();

            if (existingNotice) {
                console.log(`[send-booking-confirmation] Idempotent hit: booking ${bookingId} already notified.`);
                return new Response(JSON.stringify({
                    success: true,
                    already_sent: true,
                    message: "Booking confirmation email has already been dispatched.",
                    notification_id: existingNotice.notification_id,
                    provider_message_id: existingNotice.provider_message_id,
                    sent_at: existingNotice.sent_at
                }), {
                    status: 200,
                    headers: { ...corsHeaders, "Content-Type": "application/json" }
                });
            }
        } catch (tableErr) {
            // Table may not yet be created if migration is pending; proceed gracefully
            console.warn('[send-booking-confirmation] Notice table check skipped:', tableErr);
        }

        // 6. Retrieve Persisted Booking Details (enforcing RLS via userClient & ticket_details_view)
        console.log(`[send-booking-confirmation] Querying ticket_details_view for booking ${bookingId}...`);
        const { data: booking, error: bookingErr } = await userClient
            .from('ticket_details_view')
            .select('*')
            .eq('booking_id', bookingId)
            .maybeSingle();

        if (bookingErr) {
            console.error('[send-booking-confirmation] ticket_details_view query failed:', bookingErr.message);
            return new Response(JSON.stringify({
                success: false,
                error: `Database lookup failed: ${bookingErr.message}`
            }), {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        if (!booking) {
            // Check if booking exists but belongs to another user (RLS restricted)
            console.warn(`[send-booking-confirmation] Booking ${bookingId} not found under caller ${user.id}.`);
            return new Response(JSON.stringify({
                success: false,
                error: "Booking not found or you are not authorized to view this booking."
            }), {
                status: 404,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        // 7. Validate Booking Status
        if (booking.booking_status !== 'CONFIRMED') {
            return new Response(JSON.stringify({
                success: false,
                error: `Cannot send confirmation for non-confirmed booking (current status: ${booking.booking_status}).`
            }), {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        // 8. Resolve Recipient Email Address
        const recipientEmail = booking.customer_email || user.email;
        if (!recipientEmail || !recipientEmail.includes('@')) {
            return new Response(JSON.stringify({
                success: false,
                error: "No valid recipient email address could be resolved for this customer account."
            }), {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        // 9. Check Transactional Email Provider Secret (Resend)
        if (!resendApiKey) {
            console.warn("[send-booking-confirmation] RESEND_API_KEY secret is not set in Supabase secrets.");
            return new Response(JSON.stringify({
                success: false,
                notConfigured: true,
                error: "Transactional email provider is not yet configured. Please set RESEND_API_KEY in Supabase secrets."
            }), {
                status: 200,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        // 10. Generate Cinematic HTML & Text Content
        const htmlBody = generateCinematicEmailHtml(booking);
        const textBody = generatePlainTextEmail(booking);

        // 11. Send Email via Resend API
        console.log(`[send-booking-confirmation] Dispatching email to ${recipientEmail} via Resend...`);
        const resendResponse = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${resendApiKey}`,
                "Content-Type": "application/json",
                "Idempotency-Key": `mtrs-booking-${bookingId}`
            },
            body: JSON.stringify({
                from: senderEmail,
                to: [recipientEmail],
                subject: `Booking Confirmed: ${booking.movie_name} [${booking.booking_id}] - MTRS Cinemas`,
                html: htmlBody,
                text: textBody
            })
        });

        const resendResult = await resendResponse.json();

        if (!resendResponse.ok) {
            console.error("[send-booking-confirmation] Resend API error:", resendResult);

            // Log failure to outbox table if available
            try {
                await adminClient.from('booking_notifications').upsert({
                    booking_id: bookingId,
                    recipient_email: recipientEmail,
                    provider: 'resend',
                    status: 'FAILED',
                    error_message: resendResult?.message || 'Resend API rejected dispatch',
                    created_at: new Date().toISOString()
                }, { onConflict: 'booking_id' });
            } catch {}

            return new Response(JSON.stringify({
                success: false,
                error: resendResult?.message || "Failed to deliver confirmation email via provider."
            }), {
                status: 502,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        console.log(`[send-booking-confirmation] Email delivered successfully! Provider Message ID: ${resendResult.id}`);

        // 12. Record Successful Notification in Outbox Table
        try {
            await adminClient.from('booking_notifications').upsert({
                booking_id: bookingId,
                recipient_email: recipientEmail,
                provider: 'resend',
                provider_message_id: resendResult.id,
                status: 'SENT',
                sent_at: new Date().toISOString()
            }, { onConflict: 'booking_id' });
        } catch (saveErr) {
            console.warn('[send-booking-confirmation] Outbox record notice:', saveErr);
        }

        // 13. Return Success to Client
        return new Response(JSON.stringify({
            success: true,
            booking_id: bookingId,
            recipient: recipientEmail,
            messageId: resendResult.id,
            message: `Booking confirmation email sent to ${recipientEmail}`
        }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });

    } catch (err: any) {
        console.error("[send-booking-confirmation] Unhandled exception:", err);
        return new Response(JSON.stringify({
            success: false,
            error: "An unexpected error occurred while processing the booking confirmation."
        }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    }
});
