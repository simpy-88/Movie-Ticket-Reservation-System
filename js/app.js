// ============================================================================
// MOVIE TICKET RESERVATION SYSTEM (MTRS)
// File: js/app.js
// Description: Core application logic, routing, movie browser, showtime picker,
//              interactive seat selection, and atomic checkout transaction flow.
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

        this.init();
    }

    init() {
        // Default customer: CU01 Rahul Sharma
        const customers = this.engine.getTable('CUSTOMER');
        this.currentCustomer = customers[0] || { Customer_ID: 'CU01', Customer_Name: 'Rahul Sharma', Email: 'rahul.s@example.com' };

        this.setupEventListeners();
        this.renderNavbarUser();
        this.renderHeroBanner();
        this.renderMovieGrid();
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

        // User Switcher Click
        const userPill = document.getElementById('user-profile-pill');
        if (userPill) {
            userPill.addEventListener('click', () => this.openUserSwitcherModal());
        }

        // Reset Database Button
        const resetBtn = document.getElementById('btn-reset-db');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                if (confirm("Reset MTRS database to default academic seed state? All bookings and changes will revert to original seed data.")) {
                    this.engine.resetToSeed();
                    this.showToast("Database restored to original seed state.", "success");
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
        if (nameEl) nameEl.textContent = this.currentCustomer.Customer_Name;
        if (avatarEl) {
            const initials = this.currentCustomer.Customer_Name.split(' ').map(n => n[0]).join('');
            avatarEl.textContent = initials;
        }
    }

    // ------------------------------------------------------------------------
    // HERO BANNER
    // ------------------------------------------------------------------------
    renderHeroBanner() {
        const heroMovie = this.engine.getTable('MOVIE').find(m => m.Movie_ID === 'M01') || this.engine.getTable('MOVIE')[0];
        if (!heroMovie) return;

        const posterBox = document.getElementById('hero-poster-box');
        if (posterBox && window.MOVIE_POSTERS && window.MOVIE_POSTERS[heroMovie.Movie_ID]) {
            posterBox.innerHTML = window.MOVIE_POSTERS[heroMovie.Movie_ID].svg;
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

        const movies = this.engine.getTable('MOVIE');
        const shows = this.engine.getTable('SHOWS');

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
            const posterSvg = window.MOVIE_POSTERS && window.MOVIE_POSTERS[movie.Movie_ID] ? 
                window.MOVIE_POSTERS[movie.Movie_ID].svg : '';

            // Find available formats for this movie from shows
            const movieShows = shows.filter(s => s.Movie_ID === movie.Movie_ID);
            const formats = [...new Set(movieShows.map(s => s.Format))];
            const formatTags = formats.length > 0 ? 
                formats.map(f => `<span class="card-format-tag">${f}</span>`).join('') :
                '<span class="card-format-tag">2D</span>';

            return `
                <div class="movie-card" onclick="window.App.selectMovieForBooking('${movie.Movie_ID}')">
                    <div class="movie-poster-box">
                        ${posterSvg}
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
    // THEATER & SHOW SELECTOR VIEW
    // ------------------------------------------------------------------------
    selectMovieForBooking(movieId) {
        const movie = this.engine.getTable('MOVIE').find(m => m.Movie_ID === movieId);
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
        const theaters = this.engine.getTable('THEATER');
        const screens = this.engine.getTable('SCREEN');
        const shows = this.engine.getTable('SHOWS');

        // Filter shows for this movie and date
        const movieShows = shows.filter(s => s.Movie_ID === movie.Movie_ID);

        // Group shows by Theater
        const theaterGroups = theaters.map(th => {
            const thScreens = screens.filter(sc => sc.Theater_ID === th.Theater_ID);
            const thScreenIds = new Set(thScreens.map(sc => sc.Screen_ID));
            const thShows = movieShows.filter(sh => thScreenIds.has(sh.Screen_ID));

            return {
                theater: th,
                screens: thScreens,
                shows: thShows
            };
        }).filter(g => g.shows.length > 0);

        container.innerHTML = `
            <div class="breadcrumbs">
                <span class="breadcrumb-link" onclick="window.App.switchView('home')">← Back to Movies</span>
                <span>/</span>
                <span>${movie.Movie_Name}</span>
                <span>/</span>
                <span style="color: var(--primary);">Select Showtimes</span>
            </div>

            <div class="show-movie-banner">
                <div class="show-movie-info">
                    <h2>${movie.Movie_Name}</h2>
                    <div style="display: flex; gap: 1rem; align-items: center; color: var(--text-secondary); font-size: 0.9rem; margin-top: 0.4rem;">
                        <span style="color: var(--accent-gold); font-weight: 700;">★ ${movie.Rating}/10</span>
                        <span>•</span>
                        <span>${movie.Genre}</span>
                        <span>•</span>
                        <span>${movie.Language}</span>
                        <span>•</span>
                        <span>${movie.Duration} Mins</span>
                    </div>
                </div>
            </div>

            <!-- Date Selector Row -->
            <div class="date-selector-row">
                <div class="date-pill active" onclick="window.App.setDateFilter('2026-10-21', this)">
                    <div class="date-day">WED</div>
                    <div class="date-number">21</div>
                </div>
                <div class="date-pill" onclick="window.App.setDateFilter('2026-10-22', this)">
                    <div class="date-day">THU</div>
                    <div class="date-number">22</div>
                </div>
                <div class="date-pill" onclick="window.App.setDateFilter('2026-10-23', this)">
                    <div class="date-day">FRI</div>
                    <div class="date-number">23</div>
                </div>
            </div>

            <!-- Theaters & Showtimes Listing -->
            <div class="theaters-list">
                ${theaterGroups.length > 0 ? theaterGroups.map(group => `
                    <div class="theater-card">
                        <div class="theater-header">
                            <div>
                                <h3 class="theater-name">${group.theater.Theater_Name}</h3>
                                <div class="theater-address">📍 ${group.theater.City}, ${group.theater.State}</div>
                            </div>
                            <div style="font-size: 0.8rem; color: var(--accent-cyan); font-weight: 700;">
                                MTRS Verified Partner
                            </div>
                        </div>

                        <div class="showtimes-grid">
                            ${group.shows.map(show => {
                                const screen = group.screens.find(s => s.Screen_ID === show.Screen_ID);
                                return `
                                    <button class="showtime-btn" onclick="window.App.selectShowForSeats('${show.Show_ID}')">
                                        <div class="showtime-time">${show.Show_Time.substring(0, 5)}</div>
                                        <div class="showtime-format">${show.Format}</div>
                                        <div class="showtime-price">₹${show.Ticket_Price}</div>
                                        <div style="font-size: 0.65rem; color: var(--text-muted); margin-top: 2px;">
                                            ${screen ? screen.Screen_Type : 'Standard'}
                                        </div>
                                    </button>
                                `;
                            }).join('')}
                        </div>
                    </div>
                `).join('') : `
                    <div class="theater-card" style="text-align: center; padding: 3rem 1rem;">
                        <h4 style="color: var(--text-pure); margin-bottom: 0.5rem;">No Shows Available For This Date</h4>
                        <p style="color: var(--text-secondary); font-size: 0.9rem;">Please choose another date or explore other movies.</p>
                    </div>
                `}
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
    // SEAT SELECTION VIEW
    // ------------------------------------------------------------------------
    selectShowForSeats(showId) {
        const show = this.engine.getTable('SHOWS').find(s => s.Show_ID === showId);
        if (!show) return;

        this.selectedShow = show;
        this.selectedSeats = [];

        // Hide other views, show seat layout
        document.getElementById('view-theaters').style.display = 'none';
        document.getElementById('view-seats').style.display = 'block';

        this.renderSeatLayout();
        this.toggleDock(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    renderSeatLayout() {
        const container = document.getElementById('view-seats');
        if (!container || !this.selectedShow || !this.selectedMovie) return;

        const show = this.selectedShow;
        const movie = this.selectedMovie;
        const screen = this.engine.getTable('SCREEN').find(s => s.Screen_ID === show.Screen_ID);
        const theater = this.engine.getTable('THEATER').find(t => t.Theater_ID === (screen ? screen.Theater_ID : ''));

        // Query Stored Procedure: sp_CheckSeatAvailability
        const seatInventory = this.engine.sp_CheckSeatAvailability(show.Show_ID);

        // Group seats by row (A, B, C, D, etc.)
        const rowsMap = {};
        seatInventory.forEach(seat => {
            const rowLetter = seat.Seat_Number.charAt(0);
            if (!rowsMap[rowLetter]) rowsMap[rowLetter] = [];
            rowsMap[rowLetter].push(seat);
        });

        // Determine price multiplier by tier
        const getTierPrice = (type) => {
            if (type === 'VIP') return show.Ticket_Price;
            if (type === 'Balcony') return Math.max(show.Ticket_Price - 60, 200);
            if (type === 'Premium') return Math.max(show.Ticket_Price - 100, 180);
            return Math.max(show.Ticket_Price - 150, 150);
        };

        container.innerHTML = `
            <div class="breadcrumbs">
                <span class="breadcrumb-link" onclick="window.App.selectMovieForBooking('${movie.Movie_ID}')">← Back to Showtimes</span>
                <span>/</span>
                <span>${movie.Movie_Name}</span>
                <span>/</span>
                <span style="color: var(--primary);">${theater ? theater.Theater_Name : ''}</span>
            </div>

            <div class="seat-show-header">
                <div>
                    <h2 class="seat-movie-title">${movie.Movie_Name} (${show.Format})</h2>
                    <div class="seat-theater-meta">
                        ${theater ? theater.Theater_Name : ''} | Screen ${screen ? screen.Screen_Number : 1} (${screen ? screen.Screen_Type : 'Standard'})
                    </div>
                </div>
                <div style="text-align: right;">
                    <div style="font-size: 0.8rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Showtime</div>
                    <div style="font-family: var(--font-heading); font-size: 1.25rem; font-weight: 800; color: var(--accent-cyan);">
                        ${show.Show_Date} • ${show.Show_Time.substring(0, 5)}
                    </div>
                </div>
            </div>

            <!-- Curved Screen Visual -->
            <div class="cinema-screen-container">
                <div class="cinema-screen-curve"></div>
                <div class="screen-text">All Eyes This Way Please (Cinema Screen)</div>
            </div>

            <!-- Seat Grid Wrapper -->
            <div class="seat-map-wrapper">
                ${Object.keys(rowsMap).sort().map(rowKey => {
                    const rowSeats = rowsMap[rowKey].sort((a, b) => parseInt(a.Seat_Number.substring(1)) - parseInt(b.Seat_Number.substring(1)));
                    const rowType = rowSeats[0].Seat_Type;
                    const tierPrice = getTierPrice(rowType);

                    return `
                        <div class="seat-tier-section">
                            <div class="seat-tier-header">
                                <div class="tier-name">
                                    <span>Row ${rowKey}</span>
                                    <span class="tier-badge ${rowType.toLowerCase()}">${rowType}</span>
                                </div>
                                <div class="tier-price">₹${tierPrice}</div>
                            </div>

                            <div class="seat-row">
                                <div class="row-label">${rowKey}</div>
                                <div class="seat-cluster">
                                    ${rowSeats.map(seat => {
                                        const isBooked = seat.Status === 'BOOKED';
                                        const isSelected = this.selectedSeats.some(s => s.Seat_ID === seat.Seat_ID);
                                        const seatClass = isBooked ? 'seat booked' : (isSelected ? 'seat selected' : 'seat');

                                        return `
                                            <div 
                                                class="${seatClass}" 
                                                data-seat-id="${seat.Seat_ID}"
                                                data-seat-number="${seat.Seat_Number}"
                                                data-seat-type="${seat.Seat_Type}"
                                                data-price="${tierPrice}"
                                                onclick="window.App.toggleSeatSelection(this)"
                                                title="${seat.Seat_Number} - ${seat.Seat_Type} (₹${tierPrice})"
                                            >
                                                ${seat.Seat_Number}
                                            </div>
                                        `;
                                    }).join('')}
                                </div>
                                <div class="row-label">${rowKey}</div>
                            </div>
                        </div>
                    `;
                }).join('')}

                <!-- Seat Legend -->
                <div class="seat-legend">
                    <div class="legend-item">
                        <div class="legend-box available"></div>
                        <span>Available</span>
                    </div>
                    <div class="legend-item">
                        <div class="legend-box selected"></div>
                        <span>Selected</span>
                    </div>
                    <div class="legend-item">
                        <div class="legend-box booked"></div>
                        <span>Reserved / Sold</span>
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

        this.updateFloatingDock();
    }

    updateFloatingDock() {
        const count = this.selectedSeats.length;
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

        const subtotal = this.selectedSeats.reduce((sum, s) => sum + s.Price, 0);
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
    openCheckoutModal() {
        if (this.selectedSeats.length === 0) {
            this.showToast("Please select at least 1 seat to proceed.", "error");
            return;
        }

        const modal = document.getElementById('checkout-modal');
        if (!modal) return;

        const subtotal = this.selectedSeats.reduce((sum, s) => sum + s.Price, 0);
        const convenienceFee = 30.00;
        const gst = parseFloat((subtotal * 0.18).toFixed(2));
        const grandTotal = (subtotal + convenienceFee + gst).toFixed(2);

        const screen = this.engine.getTable('SCREEN').find(s => s.Screen_ID === this.selectedShow.Screen_ID);
        const theater = this.engine.getTable('THEATER').find(t => t.Theater_ID === (screen ? screen.Theater_ID : ''));

        // Render checkout details
        document.getElementById('checkout-movie-title').textContent = this.selectedMovie.Movie_Name;
        document.getElementById('checkout-theater-info').textContent = `${theater ? theater.Theater_Name : ''} • Screen ${screen ? screen.Screen_Number : 1} (${this.selectedShow.Format})`;
        document.getElementById('checkout-show-time').textContent = `${this.selectedShow.Show_Date} at ${this.selectedShow.Show_Time.substring(0, 5)}`;
        document.getElementById('checkout-seats-list').textContent = this.selectedSeats.map(s => s.Seat_Number).join(', ');
        
        document.getElementById('checkout-subtotal').textContent = `₹${subtotal.toFixed(2)}`;
        document.getElementById('checkout-conv-fee').textContent = `₹${convenienceFee.toFixed(2)}`;
        document.getElementById('checkout-gst').textContent = `₹${gst.toFixed(2)}`;
        document.getElementById('checkout-grand-total').textContent = `₹${grandTotal}`;

        // Populate customer selector
        const customerSelect = document.getElementById('checkout-customer-select');
        if (customerSelect) {
            const allCust = this.engine.getTable('CUSTOMER');
            customerSelect.innerHTML = allCust.map(c => `
                <option value="${c.Customer_ID}" ${c.Customer_ID === this.currentCustomer.Customer_ID ? 'selected' : ''}>
                    ${c.Customer_Name} (${c.Email})
                </option>
            `).join('');
        }

        modal.classList.add('active');
    }

    closeCheckoutModal() {
        const modal = document.getElementById('checkout-modal');
        if (modal) modal.classList.remove('active');
    }

    confirmBookingAndPay() {
        const customerSelect = document.getElementById('checkout-customer-select');
        const paymentModeSelect = document.getElementById('checkout-payment-mode');

        const customerId = customerSelect ? customerSelect.value : this.currentCustomer.Customer_ID;
        const paymentMode = paymentModeSelect ? paymentModeSelect.value : 'UPI';

        const subtotal = this.selectedSeats.reduce((sum, s) => sum + s.Price, 0);
        const convenienceFee = 30.00;
        const gst = parseFloat((subtotal * 0.18).toFixed(2));
        const grandTotal = parseFloat((subtotal + convenienceFee + gst).toFixed(2));

        // Generate next Booking_ID and Payment_ID
        const currentBookings = this.engine.getTable('BOOKING');
        const nextBkNum = currentBookings.length + 1;
        const bookingId = `BK${nextBkNum < 10 ? '0' + nextBkNum : nextBkNum}`;

        const currentPayments = this.engine.getTable('PAYMENT');
        const nextPayNum = currentPayments.length + 1;
        const paymentId = `PAY${nextPayNum < 10 ? '0' + nextPayNum : nextPayNum}`;

        const seatIds = this.selectedSeats.map(s => s.Seat_ID);

        try {
            // Execute Stored Procedure: sp_BookTicketTransaction
            // Triggers: trg_PreventDoubleBooking & trg_ValidateSeatScreen fire here!
            const txResult = this.engine.sp_BookTicketTransaction({
                bookingId,
                customerId,
                showId: this.selectedShow.Show_ID,
                format: this.selectedShow.Format,
                ticketPrice: this.selectedShow.Ticket_Price,
                paymentId,
                paymentMode,
                amount: grandTotal,
                seatIds
            });

            this.closeCheckoutModal();
            this.toggleDock(false);

            this.showToast("Booking successful! Database transaction committed.", "success");

            // Open E-Ticket Modal
            this.openTicketModal(txResult);

        } catch (error) {
            console.error("Booking Transaction Failed:", error);
            this.showToast(error.message, "error");
        }
    }

    // ------------------------------------------------------------------------
    // BOARDING PASS / E-TICKET CONFIRMATION MODAL
    // ------------------------------------------------------------------------
    openTicketModal(txResult) {
        const modal = document.getElementById('ticket-modal');
        if (!modal) return;

        const booking = txResult.booking;
        const payment = txResult.payment;
        const movie = this.selectedMovie;
        const show = this.selectedShow;
        const screen = this.engine.getTable('SCREEN').find(s => s.Screen_ID === show.Screen_ID);
        const theater = this.engine.getTable('THEATER').find(t => t.Theater_ID === (screen ? screen.Theater_ID : ''));
        const customer = this.engine.getTable('CUSTOMER').find(c => c.Customer_ID === booking.Customer_ID) || this.currentCustomer;

        const seatNumbers = this.selectedSeats.map(s => s.Seat_Number).join(', ');

        const container = document.getElementById('ticket-modal-content');
        if (container) {
            container.innerHTML = `
                <div class="ticket-pass">
                    <div class="ticket-header">
                        <div>
                            <div style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 1px; opacity: 0.9;">MTRS E-Ticket</div>
                            <div style="font-family: var(--font-heading); font-size: 1.3rem; font-weight: 800;">BOARDING PASS</div>
                        </div>
                        <div class="ticket-badge-confirmed">CONFIRMED</div>
                    </div>

                    <div class="ticket-body">
                        <div class="ticket-movie-title">${movie.Movie_Name}</div>
                        <div style="color: var(--accent-cyan); font-size: 0.85rem; font-weight: 700;">${show.Format} • ${movie.Language}</div>

                        <div class="ticket-grid">
                            <div>
                                <div class="ticket-item-label">Cinema / Theater</div>
                                <div class="ticket-item-value">${theater ? theater.Theater_Name : ''}</div>
                            </div>
                            <div>
                                <div class="ticket-item-label">Screen</div>
                                <div class="ticket-item-value">Screen ${screen ? screen.Screen_Number : 1} (${screen ? screen.Screen_Type : 'Standard'})</div>
                            </div>
                            <div>
                                <div class="ticket-item-label">Date & Time</div>
                                <div class="ticket-item-value">${show.Show_Date} | ${show.Show_Time.substring(0, 5)}</div>
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
                                <div class="ticket-item-value">${payment.Payment_Mode} (₹${payment.Amount.toFixed(2)})</div>
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
                                    ✓ Relational Integrity Verified (BCNF)
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

                <div style="display: flex; gap: 1rem; margin-top: 1.5rem; justify-content: flex-end;">
                    <button class="btn-secondary" onclick="window.print()">
                        🖨️ Print Ticket
                    </button>
                    <button class="btn-primary" onclick="window.App.closeTicketModal(); window.App.switchView('my-bookings');">
                        View in My Bookings
                    </button>
                </div>
            `;
        }

        modal.classList.add('active');
    }

    closeTicketModal() {
        const modal = document.getElementById('ticket-modal');
        if (modal) modal.classList.remove('active');
    }

    // ------------------------------------------------------------------------
    // MY BOOKINGS VIEW & CANCELLATION PROCEDURE
    // ------------------------------------------------------------------------
    renderMyBookings() {
        const container = document.getElementById('my-bookings-container');
        if (!container) return;

        const customer = this.currentCustomer;
        const bookings = this.engine.getTable('BOOKING').filter(b => b.Customer_ID === customer.Customer_ID);
        const shows = this.engine.getTable('SHOWS');
        const movies = this.engine.getTable('MOVIE');
        const screens = this.engine.getTable('SCREEN');
        const theaters = this.engine.getTable('THEATER');
        const bookedSeats = this.engine.getTable('BOOKED_SEAT');
        const payments = this.engine.getTable('PAYMENT');

        if (bookings.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 4rem 1rem; background: var(--bg-surface); border-radius: var(--radius-lg); border: var(--glass-border);">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">🎟️</div>
                    <h3 style="font-size: 1.3rem; color: var(--text-pure); margin-bottom: 0.5rem;">No Bookings Found</h3>
                    <p style="color: var(--text-secondary); margin-bottom: 1.5rem;">You haven't booked any movie tickets yet under account ${customer.Customer_Name}.</p>
                    <button class="btn-primary" onclick="window.App.switchView('home')">Browse Movies Now</button>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div style="margin-bottom: 1.5rem;">
                <h3 style="font-size: 1.4rem; color: var(--text-pure);">Tickets Booked by ${customer.Customer_Name}</h3>
                <p style="color: var(--text-muted); font-size: 0.88rem;">Manage your active reservations, view boarding passes, or process cancellations.</p>
            </div>

            <div style="display: grid; gap: 1.5rem;">
                ${bookings.map(booking => {
                    const show = shows.find(s => s.Show_ID === booking.Show_ID) || {};
                    const movie = movies.find(m => m.Movie_ID === show.Movie_ID) || {};
                    const screen = screens.find(s => s.Screen_ID === show.Screen_ID) || {};
                    const theater = theaters.find(t => t.Theater_ID === screen.Theater_ID) || {};
                    const payment = payments.find(p => p.Booking_ID === booking.Booking_ID) || {};

                    const bSeats = bookedSeats.filter(bs => bs.Booking_ID === booking.Booking_ID);
                    const seatNumbers = bSeats.map(bs => {
                        const sObj = this.engine.getTable('SEAT').find(s => s.Seat_ID === bs.Seat_ID);
                        return sObj ? sObj.Seat_Number : bs.Seat_ID;
                    }).join(', ');

                    return `
                        <div class="theater-card" style="margin-bottom: 0;">
                            <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; flex-wrap: wrap;">
                                <div>
                                    <div style="display: flex; align-items: center; gap: 0.6rem; margin-bottom: 0.35rem;">
                                        <span class="selected-seat-chip" style="font-size: 0.75rem;">${booking.Booking_ID}</span>
                                        <span class="card-format-tag">${booking.Format}</span>
                                        <span style="font-size: 0.8rem; color: var(--accent-emerald); font-weight: 700;">● Confirmed</span>
                                    </div>
                                    <h4 style="font-family: var(--font-heading); font-size: 1.4rem; color: var(--text-pure); margin-bottom: 0.25rem;">
                                        ${movie.Movie_Name || 'Movie'}
                                    </h4>
                                    <div style="color: var(--text-secondary); font-size: 0.85rem;">
                                        ${theater.Theater_Name || ''} • Screen ${screen.Screen_Number || 1}
                                    </div>
                                </div>

                                <div style="text-align: right;">
                                    <div style="font-family: var(--font-heading); font-size: 1.3rem; font-weight: 800; color: var(--text-pure);">
                                        ₹${payment.Amount ? payment.Amount.toFixed(2) : '0.00'}
                                    </div>
                                    <div style="font-size: 0.75rem; color: var(--text-muted);">
                                        Paid via ${payment.Payment_Mode || 'N/A'}
                                    </div>
                                </div>
                            </div>

                            <div style="display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-top: 1.25rem; padding-top: 1rem; border-top: 1px solid rgba(255, 255, 255, 0.06); flex-wrap: wrap;">
                                <div style="font-size: 0.88rem; color: var(--text-secondary);">
                                    📅 <strong>${show.Show_Date}</strong> at <strong>${show.Show_Time ? show.Show_Time.substring(0, 5) : ''}</strong> | 
                                    Seats: <strong style="color: var(--accent-gold);">${seatNumbers}</strong>
                                </div>

                                <div style="display: flex; gap: 0.75rem;">
                                    <button class="btn-secondary" style="padding: 0.4rem 0.9rem; font-size: 0.82rem;" onclick="window.App.reprintTicket('${booking.Booking_ID}')">
                                        View Ticket
                                    </button>
                                    <button class="btn-book-card" style="background: rgba(229, 9, 20, 0.2); border: 1px solid var(--primary); color: #fff; padding: 0.4rem 0.9rem; font-size: 0.82rem;" onclick="window.App.cancelBooking('${booking.Booking_ID}')">
                                        Cancel Booking
                                    </button>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    cancelBooking(bookingId) {
        if (!confirm(`Are you sure you want to cancel booking ${bookingId}? Seats will be released and payment refunded.`)) {
            return;
        }

        try {
            // Invokes Stored Procedure: sp_CancelBooking
            const result = this.engine.sp_CancelBooking(bookingId, this.currentCustomer.Customer_ID);
            this.showToast(result.message, "success");
            this.renderMyBookings();
            if (window.MTRSAdmin) window.MTRSAdmin.refreshDashboard();
        } catch (error) {
            this.showToast(error.message, "error");
        }
    }

    reprintTicket(bookingId) {
        const booking = this.engine.getTable('BOOKING').find(b => b.Booking_ID === bookingId);
        if (!booking) return;

        const show = this.engine.getTable('SHOWS').find(s => s.Show_ID === booking.Show_ID);
        const movie = this.engine.getTable('MOVIE').find(m => m.Movie_ID === (show ? show.Movie_ID : ''));
        const payment = this.engine.getTable('PAYMENT').find(p => p.Booking_ID === bookingId);
        const bookedSeats = this.engine.getTable('BOOKED_SEAT').filter(bs => bs.Booking_ID === bookingId);

        const seats = bookedSeats.map(bs => {
            const sObj = this.engine.getTable('SEAT').find(s => s.Seat_ID === bs.Seat_ID);
            return {
                Seat_ID: bs.Seat_ID,
                Seat_Number: sObj ? sObj.Seat_Number : bs.Seat_ID,
                Seat_Type: sObj ? sObj.Seat_Type : 'Regular'
            };
        });

        this.selectedMovie = movie;
        this.selectedShow = show;
        this.selectedSeats = seats;

        this.openTicketModal({
            booking,
            payment: payment || { Payment_ID: 'PAY_REC', Payment_Mode: 'Cash', Amount: booking.Ticket_Price }
        });
    }

    // ------------------------------------------------------------------------
    // USER SWITCHER MODAL (Demo Customer Profiles)
    // ------------------------------------------------------------------------
    openUserSwitcherModal() {
        const modal = document.getElementById('user-modal');
        if (!modal) return;

        const customers = this.engine.getTable('CUSTOMER');
        const listContainer = document.getElementById('user-list-container');
        if (listContainer) {
            listContainer.innerHTML = customers.map(c => `
                <div class="date-pill ${c.Customer_ID === this.currentCustomer.Customer_ID ? 'active' : ''}" 
                     style="display: flex; align-items: center; justify-content: space-between; padding: 0.85rem 1.25rem; margin-bottom: 0.65rem; text-align: left; cursor: pointer;"
                     onclick="window.App.switchActiveUser('${c.Customer_ID}')">
                    <div style="display: flex; align-items: center; gap: 0.85rem;">
                        <div class="user-avatar" style="width: 34px; height: 34px;">${c.Customer_Name[0]}</div>
                        <div>
                            <div style="font-family: var(--font-heading); font-weight: 700; color: var(--text-pure);">${c.Customer_Name}</div>
                            <div style="font-size: 0.78rem; color: var(--text-secondary);">${c.Email} • Phone: ${c.Phone}</div>
                        </div>
                    </div>
                    <span style="font-size: 0.75rem; font-weight: 700; color: var(--accent-cyan);">${c.Customer_ID}</span>
                </div>
            `).join('');
        }

        modal.classList.add('active');
    }

    switchActiveUser(customerId) {
        const customer = this.engine.getTable('CUSTOMER').find(c => c.Customer_ID === customerId);
        if (!customer) return;

        this.currentCustomer = customer;
        this.renderNavbarUser();

        const modal = document.getElementById('user-modal');
        if (modal) modal.classList.remove('active');

        this.showToast(`Switched active profile to ${customer.Customer_Name} (${customer.Customer_ID})`, "info");

        // If currently in My Bookings, refresh it
        if (document.getElementById('view-my-bookings').style.display === 'block') {
            this.renderMyBookings();
        }
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
