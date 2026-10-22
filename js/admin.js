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

    // ------------------------------------------------------------------------
    // DASHBOARD KPI METRICS
    // ------------------------------------------------------------------------
    refreshDashboard() {
        const bookings = this.engine.getTable('BOOKING');
        const payments = this.engine.getTable('PAYMENT');
        const movies = this.engine.getTable('MOVIE');
        const shows = this.engine.getTable('SHOWS');
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

        if (revEl) revEl.textContent = `₹${totalRev.toFixed(2)}`;
        if (bkEl) bkEl.textContent = bookings.length;
        if (mvEl) mvEl.textContent = movies.length;
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
    // TAB 1: SHOW SCHEDULE MANAGER
    // ------------------------------------------------------------------------
    renderShowsTable() {
        const container = document.getElementById('admin-shows-table-container');
        if (!container) return;

        const shows = this.engine.getTable('SHOWS');
        const movies = this.engine.getTable('MOVIE');
        const screens = this.engine.getTable('SCREEN');
        const theaters = this.engine.getTable('THEATER');

        container.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 0.75rem;">
                <div>
                    <h4 style="color: var(--text-pure); font-size: 1.1rem;">Scheduled Movie Shows (${shows.length})</h4>
                <div style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
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
                        <th>Theater Destination</th>
                        <th>Auditorium</th>
                        <th>Date & Time</th>
                        <th>Format</th>
                        <th>Ticket Price</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${shows.map(show => {
                        const movie = movies.find(m => m.Movie_ID === show.Movie_ID) || {};
                        const screen = screens.find(s => s.Screen_ID === show.Screen_ID) || {};
                        const theater = theaters.find(t => t.Theater_ID === screen.Theater_ID) || {};

                        return `
                            <tr>
                                <td><strong style="color: var(--accent-cyan);">${show.Show_ID}</strong></td>
                                <td style="color: var(--text-pure); font-weight: 600;">${movie.Movie_Name || show.Movie_ID}</td>
                                <td>${theater.Theater_Name || ''}</td>
                                <td><span style="color: var(--accent-gold); font-weight: 600;">${screen.Screen_Name || `Screen ${screen.Screen_Number}`}</span> (${screen.Audio_Tech || '7.1'})</td>
                                <td>${show.Show_Date} at ${window.MTRSUtil ? window.MTRSUtil.formatShowtimeRange(show.Show_Time, movie.Duration) : show.Show_Time.substring(0, 5)}</td>
                                <td><span class="card-format-tag">${show.Format}</span></td>
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

        const movies = this.engine.getTable('MOVIE');
        const shows = this.engine.getTable('SHOWS');

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
                                        <div style="display: flex; gap: 0.4rem;">
                                            <button class="btn-secondary" style="padding: 0.25rem 0.6rem; font-size: 0.75rem;" onclick="window.MTRSAdmin.openEditMovieModal('${m.Movie_ID}')">
                                                Edit Movie
                                            </button>
                                            <button class="btn-book-card" style="background: rgba(229, 9, 20, 0.2); border: 1px solid var(--primary); padding: 0.25rem 0.6rem; font-size: 0.75rem;" onclick="window.MTRSAdmin.deleteOrArchiveMovie('${m.Movie_ID}')">
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

    openAddMovieModal() {
        this.currentEditMovieId = null;
        this.pendingPosterBlob = null;
        this.removeCustomPosterRequested = false;

        document.getElementById('modal-movie-id').value = '';
        document.getElementById('modal-movie-name').value = '';
        document.getElementById('modal-movie-genre').value = '';
        document.getElementById('modal-movie-duration').value = '150';
        document.getElementById('modal-movie-language').value = 'Tamil, English';
        document.getElementById('modal-movie-rating').value = '8.5';
        document.getElementById('modal-movie-cast').value = '';
        document.getElementById('modal-movie-status').value = 'Active';
        document.getElementById('modal-movie-synopsis').value = '';
        document.getElementById('modal-movie-poster-url').value = '';
        document.getElementById('modal-poster-file-input').value = '';
        document.getElementById('modal-poster-error-msg').style.display = 'none';

        const previewImg = document.getElementById('modal-poster-preview-img');
        const previewPlaceholder = document.getElementById('modal-poster-preview-placeholder');
        previewImg.src = '';
        previewImg.style.display = 'none';
        previewPlaceholder.style.display = 'block';
        previewPlaceholder.textContent = 'No Poster Selected';

        document.getElementById('modal-movie-title-heading').textContent = 'Add New Theatrical Movie';
        document.getElementById('movie-modal').classList.add('active');
    }

    openEditMovieModal(movieId) {
        const movie = this.engine.getTable('MOVIE').find(m => m.Movie_ID === movieId);
        if (!movie) return;

        this.currentEditMovieId = movieId;
        this.pendingPosterBlob = null;
        this.removeCustomPosterRequested = false;

        document.getElementById('modal-movie-id').value = movie.Movie_ID;
        document.getElementById('modal-movie-name').value = movie.Movie_Name || '';
        document.getElementById('modal-movie-genre').value = movie.Genre || '';
        document.getElementById('modal-movie-duration').value = movie.Duration || 120;
        document.getElementById('modal-movie-language').value = movie.Language || '';
        document.getElementById('modal-movie-rating').value = movie.Rating || 8.0;
        document.getElementById('modal-movie-cast').value = movie.Cast || '';
        document.getElementById('modal-movie-status').value = movie.Status || 'Active';
        document.getElementById('modal-movie-synopsis').value = movie.Synopsis || '';
        document.getElementById('modal-movie-poster-url').value = movie.Poster_Url || '';
        document.getElementById('modal-poster-file-input').value = '';
        document.getElementById('modal-poster-error-msg').style.display = 'none';

        const previewImg = document.getElementById('modal-poster-preview-img');
        const previewPlaceholder = document.getElementById('modal-poster-preview-placeholder');

        const resolvedPoster = window.MTRSPosters ? window.MTRSPosters.resolvePoster(movie) : null;
        if (resolvedPoster) {
            previewImg.src = resolvedPoster;
            previewImg.style.display = 'block';
            previewPlaceholder.style.display = 'none';
        } else {
            previewImg.src = '';
            previewImg.style.display = 'none';
            previewPlaceholder.style.display = 'block';
            previewPlaceholder.textContent = 'Registry Vector SVG Fallback Active';
        }

        document.getElementById('modal-movie-title-heading').textContent = `Edit Movie — ${movie.Movie_Name} (${movie.Movie_ID})`;
        document.getElementById('movie-modal').classList.add('active');
    }

    closeMovieModal() {
        document.getElementById('movie-modal').classList.remove('active');
        this.pendingPosterBlob = null;
        this.currentEditMovieId = null;
    }

    handlePosterFileSelected(input) {
        const file = input.files && input.files[0];
        if (!file) return;

        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        const errorEl = document.getElementById('modal-poster-error-msg');

        if (!validTypes.includes(file.type.toLowerCase())) {
            errorEl.textContent = "Unsupported format. Only JPEG, JPG, PNG, and WebP images are allowed.";
            errorEl.style.display = 'block';
            input.value = '';
            return;
        }

        if (file.size > 35 * 1024 * 1024) {
            errorEl.textContent = `File size is ${(file.size / (1024 * 1024)).toFixed(2)}MB, exceeding the 35MB limit.`;
            errorEl.style.display = 'block';
            input.value = '';
            return;
        }

        errorEl.style.display = 'none';
        this.pendingPosterBlob = file;
        this.removeCustomPosterRequested = false;

        const objUrl = URL.createObjectURL(file);
        const previewImg = document.getElementById('modal-poster-preview-img');
        const previewPlaceholder = document.getElementById('modal-poster-preview-placeholder');

        previewImg.src = objUrl;
        previewImg.style.display = 'block';
        previewPlaceholder.style.display = 'none';

        window.App.showToast("Poster preview loaded from local computer. Click 'Save Movie & Poster' to persist.", "info");
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
            previewImg.src = trimmed;
            previewImg.style.display = 'block';
            previewPlaceholder.style.display = 'none';
        } else if (!this.pendingPosterBlob) {
            previewImg.style.display = 'none';
            previewPlaceholder.style.display = 'block';
        }
    }

    removeCustomPoster() {
        this.pendingPosterBlob = null;
        this.removeCustomPosterRequested = true;
        document.getElementById('modal-movie-poster-url').value = '';
        document.getElementById('modal-poster-file-input').value = '';

        const previewImg = document.getElementById('modal-poster-preview-img');
        const previewPlaceholder = document.getElementById('modal-poster-preview-placeholder');
        previewImg.src = '';
        previewImg.style.display = 'none';
        previewPlaceholder.style.display = 'block';
        previewPlaceholder.textContent = 'Poster marked for removal. Fallback artwork will be used.';

        window.App.showToast("Custom poster marked for removal. Click Save to apply.", "info");
    }

    async saveMovie() {
        const name = document.getElementById('modal-movie-name').value.trim();
        const genre = document.getElementById('modal-movie-genre').value.trim();
        const duration = parseInt(document.getElementById('modal-movie-duration').value, 10);
        const language = document.getElementById('modal-movie-language').value.trim();
        const rating = parseFloat(document.getElementById('modal-movie-rating').value) || 8.0;
        const cast = document.getElementById('modal-movie-cast').value.trim();
        const status = document.getElementById('modal-movie-status').value;
        const synopsis = document.getElementById('modal-movie-synopsis').value.trim();
        const posterUrl = document.getElementById('modal-movie-poster-url').value.trim();

        if (!name || !genre || isNaN(duration) || duration <= 0 || !language) {
            window.App.showToast("Please fill in valid Movie Title, Genre, Duration, and Language.", "error");
            return;
        }

        const movies = this.engine.getTable('MOVIE');
        let targetMovieId = this.currentEditMovieId;

        if (targetMovieId) {
            // Update existing movie record preserving primary key Movie_ID
            const existing = movies.find(m => m.Movie_ID === targetMovieId);
            if (existing) {
                existing.Movie_Name = name;
                existing.Genre = genre;
                existing.Duration = duration;
                existing.Language = language;
                existing.Rating = rating;
                existing.Cast = cast;
                existing.Status = status;
                existing.Synopsis = synopsis;

                if (this.removeCustomPosterRequested) {
                    existing.Poster_Url = '';
                } else if (posterUrl) {
                    existing.Poster_Url = posterUrl;
                }
            }
        } else {
            // Register new movie with guaranteed unique ID
            targetMovieId = this.engine.generateNextMovieId();
            movies.push({
                Movie_ID: targetMovieId,
                Movie_Name: name,
                Genre: genre,
                Duration: duration,
                Language: language,
                Rating: rating,
                Cast: cast,
                Status: status,
                Synopsis: synopsis,
                Poster_Url: this.removeCustomPosterRequested ? '' : posterUrl
            });
        }

        // Handle persistent IndexedDB image storage for uploaded files
        if (this.pendingPosterBlob && window.MTRSImageStore) {
            try {
                await window.MTRSImageStore.savePoster(targetMovieId, this.pendingPosterBlob);
            } catch (err) {
                console.error("Failed to save poster to IndexedDB:", err);
            }
        } else if (this.removeCustomPosterRequested && window.MTRSImageStore) {
            await window.MTRSImageStore.deletePoster(targetMovieId);
        }

        this.engine.save();
        this.closeMovieModal();
        window.App.showToast(`Movie "${name}" (${targetMovieId}) saved successfully.`, "success");

        this.refreshDashboard();
        if (this.activeAdminTab === 'movies') this.renderMoviesTable();

        // Immediately update customer-facing catalogue and hero banner
        if (window.App) {
            window.App.renderMovieGrid();
            window.App.renderHeroBanner();
        }
    }

    deleteOrArchiveMovie(movieId) {
        const movie = this.engine.getTable('MOVIE').find(m => m.Movie_ID === movieId);
        if (!movie) return;

        const shows = this.engine.getTable('SHOWS').filter(s => s.Movie_ID === movieId);

        if (shows.length > 0) {
            const proceedArchive = confirm(
                `Movie "${movie.Movie_Name}" (${movieId}) has ${shows.length} scheduled show(s) and historical booking relations.\n\n` +
                `Deleting this movie would break foreign keys in SHOWS, BOOKING, and PAYMENT tables.\n\n` +
                `Safe action: Would you like to Archive this movie instead (mark as Inactive)?`
            );
            if (proceedArchive) {
                movie.Status = 'Archived';
                this.engine.save();
                window.App.showToast(`Movie "${movie.Movie_Name}" archived safely.`, "info");
                this.refreshDashboard();
                if (this.activeAdminTab === 'movies') this.renderMoviesTable();
                if (window.App) window.App.renderMovieGrid();
            }
            return;
        }

        if (confirm(`Permanently delete movie "${movie.Movie_Name}" (${movieId})? This action cannot be undone.`)) {
            this.engine.db.MOVIE = this.engine.db.MOVIE.filter(m => m.Movie_ID !== movieId);
            if (window.MTRSImageStore) {
                window.MTRSImageStore.deletePoster(movieId);
            }
            this.engine.save();
            window.App.showToast(`Movie "${movie.Movie_Name}" deleted.`, "success");
            this.refreshDashboard();
            if (this.activeAdminTab === 'movies') this.renderMoviesTable();
            if (window.App) window.App.renderMovieGrid();
        }
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
    // TAB 2: SCREEN CAPACITY & TELEMETRY MANAGER (49 Screens)
    // ------------------------------------------------------------------------
    renderScreensTable() {
        const container = document.getElementById('admin-screens-table-container');
        if (!container) return;

        const screens = this.engine.getTable('SCREEN');
        const theaters = this.engine.getTable('THEATER');

        container.innerHTML = `
            <div style="margin-bottom: 1.25rem;">
                <h4 style="color: var(--text-pure); font-size: 1.1rem;">Auditorium Telemetry & Seating Capacities (${screens.length} Screens)</h4>
                <p style="color: var(--text-muted); font-size: 0.85rem;">Includes Projection, Sound telemetry, and Research Verification status from <code>chennai_cinema_sources.md</code>.</p>
            </div>

            <table class="data-table">
                <thead>
                    <tr>
                        <th>Screen ID</th>
                        <th>Theater Destination</th>
                        <th>Auditorium Name</th>
                        <th>Format Type</th>
                        <th>Capacity</th>
                        <th>Projection</th>
                        <th>Sound System</th>
                        <th>Verification Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${screens.map(screen => {
                        const theater = theaters.find(t => t.Theater_ID === screen.Theater_ID) || {};
                        const isVerified = screen.Verification_Status === 'Verified';

                        return `
                            <tr>
                                <td><strong style="color: var(--accent-cyan);">${screen.Screen_ID}</strong></td>
                                <td style="color: var(--text-pure);">${theater.Theater_Name || screen.Theater_ID}</td>
                                <td style="font-weight: 700; color: var(--text-pure);">${screen.Screen_Name || `Screen ${screen.Screen_Number}`}</td>
                                <td><span class="card-format-tag">${screen.Screen_Type}</span></td>
                                <td style="font-weight: 700; color: var(--accent-gold);">${screen.Capacity} Seats</td>
                                <td style="font-size: 0.8rem;">${screen.Projection_Tech}</td>
                                <td style="font-size: 0.8rem;">${screen.Audio_Tech}</td>
                                <td>
                                    <span style="font-size: 0.75rem; padding: 2px 6px; border-radius: 4px; font-weight: 700; background: ${isVerified ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 184, 0, 0.15)'}; color: ${isVerified ? 'var(--accent-emerald)' : 'var(--accent-gold)'};">
                                        ${screen.Verification_Status}
                                    </span>
                                </td>
                                <td>
                                    <button class="btn-secondary" style="padding: 0.25rem 0.6rem; font-size: 0.75rem;" onclick="window.MTRSAdmin.editScreenDetails('${screen.Screen_ID}')">
                                        Edit Tech/Cap
                                    </button>
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;
    }

    editScreenDetails(screenId) {
        const screen = this.engine.getTable('SCREEN').find(s => s.Screen_ID === screenId);
        if (!screen) return;

        const newCap = prompt(`Update Capacity for ${screen.Screen_Name || screenId} (Currently ${screen.Capacity}):`, screen.Capacity);
        if (newCap !== null) {
            const parsed = parseInt(newCap, 10);
            if (isNaN(parsed) || parsed <= 0) {
                window.App.showToast("CHECK Constraint Error: Capacity must be strictly greater than 0.", "error");
                return;
            }
            screen.Capacity = parsed;
            this.engine.save();
            window.App.showToast(`Capacity for ${screenId} updated to ${parsed}.`, "success");
            this.renderScreensTable();
            this.refreshDashboard();
        }
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
