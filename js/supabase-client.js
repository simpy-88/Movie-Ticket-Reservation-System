// ============================================================================
// MOVIE TICKET RESERVATION SYSTEM (MTRS)
// File: js/supabase-client.js
// Description: Dedicated Supabase Client configuration and data service for MTRS.
// Handles initialization, queries for movies, theaters, screens, and showtimes,
// precise relational mapping, and resilient fallback handling.
// ============================================================================

(function () {
    'use strict';

    // ------------------------------------------------------------------------
    // 1. SUPABASE CONFIGURATION
    // ------------------------------------------------------------------------
    const SUPABASE_URL = 'https://xwknecnmkpoxpnxqrmgh.supabase.co';
    const SUPABASE_ANON_KEY = 'sb_publishable_d8Xfx-R4OQruS6GGvkBl8A_UL_QdIdb';

    let client = null;
    let initError = null;

    // Initialize Supabase Client via global window.supabase from CDN
    try {
        if (typeof window.supabase !== 'undefined' && typeof window.supabase.createClient === 'function') {
            client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
                auth: {
                    persistSession: true,
                    autoRefreshToken: true,
                    detectSessionInUrl: true
                }
            });
            console.log('[MTRS Supabase] Client successfully initialized with persistent auth and live project endpoint.');
        } else {
            initError = new Error('Supabase SDK (@supabase/supabase-js) is not loaded on window.');
            console.warn('[MTRS Supabase] CDN library not detected. Running in offline/fallback mode.');
        }
    } catch (err) {
        initError = err;
        console.error('[MTRS Supabase] Initialization error:', err.message);
    }

    // ------------------------------------------------------------------------
    // 2. RECORD MAPPERS: SUPABASE -> FRONTEND ENTITIES
    // Maps snake_case database columns to PascalCase expected by MTRS frontend
    // ------------------------------------------------------------------------

    // Movie Mapper
    function mapMovieRecord(row) {
        if (!row) return null;
        return {
            Movie_ID: row.movie_id,
            Movie_Name: row.movie_name,
            Genre: row.genre,
            Rating: parseFloat(row.rating) || 0.0,
            Duration: parseInt(row.duration, 10) || 0,
            Language: row.language,
            Synopsis: row.synopsis || '',
            Cast: row.cast_members || '',

            Poster_Url: row.poster_url || '',
            Poster_URL: row.poster_url || '',
            Poster_Hires_Url: row.poster_hires_url || '',
            Backdrop_Url: row.backdrop_url || '',
            tmdb_id: row.tmdb_id || null,

            // Lower-case aliases for backward compatibility
            movie_id: row.movie_id,
            movie_name: row.movie_name,
            genre: row.genre,
            rating: parseFloat(row.rating) || 0.0,
            duration: parseInt(row.duration, 10) || 0,
            language: row.language,
            synopsis: row.synopsis || '',
            cast_members: row.cast_members || '',
            poster_url: row.poster_url || '',
            poster_hires_url: row.poster_hires_url || '',
            backdrop_url: row.backdrop_url || ''
        };
    }

    // Theater Mapper
    function mapTheaterRecord(row) {
        if (!row) return null;
        return {
            Theater_ID: row.theater_id,
            Theater_Name: row.theater_name,
            City: row.city,
            State: row.state,
            Country: row.country || 'India',

            // Lower-case aliases
            theater_id: row.theater_id,
            theater_name: row.theater_name,
            city: row.city,
            state: row.state,
            country: row.country || 'India'
        };
    }

    // Screen Mapper
    function mapScreenRecord(row) {
        if (!row) return null;
        return {
            Screen_ID: row.screen_id,
            Theater_ID: row.theater_id,
            Screen_Number: parseInt(row.screen_number, 10) || 1,
            Screen_Name: row.screen_name || `Screen ${row.screen_number}`,
            Screen_Type: row.screen_type || 'Standard',
            Capacity: parseInt(row.capacity, 10) || 100,
            Projection_Tech: row.projection_tech || '2K Digital',
            Audio_Tech: row.audio_tech || 'Dolby 7.1 Surround',
            Verification_Status: row.verification_status || 'Published - Unverified',

            // Lower-case aliases
            screen_id: row.screen_id,
            theater_id: row.theater_id,
            screen_number: parseInt(row.screen_number, 10) || 1,
            screen_name: row.screen_name || `Screen ${row.screen_number}`,
            screen_type: row.screen_type || 'Standard',
            capacity: parseInt(row.capacity, 10) || 100,
            projection_tech: row.projection_tech || '2K Digital',
            audio_tech: row.audio_tech || 'Dolby 7.1 Surround',
            verification_status: row.verification_status || 'Published - Unverified'
        };
    }

    // Show Mapper
    function mapShowRecord(row) {
        if (!row) return null;
        return {
            Show_ID: row.show_id,
            Movie_ID: row.movie_id,
            Screen_ID: row.screen_id,
            Show_Date: typeof row.show_date === 'string' ? row.show_date.substring(0, 10) : row.show_date,
            Show_Time: row.show_time,
            Format: row.format,
            Ticket_Price: parseFloat(row.ticket_price) || 0.0,

            // Lower-case aliases
            show_id: row.show_id,
            movie_id: row.movie_id,
            screen_id: row.screen_id,
            show_date: typeof row.show_date === 'string' ? row.show_date.substring(0, 10) : row.show_date,
            show_time: row.show_time,
            format: row.format,
            ticket_price: parseFloat(row.ticket_price) || 0.0
        };
    }

    // Customer Profile Mapper
    function mapCustomerRecord(row) {
        if (!row) return null;
        return {
            Customer_ID: row.customer_id,
            Customer_Name: row.customer_name,
            Email: row.email,
            Phone: row.phone || '',
            Auth_User_ID: row.auth_user_id || null,

            // Lower-case aliases
            customer_id: row.customer_id,
            customer_name: row.customer_name,
            email: row.email,
            phone: row.phone || '',
            auth_user_id: row.auth_user_id || null
        };
    }

    // Seat Mapper
    function mapSeatRecord(row, isBooked = false) {
        if (!row) return null;
        return {
            Seat_ID: row.seat_id,
            Screen_ID: row.screen_id,
            Seat_Number: row.seat_number,
            Seat_Type: row.seat_type || 'Regular',
            Status: isBooked ? 'BOOKED' : 'AVAILABLE',

            // Lower-case aliases
            seat_id: row.seat_id,
            screen_id: row.screen_id,
            seat_number: row.seat_number,
            seat_type: row.seat_type || 'Regular',
            status: isBooked ? 'BOOKED' : 'AVAILABLE'
        };
    }

    // ------------------------------------------------------------------------
    // 3. DATA ACCESS METHODS: CATALOG & SEATS
    // ------------------------------------------------------------------------

    // Fetch Movies from public.movies
    async function fetchMovies() {
        if (!client) {
            return {
                success: false,
                source: 'LOCAL_FALLBACK',
                data: null,
                error: initError ? initError.message : 'Supabase client not initialized'
            };
        }

        try {
            console.log('[MTRS Supabase] Querying public.movies from live database...');
            const startTime = performance.now();

            const { data, error, status } = await client
                .from('movies')
                .select('*')
                .order('movie_id', { ascending: true });

            const elapsed = (performance.now() - startTime).toFixed(1);

            if (error) {
                console.error(`[MTRS Supabase] Movies query error (HTTP ${status}):`, error.message);
                return {
                    success: false,
                    source: 'LOCAL_FALLBACK',
                    data: null,
                    error: error.message,
                    statusCode: status
                };
            }

            if (!Array.isArray(data) || data.length === 0) {
                console.warn('[MTRS Supabase] Query returned 0 movie records. Reverting to local fallback.');
                return {
                    success: false,
                    source: 'LOCAL_FALLBACK',
                    data: null,
                    error: 'Empty dataset returned from public.movies'
                };
            }

            const mappedMovies = data.map(mapMovieRecord).filter(Boolean);
            console.log(`[MTRS Supabase] Movies query successful (${elapsed}ms). Retrieved ${mappedMovies.length} movies.`);

            return {
                success: true,
                source: 'SUPABASE',
                data: mappedMovies,
                count: mappedMovies.length,
                elapsedMs: elapsed,
                raw: data
            };
        } catch (networkError) {
            console.error('[MTRS Supabase] Network exception while fetching movies:', networkError.message);
            return {
                success: false,
                source: 'LOCAL_FALLBACK',
                data: null,
                error: networkError.message
            };
        }
    }

    // Fetch Theaters from public.theaters
    async function fetchTheaters() {
        if (!client) {
            return {
                success: false,
                source: 'LOCAL_FALLBACK',
                data: null,
                error: initError ? initError.message : 'Supabase client not initialized'
            };
        }

        try {
            console.log('[MTRS Supabase] Querying public.theaters from live database...');
            const startTime = performance.now();

            const { data, error, status } = await client
                .from('theaters')
                .select('*')
                .order('theater_id', { ascending: true });

            const elapsed = (performance.now() - startTime).toFixed(1);

            if (error) {
                console.error(`[MTRS Supabase] Theaters query error (HTTP ${status}):`, error.message);
                return {
                    success: false,
                    source: 'LOCAL_FALLBACK',
                    data: null,
                    error: error.message,
                    statusCode: status
                };
            }

            if (!Array.isArray(data) || data.length === 0) {
                console.warn('[MTRS Supabase] Query returned 0 theater records. Reverting to local fallback.');
                return {
                    success: false,
                    source: 'LOCAL_FALLBACK',
                    data: null,
                    error: 'Empty dataset returned from public.theaters'
                };
            }

            const mappedTheaters = data.map(mapTheaterRecord).filter(Boolean);
            console.log(`[MTRS Supabase] Theaters query successful (${elapsed}ms). Retrieved ${mappedTheaters.length} theaters.`);

            return {
                success: true,
                source: 'SUPABASE',
                data: mappedTheaters,
                count: mappedTheaters.length,
                elapsedMs: elapsed,
                raw: data
            };
        } catch (networkError) {
            console.error('[MTRS Supabase] Network exception while fetching theaters:', networkError.message);
            return {
                success: false,
                source: 'LOCAL_FALLBACK',
                data: null,
                error: networkError.message
            };
        }
    }

    // Fetch Screens from public.screens
    async function fetchScreens() {
        if (!client) {
            return {
                success: false,
                source: 'LOCAL_FALLBACK',
                data: null,
                error: initError ? initError.message : 'Supabase client not initialized'
            };
        }

        try {
            console.log('[MTRS Supabase] Querying public.screens from live database...');
            const startTime = performance.now();

            const { data, error, status } = await client
                .from('screens')
                .select('*')
                .order('screen_id', { ascending: true });

            const elapsed = (performance.now() - startTime).toFixed(1);

            if (error) {
                console.error(`[MTRS Supabase] Screens query error (HTTP ${status}):`, error.message);
                return {
                    success: false,
                    source: 'LOCAL_FALLBACK',
                    data: null,
                    error: error.message,
                    statusCode: status
                };
            }

            if (!Array.isArray(data) || data.length === 0) {
                console.warn('[MTRS Supabase] Query returned 0 screen records. Reverting to local fallback.');
                return {
                    success: false,
                    source: 'LOCAL_FALLBACK',
                    data: null,
                    error: 'Empty dataset returned from public.screens'
                };
            }

            const mappedScreens = data.map(mapScreenRecord).filter(Boolean);
            console.log(`[MTRS Supabase] Screens query successful (${elapsed}ms). Retrieved ${mappedScreens.length} screens.`);

            return {
                success: true,
                source: 'SUPABASE',
                data: mappedScreens,
                count: mappedScreens.length,
                elapsedMs: elapsed,
                raw: data
            };
        } catch (networkError) {
            console.error('[MTRS Supabase] Network exception while fetching screens:', networkError.message);
            return {
                success: false,
                source: 'LOCAL_FALLBACK',
                data: null,
                error: networkError.message
            };
        }
    }

    // Fetch Shows from public.shows
    async function fetchShows() {
        if (!client) {
            return {
                success: false,
                source: 'LOCAL_FALLBACK',
                data: null,
                error: initError ? initError.message : 'Supabase client not initialized'
            };
        }

        try {
            console.log('[MTRS Supabase] Querying public.shows from live database...');
            const startTime = performance.now();

            const { data, error, status } = await client
                .from('shows')
                .select('*')
                .order('show_id', { ascending: true });

            const elapsed = (performance.now() - startTime).toFixed(1);

            if (error) {
                console.error(`[MTRS Supabase] Shows query error (HTTP ${status}):`, error.message);
                return {
                    success: false,
                    source: 'LOCAL_FALLBACK',
                    data: null,
                    error: error.message,
                    statusCode: status
                };
            }

            if (!Array.isArray(data) || data.length === 0) {
                console.warn('[MTRS Supabase] Query returned 0 show records. Reverting to local fallback.');
                return {
                    success: false,
                    source: 'LOCAL_FALLBACK',
                    data: null,
                    error: 'Empty dataset returned from public.shows'
                };
            }

            const mappedShows = data.map(mapShowRecord).filter(Boolean);
            console.log(`[MTRS Supabase] Shows query successful (${elapsed}ms). Retrieved ${mappedShows.length} showtimes.`);

            return {
                success: true,
                source: 'SUPABASE',
                data: mappedShows,
                count: mappedShows.length,
                elapsedMs: elapsed,
                raw: data
            };
        } catch (networkError) {
            console.error('[MTRS Supabase] Network exception while fetching shows:', networkError.message);
            return {
                success: false,
                source: 'LOCAL_FALLBACK',
                data: null,
                error: networkError.message
            };
        }
    }

    // Combined Parallel Fetch for Entire Cinema Operational Dataset
    async function fetchCinemaSystem() {
        const [moviesRes, theatersRes, screensRes, showsRes] = await Promise.allSettled([
            fetchMovies(),
            fetchTheaters(),
            fetchScreens(),
            fetchShows()
        ]);

        return {
            movies: moviesRes.status === 'fulfilled' ? moviesRes.value : { success: false, data: null, error: moviesRes.reason?.message },
            theaters: theatersRes.status === 'fulfilled' ? theatersRes.value : { success: false, data: null, error: theatersRes.reason?.message },
            screens: screensRes.status === 'fulfilled' ? screensRes.value : { success: false, data: null, error: screensRes.reason?.message },
            shows: showsRes.status === 'fulfilled' ? showsRes.value : { success: false, data: null, error: showsRes.reason?.message }
        };
    }

    // ------------------------------------------------------------------------
    // 4. LIVE SEAT AVAILABILITY & REALTIME SUBSCRIPTION
    // ------------------------------------------------------------------------

    // Fetch Seats and Active Bookings for a given Show and Screen
    async function fetchSeatAvailability(showId, screenId) {
        if (!client) {
            return {
                success: false,
                source: 'LOCAL_FALLBACK',
                data: null,
                error: initError ? initError.message : 'Supabase client not initialized'
            };
        }

        try {
            console.log(`[MTRS Supabase] Querying seat availability for show ${showId} in screen ${screenId}...`);

            // Query seats for this screen and confirmed booked_seats for this show in parallel
            // Explicitly set limit to 2000 to ensure auditoriums up to 2000 seats (like SC31 with 948 seats) are never truncated by PostgREST defaults
            const [seatsRes, bookedRes] = await Promise.all([
                client.from('seats').select('*').eq('screen_id', screenId).order('seat_number', { ascending: true }).limit(2000),
                client.from('booked_seats').select('seat_id, status').eq('show_id', showId).eq('status', 'CONFIRMED')
            ]);

            if (seatsRes.error) {
                console.error('[MTRS Supabase] Seats query error:', seatsRes.error.message);
                return { success: false, source: 'LOCAL_FALLBACK', data: null, error: seatsRes.error.message };
            }

            if (bookedRes.error) {
                console.error('[MTRS Supabase] Booked seats query error:', bookedRes.error.message);
                return { success: false, source: 'LOCAL_FALLBACK', data: null, error: bookedRes.error.message };
            }

            const bookedIds = new Set((bookedRes.data || []).map(b => b.seat_id));

            // If the database has records for this screen, map them
            if (Array.isArray(seatsRes.data) && seatsRes.data.length > 0) {
                const mappedSeats = seatsRes.data.map(row => mapSeatRecord(row, bookedIds.has(row.seat_id)));
                console.log(`[MTRS Supabase] Live seat map loaded: ${mappedSeats.length} seats (${bookedIds.size} booked).`);
                return {
                    success: true,
                    source: 'SUPABASE',
                    data: mappedSeats,
                    bookedCount: bookedIds.size,
                    totalSeats: mappedSeats.length,
                    bookedSeatIds: Array.from(bookedIds)
                };
            }

            // If screen has no seeded rows in public.seats, report empty data so frontend can adapt
            return {
                success: true,
                source: 'SUPABASE',
                data: [],
                bookedCount: bookedIds.size,
                totalSeats: 0,
                bookedSeatIds: Array.from(bookedIds)
            };
        } catch (err) {
            console.error('[MTRS Supabase] Seat availability exception:', err);
            return { success: false, source: 'LOCAL_FALLBACK', data: null, error: err.message };
        }
    }

    // Subscribe to live booked_seats changes via Supabase Realtime Channel
    function subscribeToBookedSeats(showId, onChangeCallback) {
        if (!client || !showId) return null;
        try {
            const channelName = `realtime-show-${showId}`;
            const channel = client.channel(channelName)
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'booked_seats',
                        filter: `show_id=eq.${showId}`
                    },
                    (payload) => {
                        console.log(`[MTRS Supabase Realtime] Seat status change detected on show ${showId}:`, payload);
                        if (typeof onChangeCallback === 'function') {
                            onChangeCallback(payload);
                        }
                    }
                )
                .subscribe((status) => {
                    console.log(`[MTRS Supabase Realtime] Channel '${channelName}' status:`, status);
                });

            return channel;
        } catch (err) {
            console.warn('[MTRS Supabase Realtime] Realtime subscription not available:', err.message);
            return null;
        }
    }

    // Unsubscribe from a realtime channel
    async function unsubscribeChannel(channel) {
        if (!client || !channel) return;
        try {
            await client.removeChannel(channel);
        } catch (err) {
            console.warn('[MTRS Supabase Realtime] Error removing channel:', err);
        }
    }

    // ------------------------------------------------------------------------
    // 5. SUPABASE AUTHENTICATION & CUSTOMER PROFILE LINKING
    // ------------------------------------------------------------------------

    // Register a new customer via Supabase Auth
    async function signUpCustomer({ name, email, phone, password }) {
        if (!client) {
            return { success: false, error: 'Supabase client not initialized' };
        }

        try {
            const cleanEmail = email.trim().toLowerCase();
            const { data, error } = await client.auth.signUp({
                email: cleanEmail,
                password: password,
                options: {
                    data: {
                        full_name: name.trim(),
                        phone: (phone || '').trim()
                    }
                }
            });

            if (error) {
                console.error('[MTRS Supabase Auth] SignUp failed:', error.message);
                return { success: false, error: error.message };
            }

            return {
                success: true,
                user: data.user,
                session: data.session,
                requiresEmailConfirmation: !data.session
            };
        } catch (err) {
            console.error('[MTRS Supabase Auth] SignUp exception:', err);
            return { success: false, error: err.message };
        }
    }

    // Sign in an existing customer via Supabase Auth
    async function signInCustomer({ email, password }) {
        if (!client) {
            return { success: false, error: 'Supabase client not initialized' };
        }

        try {
            const cleanEmail = email.trim().toLowerCase();
            const { data, error } = await client.auth.signInWithPassword({
                email: cleanEmail,
                password: password
            });

            if (error) {
                console.error('[MTRS Supabase Auth] SignIn failed:', error.message);
                return { success: false, error: error.message };
            }

            return {
                success: true,
                user: data.user,
                session: data.session
            };
        } catch (err) {
            console.error('[MTRS Supabase Auth] SignIn exception:', err);
            return { success: false, error: err.message };
        }
    }

    // Sign out customer
    async function signOutCustomer() {
        if (!client) return { success: true };
        try {
            const { error } = await client.auth.signOut();
            if (error) {
                console.error('[MTRS Supabase Auth] SignOut error:', error.message);
                return { success: false, error: error.message };
            }
            return { success: true };
        } catch (err) {
            console.error('[MTRS Supabase Auth] SignOut exception:', err);
            return { success: false, error: err.message };
        }
    }

    // Get current persisted session
    async function getCurrentSession() {
        if (!client) return { session: null, user: null };
        try {
            const { data, error } = await client.auth.getSession();
            if (data && data.session) {
                return { session: data.session, user: data.session.user };
            }
            // Fallback: If session is null or stale in storage, check getUser
            const { data: userData, error: userError } = await client.auth.getUser();
            if (userData && userData.user) {
                const { data: refreshed } = await client.auth.refreshSession();
                return { session: refreshed?.session || null, user: userData.user };
            }
            return { session: null, user: null };
        } catch (err) {
            console.warn('[MTRS Supabase Auth] getSession error:', err);
            return { session: null, user: null };
        }
    }

    // Link authenticated session to customer profile via database procedure sp_link_current_user_profile
    async function linkCurrentUserProfile() {
        if (!client) {
            return { success: false, error: 'Supabase client not initialized' };
        }

        try {
            console.log('[MTRS Supabase Auth] Executing sp_link_current_user_profile RPC...');
            const { data, error } = await client.rpc('sp_link_current_user_profile');

            if (error) {
                console.warn('[MTRS Supabase Auth] Profile linking RPC notice:', error.message);
                return { success: false, error: error.message };
            }

            return { success: true, data: data };
        } catch (err) {
            console.error('[MTRS Supabase Auth] linkCurrentUserProfile exception:', err);
            return { success: false, error: err.message };
        }
    }

    // Fetch authenticated customer profile from public.customers (enforcing RLS)
    async function fetchAuthenticatedCustomerProfile(userId) {
        if (!client || !userId) return null;
        try {
            const { data, error } = await client
                .from('customers')
                .select('*')
                .eq('auth_user_id', userId)
                .maybeSingle();

            if (error) {
                console.warn('[MTRS Supabase Auth] Fetch profile error:', error.message);
                return null;
            }

            return mapCustomerRecord(data);
        } catch (err) {
            console.error('[MTRS Supabase Auth] Fetch profile exception:', err);
            return null;
        }
    }

    // Authoritative resolution of authenticated customer profile with automatic linking
    async function resolveCustomerProfile(userParam) {
        if (!client) {
            return { success: false, authenticated: false, error: 'Supabase client not initialized' };
        }

        let user = userParam;
        if (!user) {
            const sess = await getCurrentSession();
            user = sess.user;
        }

        if (!user) {
            return { success: false, authenticated: false, error: 'No active authentication session' };
        }

        // 1. Direct query of customer record matching auth_user_id
        let profile = await fetchAuthenticatedCustomerProfile(user.id);
        if (profile && (profile.Customer_ID || profile.customer_id)) {
            return { success: true, authenticated: true, profile: profile };
        }

        // 2. Profile not linked yet: run sp_link_current_user_profile RPC
        console.log('[MTRS Supabase Auth] Customer unlinked. Attempting database linking RPC...');
        const linkRes = await linkCurrentUserProfile();
        if (!linkRes.success) {
            console.warn('[MTRS Supabase Auth] Linking RPC notice:', linkRes.error);
            return {
                success: false,
                authenticated: true,
                unlinked: true,
                error: linkRes.error || 'Failed to link authenticated account to customer profile'
            };
        }

        // 3. Re-query profile post-linking
        profile = await fetchAuthenticatedCustomerProfile(user.id);
        if (profile && (profile.Customer_ID || profile.customer_id)) {
            return { success: true, authenticated: true, profile: profile };
        }

        // If RPC succeeded and returned customer_id directly
        if (linkRes.data && (linkRes.data.customer_id || linkRes.data.Customer_ID)) {
            const custId = linkRes.data.customer_id || linkRes.data.Customer_ID;
            const custName = user.user_metadata?.full_name || (user.email ? user.email.split('@')[0] : 'Customer');
            const custEmail = linkRes.data.email || user.email;
            const custPhone = user.user_metadata?.phone || '';
            const resolved = {
                Customer_ID: custId,
                Customer_Name: custName,
                Email: custEmail,
                Phone: custPhone,
                Auth_User_ID: user.id,

                customer_id: custId,
                customer_name: custName,
                email: custEmail,
                phone: custPhone,
                auth_user_id: user.id
            };
            return { success: true, authenticated: true, profile: resolved };
        }

        return {
            success: false,
            authenticated: true,
            unlinked: true,
            error: 'Customer profile record could not be found after linking.'
        };
    }

    // Send transactional booking confirmation email via Supabase Edge Function
    async function sendBookingConfirmation(bookingId) {
        if (!client) {
            return { success: false, error: 'Supabase client not initialized' };
        }
        if (!bookingId) {
            return { success: false, error: 'booking_id is required' };
        }

        try {
            console.log(`[MTRS Supabase] Invoking Edge Function send-booking-confirmation for booking ${bookingId}...`);
            const { data, error } = await client.functions.invoke('send-booking-confirmation', {
                body: { booking_id: bookingId }
            });

            if (error) {
                console.warn('[MTRS Supabase] Edge function invocation error:', error);
                return { success: false, error: error.message };
            }

            return data || { success: true };
        } catch (err) {
            console.error('[MTRS Supabase] Exception calling send-booking-confirmation:', err);
            return { success: false, error: err.message };
        }
    }

    // Listen for auth state transitions (login, logout, token refresh)
    function onAuthStateChange(callback) {
        if (!client) return null;
        try {
            const { data: { subscription } } = client.auth.onAuthStateChange((event, session) => {
                if (typeof callback === 'function') {
                    callback(event, session);
                }
            });
            return subscription;
        } catch (err) {
            console.warn('[MTRS Supabase Auth] onAuthStateChange error:', err);
            return null;
        }
    }

    // ------------------------------------------------------------------------
    // 6. DATABASE-BACKED ATOMIC BOOKING TRANSACTION (sp_book_ticket_transaction)
    // ------------------------------------------------------------------------

    // Execute atomic booking transaction via database stored procedure
    // Enforces server-side locks, auth matching, and hardware unique constraint uq_active_show_seat
    async function executeBookingTransaction({
        customerId,
        showId,
        format,
        ticketPrice,
        paymentMode,
        amount,
        seatIds
    }) {
        if (!client) {
            return { success: false, error: 'Database service is offline. Supabase client is not available.' };
        }

        if (!customerId || !showId || !Array.isArray(seatIds) || seatIds.length === 0) {
            return { success: false, error: 'Invalid booking parameters: Customer ID, Show ID, and Seat IDs are required.' };
        }

        try {
            console.log(`[MTRS Supabase RPC] Executing sp_book_ticket_transaction for customer ${customerId}, show ${showId}, seats:`, seatIds);

            const { data, error } = await client.rpc('sp_book_ticket_transaction', {
                p_customer_id: customerId,
                p_show_id: showId,
                p_format: format || '2D',
                p_ticket_price: parseFloat(ticketPrice) || 0.0,
                p_payment_mode: paymentMode || 'UPI',
                p_amount: parseFloat(amount) || 0.0,
                p_seat_ids: seatIds,
                p_booking_id: null,
                p_payment_id: null
            });

            if (error) {
                console.error('[MTRS Supabase RPC] sp_book_ticket_transaction failed:', error);
                return {
                    success: false,
                    error: error.message,
                    code: error.code,
                    details: error.details,
                    hint: error.hint
                };
            }

            console.log('[MTRS Supabase RPC] Booking transaction committed successfully:', data);
            return {
                success: true,
                data: data
            };
        } catch (err) {
            console.error('[MTRS Supabase RPC] Exception during booking transaction:', err);
            return {
                success: false,
                error: err.message
            };
        }
    }

    // ------------------------------------------------------------------------
    // 7. BOOKING HISTORY & E-TICKETS (ticket_details_view & public.bookings)
    // ------------------------------------------------------------------------

    // Fetch confirmed bookings for the authenticated customer
    async function fetchCustomerBookings() {
        if (!client) {
            return { success: false, source: 'LOCAL_FALLBACK', data: [], error: 'Supabase client not initialized' };
        }

        try {
            console.log('[MTRS Supabase] Fetching customer bookings via ticket_details_view...');
            // First attempt: query ticket_details_view (with security_invoker = true)
            const { data, error } = await client
                .from('ticket_details_view')
                .select('*')
                .order('booking_date', { ascending: false });

            if (!error && Array.isArray(data)) {
                console.log(`[MTRS Supabase] Retrieved ${data.length} bookings from ticket_details_view.`);
                return {
                    success: true,
                    source: 'SUPABASE',
                    data: data
                };
            }

            console.warn('[MTRS Supabase] ticket_details_view query fell back to direct bookings join:', error?.message);

            // Second attempt: query public.bookings directly with joins (enforces RLS)
            const { data: bookingsData, error: bookingsErr } = await client
                .from('bookings')
                .select(`
                    booking_id,
                    customer_id,
                    show_id,
                    booking_date,
                    ticket_price,
                    format,
                    status,
                    shows (
                        show_id,
                        movie_id,
                        screen_id,
                        show_date,
                        show_time,
                        format,
                        movies (movie_id, movie_name, duration, language, poster_url),
                        screens (screen_id, screen_name, screen_type, theaters (theater_id, theater_name, city))
                    ),
                    payments (payment_id, payment_mode, amount, status),
                    booked_seats (seat_id, status, seats (seat_id, seat_number, seat_type))
                `)
                .order('booking_date', { ascending: false });

            if (bookingsErr) {
                console.error('[MTRS Supabase] Direct bookings query error:', bookingsErr.message);
                return { success: false, source: 'LOCAL_FALLBACK', data: [], error: bookingsErr.message };
            }

            // Normalize joined records to match ticket_details_view schema
            const normalized = (bookingsData || []).map(b => {
                const show = b.shows || {};
                const movie = show.movies || {};
                const screen = show.screens || {};
                const theater = screen.theaters || {};
                const payment = Array.isArray(b.payments) ? b.payments[0] : (b.payments || {});
                const bSeats = Array.isArray(b.booked_seats) ? b.booked_seats : [];
                const seatNumbers = bSeats.map(bs => (bs.seats ? bs.seats.seat_number : bs.seat_id)).join(', ');

                return {
                    booking_id: b.booking_id,
                    customer_id: b.customer_id,
                    show_id: b.show_id,
                    movie_id: movie.movie_id,
                    movie_name: movie.movie_name || 'Movie',
                    movie_duration: movie.duration,
                    movie_language: movie.language,
                    poster_url: movie.poster_url,
                    theater_id: theater.theater_id,
                    theater_name: theater.theater_name,
                    theater_city: theater.city,
                    screen_id: screen.screen_id,
                    screen_name: screen.screen_name,
                    screen_type: screen.screen_type,
                    show_date: show.show_date,
                    show_time: show.show_time,
                    format: b.format,
                    ticket_price: b.ticket_price,
                    payment_id: payment.payment_id,
                    total_amount: payment.amount,
                    payment_mode: payment.payment_mode,
                    payment_status: payment.status,
                    booking_status: b.status,
                    booking_date: b.booking_date,
                    total_seats_count: bSeats.length,
                    booked_seat_numbers: seatNumbers,
                    booked_seat_ids: bSeats.map(bs => bs.seat_id)
                };
            });

            return {
                success: true,
                source: 'SUPABASE',
                data: normalized
            };
        } catch (err) {
            console.error('[MTRS Supabase] Fetch customer bookings exception:', err);
            return { success: false, source: 'LOCAL_FALLBACK', data: [], error: err.message };
        }
    }

    // ------------------------------------------------------------------------
    // 8. CANCELLATION PROCEDURE (sp_cancel_booking)
    // ------------------------------------------------------------------------

    // Execute atomic cancellation via database stored procedure sp_cancel_booking
    async function executeCancellationTransaction(bookingId, customerId) {
        if (!client) {
            return { success: false, error: 'Database service is offline. Supabase client is not available.' };
        }

        if (!bookingId || !customerId) {
            return { success: false, error: 'Booking ID and Customer ID are required for cancellation.' };
        }

        try {
            console.log(`[MTRS Supabase RPC] Executing sp_cancel_booking for booking ${bookingId}, customer ${customerId}...`);

            const { data, error } = await client.rpc('sp_cancel_booking', {
                p_booking_id: bookingId,
                p_customer_id: customerId
            });

            if (error) {
                console.error('[MTRS Supabase RPC] sp_cancel_booking failed:', error);
                return { success: false, error: error.message };
            }

            console.log('[MTRS Supabase RPC] Booking cancelled successfully:', data);
            return { success: true, data: data };
        } catch (err) {
            console.error('[MTRS Supabase RPC] Cancellation exception:', err);
            return { success: false, error: err.message };
        }
    }

    // ------------------------------------------------------------------------
    // 8.5. SCREEN & PHYSICAL SEAT TELEMETRY (Admin Source of Truth)
    // ------------------------------------------------------------------------
    async function updateScreenCapacity(screenId, newCapacity) {
        if (!client) {
            return { success: false, error: 'Supabase client not initialized' };
        }
        try {
            const parsed = parseInt(newCapacity, 10);
            if (isNaN(parsed) || parsed <= 0) {
                return { success: false, error: 'Capacity must be a positive integer.' };
            }
            const { data, error } = await client
                .from('screens')
                .update({ capacity: parsed })
                .eq('screen_id', screenId)
                .select();

            if (error) {
                console.error(`[MTRS Supabase] Error updating screen capacity for ${screenId}:`, error.message);
                return { success: false, error: error.message };
            }
            console.log(`[MTRS Supabase] Screen ${screenId} capacity updated to ${parsed} in Supabase.`);
            return { success: true, data: data };
        } catch (err) {
            console.error(`[MTRS Supabase] Exception updating screen capacity for ${screenId}:`, err);
            return { success: false, error: err.message };
        }
    }

    async function fetchPhysicalSeatCounts() {
        if (!client) {
            return { success: false, error: 'Supabase client not initialized' };
        }
        try {
            // Use relational aggregation to query all 49 screens and their exact physical seat count
            // This completely bypasses PostgREST's default 1,000-row table limit and provides instant verification
            const { data, error } = await client
                .from('screens')
                .select('screen_id, capacity, seats(count)')
                .order('screen_id', { ascending: true });

            if (error) {
                console.error('[MTRS Supabase] Error querying physical seat counts:', error.message);
                return { success: false, error: error.message };
            }

            const countMap = {};
            let totalSeats = 0;
            if (Array.isArray(data)) {
                data.forEach(row => {
                    const cnt = (Array.isArray(row.seats) && row.seats[0] && typeof row.seats[0].count === 'number')
                        ? row.seats[0].count
                        : 0;
                    countMap[row.screen_id] = cnt;
                    totalSeats += cnt;
                });
            }
            console.log(`[MTRS Supabase] Physical seat counts loaded: ${totalSeats} seats across ${data ? data.length : 0} screens.`);
            return { success: true, counts: countMap, totalSeats: totalSeats };
        } catch (err) {
            console.error('[MTRS Supabase] Exception querying physical seat counts:', err);
            return { success: false, error: err.message };
        }
    }

    // Fetch live confirmed booked seat counts for all shows
    async function fetchShowOccupancies() {
        if (!client) {
            return { success: false, data: {} };
        }
        try {
            const { data, error } = await client
                .from('booked_seats')
                .select('show_id, seat_id')
                .eq('status', 'CONFIRMED');

            if (error) {
                console.error('[MTRS Supabase] Error querying show occupancies:', error.message);
                return { success: false, error: error.message, data: {} };
            }

            const occupancyMap = {};
            if (Array.isArray(data)) {
                data.forEach(row => {
                    occupancyMap[row.show_id] = (occupancyMap[row.show_id] || 0) + 1;
                });
            }
            return { success: true, data: occupancyMap };
        } catch (err) {
            console.error('[MTRS Supabase] Exception querying show occupancies:', err);
            return { success: false, error: err.message, data: {} };
        }
    }

    // ------------------------------------------------------------------------
    // 9. GLOBAL EXPORTS
    // Expose client safely on window for MTRS application modules
    // ------------------------------------------------------------------------
    window.supabaseClient = client;
    window.MTRSSupabase = {
        client: client,
        url: SUPABASE_URL,
        isConfigured: !!client,
        initError: initError,
        // Mappers
        mapMovieRecord: mapMovieRecord,
        mapTheaterRecord: mapTheaterRecord,
        mapScreenRecord: mapScreenRecord,
        mapShowRecord: mapShowRecord,
        mapCustomerRecord: mapCustomerRecord,
        mapSeatRecord: mapSeatRecord,
        // Catalog Fetchers
        fetchMovies: fetchMovies,
        fetchTheaters: fetchTheaters,
        fetchScreens: fetchScreens,
        fetchShows: fetchShows,
        fetchCinemaSystem: fetchCinemaSystem,
        // Screen & Telemetry Management
        updateScreenCapacity: updateScreenCapacity,
        fetchPhysicalSeatCounts: fetchPhysicalSeatCounts,
        fetchShowOccupancies: fetchShowOccupancies,
        // Seats & Realtime
        fetchSeatAvailability: fetchSeatAvailability,
        subscribeToBookedSeats: subscribeToBookedSeats,
        unsubscribeChannel: unsubscribeChannel,
        // Authentication & Profile Linking
        signUpCustomer: signUpCustomer,
        signInCustomer: signInCustomer,
        signOutCustomer: signOutCustomer,
        getCurrentSession: getCurrentSession,
        linkCurrentUserProfile: linkCurrentUserProfile,
        fetchAuthenticatedCustomerProfile: fetchAuthenticatedCustomerProfile,
        resolveCustomerProfile: resolveCustomerProfile,
        onAuthStateChange: onAuthStateChange,
        // Transactions, Notifications & Booking History
        executeBookingTransaction: executeBookingTransaction,
        sendBookingConfirmation: sendBookingConfirmation,
        fetchCustomerBookings: fetchCustomerBookings,
        executeCancellationTransaction: executeCancellationTransaction
    };

})();

