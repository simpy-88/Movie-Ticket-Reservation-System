// ============================================================================
// MOVIE TICKET RESERVATION SYSTEM (MTRS)
// File: js/admin.js
// Description: Admin Panel controller, Show Schedule management, Screen capacity,
//              Relational Table Inspector, and Academic SQL Query Sandbox (DA2).
// Sourced from 6 Primary Chennai Cinema Destinations across 49 Auditoriums.
// ============================================================================

class MTRSAdminPanel {
    constructor() {
        this.engine = window.MTRSEngine;
        this.activeAdminTab = 'shows';
        this.selectedQueryId = 1;
        this.movieSearchQuery = '';
        this.theatreSearchQuery = '';
        this.pendingPosterBlob = null;
        this.currentEditMovieId = null;
        this.removeCustomPosterRequested = false;

        this.init();
    }

    init() {
        this.setupAdminTabs();
        this.refreshDashboard();
    }

    setupAdminTabs() {
        document.querySelectorAll('.admin-tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.getAttribute('data-tab');
                this.switchAdminTab(tab);
            });
        });
    }

    switchAdminTab(tabName) {
        this.activeAdminTab = tabName;
        document.querySelectorAll('.admin-tab-btn').forEach(b => {
            b.classList.toggle('active', b.getAttribute('data-tab') === tabName);
        });

        document.querySelectorAll('.admin-tab-content').forEach(c => {
            c.classList.toggle('active', c.id === `admin-tab-${tabName}`);
        });

        if (tabName === 'shows') this.renderShowsTable();
        if (tabName === 'movies') this.renderMoviesTable();
        if (tabName === 'theatres') this.renderTheatresTable();
        if (tabName === 'screens') this.renderScreensTable();
        if (tabName === 'revenue') this.renderRevenueReport();
        if (tabName === 'relations') this.renderRelationalInspector();
    }

    getMovies() {
        if (window.App && Array.isArray(window.App.movies) && window.App.movies.length > 0) {
            return window.App.movies;
        }
        return this.engine.getTable('MOVIE') || [];
    }

    getShows() {
        if (window.App && Array.isArray(window.App.shows) && window.App.shows.length > 0) {
            return window.App.shows;
        }
        return this.engine.getTable('SHOWS') || [];
    }

    // ------------------------------------------------------------------------
    // DASHBOARD KPI METRICS
    // ------------------------------------------------------------------------
    refreshDashboard() {
        const bookings = this.engine.getTable('BOOKING');
        const payments = this.engine.getTable('PAYMENT');
        const movies = this.getMovies();
        const shows = this.getShows();
        const screens = this.engine.getTable('SCREEN');
        const bookedSeats = this.engine.getTable('BOOKED_SEAT');

        const totalRev = payments.reduce((sum, p) => sum + parseFloat(p.Amount), 0);
        const totalSeatsCapacity = screens.reduce((sum, s) => sum + s.Capacity, 0);
        const avgOccupancy = totalSeatsCapacity > 0 ? 
            ((bookedSeats.length / (totalSeatsCapacity * (shows.length || 1))) * 100).toFixed(1) : '0';

        const revEl = document.getElementById('kpi-total-revenue');
        const bkEl = document.getElementById('kpi-total-bookings');
        const mvEl = document.getElementById('kpi-active-movies');
        const shEl = document.getElementById('kpi-total-shows');

        const activeMovies = movies.filter(m => (m.Status || m.status || 'Active') === 'Active');

        if (revEl) revEl.textContent = `₹${totalRev.toFixed(2)}`;
        if (bkEl) bkEl.textContent = bookings.length;
        if (mvEl) mvEl.textContent = activeMovies.length;
        if (shEl) shEl.textContent = shows.length;

        // Refresh currently active tab
        if (this.activeAdminTab === 'shows') this.renderShowsTable();
        if (this.activeAdminTab === 'movies') this.renderMoviesTable();
        if (this.activeAdminTab === 'theatres') this.renderTheatresTable();
        if (this.activeAdminTab === 'screens') this.renderScreensTable();
        if (this.activeAdminTab === 'revenue') this.renderRevenueReport();
        if (this.activeAdminTab === 'relations') this.renderRelationalInspector();
    }

    // ------------------------------------------------------------------------
    // TAB 1: SHOW SCHEDULE MANAGER & LIVE TELEMETRY
    // Displays separate, clearly labeled values for Configured Screen Capacity,
    // Physical Seats in Database, Occupied Seats (for this show), and Available Seats
    // ------------------------------------------------------------------------
    async renderShowsTable() {
        const container = document.getElementById('admin-shows-table-container');
        if (!container) return;

        const shows = this.engine.getTable('SHOWS');
        const movies = this.engine.getTable('MOVIE');
        const screens = this.engine.getTable('SCREEN');
        const theaters = this.engine.getTable('THEATER');

        // Fetch live physical seat counts and show occupancies from Supabase if online
        let dbCounts = this.livePhysicalSeatCounts || null;
        let showOccupancies = this.liveShowOccupancies || null;

        if (window.MTRSSupabase) {
            try {
                if (!dbCounts && typeof window.MTRSSupabase.fetchPhysicalSeatCounts === 'function') {
                    const res = await window.MTRSSupabase.fetchPhysicalSeatCounts();
                    if (res && res.success) {
                        dbCounts = res.counts;
                        this.livePhysicalSeatCounts = res.counts;
                    }
                }
                if (!showOccupancies && typeof window.MTRSSupabase.fetchShowOccupancies === 'function') {
                    const occRes = await window.MTRSSupabase.fetchShowOccupancies();
                    if (occRes && occRes.success) {
                        showOccupancies = occRes.data;
                        this.liveShowOccupancies = occRes.data;
                    }
                }
            } catch (err) {
                console.warn('[MTRS Admin] Exception loading show telemetry from Supabase:', err);
            }
        }

        container.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 0.75rem;">
                <div>
                    <h4 style="color: var(--text-pure); font-size: 1.1rem;">Scheduled Movie Shows (${shows.length})</h4>
                    <p style="color: var(--text-muted); font-size: 0.85rem;">Live show inventory displaying distinct screen capacities, physical database seats, and real-time show availability.</p>
                </div>
                <div style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
                    <button class="btn-secondary" style="font-size: 0.82rem; padding: 0.5rem 0.9rem;" onclick="window.MTRSAdmin.refreshShowsTelemetry()">
                        🔄 Refresh Show Inventory
                    </button>
                    <button class="btn-primary" style="background: linear-gradient(135deg, var(--accent-cyan), var(--primary)); padding: 0.5rem 1rem; font-size: 0.85rem;" onclick="window.MTRSAdmin.openAutoScheduleModal()">
                        ⚡ Auto-Schedule Showtimes
                    </button>
                    <button class="btn-primary" style="padding: 0.5rem 1rem; font-size: 0.85rem;" onclick="window.MTRSAdmin.openAddShowModal()">
                        + Add New Show
                    </button>
                </div>
            </div>

            <table class="data-table">
                <thead>
                    <tr>
                        <th>Show ID</th>
                        <th>Movie</th>
                        <th>Destination &amp; Audi</th>
                        <th>Date &amp; Time</th>
                        <th>Format</th>
                        <th title="Total configured screen capacity in auditorium">Configured Capacity</th>
                        <th title="Total physical records in public.seats for this screen">Physical Seats (DB)</th>
                        <th title="Confirmed reservations for this specific show">Occupied (Show)</th>
                        <th title="Remaining bookable seats for this specific show">Available (Show)</th>
                        <th>Ticket Price</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${shows.map(show => {
                        const movie = movies.find(m => m.Movie_ID === show.Movie_ID) || {};
                        const screen = screens.find(s => s.Screen_ID === show.Screen_ID) || {};
                        const theater = theaters.find(t => t.Theater_ID === screen.Theater_ID) || {};
                        const cap = parseInt(screen.Capacity, 10) || 0;
                        const physicalDbSeats = (dbCounts && dbCounts[screen.Screen_ID] !== undefined)
                            ? dbCounts[screen.Screen_ID]
                            : cap;
                        const occupied = (showOccupancies && showOccupancies[show.Show_ID] !== undefined)
                            ? showOccupancies[show.Show_ID]
                            : 0;
                        const available = Math.max(0, physicalDbSeats - occupied);

                        return `
                            <tr>
                                <td><strong style="color: var(--accent-cyan);">${show.Show_ID}</strong></td>
                                <td style="color: var(--text-pure); font-weight: 600;">${movie.Movie_Name || show.Movie_ID}</td>
                                <td>
                                    <div style="font-weight: 600; color: var(--text-pure);">${theater.Theater_Name || ''}</div>
                                    <div style="font-size: 0.78rem; color: var(--accent-gold);">${screen.Screen_Name || `Screen ${screen.Screen_Number}`} <span style="color: var(--text-muted);">(${screen.Screen_ID})</span></div>
                                </td>
                                <td>${show.Show_Date} at ${window.MTRSUtil ? window.MTRSUtil.formatShowtimeRange(show.Show_Time, movie.Duration) : (show.Show_Time ? show.Show_Time.substring(0, 5) : '')}</td>
                                <td><span class="card-format-tag">${show.Format}</span></td>
                                <td style="font-weight: 700; color: var(--accent-gold);">${cap} Seats</td>
                                <td style="font-weight: 700; color: ${physicalDbSeats >= cap ? 'var(--accent-emerald)' : 'var(--accent-gold)'};">${physicalDbSeats} Seats</td>
                                <td style="font-weight: 700; color: ${occupied > 0 ? 'var(--accent-rose, #EF4444)' : 'var(--text-muted)'};">${occupied} Booked</td>
                                <td style="font-weight: 800; color: var(--accent-emerald);">${available} Available</td>
                                <td style="color: var(--accent-gold); font-weight: 700;">₹${show.Ticket_Price}</td>
                                <td>
                                    <button class="btn-secondary" style="padding: 0.25rem 0.6rem; font-size: 0.75rem;" onclick="window.MTRSAdmin.editShowPrice('${show.Show_ID}')">
                                        Edit Price
                                    </button>
                                    <button class="btn-book-card" style="background: rgba(229, 9, 20, 0.2); border: 1px solid var(--primary); padding: 0.25rem 0.6rem; font-size: 0.75rem;" onclick="window.MTRSAdmin.deleteShow('${show.Show_ID}')">
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;
    }

    async refreshShowsTelemetry() {
        this.livePhysicalSeatCounts = null;
        this.liveShowOccupancies = null;
        if (window.App) window.App.showToast("Fetching live show availability and seat counts from Supabase...", "info");
        await this.renderShowsTable();
        if (window.App) window.App.showToast("Show availability metrics refreshed.", "success");
    }

    openAddShowModal() {
        const movies = this.engine.getTable('MOVIE');
        const screens = this.engine.getTable('SCREEN');
        const theaters = this.engine.getTable('THEATER');

        const modal = document.getElementById('add-show-modal');
        if (!modal) return;

        const movieSelect = document.getElementById('modal-new-show-movie');
        const screenSelect = document.getElementById('modal-new-show-screen');

        if (movieSelect) {
            movieSelect.innerHTML = movies.map(m => `<option value="${m.Movie_ID}">${m.Movie_Name} (${m.Language})</option>`).join('');
        }

        if (screenSelect) {
            screenSelect.innerHTML = screens.map(s => {
                const th = theaters.find(t => t.Theater_ID === s.Theater_ID) || {};
                return `<option value="${s.Screen_ID}">${th.Theater_Name} — ${s.Screen_Name || `Screen ${s.Screen_Number}`} (${s.Screen_Type})</option>`;
            }).join('');
        }

        modal.classList.add('active');
    }

    saveNewShow() {
        const movieId = document.getElementById('modal-new-show-movie').value;
        const screenId = document.getElementById('modal-new-show-screen').value;
        const date = document.getElementById('modal-new-show-date').value;
        const time = document.getElementById('modal-new-show-time').value;
        const format = document.getElementById('modal-new-show-format').value;
        const price = parseFloat(document.getElementById('modal-new-show-price').value);

        if (!date || !time || isNaN(price) || price <= 0) {
            window.App.showToast("Please enter valid show date, time, and price.", "error");
            return;
        }

        const movies = this.engine.getTable('MOVIE');
        const movie = movies.find(m => m.Movie_ID === movieId);
        const duration = movie && movie.Duration ? parseInt(movie.Duration, 10) : 120;

        const timeParts = time.split(':');
        const startH = parseInt(timeParts[0], 10) || 0;
        const startM = parseInt(timeParts[1], 10) || 0;
        const newStartTotal = startH * 60 + startM;
        const newEndTotal = newStartTotal + duration;

        if (newEndTotal > 1560) {
            window.App.showToast("Show cannot exceed the 2:00 AM cinema closing deadline.", "error");
            return;
        }

        // Showtime Scheduling Overlap Validation with 15-min cleaning/turnover interval (Requirement 15)
        const shows = this.engine.getTable('SHOWS');
        const screenShows = shows.filter(s => s.Screen_ID === screenId && s.Show_Date === date);
        const turnoverMinutes = 15;

        for (const exShow of screenShows) {
            const exMovie = movies.find(m => m.Movie_ID === exShow.Movie_ID);
            const exDuration = exMovie && exMovie.Duration ? parseInt(exMovie.Duration, 10) : 120;
            const exParts = exShow.Show_Time.split(':');
            const exStart = (parseInt(exParts[0], 10) || 0) * 60 + (parseInt(exParts[1], 10) || 0);
            const exEnd = exStart + exDuration;

            const exWindowStart = exStart;
            const exWindowEnd = exEnd + turnoverMinutes;
            const newWindowStart = newStartTotal;
            const newWindowEnd = newEndTotal + turnoverMinutes;

            if (newWindowStart < exWindowEnd && newWindowEnd > exWindowStart) {
                const exRange = window.MTRSUtil ? window.MTRSUtil.formatShowtimeRange(exShow.Show_Time, exDuration) : exShow.Show_Time;
                window.App.showToast(`Scheduling Conflict: Screen already has ${exShow.Show_ID} (${exRange}). With 15-min cleaning turnover, the new show cannot overlap.`, "error");
                return;
            }
        }

        const maxNum = shows.reduce((max, s) => {
            const n = parseInt(String(s.Show_ID).replace(/\D/g, ''), 10);
            return isNaN(n) ? max : Math.max(max, n);
        }, 0);
        const nextId = `SH${maxNum + 1 < 10 ? '0' + (maxNum + 1) : (maxNum + 1)}`;

        shows.push({
            Show_ID: nextId,
            Movie_ID: movieId,
            Screen_ID: screenId,
            Show_Date: date,
            Show_Time: `${time}:00`,
            Format: format,
            Ticket_Price: price
        });

        this.engine.save();
        document.getElementById('add-show-modal').classList.remove('active');
        window.App.showToast(`Show ${nextId} added to schedule successfully.`, "success");
        this.refreshDashboard();
    }

    // ------------------------------------------------------------------------
    // AUTOMATIC SHOWTIME SCHEDULER (Requirement 15)
    // Generates showtimes from 9:00 AM (540 min) to 2:00 AM (1560 min)
    // with mandatory 15-minute cleaning intervals between consecutive shows
    // ------------------------------------------------------------------------
    openAutoScheduleModal() {
        const modal = document.getElementById('auto-schedule-modal');
        if (!modal) return;

        const theaters = this.engine.getTable('THEATER');
        const movies = this.engine.getTable('MOVIE');

        const theatreSelect = document.getElementById('auto-sched-theatre');
        const movieSelect = document.getElementById('auto-sched-movie');

        if (theatreSelect) {
            theatreSelect.innerHTML = theaters.map(t => `<option value="${t.Theater_ID}">${t.Theater_Name}</option>`).join('');
        }

        if (movieSelect) {
            movieSelect.innerHTML = movies.map(m => `<option value="${m.Movie_ID}">${m.Movie_Name} (${m.Duration}m • ${m.Language})</option>`).join('');
        }

        this.onAutoScheduleTheatreChange();
        modal.classList.add('active');
    }

    onAutoScheduleTheatreChange() {
        const theatreId = document.getElementById('auto-sched-theatre').value;
        const screens = this.engine.getTable('SCREEN').filter(s => s.Theater_ID === theatreId);
        const screenSelect = document.getElementById('auto-sched-screen');

        if (screenSelect) {
            screenSelect.innerHTML = screens.map(s => `
                <option value="${s.Screen_ID}">${s.Screen_Name || `Screen ${s.Screen_Number}`} (${s.Screen_Type})</option>
            `).join('');
        }

        this.previewAutoSchedule();
    }

    calculateAutoScheduleList(movieId, screenId, date, format, ticketPrice) {
        const movies = this.engine.getTable('MOVIE');
        const movie = movies.find(m => m.Movie_ID === movieId);
        const duration = movie && movie.Duration ? parseInt(movie.Duration, 10) : 120;

        const START_WINDOW = 540;   // 09:00 AM
        const CLOSE_DEADLINE = 1560; // 02:00 AM next day (26:00)
        const CLEANING_INTERVAL = 15; // 15 minutes mandatory turnover

        const shows = [];
        let curStart = START_WINDOW;

        while (curStart + duration <= CLOSE_DEADLINE) {
            const curEnd = curStart + duration;

            // Normalize start time for HH:MM:00 representation
            const startNormalized = curStart % 1440;
            const startH = Math.floor(startNormalized / 60);
            const startM = startNormalized % 60;
            const timeStr = `${startH < 10 ? '0' + startH : startH}:${startM < 10 ? '0' + startM : startM}:00`;

            // Check if end crosses midnight
            const crossesMidnight = curEnd >= 1440;

            shows.push({
                Movie_ID: movieId,
                Screen_ID: screenId,
                Show_Date: date,
                Show_Time: timeStr,
                Format: format,
                Ticket_Price: parseFloat(ticketPrice) || 350,
                startMinutes: curStart,
                endMinutes: curEnd,
                duration: duration,
                crossesMidnight: crossesMidnight
            });

            // Advance start time by runtime + 15 minutes cleaning interval
            curStart = curEnd + CLEANING_INTERVAL;
        }

        return shows;
    }

    previewAutoSchedule() {
        const movieId = document.getElementById('auto-sched-movie') ? document.getElementById('auto-sched-movie').value : null;
        const screenId = document.getElementById('auto-sched-screen') ? document.getElementById('auto-sched-screen').value : null;
        const date = document.getElementById('auto-sched-date') ? document.getElementById('auto-sched-date').value : '2026-10-22';
        const format = document.getElementById('auto-sched-format') ? document.getElementById('auto-sched-format').value : '2D';
        const price = document.getElementById('auto-sched-price') ? document.getElementById('auto-sched-price').value : 350;

        const listEl = document.getElementById('auto-sched-preview-list');
        const countEl = document.getElementById('auto-sched-preview-count');
        if (!listEl || !movieId || !screenId) return;

        const schedule = this.calculateAutoScheduleList(movieId, screenId, date, format, price);
        const movies = this.engine.getTable('MOVIE');
        const movie = movies.find(m => m.Movie_ID === movieId) || {};

        if (countEl) countEl.textContent = `${schedule.length} showtimes generated`;

        listEl.innerHTML = schedule.map((s, idx) => {
            const rangeStr = window.MTRSUtil ? window.MTRSUtil.formatShowtimeRange(s.Show_Time, s.duration) : s.Show_Time;
            const badgeCross = s.crossesMidnight ? '<span style="color: var(--accent-gold); font-size: 0.72rem; margin-left: 0.4rem;">[Crosses Midnight]</span>' : '';
            return `
                <div style="padding: 0.35rem 0.5rem; background: rgba(255,255,255,0.03); border-radius: 4px; display: flex; justify-content: space-between; align-items: center;">
                    <span><strong>Show ${idx + 1}:</strong> ${rangeStr} ${badgeCross}</span>
                    <span style="color: var(--text-muted); font-size: 0.72rem;">+15m clean</span>
                </div>
            `;
        }).join('');
    }

    commitAutoSchedule() {
        const movieId = document.getElementById('auto-sched-movie').value;
        const screenId = document.getElementById('auto-sched-screen').value;
        const date = document.getElementById('auto-sched-date').value;
        const format = document.getElementById('auto-sched-format').value;
        const price = parseFloat(document.getElementById('auto-sched-price').value) || 350;
        const replaceExisting = document.getElementById('auto-sched-replace').checked;

        const result = this.autoGenerateScreenSchedule({
            movieId,
            screenId,
            date,
            format,
            ticketPrice: price,
            replaceExisting
        });

        document.getElementById('auto-schedule-modal').classList.remove('active');
        window.App.showToast(`Auto-scheduled ${result.length} shows on screen ${screenId} for ${date}`, "success");
        this.refreshDashboard();
    }

    autoGenerateScreenSchedule({ screenId, movieId, date, format = '2D', ticketPrice = 350, replaceExisting = false }) {
        const calculated = this.calculateAutoScheduleList(movieId, screenId, date, format, ticketPrice);
        let allShows = this.engine.getTable('SHOWS');

        if (replaceExisting) {
            // Remove shows for this screen and date (except those with active bookings)
            const bookings = this.engine.getTable('BOOKING');
            allShows = allShows.filter(s => {
                if (s.Screen_ID === screenId && s.Show_Date === date) {
                    const hasBooking = bookings.some(b => b.Show_ID === s.Show_ID);
                    return hasBooking; // preserve booked shows to maintain foreign keys
                }
                return true;
            });
            this.engine.db.SHOWS = allShows;
        }

        // Determine highest show ID number
        let maxIdNum = allShows.reduce((max, s) => {
            const num = parseInt(String(s.Show_ID).replace(/\D/g, ''), 10);
            return isNaN(num) ? max : Math.max(max, num);
        }, 0);

        const createdShows = [];
        for (const item of calculated) {
            maxIdNum++;
            const nextId = `SH${maxIdNum < 10 ? '0' + maxIdNum : maxIdNum}`;
            const newShow = {
                Show_ID: nextId,
                Movie_ID: item.Movie_ID,
                Screen_ID: item.Screen_ID,
                Show_Date: item.Show_Date,
                Show_Time: item.Show_Time,
                Format: item.Format,
                Ticket_Price: item.Ticket_Price
            };
            allShows.push(newShow);
            createdShows.push(newShow);
        }

        this.engine.save();
        return createdShows;
    }

    autoGenerateTheatreSchedule({ theaterId, date, movieAssignments = null, replaceExisting = false }) {
        const screens = this.engine.getTable('SCREEN').filter(s => s.Theater_ID === theaterId);
        const movies = this.engine.getTable('MOVIE');
        const allCreated = [];

        screens.forEach((screen, index) => {
            let assignedMovieId;
            if (movieAssignments && movieAssignments[screen.Screen_ID]) {
                assignedMovieId = movieAssignments[screen.Screen_ID];
            } else {
                assignedMovieId = movies[index % movies.length].Movie_ID;
            }

            const format = screen.Screen_Type && screen.Screen_Type.includes('IMAX') ? 'IMAX 3D' : 
                          (screen.Screen_Type && screen.Screen_Type.includes('P[XL]') ? 'P[XL] 3D' : '2D');
            const price = format.includes('IMAX') ? 480 : (format.includes('P[XL]') ? 420 : 250);

            const screenShows = this.autoGenerateScreenSchedule({
                screenId: screen.Screen_ID,
                movieId: assignedMovieId,
                date,
                format,
                ticketPrice: price,
                replaceExisting
            });
            allCreated.push(...screenShows);
        });

        this.refreshDashboard();
        return allCreated;
    }

    editShowPrice(showId) {
        const show = this.engine.getTable('SHOWS').find(s => s.Show_ID === showId);
        if (!show) return;

        const newPrice = prompt(`Enter new ticket price for Show ${showId}:`, show.Ticket_Price);
        if (newPrice !== null) {
            const parsed = parseFloat(newPrice);
            if (isNaN(parsed) || parsed <= 0) {
                window.App.showToast("Ticket price must be a positive number (CHECK chk_show_price).", "error");
                return;
            }
            show.Ticket_Price = parsed;
            this.engine.save();
            window.App.showToast(`Ticket price for ${showId} updated to ₹${parsed}.`, "success");
            this.renderShowsTable();
        }
    }

    deleteShow(showId) {
        if (!confirm(`Delete Show ${showId}? This will cascade delete associated bookings and free occupied seats.`)) {
            return;
        }

        this.engine.db.SHOWS = this.engine.db.SHOWS.filter(s => s.Show_ID !== showId);
        this.engine.save();
        window.App.showToast(`Show ${showId} deleted from schedule.`, "success");
        this.refreshDashboard();
    }

    // ========================================================================
    // FEATURE 2 & 3: MOVIE & POSTER MANAGEMENT
    // ========================================================================
    renderMoviesTable() {
        const container = document.getElementById('admin-movies-container');
        if (!container) return;

        const movies = (window.App && Array.isArray(window.App.movies) && window.App.movies.length > 0)
            ? window.App.movies
            : this.engine.getTable('MOVIE');
        const shows = (window.App && Array.isArray(window.App.shows) && window.App.shows.length > 0)
            ? window.App.shows
            : this.engine.getTable('SHOWS');

        const q = (this.movieSearchQuery || '').toLowerCase();
        const filtered = movies.filter(m => 
            !q ||
            m.Movie_Name.toLowerCase().includes(q) ||
            m.Genre.toLowerCase().includes(q) ||
            m.Language.toLowerCase().includes(q) ||
            (m.Cast && m.Cast.toLowerCase().includes(q))
        );

        container.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 0.75rem;">
                <div>
                    <h4 style="color: var(--text-pure); font-size: 1.15rem;">🎬 Theatrical Movies &amp; Posters (${movies.length})</h4>
                    <p style="color: var(--text-muted); font-size: 0.82rem;">Manage movie metadata, upload theatrical posters from your computer, or configure poster URLs.</p>
                </div>
                <div style="display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap;">
                    <input 
                        type="text" 
                        class="search-input" 
                        style="max-width: 240px; padding: 0.45rem 0.85rem; font-size: 0.82rem;" 
                        placeholder="Search movies..." 
                        value="${this.movieSearchQuery || ''}"
                        oninput="window.MTRSAdmin.filterMovies(this.value)"
                    />
                    <button class="btn-secondary" style="padding: 0.5rem 1rem; font-size: 0.85rem; display: flex; align-items: center; gap: 0.4rem;" onclick="window.MTRSArtworkManager.open()">
                        🎨 Manage Artwork
                    </button>
                    <button class="btn-primary" style="padding: 0.5rem 1rem; font-size: 0.85rem;" onclick="window.MTRSAdmin.openAddMovieModal()">
                        + Add New Movie
                    </button>
                </div>
            </div>

            <div class="data-table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th style="width: 70px;">Poster</th>
                            <th>Movie Title</th>
                            <th>Genre &amp; Duration</th>
                            <th>Language &amp; Rating</th>
                            <th>Cast</th>
                            <th>Status</th>
                            <th>Scheduled Shows</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filtered.length > 0 ? filtered.map(m => {
                            const movieShows = shows.filter(s => s.Movie_ID === m.Movie_ID);
                            const posterHtml = window.MTRSPosters ? 
                                window.MTRSPosters.renderPosterHtml(m, 'admin-poster-thumb', m.Movie_Name) : '';
                            const isArchived = m.Status === 'Archived';

                            return `
                                <tr style="${isArchived ? 'opacity: 0.65;' : ''}">
                                    <td>
                                        <div style="width: 48px; height: 68px; overflow: hidden; border-radius: 6px; border: 1px solid var(--border-subtle); display: flex; align-items: center; justify-content: center; background: #080910;">
                                            ${posterHtml}
                                        </div>
                                    </td>
                                    <td>
                                        <div style="color: var(--text-pure); font-weight: 700; font-size: 0.95rem;">${m.Movie_Name}</div>
                                        <span style="color: var(--accent-cyan); font-family: var(--font-mono); font-size: 0.75rem;">${m.Movie_ID}</span>
                                    </td>
                                    <td>
                                        <div style="color: var(--text-pure);">${m.Genre}</div>
                                        <span style="color: var(--text-muted); font-size: 0.78rem;">${m.Duration} mins</span>
                                    </td>
                                    <td>
                                        <div><span class="movie-lang-pill" style="font-size: 0.72rem; padding: 2px 7px;">${m.Language}</span></div>
                                        <span style="color: var(--accent-gold); font-size: 0.8rem; font-weight: 700; margin-top: 3px; display: inline-block;">★ ${m.Rating}/10</span>
                                    </td>
                                    <td style="font-size: 0.78rem; color: var(--text-secondary); max-width: 170px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                                        ${m.Cast || '—'}
                                    </td>
                                    <td>
                                        <span style="font-size: 0.72rem; padding: 2px 8px; border-radius: 4px; font-weight: 700; background: ${isArchived ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)'}; color: ${isArchived ? '#ef4444' : 'var(--accent-emerald)'};">
                                            ${m.Status || 'Active'}
                                        </span>
                                    </td>
                                    <td>
                                        <span style="font-weight: 700; color: ${movieShows.length > 0 ? 'var(--accent-gold)' : 'var(--text-muted)'};">
                                            ${movieShows.length} Shows
                                        </span>
                                    </td>
                                    <td>
                                        <div style="display: flex; gap: 0.35rem; flex-wrap: wrap;">
                                            <button class="btn-secondary" style="padding: 0.25rem 0.55rem; font-size: 0.75rem; color: var(--accent-cyan);" onclick="window.MTRSArtworkManager.open('${m.Movie_ID}')" title="Upload custom poster or backdrop">
                                                🎨 Artwork
                                            </button>
                                            <button class="btn-secondary" style="padding: 0.25rem 0.55rem; font-size: 0.75rem;" onclick="window.MTRSAdmin.openEditMovieModal('${m.Movie_ID}')">
                                                Edit
                                            </button>
                                            <button class="btn-book-card" style="background: rgba(229, 9, 20, 0.2); border: 1px solid var(--primary); padding: 0.25rem 0.55rem; font-size: 0.75rem;" onclick="window.MTRSAdmin.deleteOrArchiveMovie('${m.Movie_ID}')">
                                                ${movieShows.length > 0 ? 'Archive' : 'Delete'}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            `;
                        }).join('') : `
                            <tr>
                                <td colspan="8" style="text-align: center; padding: 2.5rem; color: var(--text-muted);">
                                    No movies found matching "${this.movieSearchQuery}".
                                </td>
                            </tr>
                        `}
                    </tbody>
                </table>
            </div>
        `;
    }

    filterMovies(query) {
        this.movieSearchQuery = query;
        this.renderMoviesTable();
    }

    showModalError(message) {
        const errorEl = document.getElementById('modal-movie-error-alert');
        if (errorEl) {
            errorEl.innerHTML = `<strong>⚠️ Database Write Failed:</strong> ${message}`;
            errorEl.style.display = 'block';
            errorEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }

    clearModalError() {
        const errorEl = document.getElementById('modal-movie-error-alert');
        if (errorEl) {
            errorEl.style.display = 'none';
            errorEl.innerHTML = '';
        }
    }

    async checkAdminAuthNotice() {
        const noticeEl = document.getElementById('modal-movie-auth-notice');
        if (!noticeEl) return;

        noticeEl.style.display = 'none';
        noticeEl.innerHTML = '';

        if (!window.MTRSSupabase || !window.MTRSSupabase.isConfigured) {
            noticeEl.innerHTML = `<strong>⚠️ Supabase Disconnected:</strong> The application is currently running without an active Supabase client. Central database persistence requires Supabase connection.`;
            noticeEl.style.display = 'block';
            return;
        }

        try {
            const check = await window.MTRSSupabase.checkIsAdmin();
            if (!check.isAdmin) {
                if (check.reason === 'NOT_AUTHENTICATED' || !check.user) {
                    noticeEl.innerHTML = `
                        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
                            <div>
                                <strong>🔒 Admin Authentication Required:</strong> You are currently browsing as guest. Central database writes in Supabase are protected by Row Level Security (RLS) and require an authorized administrator session.
                            </div>
                            <button type="button" class="btn-secondary" style="padding: 0.25rem 0.65rem; font-size: 0.76rem; color: var(--accent-cyan);" onclick="window.MTRSAdmin.closeMovieModal(); window.App.openAccountModal();">
                                🔑 Sign In
                            </button>
                        </div>
                    `;
                    noticeEl.style.display = 'block';
                } else {
                    noticeEl.innerHTML = `
                        <strong>⚠️ Administrator Permissions Required:</strong> Signed in as <em>${check.user.email}</em>, but this user is not registered in <code>public.admin_users</code>. Database inserts and updates will be rejected by PostgreSQL Row Level Security.
                    `;
                    noticeEl.style.display = 'block';
                }
            } else {
                noticeEl.style.display = 'none';
            }
        } catch (err) {
            console.warn('[MTRS Admin] checkAdminAuthNotice error:', err);
        }
    }

    openAddMovieModal() {
        this.currentEditMovieId = null;
        this.pendingPosterBlob = null;
        this.pendingBackdropBlob = null;
        this.removeCustomPosterRequested = false;
        this.removeCustomBackdropRequested = false;
        this.clearModalError();

        document.getElementById('modal-movie-id').value = '';
        document.getElementById('modal-movie-name').value = '';
        document.getElementById('modal-movie-genre').value = '';
        document.getElementById('modal-movie-duration').value = '150';
        document.getElementById('modal-movie-language').value = 'Tamil, English';
        document.getElementById('modal-movie-rating').value = '8.5';
        document.getElementById('modal-movie-cast').value = '';
        document.getElementById('modal-movie-status').value = 'Active';
        document.getElementById('modal-movie-synopsis').value = '';

        // Reset Poster Controls
        document.getElementById('modal-movie-poster-url').value = '';
        document.getElementById('modal-poster-file-input').value = '';
        const posterErr = document.getElementById('modal-poster-error-msg');
        if (posterErr) posterErr.style.display = 'none';

        const previewPosterImg = document.getElementById('modal-poster-preview-img');
        const previewPosterPlaceholder = document.getElementById('modal-poster-preview-placeholder');
        if (previewPosterImg) { previewPosterImg.src = ''; previewPosterImg.style.display = 'none'; }
        if (previewPosterPlaceholder) { previewPosterPlaceholder.style.display = 'block'; previewPosterPlaceholder.textContent = 'No Poster Selected'; }

        // Reset Backdrop Controls
        const backdropUrlInput = document.getElementById('modal-movie-backdrop-url');
        if (backdropUrlInput) backdropUrlInput.value = '';
        const backdropFileInput = document.getElementById('modal-backdrop-file-input');
        if (backdropFileInput) backdropFileInput.value = '';
        const backdropErr = document.getElementById('modal-backdrop-error-msg');
        if (backdropErr) backdropErr.style.display = 'none';

        const previewBackdropImg = document.getElementById('modal-backdrop-preview-img');
        const previewBackdropPlaceholder = document.getElementById('modal-backdrop-preview-placeholder');
        if (previewBackdropImg) { previewBackdropImg.src = ''; previewBackdropImg.style.display = 'none'; }
        if (previewBackdropPlaceholder) { previewBackdropPlaceholder.style.display = 'block'; previewBackdropPlaceholder.textContent = 'No Backdrop Selected'; }

        document.getElementById('modal-movie-title-heading').textContent = 'Add New Theatrical Movie';
        document.getElementById('movie-modal').classList.add('active');

        this.checkAdminAuthNotice();
    }

    openEditMovieModal(movieId) {
        const movies = (window.App && Array.isArray(window.App.movies) && window.App.movies.length > 0)
            ? window.App.movies
            : this.engine.getTable('MOVIE');
        const movie = movies.find(m => m.Movie_ID === movieId);
        if (!movie) return;

        this.currentEditMovieId = movieId;
        this.pendingPosterBlob = null;
        this.pendingBackdropBlob = null;
        this.removeCustomPosterRequested = false;
        this.removeCustomBackdropRequested = false;
        this.clearModalError();

        document.getElementById('modal-movie-id').value = movie.Movie_ID;
        document.getElementById('modal-movie-name').value = movie.Movie_Name || '';
        document.getElementById('modal-movie-genre').value = movie.Genre || '';
        document.getElementById('modal-movie-duration').value = movie.Duration || 120;
        document.getElementById('modal-movie-language').value = movie.Language || '';
        document.getElementById('modal-movie-rating').value = movie.Rating || 8.0;
        document.getElementById('modal-movie-cast').value = movie.Cast || '';
        document.getElementById('modal-movie-status').value = movie.Status || 'Active';
        document.getElementById('modal-movie-synopsis').value = movie.Synopsis || '';

        // Poster controls pre-fill
        document.getElementById('modal-movie-poster-url').value = movie.Poster_Url || '';
        document.getElementById('modal-poster-file-input').value = '';
        const posterErr = document.getElementById('modal-poster-error-msg');
        if (posterErr) posterErr.style.display = 'none';

        const previewPosterImg = document.getElementById('modal-poster-preview-img');
        const previewPosterPlaceholder = document.getElementById('modal-poster-preview-placeholder');

        const resolvedPoster = window.MTRSPosters ? window.MTRSPosters.resolvePoster(movie) : (movie.Poster_Url || null);
        if (resolvedPoster) {
            previewPosterImg.src = resolvedPoster;
            previewPosterImg.style.display = 'block';
            if (previewPosterPlaceholder) previewPosterPlaceholder.style.display = 'none';
        } else {
            previewPosterImg.src = '';
            previewPosterImg.style.display = 'none';
            if (previewPosterPlaceholder) {
                previewPosterPlaceholder.style.display = 'block';
                previewPosterPlaceholder.textContent = 'Registry Vector SVG Fallback Active';
            }
        }

        // Backdrop controls pre-fill
        const backdropUrlInput = document.getElementById('modal-movie-backdrop-url');
        if (backdropUrlInput) backdropUrlInput.value = movie.Backdrop_Url || '';
        const backdropFileInput = document.getElementById('modal-backdrop-file-input');
        if (backdropFileInput) backdropFileInput.value = '';
        const backdropErr = document.getElementById('modal-backdrop-error-msg');
        if (backdropErr) backdropErr.style.display = 'none';

        const previewBackdropImg = document.getElementById('modal-backdrop-preview-img');
        const previewBackdropPlaceholder = document.getElementById('modal-backdrop-preview-placeholder');

        const resolvedBackdrop = window.MTRSPosters ? window.MTRSPosters.resolveBackdrop(movie) : (movie.Backdrop_Url || null);
        if (resolvedBackdrop && previewBackdropImg) {
            previewBackdropImg.src = resolvedBackdrop;
            previewBackdropImg.style.display = 'block';
            if (previewBackdropPlaceholder) previewBackdropPlaceholder.style.display = 'none';
        } else if (previewBackdropImg) {
            previewBackdropImg.src = '';
            previewBackdropImg.style.display = 'none';
            if (previewBackdropPlaceholder) {
                previewBackdropPlaceholder.style.display = 'block';
                previewBackdropPlaceholder.textContent = 'Default Hero Backdrop Active';
            }
        }

        document.getElementById('modal-movie-title-heading').textContent = `Edit Movie — ${movie.Movie_Name} (${movie.Movie_ID})`;
        document.getElementById('movie-modal').classList.add('active');

        this.checkAdminAuthNotice();
    }

    closeMovieModal() {
        document.getElementById('movie-modal').classList.remove('active');
        this.pendingPosterBlob = null;
        this.pendingBackdropBlob = null;
        this.removeCustomPosterRequested = false;
        this.removeCustomBackdropRequested = false;
        this.currentEditMovieId = null;
        this.clearModalError();
        const noticeEl = document.getElementById('modal-movie-auth-notice');
        if (noticeEl) noticeEl.style.display = 'none';
    }

    handlePosterFileSelected(input) {
        const file = input.files && input.files[0];
        if (!file) return;

        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        const errorEl = document.getElementById('modal-poster-error-msg');

        if (!validTypes.includes(file.type.toLowerCase())) {
            if (errorEl) {
                errorEl.textContent = "Unsupported format. Only JPEG, JPG, PNG, and WebP images are allowed.";
                errorEl.style.display = 'block';
            }
            input.value = '';
            return;
        }

        if (file.size > 25 * 1024 * 1024) {
            if (errorEl) {
                errorEl.textContent = `File size is ${(file.size / (1024 * 1024)).toFixed(2)}MB, exceeding the 25MB limit.`;
                errorEl.style.display = 'block';
            }
            input.value = '';
            return;
        }

        if (errorEl) errorEl.style.display = 'none';
        this.pendingPosterBlob = file;
        this.removeCustomPosterRequested = false;

        const objUrl = URL.createObjectURL(file);
        const previewImg = document.getElementById('modal-poster-preview-img');
        const previewPlaceholder = document.getElementById('modal-poster-preview-placeholder');

        if (previewImg) {
            previewImg.src = objUrl;
            previewImg.style.display = 'block';
        }
        if (previewPlaceholder) previewPlaceholder.style.display = 'none';

        window.App.showToast("Poster preview loaded. It will upload to Supabase Storage on save.", "info");
    }

    handlePosterUrlInput(url) {
        const errorEl = document.getElementById('modal-poster-error-msg');
        if (errorEl) errorEl.style.display = 'none';

        const previewImg = document.getElementById('modal-poster-preview-img');
        const previewPlaceholder = document.getElementById('modal-poster-preview-placeholder');
        const trimmed = (url || '').trim();

        if (trimmed) {
            this.pendingPosterBlob = null;
            this.removeCustomPosterRequested = false;
            if (previewImg) {
                previewImg.src = trimmed;
                previewImg.style.display = 'block';
            }
            if (previewPlaceholder) previewPlaceholder.style.display = 'none';
        } else if (!this.pendingPosterBlob) {
            if (previewImg) previewImg.style.display = 'none';
            if (previewPlaceholder) previewPlaceholder.style.display = 'block';
        }
    }

    removeCustomPoster() {
        this.pendingPosterBlob = null;
        this.removeCustomPosterRequested = true;
        document.getElementById('modal-movie-poster-url').value = '';
        document.getElementById('modal-poster-file-input').value = '';

        const previewImg = document.getElementById('modal-poster-preview-img');
        const previewPlaceholder = document.getElementById('modal-poster-preview-placeholder');
        if (previewImg) {
            previewImg.src = '';
            previewImg.style.display = 'none';
        }
        if (previewPlaceholder) {
            previewPlaceholder.style.display = 'block';
            previewPlaceholder.textContent = 'Poster marked for removal. Fallback artwork will be used.';
        }

        window.App.showToast("Poster marked for removal. Click Save to apply.", "info");
    }

    handleBackdropFileSelected(input) {
        const file = input.files && input.files[0];
        if (!file) return;

        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        const errorEl = document.getElementById('modal-backdrop-error-msg');

        if (!validTypes.includes(file.type.toLowerCase())) {
            if (errorEl) {
                errorEl.textContent = "Unsupported format. Only JPEG, JPG, PNG, and WebP images are allowed.";
                errorEl.style.display = 'block';
            }
            input.value = '';
            return;
        }

        if (file.size > 25 * 1024 * 1024) {
            if (errorEl) {
                errorEl.textContent = `File size is ${(file.size / (1024 * 1024)).toFixed(2)}MB, exceeding the 25MB limit.`;
                errorEl.style.display = 'block';
            }
            input.value = '';
            return;
        }

        if (errorEl) errorEl.style.display = 'none';
        this.pendingBackdropBlob = file;
        this.removeCustomBackdropRequested = false;

        const objUrl = URL.createObjectURL(file);
        const previewImg = document.getElementById('modal-backdrop-preview-img');
        const previewPlaceholder = document.getElementById('modal-backdrop-preview-placeholder');

        if (previewImg) {
            previewImg.src = objUrl;
            previewImg.style.display = 'block';
        }
        if (previewPlaceholder) previewPlaceholder.style.display = 'none';

        window.App.showToast("Hero backdrop preview loaded. It will upload to Supabase Storage on save.", "info");
    }

    handleBackdropUrlInput(url) {
        const errorEl = document.getElementById('modal-backdrop-error-msg');
        if (errorEl) errorEl.style.display = 'none';

        const previewImg = document.getElementById('modal-backdrop-preview-img');
        const previewPlaceholder = document.getElementById('modal-backdrop-preview-placeholder');
        const trimmed = (url || '').trim();

        if (trimmed) {
            this.pendingBackdropBlob = null;
            this.removeCustomBackdropRequested = false;
            if (previewImg) {
                previewImg.src = trimmed;
                previewImg.style.display = 'block';
            }
            if (previewPlaceholder) previewPlaceholder.style.display = 'none';
        } else if (!this.pendingBackdropBlob) {
            if (previewImg) previewImg.style.display = 'none';
            if (previewPlaceholder) previewPlaceholder.style.display = 'block';
        }
    }

    removeCustomBackdrop() {
        this.pendingBackdropBlob = null;
        this.removeCustomBackdropRequested = true;
        const backdropUrlInput = document.getElementById('modal-movie-backdrop-url');
        if (backdropUrlInput) backdropUrlInput.value = '';
        const backdropFileInput = document.getElementById('modal-backdrop-file-input');
        if (backdropFileInput) backdropFileInput.value = '';

        const previewImg = document.getElementById('modal-backdrop-preview-img');
        const previewPlaceholder = document.getElementById('modal-backdrop-preview-placeholder');
        if (previewImg) {
            previewImg.src = '';
            previewImg.style.display = 'none';
        }
        if (previewPlaceholder) {
            previewPlaceholder.style.display = 'block';
            previewPlaceholder.textContent = 'Backdrop marked for removal. Fallback backdrop will be used.';
        }

        window.App.showToast("Backdrop marked for removal. Click Save to apply.", "info");
    }

    async saveMovie() {
        const name = document.getElementById('modal-movie-name').value.trim();
        const genre = document.getElementById('modal-movie-genre').value.trim();
        const duration = parseInt(document.getElementById('modal-movie-duration').value, 10);
        const language = document.getElementById('modal-movie-language').value.trim();
        const rawRating = parseFloat(document.getElementById('modal-movie-rating').value);
        const rating = !isNaN(rawRating) ? Math.min(10.0, Math.max(0.0, Math.round(rawRating * 10) / 10)) : 0.0;
        const cast = document.getElementById('modal-movie-cast').value.trim();
        const status = document.getElementById('modal-movie-status').value || 'Active';
        const synopsis = document.getElementById('modal-movie-synopsis').value.trim();
        const posterUrlInput = document.getElementById('modal-movie-poster-url').value.trim();
        const backdropUrlInput = (document.getElementById('modal-movie-backdrop-url')?.value || '').trim();

        // 1. Client-side Form Validation
        if (!name || !genre || isNaN(duration) || duration <= 0 || !language) {
            const valMsg = "Please fill in valid Movie Title, Genre, Duration (minutes > 0), and Language.";
            this.showModalError(valMsg);
            window.App.showToast(valMsg, "error");
            return;
        }

        if (name.length > 100) {
            const valMsg = "Movie Title cannot exceed 100 characters.";
            this.showModalError(valMsg);
            window.App.showToast(valMsg, "error");
            return;
        }

        if (genre.length > 50) {
            const valMsg = "Genre exceeds maximum length of 50 characters.";
            this.showModalError(valMsg);
            window.App.showToast(valMsg, "error");
            return;
        }

        if (language.length > 30) {
            const valMsg = "Language cannot exceed 30 characters.";
            this.showModalError(valMsg);
            window.App.showToast(valMsg, "error");
            return;
        }

        if (rating < 0 || rating > 10) {
            const valMsg = "Movie rating must be between 0.0 and 10.0.";
            this.showModalError(valMsg);
            window.App.showToast(valMsg, "error");
            return;
        }

        this.clearModalError();

        // 2. Set saving UI state on button
        const saveBtn = document.getElementById('btn-save-movie');
        const originalBtnText = saveBtn ? saveBtn.textContent : 'Save Movie & Poster';
        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.textContent = 'Checking admin status...';
        }

        const targetMovieId = this.currentEditMovieId;

        // 3. Verify Supabase client connection
        if (!window.MTRSSupabase || !window.MTRSSupabase.isConfigured) {
            const connErr = "Supabase client is not initialized. Movies must be persisted to the central database.";
            this.showModalError(connErr);
            window.App.showToast(connErr, "error");
            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.textContent = originalBtnText;
            }
            return;
        }

        // 4. Preflight Administrator Check: Prevent broken operations early
        const adminCheck = await window.MTRSSupabase.checkIsAdmin();
        if (!adminCheck.success || !adminCheck.isAdmin) {
            const authErrMsg = "Admin authorization required: Only authenticated administrators registered in public.admin_users can create or modify movies and artwork.";
            this.showModalError(authErrMsg);
            window.App.showToast(authErrMsg, "error");
            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.textContent = originalBtnText;
            }
            return;
        }

        // Array to track newly uploaded cloud storage files for compensating rollback
        const newlyUploadedStorageFiles = [];

        try {
            let finalPosterUrl = this.removeCustomPosterRequested ? '' : posterUrlInput;
            let finalBackdropUrl = this.removeCustomBackdropRequested ? '' : backdropUrlInput;

            // 5. Cloud Upload: Theatrical Poster (if file selected)
            if (this.pendingPosterBlob) {
                if (saveBtn) saveBtn.textContent = 'Uploading poster to cloud storage...';
                console.log('[MTRS Admin] Uploading poster to Supabase Storage...');

                const posterUploadRes = await window.MTRSSupabase.uploadArtworkFile({
                    file: this.pendingPosterBlob,
                    folder: 'posters',
                    movieId: targetMovieId || 'new'
                });

                if (!posterUploadRes || !posterUploadRes.success) {
                    const upErr = `Poster upload failed: ${posterUploadRes?.error || 'Unknown storage error'}. Operation cancelled to prevent broken artwork reference.`;
                    console.error('[MTRS Admin] Poster upload failed:', posterUploadRes);
                    this.showModalError(upErr);
                    window.App.showToast(upErr, 'error');
                    if (saveBtn) {
                        saveBtn.disabled = false;
                        saveBtn.textContent = originalBtnText;
                    }
                    return;
                }

                finalPosterUrl = posterUploadRes.publicUrl;
                newlyUploadedStorageFiles.push(posterUploadRes.path);
                console.log(`[MTRS Admin] Poster uploaded successfully: ${finalPosterUrl}`);
            }

            // 6. Cloud Upload: Cinematic Hero Backdrop (if file selected)
            if (this.pendingBackdropBlob) {
                if (saveBtn) saveBtn.textContent = 'Uploading backdrop to cloud storage...';
                console.log('[MTRS Admin] Uploading backdrop to Supabase Storage...');

                const backdropUploadRes = await window.MTRSSupabase.uploadArtworkFile({
                    file: this.pendingBackdropBlob,
                    folder: 'backdrops',
                    movieId: targetMovieId || 'new'
                });

                if (!backdropUploadRes || !backdropUploadRes.success) {
                    let upErr = `Backdrop upload failed: ${backdropUploadRes?.error || 'Unknown storage error'}. Operation cancelled to prevent broken artwork reference.`;
                    console.error('[MTRS Admin] Backdrop upload failed:', backdropUploadRes);

                    // Clean up already uploaded poster to prevent orphans
                    const cleanupFailures = [];
                    for (const f of newlyUploadedStorageFiles) {
                        const delRes = await window.MTRSSupabase.deleteArtworkFile(f);
                        if (!delRes || !delRes.success) cleanupFailures.push(f);
                    }
                    newlyUploadedStorageFiles.length = 0;

                    if (cleanupFailures.length > 0) {
                        upErr += ` Warning: Storage cleanup failed for: ${cleanupFailures.join(', ')}. Please delete manually in Supabase Storage.`;
                    }

                    this.showModalError(upErr);
                    window.App.showToast(upErr, 'error');
                    if (saveBtn) {
                        saveBtn.disabled = false;
                        saveBtn.textContent = originalBtnText;
                    }
                    return;
                }

                finalBackdropUrl = backdropUploadRes.publicUrl;
                newlyUploadedStorageFiles.push(backdropUploadRes.path);
                console.log(`[MTRS Admin] Backdrop uploaded successfully: ${finalBackdropUrl}`);
            }

            // 7. Prepare Database Payload
            const moviePayload = {
                Movie_Name: name,
                Genre: genre,
                Duration: duration,
                Language: language,
                Rating: rating,
                Cast: cast,
                Status: status,
                Synopsis: synopsis,
                Poster_Url: finalPosterUrl,
                Poster_Hires_Url: finalPosterUrl,
                Backdrop_Url: finalBackdropUrl
            };

            if (saveBtn) saveBtn.textContent = 'Saving movie to Supabase...';

            let saveResult;
            if (targetMovieId) {
                // UPDATE existing movie in Supabase
                saveResult = await window.MTRSSupabase.updateMovie(targetMovieId, moviePayload);
            } else {
                // INSERT new movie into Supabase
                saveResult = await window.MTRSSupabase.createMovie(moviePayload);
            }

            // 8. Strict Persistence Check: Handle DB Failure with Compensating Storage Cleanup
            if (!saveResult || !saveResult.success) {
                const rawError = saveResult?.error || "Unknown database error";
                console.error('[MTRS Admin] Supabase movie write failed:', saveResult);

                // Clean up newly uploaded files to avoid orphaned files in Storage
                const cleanupFailures = [];
                let cleanupSuccessCount = 0;
                for (const f of newlyUploadedStorageFiles) {
                    const delRes = await window.MTRSSupabase.deleteArtworkFile(f);
                    if (!delRes || !delRes.success) {
                        cleanupFailures.push(f);
                    } else {
                        cleanupSuccessCount++;
                    }
                }
                newlyUploadedStorageFiles.length = 0;

                let friendlyMsg = rawError;
                if (saveResult?.code === '42501' || rawError.toLowerCase().includes('permission denied') || rawError.toLowerCase().includes('violates row-level security')) {
                    friendlyMsg = `Permission Denied (PostgreSQL RLS 42501): Only authenticated administrators registered in public.admin_users can create or modify movies in the Supabase database. (${rawError})`;
                } else if (rawError.toLowerCase().includes('failed to fetch')) {
                    friendlyMsg = "Network Connection Error: Could not reach Supabase cloud endpoint. Please check your network connection and retry.";
                }

                if (cleanupFailures.length > 0) {
                    friendlyMsg += ` Warning: Storage cleanup could not confirm deletion of orphaned file(s): ${cleanupFailures.join(', ')}. Please delete manually in Supabase Storage.`;
                } else if (cleanupSuccessCount > 0) {
                    friendlyMsg += ` (Compensating rollback confirmed deletion of uploaded storage file(s).)`;
                }

                this.showModalError(friendlyMsg);
                window.App.showToast(friendlyMsg, "error");

                if (saveBtn) {
                    saveBtn.disabled = false;
                    saveBtn.textContent = originalBtnText;
                }
                // Keep modal open so administrator does not lose form input
                return;
            }

            const savedMovie = saveResult.data;
            const resolvedMovieId = savedMovie?.Movie_ID || targetMovieId;

            // 9. Cache in local IndexedDB for instant offline preview & fallback
            if (this.pendingPosterBlob && window.MTRSImageStore && resolvedMovieId) {
                try {
                    await window.MTRSImageStore.savePoster(resolvedMovieId, this.pendingPosterBlob);
                } catch (artErr) {
                    console.warn('[MTRS Admin] Artwork local poster cache warning:', artErr);
                }
            } else if (this.removeCustomPosterRequested && window.MTRSImageStore && resolvedMovieId) {
                try {
                    await window.MTRSImageStore.deletePoster(resolvedMovieId);
                } catch (artErr) {
                    console.warn('[MTRS Admin] Artwork local poster removal warning:', artErr);
                }
            }

            if (this.pendingBackdropBlob && window.MTRSImageStore && resolvedMovieId) {
                try {
                    await window.MTRSImageStore.saveBackdrop(resolvedMovieId, this.pendingBackdropBlob);
                } catch (artErr) {
                    console.warn('[MTRS Admin] Artwork local backdrop cache warning:', artErr);
                }
            } else if (this.removeCustomBackdropRequested && window.MTRSImageStore && resolvedMovieId) {
                try {
                    await window.MTRSImageStore.deleteBackdrop(resolvedMovieId);
                } catch (artErr) {
                    console.warn('[MTRS Admin] Artwork local backdrop removal warning:', artErr);
                }
            }

            // 10. Close Modal
            this.closeMovieModal();

            // 11. Reload authoritative catalogue from Supabase
            window.App.showToast(`Movie "${savedMovie.Movie_Name}" (${resolvedMovieId}) persisted to Supabase! Syncing catalogue...`, "info");
            await window.App.loadCinemaData();

            // 12. Refresh Dashboard and Admin Movies Table
            this.refreshDashboard();
            if (this.activeAdminTab === 'movies') this.renderMoviesTable();

            window.App.showToast(`✓ Movie "${savedMovie.Movie_Name}" (${resolvedMovieId}) & artwork live in central Supabase!`, "success");

        } catch (err) {
            console.error('[MTRS Admin] Unexpected exception saving movie:', err);

            // Clean up any uploaded storage files on unexpected exception
            const cleanupFailures = [];
            for (const f of newlyUploadedStorageFiles) {
                try {
                    const delRes = await window.MTRSSupabase.deleteArtworkFile(f);
                    if (!delRes || !delRes.success) cleanupFailures.push(f);
                } catch (e) {
                    cleanupFailures.push(f);
                }
            }

            let excMsg = `Unexpected error: ${err.message || 'Operation failed'}`;
            if (cleanupFailures.length > 0) {
                excMsg += ` Warning: Storage cleanup failed for orphaned file(s): ${cleanupFailures.join(', ')}. Please delete manually in Supabase Storage.`;
            }
            this.showModalError(excMsg);
            window.App.showToast(excMsg, "error");
        } finally {
            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.textContent = originalBtnText;
            }
        }
    }

    async deleteOrArchiveMovie(movieId) {
        const movies = (window.App && Array.isArray(window.App.movies) && window.App.movies.length > 0)
            ? window.App.movies
            : this.engine.getTable('MOVIE');
        const movie = movies.find(m => m.Movie_ID === movieId);
        if (!movie) return;

        const shows = (this.engine.getTable('SHOWS') || []).filter(s => s.Movie_ID === movieId);

        const promptText = shows.length > 0 ?
            `Movie "${movie.Movie_Name}" (${movieId}) has ${shows.length} scheduled show(s) and historical booking relations.\n\n` +
            `Deleting this movie would violate foreign key constraints in SHOWS, BOOKINGS, and PAYMENTS.\n\n` +
            `Safe Action: Would you like to Archive this movie in the central Supabase database? (It will be hidden from the public ticket booking catalogue while fully preserving past customer bookings).` :
            `Archive movie "${movie.Movie_Name}" (${movieId}) in the central Supabase database?\n\n` +
            `The movie status will be updated to "Archived" in Supabase public.movies.`;

        if (!confirm(promptText)) return;

        if (!window.MTRSSupabase || !window.MTRSSupabase.isConfigured) {
            window.App.showToast("Supabase client is not connected.", "error");
            return;
        }

        window.App.showToast(`Archiving movie "${movie.Movie_Name}" in Supabase...`, "info");

        const res = await window.MTRSSupabase.archiveMovie(movieId);
        if (!res || !res.success) {
            const errMsg = res?.error || "Failed to archive movie in Supabase.";
            console.error('[MTRS Admin] Archival failed:', res);
            let friendly = errMsg;
            if (res?.code === '42501' || errMsg.toLowerCase().includes('permission denied')) {
                friendly = `Supabase Permission Denied (RLS): Administrator authorization required to archive movies.`;
            }
            window.App.showToast(friendly, "error");
            return;
        }

        window.App.showToast(`✓ Movie "${movie.Movie_Name}" (${movieId}) archived successfully in Supabase!`, "success");
        await window.App.loadCinemaData();
        this.refreshDashboard();
        if (this.activeAdminTab === 'movies') this.renderMoviesTable();
    }

    // ========================================================================
    // FEATURE 4: THEATRE & SCREEN MANAGEMENT
    // ========================================================================
    renderTheatresTable() {
        const container = document.getElementById('admin-theatres-container');
        if (!container) return;

        const theaters = this.engine.getTable('THEATER');
        const screens = this.engine.getTable('SCREEN');
        const shows = this.engine.getTable('SHOWS');

        const q = (this.theatreSearchQuery || '').toLowerCase();
        const filtered = theaters.filter(t => 
            !q ||
            t.Theater_Name.toLowerCase().includes(q) ||
            t.City.toLowerCase().includes(q) ||
            t.State.toLowerCase().includes(q)
        );

        container.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 0.75rem;">
                <div>
                    <h4 style="color: var(--text-pure); font-size: 1.15rem;">🏛️ Cinema Multiplex Destinations &amp; Screens (${theaters.length})</h4>
                    <p style="color: var(--text-muted); font-size: 0.82rem;">Register cinema theatres, configure multi-auditorium screens, capacities, and formats.</p>
                </div>
                <div style="display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap;">
                    <input 
                        type="text" 
                        class="search-input" 
                        style="max-width: 240px; padding: 0.45rem 0.85rem; font-size: 0.82rem;" 
                        placeholder="Search theatres..." 
                        value="${this.theatreSearchQuery || ''}"
                        oninput="window.MTRSAdmin.filterTheatres(this.value)"
                    />
                    <button class="btn-primary" style="padding: 0.5rem 1rem; font-size: 0.85rem;" onclick="window.MTRSAdmin.openAddTheatreModal()">
                        + Add New Theatre
                    </button>
                </div>
            </div>

            <div class="theatres-management-list">
                ${filtered.length > 0 ? filtered.map(th => {
                    const thScreens = screens.filter(sc => sc.Theater_ID === th.Theater_ID);
                    const totalSeats = thScreens.reduce((sum, s) => sum + s.Capacity, 0);

                    return `
                        <div class="theatre-card-admin">
                            <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; flex-wrap: wrap; margin-bottom: 1rem;">
                                <div>
                                    <div style="display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;">
                                        <h3 style="font-family: var(--font-heading); font-size: 1.2rem; color: var(--text-pure);">${th.Theater_Name}</h3>
                                        <span style="color: var(--accent-cyan); font-family: var(--font-mono); font-size: 0.75rem; background: rgba(0, 229, 255, 0.1); padding: 2px 7px; border-radius: 4px;">${th.Theater_ID}</span>
                                    </div>
                                    <div style="color: var(--text-secondary); font-size: 0.85rem; margin-top: 0.25rem;">
                                        📍 ${th.City}, ${th.State} • Country: ${th.Country || 'India'}
                                    </div>
                                    <div style="display: flex; gap: 1rem; margin-top: 0.4rem; font-size: 0.78rem;">
                                        <span style="color: var(--accent-gold); font-weight: 700;">${thScreens.length} Auditoriums</span>
                                        <span style="color: var(--text-muted);">•</span>
                                        <span style="color: var(--accent-emerald); font-weight: 700;">${totalSeats} Total Seats</span>
                                    </div>
                                </div>

                                <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                                    <button class="btn-secondary" style="padding: 0.35rem 0.75rem; font-size: 0.78rem;" onclick="window.MTRSAdmin.openEditTheatreModal('${th.Theater_ID}')">
                                        Edit Theatre
                                    </button>
                                    <button class="btn-primary" style="padding: 0.35rem 0.75rem; font-size: 0.78rem; background: var(--accent-cyan); border-color: var(--accent-cyan); color: #000;" onclick="window.MTRSAdmin.openAddScreenModal('${th.Theater_ID}')">
                                        + Add Screen
                                    </button>
                                    <button class="btn-book-card" style="background: rgba(229, 9, 20, 0.2); border: 1px solid var(--primary); padding: 0.35rem 0.75rem; font-size: 0.78rem;" onclick="window.MTRSAdmin.deleteTheatre('${th.Theater_ID}')">
                                        Delete Theatre
                                    </button>
                                </div>
                            </div>

                            <!-- Screen Auditoriums Subcard List -->
                            <div style="border-top: 1px solid rgba(255, 255, 255, 0.08); padding-top: 0.85rem;">
                                <div style="font-size: 0.8rem; font-weight: 700; color: var(--text-pure); margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 0.5px;">
                                    Configured Screens (${thScreens.length}):
                                </div>

                                ${thScreens.length > 0 ? thScreens.map(sc => {
                                    const scShows = shows.filter(sh => sh.Screen_ID === sc.Screen_ID);

                                    return `
                                        <div class="screen-subcard">
                                            <div style="display: flex; align-items: center; gap: 1rem; flex-wrap: wrap;">
                                                <div style="font-weight: 800; color: var(--accent-cyan); font-family: var(--font-mono); font-size: 0.85rem;">
                                                    ${sc.Screen_ID}
                                                </div>
                                                <div>
                                                    <strong style="color: var(--text-pure); font-size: 0.9rem;">${sc.Screen_Name || `Screen ${sc.Screen_Number}`}</strong>
                                                    <span class="card-format-tag" style="margin-left: 0.5rem;">${sc.Screen_Type}</span>
                                                </div>
                                                <div style="font-size: 0.8rem; color: var(--accent-gold); font-weight: 700;">
                                                    ${sc.Capacity} Seats
                                                </div>
                                                <div style="font-size: 0.75rem; color: var(--text-muted);">
                                                    ${sc.Projection_Tech} • ${sc.Audio_Tech}
                                                </div>
                                                <div style="font-size: 0.72rem; color: var(--text-secondary);">
                                                    (${scShows.length} Scheduled Shows)
                                                </div>
                                            </div>

                                            <div style="display: flex; gap: 0.4rem;">
                                                <button class="btn-secondary" style="padding: 0.25rem 0.6rem; font-size: 0.75rem;" onclick="window.MTRSAdmin.openEditScreenModal('${sc.Screen_ID}')">
                                                    Edit Screen
                                                </button>
                                                <button class="btn-book-card" style="background: rgba(229, 9, 20, 0.15); border: 1px solid var(--primary); padding: 0.25rem 0.6rem; font-size: 0.75rem;" onclick="window.MTRSAdmin.deleteScreen('${sc.Screen_ID}')">
                                                    Remove
                                                </button>
                                            </div>
                                        </div>
                                    `;
                                }).join('') : `
                                    <div style="font-size: 0.82rem; color: var(--text-muted); padding: 0.75rem 0;">
                                        No screens added yet. Click "+ Add Screen" to configure the first auditorium.
                                    </div>
                                `}
                            </div>
                        </div>
                    `;
                }).join('') : `
                    <div style="text-align: center; padding: 3rem 1rem; color: var(--text-muted);">
                        No theatres matching "${this.theatreSearchQuery}".
                    </div>
                `}
            </div>
        `;
    }

    filterTheatres(query) {
        this.theatreSearchQuery = query;
        this.renderTheatresTable();
    }

    openAddTheatreModal() {
        document.getElementById('modal-theatre-id').value = '';
        document.getElementById('modal-theatre-name').value = '';
        document.getElementById('modal-theatre-city').value = 'Chennai';
        document.getElementById('modal-theatre-state').value = 'Tamil Nadu';
        document.getElementById('modal-theatre-country').value = 'India';
        document.getElementById('modal-theatre-heading').textContent = 'Add New Cinema Theatre';
        document.getElementById('theatre-modal').classList.add('active');
    }

    openEditTheatreModal(theatreId) {
        const theatre = this.engine.getTable('THEATER').find(t => t.Theater_ID === theatreId);
        if (!theatre) return;

        document.getElementById('modal-theatre-id').value = theatre.Theater_ID;
        document.getElementById('modal-theatre-name').value = theatre.Theater_Name;
        document.getElementById('modal-theatre-city').value = theatre.City;
        document.getElementById('modal-theatre-state').value = theatre.State;
        document.getElementById('modal-theatre-country').value = theatre.Country || 'India';
        document.getElementById('modal-theatre-heading').textContent = `Edit Theatre — ${theatre.Theater_Name} (${theatre.Theater_ID})`;
        document.getElementById('theatre-modal').classList.add('active');
    }

    saveTheatre() {
        const id = document.getElementById('modal-theatre-id').value;
        const name = document.getElementById('modal-theatre-name').value.trim();
        const city = document.getElementById('modal-theatre-city').value.trim();
        const state = document.getElementById('modal-theatre-state').value.trim();
        const country = document.getElementById('modal-theatre-country').value.trim() || 'India';

        if (!name || !city || !state) {
            window.App.showToast("Please provide valid Theatre Name, City, and State.", "error");
            return;
        }

        const theaters = this.engine.getTable('THEATER');

        if (id) {
            const existing = theaters.find(t => t.Theater_ID === id);
            if (existing) {
                existing.Theater_Name = name;
                existing.City = city;
                existing.State = state;
                existing.Country = country;
            }
        } else {
            const newId = this.engine.generateNextTheaterId();
            theaters.push({
                Theater_ID: newId,
                Theater_Name: name,
                City: city,
                State: state,
                Country: country
            });
        }

        this.engine.save();
        document.getElementById('theatre-modal').classList.remove('active');
        window.App.showToast(`Theatre "${name}" saved successfully.`, "success");

        this.refreshDashboard();
        if (this.activeAdminTab === 'theatres') this.renderTheatresTable();
    }

    deleteTheatre(theatreId) {
        const thScreens = this.engine.getTable('SCREEN').filter(s => s.Theater_ID === theatreId);
        const thScreenIds = new Set(thScreens.map(s => s.Screen_ID));
        const thShows = this.engine.getTable('SHOWS').filter(s => thScreenIds.has(s.Screen_ID));

        if (thShows.length > 0) {
            window.App.showToast(`Cannot delete theatre: ${thShows.length} scheduled show(s) exist across its screens. Remove shows first.`, "error");
            return;
        }

        const th = this.engine.getTable('THEATER').find(t => t.Theater_ID === theatreId);
        if (confirm(`Are you sure you want to delete theatre "${th ? th.Theater_Name : theatreId}" and its ${thScreens.length} auditorium screens?`)) {
            this.engine.db.THEATER = this.engine.db.THEATER.filter(t => t.Theater_ID !== theatreId);
            this.engine.db.SCREEN = this.engine.db.SCREEN.filter(s => s.Theater_ID !== theatreId);
            this.engine.save();
            window.App.showToast("Theatre and screens deleted successfully.", "success");
            this.refreshDashboard();
            if (this.activeAdminTab === 'theatres') this.renderTheatresTable();
        }
    }

    openAddScreenModal(theatreId) {
        document.getElementById('modal-screen-id').value = '';
        document.getElementById('modal-screen-theatre-id').value = theatreId;

        const screens = this.engine.getTable('SCREEN').filter(s => s.Theater_ID === theatreId);
        const nextNum = screens.length + 1;

        document.getElementById('modal-screen-number').value = nextNum;
        document.getElementById('modal-screen-name').value = `Screen ${nextNum}`;
        document.getElementById('modal-screen-type').value = 'Standard';
        document.getElementById('modal-screen-capacity').value = '250';
        document.getElementById('modal-screen-projection').value = '4K RGB Laser';
        document.getElementById('modal-screen-audio').value = 'Dolby Atmos';
        document.getElementById('modal-screen-heading').textContent = 'Configure New Auditorium Screen';
        document.getElementById('screen-modal').classList.add('active');
    }

    openEditScreenModal(screenId) {
        const screen = this.engine.getTable('SCREEN').find(s => s.Screen_ID === screenId);
        if (!screen) return;

        document.getElementById('modal-screen-id').value = screen.Screen_ID;
        document.getElementById('modal-screen-theatre-id').value = screen.Theater_ID;
        document.getElementById('modal-screen-number').value = screen.Screen_Number;
        document.getElementById('modal-screen-name').value = screen.Screen_Name || `Screen ${screen.Screen_Number}`;
        document.getElementById('modal-screen-type').value = screen.Screen_Type || 'Standard';
        document.getElementById('modal-screen-capacity').value = screen.Capacity;
        document.getElementById('modal-screen-projection').value = screen.Projection_Tech || '4K Laser';
        document.getElementById('modal-screen-audio').value = screen.Audio_Tech || 'Dolby Atmos';
        document.getElementById('modal-screen-heading').textContent = `Edit Auditorium — ${screen.Screen_Name || screenId}`;
        document.getElementById('screen-modal').classList.add('active');
    }

    saveScreen() {
        const screenId = document.getElementById('modal-screen-id').value;
        const theatreId = document.getElementById('modal-screen-theatre-id').value;
        const num = parseInt(document.getElementById('modal-screen-number').value, 10);
        const name = document.getElementById('modal-screen-name').value.trim();
        const type = document.getElementById('modal-screen-type').value;
        const cap = parseInt(document.getElementById('modal-screen-capacity').value, 10);
        const proj = document.getElementById('modal-screen-projection').value.trim();
        const audio = document.getElementById('modal-screen-audio').value.trim();

        if (isNaN(num) || num <= 0 || !name || isNaN(cap) || cap <= 0) {
            window.App.showToast("Please provide valid Screen Number, Name, and positive Capacity.", "error");
            return;
        }

        const screens = this.engine.getTable('SCREEN');

        if (screenId) {
            const existing = screens.find(s => s.Screen_ID === screenId);
            if (existing) {
                existing.Screen_Number = num;
                existing.Screen_Name = name;
                existing.Screen_Type = type;
                existing.Capacity = cap;
                existing.Projection_Tech = proj;
                existing.Audio_Tech = audio;
            }
        } else {
            const newScreenId = this.engine.generateNextScreenId();
            screens.push({
                Screen_ID: newScreenId,
                Theater_ID: theatreId,
                Screen_Number: num,
                Screen_Name: name,
                Screen_Type: type,
                Capacity: cap,
                Projection_Tech: proj,
                Audio_Tech: audio,
                Verification_Status: 'Verified'
            });
        }

        this.engine.save();
        document.getElementById('screen-modal').classList.remove('active');
        window.App.showToast(`Auditorium screen "${name}" saved successfully.`, "success");

        this.refreshDashboard();
        if (this.activeAdminTab === 'theatres') this.renderTheatresTable();
        if (this.activeAdminTab === 'screens') this.renderScreensTable();
    }

    deleteScreen(screenId) {
        const scShows = this.engine.getTable('SHOWS').filter(s => s.Screen_ID === screenId);
        if (scShows.length > 0) {
            window.App.showToast(`Cannot delete screen: ${scShows.length} scheduled show(s) exist for this auditorium. Delete shows first.`, "error");
            return;
        }

        const screen = this.engine.getTable('SCREEN').find(s => s.Screen_ID === screenId);
        if (confirm(`Delete auditorium screen "${screen ? screen.Screen_Name : screenId}"?`)) {
            this.engine.db.SCREEN = this.engine.db.SCREEN.filter(s => s.Screen_ID !== screenId);
            this.engine.save();
            window.App.showToast(`Auditorium screen ${screenId} removed.`, "success");
            this.refreshDashboard();
            if (this.activeAdminTab === 'theatres') this.renderTheatresTable();
            if (this.activeAdminTab === 'screens') this.renderScreensTable();
        }
    }

    // ------------------------------------------------------------------------
    // ------------------------------------------------------------------------
    // TAB 2: SCREEN CAPACITY & TELEMETRY MANAGER (49 Screens)
    // ------------------------------------------------------------------------
    async renderScreensTable() {
        const container = document.getElementById('admin-screens-table-container');
        if (!container) return;

        const screens = this.engine.getTable('SCREEN');
        const theaters = this.engine.getTable('THEATER');
        const localSeats = this.engine.getTable('SEAT');

        // Fetch live physical seats from Supabase if online
        let dbCounts = this.livePhysicalSeatCounts || null;
        if (!dbCounts && window.MTRSSupabase && typeof window.MTRSSupabase.fetchPhysicalSeatCounts === 'function') {
            try {
                const res = await window.MTRSSupabase.fetchPhysicalSeatCounts();
                if (res && res.success) {
                    dbCounts = res.counts;
                    this.livePhysicalSeatCounts = res.counts;
                }
            } catch (e) {
                console.warn('[MTRS Admin] Could not fetch live DB seat counts:', e);
            }
        }

        const totalCapacity = screens.reduce((sum, s) => sum + (parseInt(s.Capacity, 10) || 0), 0);
        let totalLiveSeats = 0;
        screens.forEach(s => {
            const live = (dbCounts && dbCounts[s.Screen_ID] !== undefined)
                ? dbCounts[s.Screen_ID]
                : (parseInt(s.Capacity, 10) || 0);
            totalLiveSeats += live;
        });

        container.innerHTML = `
            <div style="margin-bottom: 1.25rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
                <div>
                    <h4 style="color: var(--text-pure); font-size: 1.1rem;">Auditorium Telemetry &amp; Seating Capacities (${screens.length} Screens)</h4>
                    <p style="color: var(--text-muted); font-size: 0.85rem;">Authoritative source of truth for screen capacity, physical database seat inventory, and row/column geometry.</p>
                </div>
                <button class="btn-secondary" style="font-size: 0.8rem; padding: 0.35rem 0.8rem;" onclick="window.MTRSAdmin.refreshLiveSeatCounts()">
                    🔄 Refresh Database Inventory
                </button>
            </div>

            <!-- Seating Telemetry KPI Summary -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
                <div style="background: var(--bg-surface-elevated); border: 1px solid var(--glass-border); border-radius: var(--radius-md); padding: 1.15rem;">
                    <div style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-muted); font-weight: 700; letter-spacing: 0.5px;">Auditoriums Configured</div>
                    <div style="font-family: var(--font-heading); font-size: 1.6rem; font-weight: 800; color: var(--accent-cyan); margin-top: 0.35rem;">${screens.length} Screens</div>
                    <div style="font-size: 0.78rem; color: var(--text-secondary); margin-top: 0.25rem;">Across 6 Chennai destinations</div>
                </div>
                <div style="background: var(--bg-surface-elevated); border: 1px solid var(--glass-border); border-radius: var(--radius-md); padding: 1.15rem;">
                    <div style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-muted); font-weight: 700; letter-spacing: 0.5px;">Configured Screen Capacity</div>
                    <div style="font-family: var(--font-heading); font-size: 1.6rem; font-weight: 800; color: var(--accent-gold); margin-top: 0.35rem;">${totalCapacity.toLocaleString()} Seats</div>
                    <div style="font-size: 0.78rem; color: var(--text-secondary); margin-top: 0.25rem;">Total physical cinema design limit</div>
                </div>
                <div style="background: var(--bg-surface-elevated); border: 1px solid var(--glass-border); border-radius: var(--radius-md); padding: 1.15rem;">
                    <div style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-muted); font-weight: 700; letter-spacing: 0.5px;">Physical Seats in Database</div>
                    <div style="font-family: var(--font-heading); font-size: 1.6rem; font-weight: 800; color: ${totalLiveSeats >= totalCapacity ? 'var(--accent-emerald)' : 'var(--accent-gold)'}; margin-top: 0.35rem;">${totalLiveSeats.toLocaleString()} Seats</div>
                    <div style="font-size: 0.78rem; color: ${totalLiveSeats >= totalCapacity ? 'var(--accent-emerald)' : 'var(--accent-gold)'}; margin-top: 0.25rem;">
                        ${totalLiveSeats >= totalCapacity ? '✓ 100% Synchronized with Supabase' : 'Partial Synchronization'}
                    </div>
                </div>
            </div>

            <table class="data-table">
                <thead>
                    <tr>
                        <th>Screen ID</th>
                        <th>Theater Destination</th>
                        <th>Auditorium Name</th>
                        <th>Format Type</th>
                        <th>Configured Capacity</th>
                        <th>Configured Layout</th>
                        <th>Physical Seats (DB)</th>
                        <th>Inventory Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${screens.map(screen => {
                        const theater = theaters.find(t => t.Theater_ID === screen.Theater_ID) || {};
                        const cap = parseInt(screen.Capacity, 10) || 0;
                        const layout = (typeof window.calculateScreenLayout === 'function') 
                            ? window.calculateScreenLayout(cap)
                            : { numRows: Math.ceil(cap / 14), colsPerRow: 14, aisleCol: 7 };

                        const liveCount = (dbCounts && dbCounts[screen.Screen_ID] !== undefined) 
                            ? dbCounts[screen.Screen_ID] 
                            : localSeats.filter(s => s.Screen_ID === screen.Screen_ID).length;

                        let statusBadge = '';
                        if (liveCount >= cap && cap > 0) {
                            statusBadge = `<span class="status-badge synchronized" style="font-size: 0.75rem; padding: 2px 6px; border-radius: 4px; font-weight: 700; background: rgba(16, 185, 129, 0.15); color: var(--accent-emerald);">Synchronized (${liveCount}/${cap})</span>`;
                        } else if (liveCount > 0) {
                            statusBadge = `<span class="status-badge mismatch warning" style="font-size: 0.75rem; padding: 2px 6px; border-radius: 4px; font-weight: 700; background: rgba(255, 184, 0, 0.15); color: var(--accent-gold);">MISMATCH: Partial (${liveCount}/${cap})</span>`;
                        } else {
                            statusBadge = `<span class="status-badge mismatch danger" style="font-size: 0.75rem; padding: 2px 6px; border-radius: 4px; font-weight: 700; background: rgba(239, 68, 68, 0.15); color: var(--accent-rose);">MISMATCH: 0 Seats in DB</span>`;
                        }

                        return `
                            <tr>
                                <td><strong style="color: var(--accent-cyan);">${screen.Screen_ID}</strong></td>
                                <td style="color: var(--text-pure);">${theater.Theater_Name || screen.Theater_ID}</td>
                                <td style="font-weight: 700; color: var(--text-pure);">${screen.Screen_Name || `Screen ${screen.Screen_Number}`}</td>
                                <td><span class="card-format-tag">${screen.Screen_Type}</span></td>
                                <td style="font-weight: 700; color: var(--accent-gold);">${cap} Seats</td>
                                <td style="font-size: 0.82rem; color: var(--text-secondary);">${layout.numRows} Rows × ${layout.colsPerRow} Cols <span style="font-size: 0.75rem; opacity: 0.7;">(Aisle @ ${layout.aisleCol})</span></td>
                                <td style="font-weight: 700; color: ${liveCount >= cap ? 'var(--accent-emerald)' : 'var(--accent-gold)'};">${liveCount} Seats</td>
                                <td>${statusBadge}</td>
                                <td>
                                    <button class="btn-secondary" style="padding: 0.25rem 0.6rem; font-size: 0.75rem;" onclick="window.MTRSAdmin.editScreenDetails('${screen.Screen_ID}')">
                                        Edit Capacity
                                    </button>
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;
    }

    async editScreenDetails(screenId) {
        const screen = this.engine.getTable('SCREEN').find(s => s.Screen_ID === screenId);
        if (!screen) return;

        const newCap = prompt(`Update Capacity for ${screen.Screen_Name || screenId} (Currently ${screen.Capacity} Seats):`, screen.Capacity);
        if (newCap !== null) {
            const parsed = parseInt(newCap, 10);
            if (isNaN(parsed) || parsed <= 0) {
                window.App.showToast("CHECK Constraint Error: Capacity must be strictly greater than 0.", "error");
                return;
            }
            screen.Capacity = parsed;
            
            // Persist to live Supabase database
            if (window.MTRSSupabase && typeof window.MTRSSupabase.updateScreenCapacity === 'function') {
                const res = await window.MTRSSupabase.updateScreenCapacity(screenId, parsed);
                if (res && res.success) {
                    console.log(`[MTRS Admin] Persisted new capacity ${parsed} for ${screenId} to Supabase.`);
                }
            }

            // Regenerate local physical seats to match new capacity
            if (typeof window.generateAuditoriumSeats === 'function') {
                const updatedSeats = window.generateAuditoriumSeats(screen, window.SEED_DATA ? window.SEED_DATA.BASE_PRESEEDED_SEATS : []);
                this.engine.db.SEAT = this.engine.db.SEAT.filter(s => s.Screen_ID !== screenId).concat(updatedSeats);
            }

            this.engine.save();
            if (window.App && Array.isArray(window.App.screens)) {
                const appScreen = window.App.screens.find(s => s.Screen_ID === screenId);
                if (appScreen) appScreen.Capacity = parsed;
            }

            const layout = (typeof window.calculateScreenLayout === 'function') ? window.calculateScreenLayout(parsed) : null;
            const layoutInfo = layout ? ` (${layout.numRows} Rows × ${layout.colsPerRow} Cols)` : '';
            window.App.showToast(`Capacity for ${screenId} updated to ${parsed}${layoutInfo}. Persisted to database & admin state.`, "success");
            
            // Invalidate live count cache and re-render
            this.livePhysicalSeatCounts = null;
            await this.renderScreensTable();
            this.refreshDashboard();
        }
    }

    async refreshLiveSeatCounts() {
        this.livePhysicalSeatCounts = null;
        if (window.App) window.App.showToast("Fetching live physical seat counts from Supabase...", "info");
        await this.renderScreensTable();
        if (window.App) window.App.showToast("Database seating inventory telemetry updated.", "success");
    }

    // ------------------------------------------------------------------------
    // TAB 3: REVENUE & OCCUPANCY REPORTS (Stored Procedure sp_GetShowRevenueReport)
    // ------------------------------------------------------------------------
    renderRevenueReport() {
        const container = document.getElementById('admin-revenue-table-container');
        if (!container) return;

        // Invoke Stored Procedure: sp_GetShowRevenueReport
        const reports = this.engine.sp_GetShowRevenueReport();

        container.innerHTML = `
            <div style="margin-bottom: 1.25rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
                <div>
                    <h4 style="color: var(--text-pure); font-size: 1.1rem;">Financial &amp; Occupancy Performance Report</h4>
                    <p style="color: var(--text-muted); font-size: 0.85rem;">Generated live via Stored Procedure: <code>sp_GetShowRevenueReport()</code></p>
                </div>
            </div>

            <table class="data-table">
                <thead>
                    <tr>
                        <th>Show ID</th>
                        <th>Movie Title</th>
                        <th>Theater</th>
                        <th>Auditorium</th>
                        <th>Format</th>
                        <th>Booked / Cap</th>
                        <th>Occupancy</th>
                        <th>Total Revenue</th>
                    </tr>
                </thead>
                <tbody>
                    ${reports.map(r => `
                        <tr>
                            <td><strong style="color: var(--accent-cyan);">${r.Show_ID}</strong></td>
                            <td style="color: var(--text-pure); font-weight: 600;">${r.Movie_Name}</td>
                            <td>${r.Theater_Name}</td>
                            <td><strong style="color: var(--text-pure);">${r.Screen_Name}</strong> (${r.Screen_Type})</td>
                            <td><span class="card-format-tag">${r.Format}</span></td>
                            <td>${r.Seats_Booked} / ${r.Total_Capacity}</td>
                            <td style="color: ${parseFloat(r.Occupancy_Rate) > 0 ? 'var(--accent-emerald)' : 'var(--text-muted)'}; font-weight: 700;">
                                ${r.Occupancy_Rate}
                            </td>
                            <td style="color: var(--accent-gold); font-weight: 800; font-size: 0.95rem;">
                                ${r.Total_Revenue}
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    // ------------------------------------------------------------------------
    // TAB 4: RELATIONAL DATABASE INSPECTOR (9 Relations Browser)
    // ------------------------------------------------------------------------
    renderRelationalInspector() {
        const container = document.getElementById('admin-relations-container');
        if (!container) return;

        const tableNames = ['THEATER', 'SCREEN', 'MOVIE', 'SHOWS', 'SEAT', 'CUSTOMER', 'BOOKING', 'BOOKED_SEAT', 'PAYMENT'];

        container.innerHTML = `
            <div style="margin-bottom: 1.5rem;">
                <h4 style="color: var(--text-pure); font-size: 1.2rem;">Relational Database Schema Inspector (9 BCNF Tables)</h4>
                <p style="color: var(--text-muted); font-size: 0.88rem;">Inspect live rows, foreign key mappings, and table states for the Chennai dataset.</p>
            </div>

            <div style="display: flex; gap: 0.5rem; overflow-x: auto; padding-bottom: 0.75rem; margin-bottom: 1.5rem;">
                ${tableNames.map((tbl, i) => `
                    <button class="filter-chip ${i === 0 ? 'active' : ''}" onclick="window.MTRSAdmin.inspectTable('${tbl}', this)">
                        ${tbl} (${this.engine.getTable(tbl).length})
                    </button>
                `).join('')}
            </div>

            <div id="relation-data-view" class="data-table-container"></div>
        `;

        this.inspectTable('THEATER');
    }

    inspectTable(tableName, chipEl) {
        if (chipEl) {
            chipEl.parentElement.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
            chipEl.classList.add('active');
        }

        const view = document.getElementById('relation-data-view');
        if (!view) return;

        const rows = this.engine.getTable(tableName);
        if (rows.length === 0) {
            view.innerHTML = `<div style="padding: 2rem; text-align: center; color: var(--text-muted);">No records currently exist in ${tableName}.</div>`;
            return;
        }

        const headers = Object.keys(rows[0]);

        view.innerHTML = `
            <div style="padding: 0.75rem 1.25rem; background: var(--bg-surface-elevated); border-bottom: var(--glass-border); font-size: 0.82rem; color: var(--accent-cyan); font-weight: 700;">
                RELATION: ${tableName} • Total Records: ${rows.length}
            </div>
            <table class="data-table">
                <thead>
                    <tr>
                        ${headers.map(h => `<th>${h}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${rows.map(row => `
                        <tr>
                            ${headers.map(h => {
                                let val = row[h];
                                if (typeof val === 'number') val = val.toString();
                                return `<td>${val || '-'}</td>`;
                            }).join('')}
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    // ------------------------------------------------------------------------
    // ACADEMIC SQL QUERY SANDBOX (18 DA2 Queries)
    // ------------------------------------------------------------------------
    initQuerySandbox() {
        const select = document.getElementById('academic-query-dropdown');
        if (!select || !window.ACADEMIC_QUERIES) return;

        select.innerHTML = window.ACADEMIC_QUERIES.map(q => `
            <option value="${q.id}">Query ${q.id}: ${q.title.replace(/^Q\d+:\s*/, '')}</option>
        `).join('');

        select.onchange = (e) => {
            this.selectedQueryId = parseInt(e.target.value, 10);
            this.displayQueryDetails();
        };

        this.displayQueryDetails();
    }

    displayQueryDetails() {
        const query = window.ACADEMIC_QUERIES.find(q => q.id === this.selectedQueryId);
        if (!query) return;

        const titleEl = document.getElementById('sandbox-query-title');
        const conceptEl = document.getElementById('sandbox-query-concept');
        const descEl = document.getElementById('sandbox-query-desc');
        const codeEl = document.getElementById('sandbox-sql-code');

        if (titleEl) titleEl.textContent = query.title;
        if (conceptEl) conceptEl.textContent = `Concept: ${query.concept}`;
        if (descEl) descEl.textContent = query.description;
        if (codeEl) codeEl.textContent = query.sql;

        // Auto execute on select for seamless demo
        this.runSelectedQuery();
    }

    runSelectedQuery() {
        const query = window.ACADEMIC_QUERIES.find(q => q.id === this.selectedQueryId);
        if (!query) return;

        const resultsContainer = document.getElementById('sandbox-query-results');
        if (!resultsContainer) return;

        try {
            const out = this.engine.runAcademicQuery(this.selectedQueryId);

            resultsContainer.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                    <div style="font-size: 0.85rem; color: var(--accent-emerald); font-weight: 700;">
                        ✓ Executed in ${out.executionTimeMs} ms • Returned ${out.rowCount} Row(s)
                    </div>
                    <button class="btn-secondary" style="padding: 0.35rem 0.75rem; font-size: 0.75rem;" onclick="navigator.clipboard.writeText(document.getElementById('sandbox-sql-code').textContent); window.App.showToast('SQL query copied to clipboard!', 'info');">
                        Copy SQL
                    </button>
                </div>

                <div class="data-table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                ${out.columns.map(c => `<th>${c}</th>`).join('')}
                            </tr>
                        </thead>
                        <tbody>
                            ${out.rows.length > 0 ? out.rows.map(row => `
                                <tr>
                                    ${row.map(cell => `<td>${cell !== null && cell !== undefined ? cell : 'NULL'}</td>`).join('')}
                                </tr>
                            `).join('') : `
                                <tr>
                                    <td colspan="${out.columns.length}" style="text-align: center; padding: 2rem; color: var(--text-muted);">
                                        Empty set (0 matching records found).
                                    </td>
                                </tr>
                            `}
                        </tbody>
                    </table>
                </div>
            `;
        } catch (error) {
            resultsContainer.innerHTML = `
                <div style="background: rgba(229, 9, 20, 0.1); border: 1px solid var(--primary); padding: 1.5rem; border-radius: var(--radius-md); color: #fff;">
                    <strong>Execution Error:</strong> ${error.message}
                </div>
            `;
        }
    }
}

// Instantiate globally
window.MTRSAdmin = new MTRSAdminPanel();
