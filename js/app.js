// ============================================================================
// MOVIE TICKET RESERVATION SYSTEM (MTRS)
// File: js/app.js
// Description: Core application logic, routing, movie browser, showtime picker,
//              interactive seat selection, and atomic checkout transaction flow.
// Updated for 6 Chennai Cinema Destinations & 49 Multi-Auditorium Screens.
// ============================================================================

class MTRSApp {
    constructor() {
        this.engine = window.MTRSEngine;
        this.currentCustomer = null;
        this.selectedMovie = null;
        this.selectedShow = null;
        this.selectedDate = '2026-10-21';
        this.selectedSeats = []; // Array of seat objects { Seat_ID, Seat_Number, Seat_Type, Price }
        this.searchQuery = '';
        this.activeGenre = 'All';
        this.activeFormat = 'All';
        this.activeLanguage = 'All';

        // Relational dataset state (Supabase Live vs. Local Fallback)
        this.movies = this.engine ? this.engine.getTable('MOVIE') : [];
        this.theaters = this.engine ? this.engine.getTable('THEATER') : [];
        this.screens = this.engine ? this.engine.getTable('SCREEN') : [];
        this.shows = this.engine ? this.engine.getTable('SHOWS') : [];

        this.dataSources = {
            movies: 'PENDING',
            theaters: 'PENDING',
            screens: 'PENDING',
            shows: 'PENDING'
        };
        this.movieSource = 'PENDING';
        this.isLoadingData = true;
        this.isLoadingMovies = true;

        this.init();
    }

    // ------------------------------------------------------------------------
    // SHOWTIME & DURATION END-TIME FORMATTING (Feature 5)
    // ------------------------------------------------------------------------
    formatShowtimeRange(showTimeStr, durationMinutes) {
        if (!showTimeStr) return '';
        const dur = parseInt(durationMinutes, 10);
        if (isNaN(dur) || dur <= 0) {
            return this.formatTime12Hour(showTimeStr);
        }

        const parts = showTimeStr.split(':');
        const startH = parseInt(parts[0], 10) || 0;
        const startM = parseInt(parts[1], 10) || 0;

        const startTotal = startH * 60 + startM;
        const endTotal = startTotal + dur;

        const startFormatted = this.formatMinutesTo12Hour(startTotal);
        const endFormatted = this.formatMinutesTo12Hour(endTotal);

        const daysCrossed = Math.floor(endTotal / 1440);
        const nextDayIndicator = daysCrossed > 0 ? ` (+${daysCrossed}d)` : '';

        return `${startFormatted} – ${endFormatted}${nextDayIndicator}`;
    }

    formatMinutesTo12Hour(totalMinutes) {
        const normalized = ((totalMinutes % 1440) + 1440) % 1440;
        const h24 = Math.floor(normalized / 60);
        const m = normalized % 60;
        const period = h24 >= 12 ? 'PM' : 'AM';
        const h12 = h24 % 12 === 0 ? 12 : (h24 % 12);
        const mStr = m < 10 ? `0${m}` : `${m}`;
        return `${h12}:${mStr} ${period}`;
    }

    formatTime12Hour(timeStr) {
        if (!timeStr) return '';
        const parts = timeStr.split(':');
        const h = parseInt(parts[0], 10) || 0;
        const m = parseInt(parts[1], 10) || 0;
        return this.formatMinutesTo12Hour(h * 60 + m);
    }

    init() {
        this.authUser = null;
        this.currentCustomer = null;
        this._authProfileError = null;
        this.liveSeatInventory = null;
        this.realtimeChannel = null;

        this.setupEventListeners();
        this.renderNavbarUser();
        this.updateDatabaseStatusBadge('loading');
        this.renderHeroBanner();
        this.renderMovieGrid();

        // Authoritative Supabase authentication restoration and live state listener
        this._authReadyPromise = this.initializeAuth();

        // Asynchronously load all cinema data (movies, theaters, screens, shows) from Supabase
        this.loadCinemaData();

        // Ensure original high-resolution uploaded posters render as soon as IndexedDB preloads
        window.addEventListener('mtrs:posters-loaded', () => {
            this.renderHeroBanner();
            this.renderMovieGrid();
        });

        if (window.MTRSImageStore && window.MTRSImageStore.initPromise) {
            window.MTRSImageStore.initPromise.then(() => {
                this.renderHeroBanner();
                this.renderMovieGrid();
            });
        }
    }

    // ------------------------------------------------------------------------
    // SUPABASE AUTHENTICATION & SESSION RESTORATION
    // ------------------------------------------------------------------------

    // Await this helper before any authenticated action to prevent race conditions
    async ensureAuthReady() {
        if (this._authReadyPromise) {
            try {
                await this._authReadyPromise;
            } catch (err) {
                console.warn('[MTRS App] ensureAuthReady caught error:', err);
            }
        }
        return {
            isAuthenticated: !!this.authUser,
            customer: this.currentCustomer,
            user: this.authUser,
            profileError: this._authProfileError
        };
    }

    // Refresh application state from the authoritative Supabase Auth session
    async refreshAuthState() {
        if (!window.MTRSSupabase || typeof window.MTRSSupabase.getCurrentSession !== 'function') {
            this.authUser = null;
            this.currentCustomer = null;
            this._authProfileError = null;
            this.renderNavbarUser();
            return;
        }

        try {
            const { session, user } = await window.MTRSSupabase.getCurrentSession();
            if (session && user) {
                this.authUser = user;
                console.log('[MTRS App] Verified active Supabase session for:', user.email);

                // Authoritatively resolve and link customer profile
                const res = await window.MTRSSupabase.resolveCustomerProfile(user);
                if (res.success && res.profile && res.profile.Customer_ID) {
                    this.currentCustomer = res.profile;
                    this._authProfileError = null;
                    console.log('[MTRS App] Linked customer profile:', this.currentCustomer.Customer_Name, this.currentCustomer.Customer_ID);
                } else {
                    this.currentCustomer = null;
                    this._authProfileError = res.error || 'Customer profile not yet linked in database';
                    console.warn('[MTRS App] Customer profile unlinked:', this._authProfileError);
                }
            } else {
                this.authUser = null;
                this.currentCustomer = null;
                this._authProfileError = null;
                console.log('[MTRS App] Running in guest mode (unauthenticated).');
            }
        } catch (err) {
            console.warn('[MTRS App] refreshAuthState exception:', err);
            this.authUser = null;
            this.currentCustomer = null;
            this._authProfileError = err.message;
        } finally {
            this.renderNavbarUser();

            // Refresh Account Modal if currently visible
            const accountModal = document.getElementById('account-modal');
            if (accountModal && accountModal.classList.contains('active')) {
                this.renderAccountModalContent();
            }

            // Refresh Checkout Modal customer display if currently visible
            const checkoutModal = document.getElementById('checkout-modal');
            if (checkoutModal && checkoutModal.classList.contains('active')) {
                this.renderCheckoutCustomerState();
            }

            // Refresh My Bookings view if currently visible
            const bookingsView = document.getElementById('view-my-bookings');
            if (bookingsView && bookingsView.style.display === 'block') {
                this.renderMyBookings();
            }
        }
    }

    async initializeAuth() {
        await this.refreshAuthState();

        // Listen for live Supabase Auth state transitions
        if (window.MTRSSupabase && typeof window.MTRSSupabase.onAuthStateChange === 'function') {
            window.MTRSSupabase.onAuthStateChange(async (event, session) => {
                console.log('[MTRS App] Supabase Auth event detected:', event);
                await this.refreshAuthState();
            });
        }
    }

    // Retry linking profile when email is confirmed or post-registration
    async retryProfileLinking() {
        const btn = document.getElementById('btn-retry-link');
        if (btn) {
            btn.disabled = true;
            btn.textContent = 'Linking Profile...';
        }

        try {
            const linkRes = await window.MTRSSupabase.linkCurrentUserProfile();
            if (!linkRes.success) {
                this.showToast(linkRes.error || "Profile linking failed. If you just registered, please verify your email first.", "error");
            } else {
                this.showToast("Customer profile successfully linked!", "success");
            }
            await this.refreshAuthState();
        } catch (err) {
            this.showToast(err.message || "Error linking profile", "error");
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.textContent = '🔄 Retry Profile Linking';
            }
        }
    }

    // ------------------------------------------------------------------------
    // ASYNC SUPABASE RELATIONAL LOADER (MOVIES, THEATERS, SCREENS, SHOWS)
    // ------------------------------------------------------------------------
    async loadCinemaData() {
        this.isLoadingData = true;
        this.isLoadingMovies = true;
        this.updateDatabaseStatusBadge('loading');

        if (!window.MTRSSupabase || typeof window.MTRSSupabase.fetchCinemaSystem !== 'function') {
            console.warn('[MTRS App] Supabase client service unavailable. Falling back to local dataset.');
            this.fallbackToLocalData('Supabase client module not detected');
            return;
        }

        try {
            const system = await window.MTRSSupabase.fetchCinemaSystem();

            let allLive = true;
            let loadedSummary = [];
            let fallbackReasons = [];

            // 1. Process Movies (public.movies)
            if (system.movies && system.movies.success && Array.isArray(system.movies.data) && system.movies.data.length > 0) {
                this.movies = system.movies.data;
                this.dataSources.movies = 'SUPABASE';
                this.movieSource = 'SUPABASE';
                if (this.engine && this.engine.db) this.engine.db.MOVIE = system.movies.data;
                loadedSummary.push(`${system.movies.count} Movies`);
            } else {
                allLive = false;
                this.dataSources.movies = 'LOCAL_FALLBACK';
                this.movieSource = 'LOCAL_FALLBACK';
                this.movies = this.engine.getTable('MOVIE');
                const err = system.movies?.error || 'Empty movie dataset';
                fallbackReasons.push(`Movies: ${err}`);
                console.warn('[MTRS App] Movies query failed, using local fallback:', err);
            }

            // 2. Process Theaters (public.theaters)
            if (system.theaters && system.theaters.success && Array.isArray(system.theaters.data) && system.theaters.data.length > 0) {
                this.theaters = system.theaters.data;
                this.dataSources.theaters = 'SUPABASE';
                if (this.engine && this.engine.db) this.engine.db.THEATER = system.theaters.data;
                loadedSummary.push(`${system.theaters.count} Theaters`);
            } else {
                allLive = false;
                this.dataSources.theaters = 'LOCAL_FALLBACK';
                this.theaters = this.engine.getTable('THEATER');
                const err = system.theaters?.error || 'Empty theater dataset';
                fallbackReasons.push(`Theaters: ${err}`);
                console.warn('[MTRS App] Theaters query failed, using local fallback:', err);
            }

            // 3. Process Screens (public.screens)
            if (system.screens && system.screens.success && Array.isArray(system.screens.data) && system.screens.data.length > 0) {
                this.screens = system.screens.data;
                this.dataSources.screens = 'SUPABASE';
                if (this.engine && this.engine.db) this.engine.db.SCREEN = system.screens.data;
                loadedSummary.push(`${system.screens.count} Screens`);
            } else {
                allLive = false;
                this.dataSources.screens = 'LOCAL_FALLBACK';
                this.screens = this.engine.getTable('SCREEN');
                const err = system.screens?.error || 'Empty screens dataset';
                fallbackReasons.push(`Screens: ${err}`);
                console.warn('[MTRS App] Screens query failed, using local fallback:', err);
            }

            // 4. Process Shows (public.shows)
            if (system.shows && system.shows.success && Array.isArray(system.shows.data) && system.shows.data.length > 0) {
                this.shows = system.shows.data;
                this.dataSources.shows = 'SUPABASE';
                if (this.engine && this.engine.db) this.engine.db.SHOWS = system.shows.data;
                loadedSummary.push(`${system.shows.count} Shows`);
            } else {
                allLive = false;
                this.dataSources.shows = 'LOCAL_FALLBACK';
                this.shows = this.engine.getTable('SHOWS');
                const err = system.shows?.error || 'Empty shows dataset';
                fallbackReasons.push(`Shows: ${err}`);
                console.warn('[MTRS App] Shows query failed, using local fallback:', err);
            }

            this.isLoadingData = false;
            this.isLoadingMovies = false;

            if (allLive) {
                this.updateDatabaseStatusBadge('live', loadedSummary.join(', '));
                console.log(`[MTRS App] Phase 2 complete. Supabase synchronization active: ${loadedSummary.join(' | ')}`);
            } else {
                const liveCount = Object.values(this.dataSources).filter(s => s === 'SUPABASE').length;
                if (liveCount > 0) {
                    this.updateDatabaseStatusBadge('fallback', `Partial Live: ${loadedSummary.join(', ')} (Fallbacks: ${fallbackReasons.join('; ')})`);
                } else {
                    this.updateDatabaseStatusBadge('fallback', fallbackReasons.join('; '));
                }
            }

            this.renderHeroBanner();
            this.renderMovieGrid();
            if (document.getElementById('view-theaters').style.display === 'block') {
                this.renderTheaterView();
            }
        } catch (err) {
            console.error('[MTRS App] Unexpected error during cinema data load:', err);
            this.fallbackToLocalData(err.message || 'Network exception');
        }
    }

    fallbackToLocalData(reason) {
        console.warn(`[MTRS App] Using LOCAL FALLBACK DATA. Reason: ${reason}`);
        this.movies = this.engine.getTable('MOVIE');
        this.theaters = this.engine.getTable('THEATER');
        this.screens = this.engine.getTable('SCREEN');
        this.shows = this.engine.getTable('SHOWS');

        this.dataSources = {
            movies: 'LOCAL_FALLBACK',
            theaters: 'LOCAL_FALLBACK',
            screens: 'LOCAL_FALLBACK',
            shows: 'LOCAL_FALLBACK'
        };
        this.movieSource = 'LOCAL_FALLBACK';

        this.isLoadingData = false;
        this.isLoadingMovies = false;
        this.updateDatabaseStatusBadge('fallback', reason);
        this.renderHeroBanner();
        this.renderMovieGrid();
        if (document.getElementById('view-theaters').style.display === 'block') {
            this.renderTheaterView();
        }
    }

    updateDatabaseStatusBadge(status, details = '') {
        const badge = document.getElementById('db-status-badge');
        const text = document.getElementById('db-status-text');
        const sourceTag = document.getElementById('catalog-source-tag');
        const sourceText = document.getElementById('catalog-source-text');
        const theatersTag = document.getElementById('theaters-source-tag');

        if (status === 'loading') {
            if (badge) {
                badge.className = 'db-status-badge loading';
                badge.title = 'Connecting to Supabase public tables (movies, theaters, screens, shows)...';
            }
            if (text) text.textContent = 'CONNECTING...';
            if (sourceTag) sourceTag.className = 'catalog-source-tag';
            if (sourceText) sourceText.textContent = 'Connecting to Supabase...';
            if (theatersTag) {
                theatersTag.className = 'catalog-source-tag';
                theatersTag.innerHTML = '<span>Connecting to Supabase...</span>';
            }
        } else if (status === 'live') {
            if (badge) {
                badge.className = 'db-status-badge live';
                badge.title = `Connected to live Supabase database. ${details}`;
            }
            if (text) text.textContent = 'LIVE SUPABASE DATA';
            if (sourceTag) sourceTag.className = 'catalog-source-tag live';
            if (sourceText) sourceText.innerHTML = '● LIVE SUPABASE DATA';
            if (theatersTag) {
                theatersTag.className = 'catalog-source-tag live';
                theatersTag.innerHTML = '<span>● LIVE SUPABASE SHOWTIMES</span>';
            }
        } else if (status === 'fallback') {
            if (badge) {
                badge.className = 'db-status-badge fallback';
                badge.title = `Using local in-memory relational seed data. ${details ? '(' + details + ')' : ''}`;
            }
            if (text) text.textContent = 'LOCAL FALLBACK DATA';
            if (sourceTag) sourceTag.className = 'catalog-source-tag fallback';
            if (sourceText) sourceText.innerHTML = '● LOCAL FALLBACK DATA';
            if (theatersTag) {
                theatersTag.className = 'catalog-source-tag fallback';
                theatersTag.innerHTML = '<span>● LOCAL FALLBACK SHOWTIMES</span>';
            }
        }
    }

    setupEventListeners() {
        // Navigation Links
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const targetView = item.getAttribute('data-view');
                if (targetView) this.switchView(targetView);
            });
        });

        // Search Input
        const searchInput = document.getElementById('navbar-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchQuery = e.target.value.toLowerCase().trim();
                this.renderMovieGrid();
            });
        }

        // Filter Chips
        document.querySelectorAll('.filter-chip[data-filter-type]').forEach(chip => {
            chip.addEventListener('click', (e) => {
                const type = chip.getAttribute('data-filter-type');
                const val = chip.getAttribute('data-filter-value');

                // Toggle active state in sibling chips
                chip.parentElement.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
                chip.classList.add('active');

                if (type === 'genre') this.activeGenre = val;
                if (type === 'format') this.activeFormat = val;
                if (type === 'lang') this.activeLanguage = val;

                this.renderMovieGrid();
            });
        });

        // User Account / Profile Click
        const userPill = document.getElementById('user-profile-pill');
        if (userPill) {
            userPill.addEventListener('click', () => this.openAccountModal());
        }

        // Global Escape Key to dismiss modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeTicketModal();
                this.closeAccountModal();
                const chkModal = document.getElementById('checkout-modal');
                if (chkModal) chkModal.classList.remove('active');
                const autoModal = document.getElementById('auto-schedule-modal');
                if (autoModal) autoModal.classList.remove('active');
            }
        });

        // Reset Database Button
        const resetBtn = document.getElementById('btn-reset-db');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                if (confirm("Reset MTRS database to default Chennai cinema seed state? All 6 Chennai destinations and 49 screens will be re-initialized.")) {
                    this.engine.resetToSeed();
                    this.showToast("Database restored to Chennai cinema seed dataset.", "success");
                    this.renderMovieGrid();
                    if (window.MTRSAdmin) window.MTRSAdmin.refreshDashboard();
                }
            });
        }

        // Floating Dock Checkout Button
        const proceedBtn = document.getElementById('dock-proceed-btn');
        if (proceedBtn) {
            proceedBtn.addEventListener('click', () => this.openCheckoutModal());
        }
    }

    switchView(viewName) {
        // Update nav active tab
        document.querySelectorAll('.nav-item').forEach(el => {
            el.classList.toggle('active', el.getAttribute('data-view') === viewName);
        });

        // Hide all views
        document.getElementById('view-home').style.display = 'none';
        document.getElementById('view-theaters').style.display = 'none';
        document.getElementById('view-seats').style.display = 'none';
        document.getElementById('view-my-bookings').style.display = 'none';
        document.getElementById('view-admin').style.display = 'none';
        document.getElementById('view-sql-sandbox').style.display = 'none';

        // Hide dock
        this.toggleDock(false);

        // Show target view
        if (viewName === 'home') {
            document.getElementById('view-home').style.display = 'block';
            this.renderMovieGrid();
        } else if (viewName === 'my-bookings') {
            document.getElementById('view-my-bookings').style.display = 'block';
            this.renderMyBookings();
        } else if (viewName === 'admin') {
            document.getElementById('view-admin').style.display = 'block';
            if (window.MTRSAdmin) window.MTRSAdmin.refreshDashboard();
        } else if (viewName === 'sql-sandbox') {
            document.getElementById('view-sql-sandbox').style.display = 'block';
            if (window.MTRSAdmin) window.MTRSAdmin.initQuerySandbox();
        }

        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    renderNavbarUser() {
        const nameEl = document.getElementById('navbar-user-name');
        const avatarEl = document.getElementById('navbar-user-avatar');
        if (this.currentCustomer) {
            if (nameEl) nameEl.textContent = this.currentCustomer.Customer_Name;
            if (avatarEl) {
                const parts = (this.currentCustomer.Customer_Name || '').trim().split(' ');
                const initials = parts.length > 1 ? (parts[0][0] + parts[parts.length - 1][0]) : (parts[0] ? parts[0].substring(0, 2) : 'CU');
                avatarEl.textContent = initials.toUpperCase();
            }
        } else {
            if (nameEl) nameEl.textContent = 'Sign In';
            if (avatarEl) avatarEl.textContent = '👤';
        }
    }

    // ------------------------------------------------------------------------
    // HERO BANNER
    // ------------------------------------------------------------------------
    renderHeroBanner() {
        const movies = this.movies || this.engine.getTable('MOVIE');
        const heroMovie = movies.find(m => m.Movie_ID === 'M01') || movies[0];
        if (!heroMovie) return;

        const posterBox = document.getElementById('hero-poster-box');
        if (posterBox) {
            posterBox.innerHTML = window.MTRSPosters ? 
                window.MTRSPosters.renderPosterHtml(heroMovie, 'hero-poster-img', heroMovie.Movie_Name) :
                (window.MOVIE_POSTERS && window.MOVIE_POSTERS[heroMovie.Movie_ID] ? window.MOVIE_POSTERS[heroMovie.Movie_ID].svg : '');
        }

        const btnBookHero = document.getElementById('btn-hero-book');
        if (btnBookHero) {
            btnBookHero.onclick = () => this.selectMovieForBooking(heroMovie.Movie_ID);
        }
    }

    // ------------------------------------------------------------------------
    // MOVIE GRID (Catalogue & Filtering)
    // ------------------------------------------------------------------------
    renderMovieGrid() {
        const grid = document.getElementById('movie-grid-container');
        if (!grid) return;

        if (this.isLoadingMovies) {
            grid.innerHTML = `
                <div class="movie-grid-loading">
                    <div class="movie-loading-spinner"></div>
                    <div style="font-family: var(--font-heading); font-size: 1.15rem; font-weight: 700; color: var(--text-pure); margin-bottom: 0.35rem;">
                        Fetching Chennai Releases from Supabase...
                    </div>
                    <p style="color: var(--text-muted); font-size: 0.85rem; max-width: 420px;">
                        Connecting to live PostgreSQL cloud database at <span style="font-family: var(--font-mono); color: var(--accent-cyan);">xwknecnmkpoxpnxqrmgh</span>...
                    </p>
                </div>
            `;
            return;
        }

        const movies = this.movies || this.engine.getTable('MOVIE');
        const shows = this.shows || this.engine.getTable('SHOWS');

        const filtered = movies.filter(movie => {
            // Search query filter
            const matchesSearch = !this.searchQuery || 
                movie.Movie_Name.toLowerCase().includes(this.searchQuery) ||
                movie.Genre.toLowerCase().includes(this.searchQuery) ||
                movie.Language.toLowerCase().includes(this.searchQuery);

            // Genre filter
            const matchesGenre = this.activeGenre === 'All' || movie.Genre.toLowerCase().includes(this.activeGenre.toLowerCase());

            // Language filter
            const matchesLang = this.activeLanguage === 'All' || movie.Language.toLowerCase() === this.activeLanguage.toLowerCase();

            // Format filter: check if any show of this movie matches format
            let matchesFormat = true;
            if (this.activeFormat !== 'All') {
                const movieShows = shows.filter(s => s.Movie_ID === movie.Movie_ID);
                matchesFormat = movieShows.some(s => s.Format.toLowerCase().includes(this.activeFormat.toLowerCase()));
            }

            return matchesSearch && matchesGenre && matchesLang && matchesFormat;
        });

        if (filtered.length === 0) {
            grid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 4rem 1rem; color: var(--text-muted);">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">🎬</div>
                    <h3 style="font-size: 1.3rem; color: var(--text-pure); margin-bottom: 0.5rem;">No Movies Found</h3>
                    <p>Try adjusting your search criteria or resetting the filters.</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = filtered.map(movie => {
            const posterHtml = window.MTRSPosters ? 
                window.MTRSPosters.renderPosterHtml(movie, 'movie-poster-img', movie.Movie_Name) :
                (window.MOVIE_POSTERS && window.MOVIE_POSTERS[movie.Movie_ID] ? window.MOVIE_POSTERS[movie.Movie_ID].svg : '');

            // Find available formats for this movie from shows
            const movieShows = shows.filter(s => s.Movie_ID === movie.Movie_ID);
            const formats = [...new Set(movieShows.map(s => s.Format))];
            const formatTags = formats.length > 0 ? 
                formats.map(f => `<span class="card-format-tag">${f}</span>`).join('') :
                '<span class="card-format-tag">2D</span>';

            return `
                <div class="movie-card" onclick="window.App.selectMovieForBooking('${movie.Movie_ID}')">
                    <div class="movie-poster-box">
                        ${posterHtml}
                        <div class="card-overlay-badge">
                            ★ ${movie.Rating}
                        </div>
                        <div class="card-formats-bar">
                            ${formatTags}
                        </div>
                    </div>
                    <div class="movie-details">
                        <h3 class="movie-card-title">${movie.Movie_Name}</h3>
                        <div class="movie-card-genre">${movie.Genre} • ${movie.Duration}m</div>
                        <div class="movie-card-footer">
                            <span class="movie-lang-pill">${movie.Language}</span>
                            <button class="btn-book-card" onclick="event.stopPropagation(); window.App.selectMovieForBooking('${movie.Movie_ID}')">
                                Book Tickets
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // ------------------------------------------------------------------------
    // THEATER & SHOW SELECTOR VIEW (6 Chennai Cinema Destinations)
    // ------------------------------------------------------------------------
    selectMovieForBooking(movieId) {
        const movies = this.movies || this.engine.getTable('MOVIE');
        const movie = movies.find(m => m.Movie_ID === movieId) || this.engine.getTable('MOVIE').find(m => m.Movie_ID === movieId);
        if (!movie) return;

        this.selectedMovie = movie;
        this.selectedShow = null;
        this.selectedSeats = [];

        // Switch to theater view
        document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
        document.getElementById('view-home').style.display = 'none';
        document.getElementById('view-seats').style.display = 'none';
        document.getElementById('view-my-bookings').style.display = 'none';
        document.getElementById('view-admin').style.display = 'none';
        document.getElementById('view-sql-sandbox').style.display = 'none';
        document.getElementById('view-theaters').style.display = 'block';

        this.renderTheaterView();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    renderTheaterView() {
        const container = document.getElementById('view-theaters');
        if (!container || !this.selectedMovie) return;

        const movie = this.selectedMovie;
        const theaters = this.theaters || this.engine.getTable('THEATER');
        const screens = this.screens || this.engine.getTable('SCREEN');
        const shows = this.shows || this.engine.getTable('SHOWS');

        const isTheatersLive = this.dataSources && this.dataSources.theaters === 'SUPABASE' && this.dataSources.shows === 'SUPABASE';
        const sourceLabel = isTheatersLive ? '● LIVE SUPABASE SHOWTIMES' : '● LOCAL FALLBACK SHOWTIMES';
        const sourceClass = isTheatersLive ? 'live' : 'fallback';

        // Filter shows for this movie and selected date
        const movieShows = shows.filter(s => s.Movie_ID === movie.Movie_ID && s.Show_Date === this.selectedDate);

        // Group shows by Theater across all 6 Chennai destinations
        const theaterGroups = theaters.map(th => {
            const thScreens = screens.filter(sc => sc.Theater_ID === th.Theater_ID);
            const thScreenIds = new Set(thScreens.map(sc => sc.Screen_ID));
            const thShows = movieShows.filter(sh => thScreenIds.has(sh.Screen_ID));

            return {
                theater: th,
                screens: thScreens,
                shows: thShows
            };
        });

        const activeGroupsWithShows = theaterGroups.filter(g => g.shows.length > 0);

        container.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem; margin-bottom: 1.25rem;">
                <div class="breadcrumbs" style="margin-bottom: 0;">
                    <span class="breadcrumb-link" onclick="window.App.switchView('home')">← Back to Movies</span>
                    <span>/</span>
                    <span>${movie.Movie_Name}</span>
                    <span>/</span>
                    <span style="color: var(--primary);">Chennai Cinema Theaters &amp; Showtimes</span>
                </div>
                <div id="theaters-source-tag" class="catalog-source-tag ${sourceClass}" title="Theaters, screens, and showtimes data origin">
                    <span>${sourceLabel}</span>
                </div>
            </div>

            <div class="show-movie-banner">
                <div class="show-movie-info">
                    <h2>${movie.Movie_Name}</h2>
                    <div style="display: flex; gap: 1rem; align-items: center; color: var(--text-secondary); font-size: 0.9rem; margin-top: 0.4rem; flex-wrap: wrap;">
                        <span style="color: var(--accent-gold); font-weight: 700;">★ ${movie.Rating}/10</span>
                        <span>•</span>
                        <span>${movie.Genre}</span>
                        <span>•</span>
                        <span>${movie.Language}</span>
                        <span>•</span>
                        <span>${movie.Duration} Mins</span>
                        <span>•</span>
                        <span style="color: var(--accent-cyan); font-weight: 600;">📍 Chennai Multiplexes</span>
                    </div>
                </div>
            </div>

            <!-- Date Selector Row -->
            <div class="date-selector-row">
                <div class="date-pill ${this.selectedDate === '2026-10-21' ? 'active' : ''}" onclick="window.App.setDateFilter('2026-10-21', this)">
                    <div class="date-day">WED</div>
                    <div class="date-number">21</div>
                </div>
                <div class="date-pill ${this.selectedDate === '2026-10-22' ? 'active' : ''}" onclick="window.App.setDateFilter('2026-10-22', this)">
                    <div class="date-day">THU</div>
                    <div class="date-number">22</div>
                </div>
                <div class="date-pill ${this.selectedDate === '2026-10-23' ? 'active' : ''}" onclick="window.App.setDateFilter('2026-10-23', this)">
                    <div class="date-day">FRI</div>
                    <div class="date-number">23</div>
                </div>
            </div>

            <!-- Theaters & Showtimes Listing -->
            <div class="theaters-list">
                ${activeGroupsWithShows.length > 0 ? activeGroupsWithShows.map(group => `
                    <div class="theater-card">
                        <div class="theater-header">
                            <div>
                                <h3 class="theater-name">${group.theater.Theater_Name}</h3>
                                <div class="theater-address">📍 ${group.theater.City}, ${group.theater.State} • Total Screens: ${group.screens.length} Auditoriums</div>
                            </div>
                            <div style="font-size: 0.8rem; color: var(--accent-cyan); font-weight: 700; text-align: right;">
                                <span>Verified Partner</span>
                            </div>
                        </div>

                        <div class="showtimes-grid">
                            ${group.shows.map(show => {
                                const screen = group.screens.find(s => s.Screen_ID === show.Screen_ID);
                                const isPLF = ['IMAX 3D', 'IMAX 2D', 'P[XL] 2D', 'P[XL] 3D', 'BIGPIX 2D', 'BIGPIX 3D'].includes(show.Format);
                                
                                return `
                                    <button class="showtime-btn ${isPLF ? 'plf-highlight' : ''}" onclick="window.App.selectShowForSeats('${show.Show_ID}')">
                                        <div class="showtime-time">${this.formatShowtimeRange(show.Show_Time, movie.Duration)}</div>
                                        <div class="showtime-format" style="color: ${isPLF ? 'var(--accent-gold)' : 'var(--accent-cyan)'};">${show.Format}</div>
                                        <div class="showtime-price">₹${show.Ticket_Price}</div>
                                        <div style="font-size: 0.68rem; color: var(--text-pure); font-weight: 600; margin-top: 3px; max-width: 130px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                            ${screen ? screen.Screen_Name : 'Audi 1'}
                                        </div>
                                        <div style="font-size: 0.62rem; color: var(--text-muted);">
                                            ${screen ? screen.Audio_Tech : 'Dolby 7.1'}
                                        </div>
                                    </button>
                                `;
                            }).join('')}
                        </div>
                    </div>
                `).join('') : `
                    <div class="theater-card" style="text-align: center; padding: 3rem 1rem;">
                        <h4 style="color: var(--text-pure); margin-bottom: 0.5rem;">No Shows Available For This Date</h4>
                        <p style="color: var(--text-secondary); font-size: 0.9rem;">Please choose another date (e.g. Wed 21) or explore other movies.</p>
                    </div>
                `}

                <!-- Collapsible list of all 6 Chennai destinations -->
                <div style="background: var(--bg-surface); border: var(--glass-border); border-radius: var(--radius-lg); padding: 1.5rem; margin-top: 2rem;">
                    <h4 style="font-size: 1.1rem; color: var(--text-pure); margin-bottom: 0.5rem;">All 6 Verified Chennai Destinations in MTRS:</h4>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem; font-size: 0.85rem; color: var(--text-secondary);">
                        ${theaters.map(t => {
                            const scCount = screens.filter(s => s.Theater_ID === t.Theater_ID).length;
                            return `
                                <div style="background: var(--bg-surface-elevated); padding: 0.75rem 1rem; border-radius: var(--radius-md); border: 1px solid var(--border-subtle);">
                                    <strong style="color: var(--text-pure);">${t.Theater_Name}</strong>
                                    <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 2px;">${scCount} Separate Auditoriums • ${t.City}</div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    setDateFilter(dateStr, element) {
        this.selectedDate = dateStr;
        document.querySelectorAll('.date-pill').forEach(el => el.classList.remove('active'));
        if (element) element.classList.add('active');
        this.renderTheaterView();
    }

    // ------------------------------------------------------------------------
    // SEAT SELECTION VIEW (Dynamic & Clamped to Capacity)
    // ------------------------------------------------------------------------
    async selectShowForSeats(showId) {
        // Clean up previous realtime channel
        if (this.realtimeChannel && window.MTRSSupabase) {
            window.MTRSSupabase.unsubscribeChannel(this.realtimeChannel);
            this.realtimeChannel = null;
        }

        const shows = this.shows || this.engine.getTable('SHOWS');
        const show = shows.find(s => s.Show_ID === showId) || this.engine.getTable('SHOWS').find(s => s.Show_ID === showId);
        if (!show) return;

        this.selectedShow = show;
        this.selectedSeats = [];

        // Hide other views, show seat layout
        document.getElementById('view-theaters').style.display = 'none';
        document.getElementById('view-seats').style.display = 'block';

        this.toggleDock(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });

        await this.loadLiveSeatsAndRender(show);
    }

    async loadLiveSeatsAndRender(show) {
        const container = document.getElementById('view-seats');
        if (!container) return;

        // Render loading state for auditorium seat grid
        container.innerHTML = `
            <div style="text-align: center; padding: 5rem 1rem;">
                <div class="movie-loading-spinner" style="margin: 0 auto 1.5rem;"></div>
                <h3 style="font-family: var(--font-heading); color: var(--text-pure); font-size: 1.25rem; margin-bottom: 0.5rem;">
                    Loading Live Auditorium Seating...
                </h3>
                <p style="color: var(--text-muted); font-size: 0.88rem;">
                    Checking real-time seat availability and confirmed bookings from Supabase.
                </p>
            </div>
        `;

        try {
            // Fetch live seat availability from Supabase (public.seats & public.booked_seats)
            const res = await window.MTRSSupabase.fetchSeatAvailability(show.Show_ID, show.Screen_ID);

            if (res.success && Array.isArray(res.data) && res.data.length > 0) {
                this.liveSeatInventory = res.data;
                this.liveSeatsSource = 'SUPABASE';
                this.liveSeatsError = null;
            } else if (res.success) {
                // Screen has 0 physical seat rows configured in public.seats:
                // Report empty array so unconfigured visual seats remain unbookable and do NOT invent fake IDs!
                this.liveSeatInventory = [];
                this.liveSeatsSource = 'SUPABASE';
                this.liveSeatsError = null;
            } else {
                // Network or Supabase error: show clear error with local fallback
                console.warn('[MTRS App] Supabase seat availability returned error:', res.error);
                this.liveSeatInventory = this.engine ? this.engine.sp_CheckSeatAvailability(show.Show_ID) : [];
                this.liveSeatsSource = 'LOCAL_FALLBACK';
                this.liveSeatsError = res.error || 'Failed to retrieve real-time inventory from database.';
            }

            // Subscribe to live Realtime changes on booked_seats
            this.realtimeChannel = window.MTRSSupabase.subscribeToBookedSeats(show.Show_ID, (payload) => {
                console.log('[MTRS App Realtime] Booked seat change received:', payload);
                if (payload.new && payload.new.seat_id && this.liveSeatInventory) {
                    const targetSeat = this.liveSeatInventory.find(s => s.Seat_ID === payload.new.seat_id);
                    if (targetSeat) {
                        targetSeat.Status = payload.new.status === 'CONFIRMED' ? 'BOOKED' : 'AVAILABLE';
                        if (targetSeat.Status === 'BOOKED') {
                            this.selectedSeats = this.selectedSeats.filter(s => s.Seat_ID !== targetSeat.Seat_ID);
                        }
                        this.renderSeatLayout();
                        this.updateFloatingDock();
                    }
                }
            });

        } catch (err) {
            console.error('[MTRS App] Exception loading live seat map:', err);
            this.liveSeatInventory = this.engine ? this.engine.sp_CheckSeatAvailability(show.Show_ID) : [];
            this.liveSeatsSource = 'LOCAL_FALLBACK';
            this.liveSeatsError = err.message || 'Database query exception.';
        }

        this.renderSeatLayout();
    }

    renderSeatLayout() {
        const container = document.getElementById('view-seats');
        if (!container || !this.selectedShow || !this.selectedMovie) return;

        const show = this.selectedShow;
        const movie = this.selectedMovie;
        const screens = this.screens || this.engine.getTable('SCREEN');
        const theaters = this.theaters || this.engine.getTable('THEATER');
        const screen = screens.find(s => s.Screen_ID === show.Screen_ID) || this.engine.getTable('SCREEN').find(s => s.Screen_ID === show.Screen_ID);
        const theater = theaters.find(t => t.Theater_ID === (screen ? screen.Theater_ID : '')) || this.engine.getTable('THEATER').find(t => t.Theater_ID === (screen ? screen.Theater_ID : ''));

        // 1. Auditorium Sizing from Authoritative Screen Capacity
        const capacity = parseInt(screen ? screen.Capacity : 0, 10) || 160;
        
        // Canonical layout configuration (Shared with Admin and Database Seed)
        const layout = (typeof window.calculateScreenLayout === 'function') 
            ? window.calculateScreenLayout(capacity)
            : { colsPerRow: 14, numRows: Math.ceil(capacity / 14), aisleCol: 7, rowLabels: ['A', 'B', 'C', 'D'] };

        const colsPerRow = layout.colsPerRow;
        const aisleCol = layout.aisleCol;
        const totalRowsCount = layout.numRows;
        const activeLetters = layout.rowLabels;

        // 2. Verified Database Seat Map
        const verifiedMap = new Map();
        const rawInventory = Array.isArray(this.liveSeatInventory) ? this.liveSeatInventory : [];
        rawInventory.forEach(seat => {
            if (seat && seat.Seat_Number) {
                verifiedMap.set(seat.Seat_Number.toUpperCase(), seat);
            }
        });

        // 3. Tiers & Pricing Calculation
        const getTierPrice = (type) => {
            if (type === 'VIP') return show.Ticket_Price;
            if (type === 'Balcony') return Math.max(show.Ticket_Price - 50, 180);
            if (type === 'Premium') return Math.max(show.Ticket_Price - 90, 160);
            return Math.max(show.Ticket_Price - 130, 140);
        };

        // 4. Construct Row Structure matching exact screen capacity
        const getRowType = (letter, rIdx) => {
            if (letter === 'A') return 'VIP';
            if (letter === 'B') return 'Balcony';
            if (letter === 'C') return 'Premium';
            if (letter === 'D') return 'Regular';
            if (rIdx < Math.ceil(totalRowsCount * 0.5)) return 'Premium';
            return 'Regular';
        };

        const tiers = [];
        let curTier = null;
        let totalSeatsGenerated = 0;

        for (let rIdx = 0; rIdx < totalRowsCount && totalSeatsGenerated < capacity; rIdx++) {
            const rowKey = activeLetters[rIdx];
            const rowType = getRowType(rowKey, rIdx);
            const tierPrice = getTierPrice(rowType);

            if (!curTier || curTier.type !== rowType || curTier.price !== tierPrice) {
                curTier = {
                    type: rowType,
                    price: tierPrice,
                    rows: []
                };
                tiers.push(curTier);
            }

            const seatsInThisRow = Math.min(colsPerRow, capacity - totalSeatsGenerated);
            const rowSeats = [];

            for (let c = 1; c <= seatsInThisRow; c++) {
                const seatNum = `${rowKey}${c}`;
                const dbRecord = verifiedMap.get(seatNum);

                if (dbRecord) {
                    rowSeats.push({
                        Seat_ID: dbRecord.Seat_ID,
                        Seat_Number: seatNum,
                        Seat_Type: dbRecord.Seat_Type || rowType,
                        Status: dbRecord.Status,
                        isConfigured: true,
                        isBookable: (dbRecord.Status !== 'BOOKED'),
                        col: c
                    });
                } else {
                    rowSeats.push({
                        Seat_ID: null,
                        Seat_Number: seatNum,
                        Seat_Type: rowType,
                        Status: 'UNCONFIGURED',
                        isConfigured: false,
                        isBookable: false,
                        col: c
                    });
                }
            }

            totalSeatsGenerated += seatsInThisRow;

            curTier.rows.push({
                rowKey,
                seats: rowSeats
            });
        }

        // 5. Calculate Distinct Verification & Telemetry Metrics
        const physicalDbSeats = verifiedMap.size;
        const occupiedCount = Array.from(verifiedMap.values()).filter(s => s.Status === 'BOOKED').length;
        const availableCount = Math.max(0, physicalDbSeats - occupiedCount);
        const selectedCount = this.selectedSeats.length;
        const subtotal = this.selectedSeats.reduce((sum, s) => sum + (s.Price || 0), 0);
        const unconfiguredCount = Math.max(0, capacity - physicalDbSeats);
        const isFullySynchronized = physicalDbSeats >= capacity && capacity > 0;
        const hasActiveInventory = physicalDbSeats > 0;


        container.innerHTML = `
            <div class="breadcrumbs">
                <span class="breadcrumb-link" onclick="window.App.selectMovieForBooking('${movie.Movie_ID}')">← Back to Showtimes</span>
                <span>/</span>
                <span>${movie.Movie_Name}</span>
                <span>/</span>
                <span style="color: var(--mtrs-seat-selected, #B49AFF);">${theater ? theater.Theater_Name : ''}</span>
            </div>

            ${this.liveSeatsError ? `
                <div style="background: rgba(239, 68, 68, 0.12); border: 1px solid rgba(239, 68, 68, 0.35); border-radius: 10px; padding: 0.75rem 1.25rem; margin-bottom: 1.25rem; display: flex; align-items: center; justify-content: space-between; gap: 1rem;">
                    <div style="color: #FCA5A5; font-size: 0.88rem;">
                        <strong>Data Retrieval Notice:</strong> ${this.liveSeatsError}. Showing local verified seat layout.
                    </div>
                    <button class="btn-secondary" style="font-size: 0.75rem; padding: 0.25rem 0.6rem;" onclick="window.App.loadLiveSeatsAndRender(window.App.selectedShow)">
                        Retry Database Sync
                    </button>
                </div>
            ` : ''}

            <div class="seat-show-header">
                <div>
                    <h2 class="seat-movie-title">${movie.Movie_Name} (${show.Format})</h2>
                    <div class="seat-theater-meta">
                        ${theater ? theater.Theater_Name : ''} | 
                        <strong>${screen ? screen.Screen_Name : 'Audi'}</strong> • 
                        ${screen ? screen.Projection_Tech : ''} • ${screen ? screen.Audio_Tech : ''}
                    </div>
                    <div style="display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; margin-top: 8px;">
                        <span style="font-size: 0.78rem; color: var(--accent-emerald, #10B981); font-weight: 700; background: rgba(16, 185, 129, 0.12); padding: 3px 8px; border-radius: 6px;">
                            Configured Capacity: ${capacity} Seats
                        </span>
                        <span style="font-size: 0.78rem; color: var(--accent-cyan, #00E5FF); font-weight: 700; background: rgba(0, 229, 255, 0.12); padding: 3px 8px; border-radius: 6px;">
                            Layout: ${layout.numRows} Rows × ${colsPerRow} Cols (Aisle @ ${aisleCol})
                        </span>
                        <div class="auditorium-inventory-badge ${isFullySynchronized ? '' : (physicalDbSeats > 0 ? 'warning' : 'danger')}">
                            <span class="verified-dot"></span>
                            <span>
                                ${isFullySynchronized 
                                    ? `Database Inventory Synchronized: ${physicalDbSeats} Physical Seats (${occupiedCount} Reserved, ${availableCount} Available)` 
                                    : (physicalDbSeats > 0 
                                        ? `Database Inventory Partial: ${physicalDbSeats}/${capacity} Physical Seats (${unconfiguredCount} Unconfigured)` 
                                        : `Database Notice: 0 physical seats found in public.seats for this screen.`)}
                            </span>
                        </div>
                    </div>
                </div>
                <div style="text-align: right;">
                    <div style="font-size: 0.8rem; color: var(--mtrs-text-secondary, #898DA5); font-weight: 700; text-transform: uppercase;">Showtime &amp; Duration</div>
                    <div style="font-family: var(--font-heading); font-size: 1.15rem; font-weight: 800; color: var(--mtrs-seat-selected, #B49AFF);">
                        ${show.Show_Date} • ${this.formatShowtimeRange(show.Show_Time, movie.Duration)}
                    </div>
                </div>
            </div>

            ${unconfiguredCount > 0 ? `
                <div class="seat-inventory-alert mismatch-warning" style="background: rgba(255, 184, 0, 0.08); border: 1px solid rgba(255, 184, 0, 0.28); border-radius: 10px; padding: 0.85rem 1.25rem; margin-bottom: 1.5rem; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.75rem;">
                    <div style="font-size: 0.85rem; color: var(--text-pure);">
                        ⚠️ <strong>INVENTORY MISMATCH WARNING:</strong> Screen <strong>${screen ? screen.Screen_ID : ''}</strong> has <strong>${physicalDbSeats}</strong> physical seats in <code>public.seats</code> out of <strong>${capacity}</strong> configured capacity. ${unconfiguredCount} positions appear unconfigured and cannot be booked until physical database inventory is reconciled.
                    </div>
                    <span style="font-size: 0.78rem; color: var(--accent-gold); font-family: monospace; background: rgba(0, 0, 0, 0.35); padding: 4px 8px; border-radius: 4px;">
                        Execute: supabase/reconcile_physical_seats.sql
                    </span>
                </div>
            ` : ''}

            <!-- 1. Cinema Screen Visual with subtle curve & purple glow -->
            <div class="cinema-screen-container">
                <div class="cinema-screen-curve"></div>
                <div class="screen-text">SCREEN</div>
            </div>

            <!-- 2. Elliptical Seat Map Wrapper -->
            <div class="seat-map-wrapper">
                ${tiers.map(tier => `
                    <div class="seat-tier-section">
                        <div class="seat-tier-banner">
                            <div class="tier-name">
                                <span class="tier-badge ${tier.type.toLowerCase()}">${tier.type}</span>
                                <span>${tier.rows.length === 1 ? 'Row ' + tier.rows[0].rowKey : 'Rows ' + tier.rows[0].rowKey + ' – ' + tier.rows[tier.rows.length - 1].rowKey}</span>
                            </div>
                            <div class="tier-price">₹${tier.price}</div>
                        </div>

                        ${tier.rows.map(r => {
                            const numSeats = r.seats.length;
                            const centerIdx = (numSeats - 1) / 2;
                            const maxCenter = Math.max(centerIdx, 1);
                            // Gentle natural cinema curvature: 12px depth max, 3.2 deg max rotation
                            const maxDepth = 12;
                            const maxAngle = 3.2;

                            const leftSeats = r.seats.filter(s => s.col <= aisleCol);
                            const rightSeats = r.seats.filter(s => s.col > aisleCol);

                            const renderSeatHtml = (seat, globalIdx) => {
                                const isConfigured = seat.isConfigured;
                                const isBooked = seat.Status === 'BOOKED';
                                const isSelected = seat.Seat_ID && this.selectedSeats.some(s => s.Seat_ID === seat.Seat_ID);
                                
                                let seatClass = 'seat';
                                if (!isConfigured) {
                                    seatClass += ' unconfigured';
                                } else if (isBooked) {
                                    seatClass += ' booked';
                                } else if (isSelected) {
                                    seatClass += ' selected';
                                }

                                const t = (globalIdx - centerIdx) / maxCenter;
                                const curveY = (maxDepth * (1 - t * t)).toFixed(1);
                                const rotDeg = (-t * maxAngle).toFixed(2);

                                const titleText = isConfigured
                                    ? (isBooked ? `${seat.Seat_Number} - Reserved` : `${seat.Seat_Number} - ${seat.Seat_Type} (₹${tier.price})`)
                                    : `${seat.Seat_Number} - Unconfigured in database inventory`;

                                const clickAttr = isConfigured && !isBooked ? 'onclick="window.App.toggleSeatSelection(this)"' : '';

                                return `
                                    <div 
                                        class="${seatClass}" 
                                        data-seat-id="${seat.Seat_ID || ''}"
                                        data-seat-number="${seat.Seat_Number}"
                                        data-seat-type="${seat.Seat_Type}"
                                        data-price="${tier.price}"
                                        ${clickAttr}
                                        title="${titleText}"
                                        aria-label="${titleText}"
                                        style="--curve-y: ${curveY}px; --curve-rot: ${rotDeg}deg;"
                                    >
                                        ${seat.Seat_Number}
                                    </div>
                                `;
                            };

                            return `
                                <div class="seat-row" style="padding-bottom: ${maxDepth + 6}px;">
                                    <div class="row-label">${r.rowKey}</div>
                                    <div class="seat-cluster">
                                        <div class="seat-bank left">
                                            ${leftSeats.map(s => renderSeatHtml(s, s.col - 1)).join('')}
                                        </div>
                                        <div class="seat-aisle-gap" aria-label="Central Aisle"></div>
                                        <div class="seat-bank right">
                                            ${rightSeats.map(s => renderSeatHtml(s, s.col - 1)).join('')}
                                        </div>
                                    </div>
                                    <div class="row-label">${r.rowKey}</div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                `).join('')}

                <!-- 4. Seat Legend -->
                <div class="seat-legend">
                    <div class="legend-item">
                        <div class="legend-box available"></div>
                        <span>Available (${availableCount})</span>
                    </div>
                    <div class="legend-item">
                        <div class="legend-box selected"></div>
                        <span>Selected (<span id="legend-selected-count">${selectedCount}</span>)</span>
                    </div>
                    <div class="legend-item">
                        <div class="legend-box booked"></div>
                        <span>Occupied (${occupiedCount})</span>
                    </div>
                    <div class="legend-item">
                        <div class="legend-box unconfigured"></div>
                        <span>Unconfigured in DB (${unconfiguredCount})</span>
                    </div>
                </div>

                <!-- 5. Booking Summary Panel (Below Seating Arrangement) -->
                <div class="booking-summary-panel" id="booking-summary-panel">
                    <div class="booking-summary-content">
                        <div class="summary-info-group">
                            <div class="summary-item">
                                <span class="summary-label">Selected Seats (<span id="summary-seat-count">${selectedCount}</span>)</span>
                                <div class="summary-seats-container" id="summary-seats-container">
                                    ${selectedCount === 0 ? 
                                        '<span class="summary-empty-text">No seats selected. Click an available seat above.</span>' : 
                                        this.selectedSeats.map(s => `<span class="selected-seat-chip">${s.Seat_Number}</span>`).join('')}
                                </div>
                            </div>
                            <div class="summary-item summary-price-item">
                                <span class="summary-label">Total Ticket Price</span>
                                <div class="summary-total-price" id="summary-total-price">₹${subtotal.toFixed(2)}</div>
                            </div>
                        </div>
                        <div class="summary-action-group">
                            <button 
                                class="btn-primary summary-book-btn ${selectedCount === 0 || !hasActiveInventory ? 'disabled' : ''}" 
                                id="summary-proceed-btn" 
                                onclick="window.App.openCheckoutModal()"
                                ${selectedCount === 0 || !hasActiveInventory ? 'disabled' : ''}
                            >
                                Proceed to Checkout →
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        `;
    }

    toggleSeatSelection(seatEl) {
        if (seatEl.classList.contains('booked')) {
            this.showToast("This seat is already reserved for this show.", "error");
            return;
        }

        if (seatEl.classList.contains('unconfigured') || !seatEl.getAttribute('data-seat-id')) {
            this.showToast("This seat is not configured in the active database inventory.", "info");
            return;
        }

        const seatId = seatEl.getAttribute('data-seat-id');
        const seatNumber = seatEl.getAttribute('data-seat-number');
        const seatType = seatEl.getAttribute('data-seat-type');
        const price = parseFloat(seatEl.getAttribute('data-price'));

        const existingIndex = this.selectedSeats.findIndex(s => s.Seat_ID === seatId);

        if (existingIndex !== -1) {
            // Deselect
            this.selectedSeats.splice(existingIndex, 1);
            seatEl.classList.remove('selected');
        } else {
            // Maximum 6 seats per transaction
            if (this.selectedSeats.length >= 6) {
                this.showToast("Maximum of 6 seats allowed per booking transaction.", "error");
                return;
            }
            this.selectedSeats.push({
                Seat_ID: seatId,
                Seat_Number: seatNumber,
                Seat_Type: seatType,
                Price: price
            });
            seatEl.classList.add('selected');
        }

        // Update in-place legend count
        const legendSel = document.getElementById('legend-selected-count');
        if (legendSel) legendSel.textContent = this.selectedSeats.length;

        this.updateFloatingDock();
    }

    updateFloatingDock() {
        const count = this.selectedSeats.length;
        const subtotal = this.selectedSeats.reduce((sum, s) => sum + s.Price, 0);

        // Update in-page booking summary (Requirement 5)
        const summaryCountEl = document.getElementById('summary-seat-count');
        const summarySeatsEl = document.getElementById('summary-seats-container');
        const summaryPriceEl = document.getElementById('summary-total-price');
        const summaryBtn = document.getElementById('summary-proceed-btn');

        if (summaryCountEl) summaryCountEl.textContent = count;
        if (summaryPriceEl) summaryPriceEl.textContent = `₹${subtotal.toFixed(2)}`;
        if (summarySeatsEl) {
            if (count === 0) {
                summarySeatsEl.innerHTML = '<span class="summary-empty-text">No seats selected. Click an available seat above.</span>';
            } else {
                summarySeatsEl.innerHTML = this.selectedSeats.map(s => `
                    <span class="selected-seat-chip">${s.Seat_Number}</span>
                `).join('');
            }
        }
        if (summaryBtn) {
            if (count === 0) {
                summaryBtn.classList.add('disabled');
                summaryBtn.setAttribute('disabled', 'true');
            } else {
                summaryBtn.classList.remove('disabled');
                summaryBtn.removeAttribute('disabled');
            }
        }

        // Also update bottom floating dock
        if (count === 0) {
            this.toggleDock(false);
            return;
        }

        const pillsContainer = document.getElementById('dock-selected-pills');
        const totalAmountEl = document.getElementById('dock-total-amount');

        if (pillsContainer) {
            pillsContainer.innerHTML = this.selectedSeats.map(s => `
                <span class="selected-seat-chip">${s.Seat_Number}</span>
            `).join('');
        }

        if (totalAmountEl) {
            totalAmountEl.textContent = `₹${subtotal.toFixed(2)}`;
        }

        this.toggleDock(true);
    }

    toggleDock(show) {
        const dock = document.getElementById('floating-booking-dock');
        if (dock) {
            dock.classList.toggle('visible', show);
        }
    }

    // ------------------------------------------------------------------------
    // CHECKOUT & ATOMIC PAYMENT MODAL
    // ------------------------------------------------------------------------
    async openCheckoutModal() {
        if (this.selectedSeats.length === 0) {
            this.showToast("Please select at least 1 seat to proceed.", "error");
            return;
        }

        const modal = document.getElementById('checkout-modal');
        if (!modal) return;

        // Ensure Supabase authentication and session resolution have fully completed
        await this.ensureAuthReady();

        // If user is authenticated in Supabase but profile is not yet loaded in currentCustomer, resolve now
        if (this.authUser && (!this.currentCustomer || !(this.currentCustomer.Customer_ID || this.currentCustomer.customer_id))) {
            try {
                const resolveRes = await window.MTRSSupabase.resolveCustomerProfile(this.authUser);
                if (resolveRes.success && resolveRes.profile && (resolveRes.profile.Customer_ID || resolveRes.profile.customer_id)) {
                    this.currentCustomer = resolveRes.profile;
                    this._authProfileError = null;
                }
            } catch (resErr) {
                console.warn('[MTRS App] openCheckoutModal profile resolution warning:', resErr);
            }
        }

        const subtotal = this.selectedSeats.reduce((sum, s) => sum + s.Price, 0);
        const convenienceFee = 30.00;
        const gst = parseFloat((subtotal * 0.18).toFixed(2));
        const grandTotal = (subtotal + convenienceFee + gst).toFixed(2);

        const screens = this.screens || this.engine.getTable('SCREEN');
        const theaters = this.theaters || this.engine.getTable('THEATER');
        const screen = screens.find(s => s.Screen_ID === this.selectedShow.Screen_ID) || this.engine.getTable('SCREEN').find(s => s.Screen_ID === this.selectedShow.Screen_ID);
        const theater = theaters.find(t => t.Theater_ID === (screen ? screen.Theater_ID : '')) || this.engine.getTable('THEATER').find(t => t.Theater_ID === (screen ? screen.Theater_ID : ''));

        // Render checkout details
        document.getElementById('checkout-movie-title').textContent = this.selectedMovie.Movie_Name;
        document.getElementById('checkout-theater-info').textContent = `${theater ? theater.Theater_Name : ''} • ${screen ? screen.Screen_Name : 'Audi'} (${this.selectedShow.Format})`;
        document.getElementById('checkout-show-time').textContent = `${this.selectedShow.Show_Date} • ${this.formatShowtimeRange(this.selectedShow.Show_Time, this.selectedMovie.Duration)}`;
        document.getElementById('checkout-seats-list').textContent = this.selectedSeats.map(s => s.Seat_Number).join(', ');
        
        document.getElementById('checkout-subtotal').textContent = `₹${subtotal.toFixed(2)}`;
        document.getElementById('checkout-conv-fee').textContent = `₹${convenienceFee.toFixed(2)}`;
        document.getElementById('checkout-gst').textContent = `₹${gst.toFixed(2)}`;
        document.getElementById('checkout-grand-total').textContent = `₹${grandTotal}`;

        // Bind customer account state and button actions
        this.renderCheckoutCustomerState();

        modal.classList.add('active');
    }

    renderCheckoutCustomerState() {
        const customerDisplay = document.getElementById('checkout-customer-display');
        const confirmBtn = document.querySelector('#checkout-modal .btn-primary');
        if (!customerDisplay) return;

        const custId = this.currentCustomer ? (this.currentCustomer.Customer_ID || this.currentCustomer.customer_id) : null;
        const custName = this.currentCustomer ? (this.currentCustomer.Customer_Name || this.currentCustomer.customer_name) : null;
        const custEmail = this.currentCustomer ? (this.currentCustomer.Email || this.currentCustomer.email) : null;

        if (this.currentCustomer && custId && custId !== 'AUTH') {
            customerDisplay.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <strong>${custName || 'Customer'}</strong>
                        <div style="font-size: 0.72rem; color: var(--text-muted);">${custEmail || ''}</div>
                    </div>
                    <span class="selected-seat-chip" style="font-size: 0.72rem; color: var(--accent-cyan); font-family: var(--font-mono);">${custId}</span>
                </div>
            `;
            if (confirmBtn) {
                confirmBtn.disabled = false;
                confirmBtn.innerHTML = '🔒 Confirm &amp; Commit Transaction';
                confirmBtn.onclick = () => window.App.confirmBookingAndPay();
            }
        } else if (this.authUser) {
            customerDisplay.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <span style="color: var(--accent-gold); font-weight: 700; font-size: 0.85rem;">Account Profile Unlinked</span>
                        <div style="font-size: 0.72rem; color: var(--text-muted);">${this.authUser.email}</div>
                    </div>
                    <button type="button" class="btn-secondary" style="padding: 0.2rem 0.5rem; font-size: 0.72rem;" onclick="window.App.openAccountModal()">Link Profile</button>
                </div>
            `;
            if (confirmBtn) {
                confirmBtn.disabled = false;
                confirmBtn.innerHTML = '⚠️ Link Profile to Complete Booking';
                confirmBtn.onclick = () => window.App.openAccountModal();
            }
        } else {
            customerDisplay.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="color: var(--primary); font-weight: 700;">Guest (Sign In Required)</span>
                    <button type="button" class="btn-secondary" style="padding: 0.2rem 0.5rem; font-size: 0.72rem;" onclick="window.App.openAccountModal()">Sign In</button>
                </div>
            `;
            if (confirmBtn) {
                confirmBtn.disabled = false;
                confirmBtn.innerHTML = '🔒 Sign In to Complete Booking';
                confirmBtn.onclick = () => window.App.openAccountModal();
            }
        }
    }

    closeCheckoutModal() {
        const modal = document.getElementById('checkout-modal');
        if (modal) modal.classList.remove('active');
    }

    async confirmBookingAndPay() {
        if (this._isBookingInProgress) {
            return;
        }

        if (!this.selectedSeats || this.selectedSeats.length === 0) {
            this.showToast("Please select at least 1 seat to proceed.", "error");
            return;
        }

        // CRITICAL SECURITY RULE: Prevent booking unconfigured seats without verified database IDs
        const invalidSeats = this.selectedSeats.filter(s => !s.Seat_ID);
        if (invalidSeats.length > 0) {
            this.showToast("Cannot book seats that are not registered in the active Supabase database inventory.", "error");
            return;
        }

        // Verify selected seats belong to the selected show's screen
        const validScreenSeats = this.selectedSeats.every(s => {
            return Array.isArray(this.liveSeatInventory) && this.liveSeatInventory.some(live => live.Seat_ID === s.Seat_ID && live.Screen_ID === this.selectedShow.Screen_ID);
        });
        if (!validScreenSeats) {
            this.showToast("Selected seats do not belong to the active screen inventory.", "error");
            return;
        }

        if (!this.selectedShow) {
            this.showToast("No showtime selected. Please select a showtime.", "error");
            return;
        }

        // Ensure session and profile are resolved before proceeding
        await this.ensureAuthReady();

        // 1. Verify active Supabase Auth session
        let { session, user } = await window.MTRSSupabase.getCurrentSession();
        if ((!session || !user) && this.authUser) {
            // Attempt state refresh if authUser is present in memory
            await this.refreshAuthState();
            const recheck = await window.MTRSSupabase.getCurrentSession();
            session = recheck.session;
            user = recheck.user || this.authUser;
        }

        if (!user) {
            this.showToast("Authentication Required: Please sign in or register to complete your booking transaction.", "error");
            this.openAccountModal();
            return;
        }

        // 2. Verify and authoritatively resolve Customer Profile
        let custId = this.currentCustomer ? (this.currentCustomer.Customer_ID || this.currentCustomer.customer_id) : null;
        if (!this.currentCustomer || !custId || custId === 'AUTH') {
            console.log('[MTRS App] Resolving customer profile prior to transaction execution...');
            const resolveRes = await window.MTRSSupabase.resolveCustomerProfile(user);
            if (resolveRes.success && resolveRes.profile && (resolveRes.profile.Customer_ID || resolveRes.profile.customer_id)) {
                this.currentCustomer = resolveRes.profile;
                custId = this.currentCustomer.Customer_ID || this.currentCustomer.customer_id;
            } else {
                const detailMsg = resolveRes.error || "Customer profile could not be linked to your verified account.";
                this.showToast(`Profile Linking Error: ${detailMsg}`, "error");
                this.openAccountModal();
                return;
            }
        }

        const customerId = custId;
        if (!customerId || customerId === 'AUTH') {
            this.showToast("Profile linking error: Customer account does not exist in database.", "error");
            this.openAccountModal();
            return;
        }

        this._isBookingInProgress = true;
        const confirmBtn = document.querySelector('#checkout-modal .btn-primary');
        if (confirmBtn) {
            confirmBtn.disabled = true;
            confirmBtn.textContent = '⏳ Executing Database Transaction...';
        }

        const paymentModeSelect = document.getElementById('checkout-payment-mode');
        const paymentMode = paymentModeSelect ? paymentModeSelect.value : 'UPI';

        const subtotal = this.selectedSeats.reduce((sum, s) => sum + s.Price, 0);
        const convenienceFee = 30.00;
        const gst = parseFloat((subtotal * 0.18).toFixed(2));
        const grandTotal = parseFloat((subtotal + convenienceFee + gst).toFixed(2));

        const seatIds = this.selectedSeats.map(s => s.Seat_ID);
        const confirmedSeatsList = [...this.selectedSeats];

        try {
            // Server Pre-Validation: verify seat availability against live Supabase records
            console.log('[MTRS App] Pre-validating seat availability against live Supabase database...');
            const availCheck = await window.MTRSSupabase.fetchSeatAvailability(this.selectedShow.Show_ID, this.selectedShow.Screen_ID);
            if (availCheck.success && Array.isArray(availCheck.bookedSeatIds)) {
                const bookedSet = new Set(availCheck.bookedSeatIds);
                const conflict = seatIds.find(id => bookedSet.has(id));
                if (conflict) {
                    throw new Error("Seat Conflict: One or more selected seats were just reserved by another customer. Please choose different seats.");
                }
            }

            // Submit atomic database transaction via RPC sp_book_ticket_transaction
            const txResult = await window.MTRSSupabase.executeBookingTransaction({
                customerId: customerId,
                showId: this.selectedShow.Show_ID,
                format: this.selectedShow.Format,
                ticketPrice: this.selectedShow.Ticket_Price,
                paymentMode: paymentMode,
                amount: grandTotal,
                seatIds: seatIds
            });

            if (!txResult.success) {
                if (txResult.error && (txResult.code === '23505' || txResult.error.includes('trg_prevent_double_booking') || txResult.error.includes('already booked'))) {
                    throw new Error("Seat Conflict: One or more selected seats were already booked. Please choose available seats.");
                }
                throw new Error(txResult.error || "Booking transaction failed on database server.");
            }

            const data = txResult.data;
            this.closeCheckoutModal();
            this.toggleDock(false);
            this.selectedSeats = [];

            this.showToast(`Booking ${data.booking_id} confirmed by database! Transaction committed.`, "success");

            // Open E-Ticket modal with confirmed database details
            const ticketData = {
                booking: {
                    Booking_ID: data.booking_id,
                    Customer_ID: data.customer_id,
                    Show_ID: data.show_id,
                    Format: this.selectedShow.Format,
                    Ticket_Price: this.selectedShow.Ticket_Price,
                    Status: 'CONFIRMED',
                    Booking_Date: new Date().toISOString()
                },
                payment: {
                    Payment_ID: data.payment_id,
                    Payment_Mode: paymentMode + ' (Simulated)',
                    Amount: grandTotal,
                    Status: 'SUCCESS'
                },
                bookedSeats: data.seat_ids ? data.seat_ids.map(id => {
                    const sObj = confirmedSeatsList.find(s => s.Seat_ID === id);
                    return {
                        Seat_ID: id,
                        Seat_Number: sObj ? sObj.Seat_Number : id,
                        Seat_Type: sObj ? sObj.Seat_Type : 'Regular'
                    };
                }) : confirmedSeatsList
            };

            try {
                this.openTicketModal(ticketData);
            } catch (ticketError) {
                console.error("Ticket display error (booking committed in DB):", ticketError);
            }

            // Refresh live seat availability in memory
            await this.loadLiveSeatsAndRender(this.selectedShow);

            // Refresh My Bookings if open
            if (document.getElementById('view-my-bookings').style.display === 'block') {
                this.renderMyBookings();
            }

            // Problem 2: Dispatch Transactional Confirmation Email (Non-blocking, post-commit)
            window.MTRSSupabase.sendBookingConfirmation(data.booking_id).then(emailRes => {
                if (emailRes && emailRes.success) {
                    if (emailRes.already_sent) {
                        console.log(`[MTRS App] Confirmation email for booking ${data.booking_id} was already sent.`);
                    } else {
                        console.log(`[MTRS App] Booking confirmation email dispatched successfully:`, emailRes);
                        const targetEmail = emailRes.recipient || this.currentCustomer.Email;
                        this.showToast(`Confirmation email sent to ${targetEmail}!`, "success");
                    }
                } else if (emailRes && emailRes.notConfigured) {
                    console.info('[MTRS App] Booking email notification not configured in Supabase secrets:', emailRes.error);
                } else {
                    console.warn('[MTRS App] Booking confirmation email dispatch notice:', emailRes?.error);
                }
            }).catch(emailErr => {
                console.warn('[MTRS App] Booking confirmation email error (non-blocking):', emailErr);
            });

        } catch (error) {
            console.error("Booking Transaction Failed:", error);
            this.showToast(error.message, "error");

            if (this.selectedShow) {
                await this.loadLiveSeatsAndRender(this.selectedShow);
            }
        } finally {
            this._isBookingInProgress = false;
            if (confirmBtn) {
                confirmBtn.disabled = false;
                confirmBtn.innerHTML = '🔒 Confirm &amp; Commit Transaction';
            }
        }
    }

    // ------------------------------------------------------------------------
    // E-TICKET CONFIRMATION MODAL (Requirements 13 & 14)
    // ------------------------------------------------------------------------
    openTicketModal(txResult) {
        const modal = document.getElementById('ticket-modal');
        if (!modal) return;

        const booking = txResult.booking;
        const payment = txResult.payment;
        const shows = this.shows || this.engine.getTable('SHOWS');
        const movies = this.movies || this.engine.getTable('MOVIE');
        const screens = this.screens || this.engine.getTable('SCREEN');
        const theaters = this.theaters || this.engine.getTable('THEATER');

        const show = txResult.show || shows.find(s => s.Show_ID === booking.Show_ID) || this.selectedShow || {};
        const movie = txResult.movie || movies.find(m => m.Movie_ID === show.Movie_ID) || this.selectedMovie || { Movie_Name: 'Cinema Movie', Language: 'English', Duration: 150 };
        const screen = txResult.screen || screens.find(s => s.Screen_ID === show.Screen_ID);
        const theater = txResult.theater || theaters.find(t => t.Theater_ID === (screen ? screen.Theater_ID : ''));
        const customer = this.currentCustomer || { Customer_Name: 'Cinema Patron' };

        // Resolve booked seats accurately
        let seatNumbers = txResult.seatNumbers || '';
        if (!seatNumbers) {
            if (Array.isArray(txResult.bookedSeats) && txResult.bookedSeats.length > 0) {
                seatNumbers = txResult.bookedSeats.map(bs => bs.Seat_Number || bs.Seat_ID).join(', ');
            } else if (Array.isArray(this.selectedSeats) && this.selectedSeats.length > 0) {
                seatNumbers = this.selectedSeats.map(s => s.Seat_Number).join(', ');
            } else {
                seatNumbers = 'Seats Confirmed';
            }
        }

        const container = document.getElementById('ticket-modal-content');
        if (container) {
            container.innerHTML = `
                <div class="ticket-pass">
                    <div class="ticket-header">
                        <div>
                            <div style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 1px; opacity: 0.9;">MTRS Chennai E-Ticket</div>
                            <div style="font-family: var(--font-heading); font-size: 1.3rem; font-weight: 800; letter-spacing: 1px;">E-TICKET</div>
                        </div>
                        <div class="ticket-badge-confirmed">CONFIRMED</div>
                    </div>

                    <div class="ticket-body">
                        <div class="ticket-movie-title">${movie.Movie_Name}</div>
                        <div style="color: var(--accent-cyan); font-size: 0.85rem; font-weight: 700;">${show.Format || '2D'} • ${movie.Language || 'English'}</div>

                        <div class="ticket-grid">
                            <div>
                                <div class="ticket-item-label">Cinema / Destination</div>
                                <div class="ticket-item-value">${theater ? theater.Theater_Name : 'Multiplex'}</div>
                            </div>
                            <div>
                                <div class="ticket-item-label">Auditorium</div>
                                <div class="ticket-item-value">${screen ? screen.Screen_Name : 'Audi'} (${screen ? screen.Audio_Tech : 'Surround'})</div>
                            </div>
                            <div>
                                <div class="ticket-item-label">Date & Time</div>
                                <div class="ticket-item-value">${show.Show_Date} | ${show.Show_Time ? this.formatShowtimeRange(show.Show_Time, movie.Duration) : ''}</div>
                            </div>
                            <div>
                                <div class="ticket-item-label">Reserved Seats</div>
                                <div class="ticket-item-value seats-highlight">${seatNumbers}</div>
                            </div>
                            <div>
                                <div class="ticket-item-label">Customer Name</div>
                                <div class="ticket-item-value">${customer.Customer_Name}</div>
                            </div>
                            <div>
                                <div class="ticket-item-label">Payment Mode</div>
                                <div class="ticket-item-value">${payment.Payment_Mode || 'UPI (Simulated)'} (₹${parseFloat(payment.Amount || 0).toFixed(2)})</div>
                            </div>
                        </div>

                        <div class="ticket-qr-area">
                            <div>
                                <div style="font-family: var(--font-mono); font-size: 0.82rem; color: var(--text-pure); margin-bottom: 2px;">
                                    BOOKING ID: <strong>${booking.Booking_ID}</strong>
                                </div>
                                <div style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--text-muted);">
                                    PAYMENT REF: ${payment.Payment_ID}
                                </div>
                                <div style="font-size: 0.75rem; color: var(--accent-emerald); font-weight: 600; margin-top: 6px;">
                                    ✓ Database Transaction Committed (BCNF Schema)
                                </div>
                            </div>

                            <div class="ticket-qr-box">
                                <svg class="qr-code-svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                                    <rect width="100" height="100" fill="white"/>
                                    <rect x="10" y="10" width="25" height="25" fill="black"/>
                                    <rect x="14" y="14" width="17" height="17" fill="white"/>
                                    <rect x="18" y="18" width="9" height="9" fill="black"/>
                                    <rect x="65" y="10" width="25" height="25" fill="black"/>
                                    <rect x="69" y="14" width="17" height="17" fill="white"/>
                                    <rect x="73" y="18" width="9" height="9" fill="black"/>
                                    <rect x="10" y="65" width="25" height="25" fill="black"/>
                                    <rect x="14" y="69" width="17" height="17" fill="white"/>
                                    <rect x="18" y="73" width="9" height="9" fill="black"/>
                                    <rect x="45" y="15" width="10" height="20" fill="black"/>
                                    <rect x="40" y="45" width="20" height="10" fill="black"/>
                                    <rect x="65" y="45" width="25" height="15" fill="black"/>
                                    <rect x="45" y="65" width="15" height="25" fill="black"/>
                                    <rect x="65" y="75" width="20" height="15" fill="black"/>
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="ticket-action-bar" style="display: flex; gap: 0.75rem; margin-top: 1.5rem; justify-content: space-between; align-items: center; flex-wrap: wrap;">
                    <button class="btn-secondary" id="btn-ticket-back" onclick="window.App.closeTicketModal(); window.App.switchView('my-bookings');">
                        ← Back to Bookings
                    </button>
                    <div style="display: flex; gap: 0.75rem;">
                        <button class="btn-secondary" id="btn-ticket-close" onclick="window.App.closeTicketModal();">
                            ✕ Close
                        </button>
                        <button class="btn-primary" id="btn-ticket-print" onclick="window.App.printTicket();">
                            🖨️ Print E-Ticket
                        </button>
                    </div>
                </div>
            `;
        }

        modal.classList.add('active');
    }

    printTicket() {
        document.body.classList.add('mtrs-printing-mode');

        let cleanedUp = false;
        const cleanupPrint = () => {
            if (cleanedUp) return;
            cleanedUp = true;
            document.body.classList.remove('mtrs-printing-mode');
            const closeBtn = document.getElementById('btn-ticket-close') || document.getElementById('ticket-modal-close-btn');
            if (closeBtn) closeBtn.focus();
        };

        window.addEventListener('afterprint', cleanupPrint, { once: true });

        try {
            window.print();
        } catch (e) {
            console.error("Print trigger failed:", e);
        }

        // Safety fallback timer if afterprint does not fire or cancels prematurely
        setTimeout(cleanupPrint, 1200);
    }

    closeTicketModal() {
        const modal = document.getElementById('ticket-modal');
        if (modal) modal.classList.remove('active');
        document.body.classList.remove('mtrs-printing-mode');
    }

    // ------------------------------------------------------------------------
    // MY BOOKINGS VIEW & CANCELLATION PROCEDURE
    // ------------------------------------------------------------------------
    async renderMyBookings() {
        const container = document.getElementById('my-bookings-container');
        if (!container) return;

        // If not authenticated, prompt user to sign in
        if (!this.currentCustomer) {
            container.innerHTML = `
                <div style="text-align: center; padding: 4rem 1rem; background: var(--bg-surface); border-radius: var(--radius-lg); border: var(--glass-border);">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">🔒</div>
                    <h3 style="font-size: 1.3rem; color: var(--text-pure); margin-bottom: 0.5rem;">Authentication Required</h3>
                    <p style="color: var(--text-secondary); margin-bottom: 1.5rem; max-width: 480px; margin-left: auto; margin-right: auto;">
                        Please sign in with your Supabase account to view your confirmed bookings, download e-tickets, and manage active reservations.
                    </p>
                    <button class="btn-primary" onclick="window.App.openAccountModal()">Sign In to View Bookings</button>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div style="text-align: center; padding: 3rem 1rem;">
                <div class="movie-loading-spinner" style="margin: 0 auto 1.25rem;"></div>
                <div style="color: var(--text-pure); font-weight: 700;">Querying Bookings from Supabase...</div>
                <div style="color: var(--text-muted); font-size: 0.85rem; margin-top: 0.35rem;">Fetching authorized reservations for ${this.currentCustomer.Customer_Name}.</div>
            </div>
        `;

        try {
            const res = await window.MTRSSupabase.fetchCustomerBookings();
            const bookings = res.success ? res.data : [];

            if (bookings.length === 0) {
                container.innerHTML = `
                    <div style="text-align: center; padding: 4rem 1rem; background: var(--bg-surface); border-radius: var(--radius-lg); border: var(--glass-border);">
                        <div style="font-size: 3rem; margin-bottom: 1rem;">🎟️</div>
                        <h3 style="font-size: 1.3rem; color: var(--text-pure); margin-bottom: 0.5rem;">No Bookings Found</h3>
                        <p style="color: var(--text-secondary); margin-bottom: 1.5rem;">You haven't booked any movie tickets yet under account ${this.currentCustomer.Customer_Name}.</p>
                        <button class="btn-primary" onclick="window.App.switchView('home')">Browse Movies Now</button>
                    </div>
                `;
                return;
            }

            container.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; margin-bottom: 1.5rem;">
                    <div>
                        <h3 style="font-size: 1.4rem; color: var(--text-pure);">Tickets Booked by ${this.currentCustomer.Customer_Name}</h3>
                        <p style="color: var(--text-muted); font-size: 0.88rem;">Live reservations retrieved directly from Supabase database.</p>
                    </div>
                    <span class="catalog-source-tag live">● LIVE SUPABASE BOOKINGS</span>
                </div>

                <div style="display: grid; gap: 1.5rem;">
                    ${bookings.map(booking => {
                        const isConfirmed = booking.booking_status === 'CONFIRMED' || booking.status === 'CONFIRMED';
                        const statusColor = isConfirmed ? 'var(--accent-emerald)' : 'var(--primary)';
                        const statusLabel = isConfirmed ? '● Confirmed' : '● Cancelled';
                        const paymentModeText = booking.payment_mode ? `${booking.payment_mode} (Simulated)` : 'Simulated Payment';

                        return `
                            <div class="theater-card" style="margin-bottom: 0;">
                                <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; flex-wrap: wrap;">
                                    <div>
                                        <div style="display: flex; align-items: center; gap: 0.6rem; margin-bottom: 0.35rem;">
                                            <span class="selected-seat-chip" style="font-size: 0.75rem;">${booking.booking_id}</span>
                                            <span class="card-format-tag">${booking.format}</span>
                                            <span style="font-size: 0.8rem; color: ${statusColor}; font-weight: 700;">${statusLabel}</span>
                                        </div>
                                        <h4 style="font-family: var(--font-heading); font-size: 1.4rem; color: var(--text-pure); margin-bottom: 0.25rem;">
                                            ${booking.movie_name || 'Movie'}
                                        </h4>
                                        <div style="color: var(--text-secondary); font-size: 0.85rem;">
                                            ${booking.theater_name || ''} • ${booking.screen_name || 'Audi'}
                                        </div>
                                    </div>

                                    <div style="text-align: right;">
                                        <div style="font-family: var(--font-heading); font-size: 1.3rem; font-weight: 800; color: var(--text-pure);">
                                            ₹${parseFloat(booking.total_amount || booking.ticket_price || 0).toFixed(2)}
                                        </div>
                                        <div style="font-size: 0.72rem; color: var(--text-muted);">
                                            ${paymentModeText}
                                        </div>
                                    </div>
                                </div>

                                <div style="display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-top: 1.25rem; padding-top: 1rem; border-top: 1px solid rgba(255, 255, 255, 0.06); flex-wrap: wrap;">
                                    <div style="font-size: 0.88rem; color: var(--text-secondary);">
                                        📅 <strong>${booking.show_date}</strong> • <strong>${booking.show_time ? this.formatTime12Hour(booking.show_time) : ''}</strong> | 
                                        Seats: <strong style="color: var(--accent-gold);">${booking.booked_seat_numbers || (Array.isArray(booking.booked_seat_ids) ? booking.booked_seat_ids.join(', ') : 'N/A')}</strong>
                                    </div>

                                    <div style="display: flex; gap: 0.75rem;">
                                        <button class="btn-secondary" style="padding: 0.4rem 0.9rem; font-size: 0.82rem;" onclick="window.App.reprintDatabaseTicket('${booking.booking_id}')">
                                            View E-Ticket
                                        </button>
                                        ${isConfirmed ? `
                                            <button class="btn-book-card" style="background: rgba(229, 9, 20, 0.2); border: 1px solid var(--primary); color: #fff; padding: 0.4rem 0.9rem; font-size: 0.82rem;" onclick="window.App.cancelBooking('${booking.booking_id}')">
                                                Cancel Booking
                                            </button>
                                        ` : ''}
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
        } catch (err) {
            console.error('[MTRS App] Render bookings exception:', err);
            container.innerHTML = `
                <div style="text-align: center; padding: 3rem 1rem; background: var(--bg-surface); border-radius: var(--radius-lg); border: var(--glass-border);">
                    <h3 style="color: var(--primary); margin-bottom: 0.5rem;">Could not load bookings</h3>
                    <p style="color: var(--text-muted);">${err.message}</p>
                </div>
            `;
        }
    }

    async cancelBooking(bookingId) {
        if (!this.currentCustomer) {
            this.showToast("Authentication Required: Please sign in to cancel bookings.", "error");
            this.openAccountModal();
            return;
        }

        if (!confirm(`Are you sure you want to cancel booking ${bookingId}? Reserved seats will be released immediately for other moviegoers.`)) {
            return;
        }

        try {
            const custId = this.currentCustomer.Customer_ID || this.currentCustomer.customer_id;
            const res = await window.MTRSSupabase.executeCancellationTransaction(bookingId, custId);

            if (!res.success) {
                throw new Error(res.error || "Cancellation was not permitted by the database.");
            }

            this.showToast(`Booking ${bookingId} cancelled successfully. Seats released.`, "success");

            // Refresh My Bookings
            await this.renderMyBookings();

            // Refresh seat availability if currently viewing this show
            if (this.selectedShow) {
                await this.loadLiveSeatsAndRender(this.selectedShow);
            }
        } catch (err) {
            console.error('[MTRS App] Cancellation failed:', err);
            this.showToast(err.message, "error");
        }
    }

    async reprintDatabaseTicket(bookingId) {
        const res = await window.MTRSSupabase.fetchCustomerBookings();
        const booking = (res.data || []).find(b => b.booking_id === bookingId);
        if (!booking) {
            this.showToast("Booking record not found in database.", "error");
            return;
        }

        const seatNumbers = booking.booked_seat_numbers || (Array.isArray(booking.booked_seat_ids) ? booking.booked_seat_ids.join(', ') : 'Seats Confirmed');

        this.openTicketModal({
            booking: {
                Booking_ID: booking.booking_id,
                Customer_ID: booking.customer_id,
                Show_ID: booking.show_id,
                Format: booking.format,
                Ticket_Price: booking.ticket_price,
                Status: booking.booking_status,
                Booking_Date: booking.booking_date
            },
            movie: {
                Movie_Name: booking.movie_name,
                Duration: booking.movie_duration || 150,
                Language: booking.movie_language || 'English',
                Poster_Url: booking.poster_url
            },
            theater: {
                Theater_Name: booking.theater_name,
                City: booking.theater_city
            },
            screen: {
                Screen_Name: booking.screen_name,
                Screen_Type: booking.screen_type
            },
            show: {
                Show_Date: booking.show_date,
                Show_Time: booking.show_time
            },
            payment: {
                Payment_ID: booking.payment_id || 'PM_CONFIRMED',
                Payment_Mode: (booking.payment_mode || 'UPI') + ' (Simulated)',
                Amount: booking.total_amount || booking.ticket_price,
                Status: booking.payment_status || 'SUCCESS'
            },
            seatNumbers: seatNumbers
        });
    }

    reprintTicket(bookingId) {
        this.reprintDatabaseTicket(bookingId);
    }

    // ------------------------------------------------------------------------
    // CUSTOMER ACCOUNT MANAGEMENT (Supabase Auth & Profile Linking)
    // ------------------------------------------------------------------------
    openAccountModal() {
        const modal = document.getElementById('account-modal');
        if (!modal) return;

        this.renderAccountModalContent();
        modal.classList.add('active');
    }

    closeAccountModal() {
        const modal = document.getElementById('account-modal');
        if (modal) modal.classList.remove('active');

        // Immediately sync checkout customer state if checkout modal is visible
        const checkoutModal = document.getElementById('checkout-modal');
        if (checkoutModal && checkoutModal.classList.contains('active')) {
            this.renderCheckoutCustomerState();
        }
    }

    renderAccountModalContent() {
        const nameEl = document.getElementById('account-name');
        const detailsEl = document.getElementById('account-details');
        const avatarEl = document.getElementById('account-avatar');
        const badgeEl = document.getElementById('account-badge');
        const signoutBtn = document.getElementById('btn-account-signout');

        const profileCard = document.getElementById('account-profile-card');
        const authInfo = document.getElementById('account-auth-info');
        const unlinkedWarn = document.getElementById('account-unlinked-warning');
        const unlinkedMsg = document.getElementById('account-unlinked-msg');
        const tabsHeader = document.getElementById('account-tabs-header');
        const tabSignIn = document.getElementById('tab-account-signin');
        const tabRegister = document.getElementById('tab-account-register');

        const custId = this.currentCustomer ? (this.currentCustomer.Customer_ID || this.currentCustomer.customer_id) : null;
        const custName = this.currentCustomer ? (this.currentCustomer.Customer_Name || this.currentCustomer.customer_name) : null;
        const custEmail = this.currentCustomer ? (this.currentCustomer.Email || this.currentCustomer.email) : null;
        const custPhone = this.currentCustomer ? (this.currentCustomer.Phone || this.currentCustomer.phone) : 'N/A';

        if (this.currentCustomer && custId && custId !== 'AUTH') {
            // STATE 1: Authenticated Customer Profile Linked
            if (profileCard) profileCard.style.display = 'block';
            if (nameEl) nameEl.textContent = custName;
            if (detailsEl) detailsEl.textContent = `${custEmail} • Phone: ${custPhone || 'N/A'}`;
            if (badgeEl) {
                badgeEl.style.display = 'inline-block';
                badgeEl.textContent = custId;
            }
            if (avatarEl) {
                const parts = (custName || '').trim().split(' ');
                const initials = parts.length > 1 ? (parts[0][0] + parts[parts.length - 1][0]) : (parts[0] ? parts[0].substring(0, 2) : 'CU');
                avatarEl.textContent = initials.toUpperCase();
            }
            if (signoutBtn) signoutBtn.style.display = 'inline-block';

            if (authInfo) authInfo.style.display = 'block';
            if (unlinkedWarn) unlinkedWarn.style.display = 'none';

            // CRITICAL FIX: Hide Sign In and Register forms when authenticated!
            if (tabsHeader) tabsHeader.style.display = 'none';
            if (tabSignIn) tabSignIn.style.display = 'none';
            if (tabRegister) tabRegister.style.display = 'none';

        } else if (this.authUser) {
            // STATE 2: Authenticated in Supabase Auth, but customer profile unlinked
            if (profileCard) profileCard.style.display = 'block';
            if (nameEl) nameEl.textContent = this.authUser.user_metadata?.full_name || (this.authUser.email ? this.authUser.email.split('@')[0] : 'Customer');
            if (detailsEl) detailsEl.textContent = `${this.authUser.email} • Auth Verified`;
            if (badgeEl) {
                badgeEl.style.display = 'inline-block';
                badgeEl.textContent = 'Profile Pending';
            }
            if (avatarEl) avatarEl.textContent = '👤';
            if (signoutBtn) signoutBtn.style.display = 'inline-block';

            if (authInfo) authInfo.style.display = 'none';
            if (unlinkedWarn) {
                unlinkedWarn.style.display = 'block';
                if (unlinkedMsg) {
                    unlinkedMsg.textContent = this._authProfileError || "Your Supabase session is verified, but your customer profile is not linked. Please click retry or confirm your email.";
                }
            }

            // Keep forms hidden because the user is already authenticated
            if (tabsHeader) tabsHeader.style.display = 'none';
            if (tabSignIn) tabSignIn.style.display = 'none';
            if (tabRegister) tabRegister.style.display = 'none';

        } else {
            // STATE 3: Guest / Unauthenticated Session
            if (profileCard) profileCard.style.display = 'block';
            if (nameEl) nameEl.textContent = 'Guest Session';
            if (detailsEl) detailsEl.textContent = 'Sign in or register below to access live bookings and checkout.';
            if (badgeEl) badgeEl.style.display = 'none';
            if (avatarEl) avatarEl.textContent = '👤';
            if (signoutBtn) signoutBtn.style.display = 'none';

            if (authInfo) authInfo.style.display = 'none';
            if (unlinkedWarn) unlinkedWarn.style.display = 'none';

            // Show Sign In and Register tabs
            if (tabsHeader) tabsHeader.style.display = 'flex';
            this.switchAccountTab('signin');
        }
    }

    switchAccountTab(tab) {
        const tabSignIn = document.getElementById('tab-account-signin');
        const tabRegister = document.getElementById('tab-account-register');
        const btnSignIn = document.getElementById('btn-tab-signin');
        const btnRegister = document.getElementById('btn-tab-register');

        if (tab === 'signin') {
            if (tabSignIn) tabSignIn.style.display = 'block';
            if (tabRegister) tabRegister.style.display = 'none';
            if (btnSignIn) btnSignIn.classList.add('active');
            if (btnRegister) btnRegister.classList.remove('active');
        } else {
            if (tabSignIn) tabSignIn.style.display = 'none';
            if (tabRegister) tabRegister.style.display = 'block';
            if (btnSignIn) btnSignIn.classList.remove('active');
            if (btnRegister) btnRegister.classList.add('active');
        }
    }

    async handleCustomerSignIn() {
        const emailInput = document.getElementById('signin-email');
        const passwordInput = document.getElementById('signin-password');
        const submitBtn = document.getElementById('btn-signin-submit');

        const email = emailInput ? emailInput.value.trim() : '';
        const password = passwordInput ? passwordInput.value : '';

        if (!email || !password) {
            this.showToast("Please enter both email and password.", "error");
            return;
        }

        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Signing in...';
        }

        try {
            const res = await window.MTRSSupabase.signInCustomer({ email, password });
            if (!res.success) {
                const err = res.error || 'Authentication failed.';
                if (err.toLowerCase().includes('invalid login credentials')) {
                    this.showToast("Invalid email or password. Please check your credentials.", "error");
                } else if (err.toLowerCase().includes('email not confirmed')) {
                    this.showToast("Email address has not been confirmed. Please verify your email.", "error");
                } else {
                    this.showToast(err, "error");
                }
                return;
            }

            // Immediately refresh authoritative application state
            await this.refreshAuthState();

            this.closeAccountModal();

            if (emailInput) emailInput.value = '';
            if (passwordInput) passwordInput.value = '';

            const displayName = (this.currentCustomer && this.currentCustomer.Customer_Name) || res.user.email;
            this.showToast(`Signed in successfully as ${displayName}!`, "success");

        } catch (err) {
            console.error('[MTRS App] SignIn exception:', err);
            this.showToast(err.message || 'Authentication error', "error");
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Sign In';
            }
        }
    }

    async handleCustomerRegister() {
        const nameInput = document.getElementById('register-name');
        const emailInput = document.getElementById('register-email');
        const phoneInput = document.getElementById('register-phone');
        const passwordInput = document.getElementById('register-password');
        const submitBtn = document.getElementById('btn-register-submit');

        const name = nameInput ? nameInput.value.trim() : '';
        const email = emailInput ? emailInput.value.trim() : '';
        const phone = phoneInput ? phoneInput.value.trim() : '';
        const password = passwordInput ? passwordInput.value : '';

        if (!name || !email || !phone || !password) {
            this.showToast("Please fill in all customer registration fields.", "error");
            return;
        }

        if (password.length < 6) {
            this.showToast("Password must be at least 6 characters long.", "error");
            return;
        }

        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Creating Account...';
        }

        try {
            const res = await window.MTRSSupabase.signUpCustomer({ name, email, phone, password });
            if (!res.success) {
                this.showToast(res.error || 'Registration failed.', "error");
                return;
            }

            if (res.requiresEmailConfirmation) {
                this.showToast("Account created! A confirmation email has been sent. Please verify your email before logging in.", "info");
                this.switchAccountTab('signin');
                if (document.getElementById('signin-email')) {
                    document.getElementById('signin-email').value = email;
                }
                return;
            }

            // Immediate session (email confirmation off): refresh full application state
            await this.refreshAuthState();

            this.closeAccountModal();

            if (nameInput) nameInput.value = '';
            if (emailInput) emailInput.value = '';
            if (phoneInput) phoneInput.value = '';
            if (passwordInput) passwordInput.value = '';

            const displayName = (this.currentCustomer && this.currentCustomer.Customer_Name) || name;
            this.showToast(`Account created! Welcome, ${displayName}!`, "success");

        } catch (err) {
            console.error('[MTRS App] Register exception:', err);
            this.showToast(err.message || 'Registration error', "error");
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Create Account';
            }
        }
    }

    async handleCustomerSignOut() {
        try {
            await window.MTRSSupabase.signOutCustomer();
            this.authUser = null;
            this.currentCustomer = null;
            this._authProfileError = null;
            await this.refreshAuthState();

            this.closeAccountModal();
            this.showToast("Signed out successfully.", "info");

        } catch (err) {
            console.error('[MTRS App] SignOut error:', err);
            this.showToast("Error signing out: " + err.message, "error");
        }
    }

    openUserSwitcherModal() {
        this.openAccountModal();
    }

    switchActiveUser(customerId) {
        this.openAccountModal();
    }

    // ------------------------------------------------------------------------
    // TOAST NOTIFICATIONS
    // ------------------------------------------------------------------------
    showToast(message, type = 'info') {
        let container = document.getElementById('toast-dock');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-dock';
            container.className = 'toast-container';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        const icon = type === 'success' ? '✓' : (type === 'error' ? '✕' : 'ℹ');
        toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(10px)';
            toast.style.transition = 'all 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }
}

// Instantiate globally
window.App = new MTRSApp();
window.MTRSUtil = {
    formatShowtimeRange: (time, dur) => window.App.formatShowtimeRange(time, dur),
    formatMinutesTo12Hour: (min) => window.App.formatMinutesTo12Hour(min),
    formatTime12Hour: (time) => window.App.formatTime12Hour(time)
};
