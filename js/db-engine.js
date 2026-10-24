// ============================================================================
// MOVIE TICKET RESERVATION SYSTEM (MTRS)
// File: js/db-engine.js
// Description: Client-side Relational Database Engine with BCNF relations,
//              Foreign Key integrity, CHECK constraints, Triggers, and Stored Procedures.
// Sourced from 6 Primary Chennai Cinema Destinations across 49 Auditoriums.
// ============================================================================

class MTRSRelationalEngine {
    constructor() {
        this.STORAGE_KEY = 'MTRS_DB_STORAGE_V3_CHENNAI';
        this.db = null;
        this.init();
    }

    init() {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        if (stored) {
            try {
                this.db = JSON.parse(stored);
                // Ensure real screen capacities are synchronized
                let changed = false;
                if (Array.isArray(this.db.SCREEN)) {
                    const sc20 = this.db.SCREEN.find(s => s.Screen_ID === 'SC20');
                    if (sc20 && sc20.Capacity !== 320) { sc20.Capacity = 320; changed = true; }
                    const sc21 = this.db.SCREEN.find(s => s.Screen_ID === 'SC21');
                    if (sc21 && sc21.Capacity !== 450) { sc21.Capacity = 450; changed = true; }
                }
                // Ensure M01 is named 'Superman' across persistent storage (Requirement 11)
                if (Array.isArray(this.db.MOVIE)) {
                    const m01 = this.db.MOVIE.find(m => m.Movie_ID === 'M01');
                    if (m01 && m01.Movie_Name !== 'Superman') {
                        m01.Movie_Name = 'Superman';
                        changed = true;
                    }
                }
                // Ensure SEQUENCES object exists in database
                if (!this.db.SEQUENCES || typeof this.db.SEQUENCES !== 'object') {
                    this.db.SEQUENCES = {};
                    changed = true;
                }
                if (changed) this.save();
            } catch (e) {
                console.error("Failed to parse stored DB, resetting to Chennai seed:", e);
                this.resetToSeed();
            }
        } else {
            this.resetToSeed();
        }
    }

    save() {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.db));
    }

    resetToSeed() {
        // Deep clone seed data
        this.db = JSON.parse(JSON.stringify(window.SEED_DATA));
        if (!this.db.SEQUENCES || typeof this.db.SEQUENCES !== 'object') {
            this.db.SEQUENCES = {};
        }
        this.save();
        console.log("MTRS Database restored to default Chennai cinema seed data.");
    }

    // ------------------------------------------------------------------------
    // ROBUST PERSISTENT SEQUENCE & ID GENERATORS
    // ------------------------------------------------------------------------
    syncSequence(tableName, idValue, prefix) {
        if (!this.db.SEQUENCES) this.db.SEQUENCES = {};
        if (typeof idValue === 'string' && idValue.startsWith(prefix)) {
            const num = parseInt(idValue.substring(prefix.length), 10);
            if (!isNaN(num)) {
                const cur = parseInt(this.db.SEQUENCES[tableName], 10) || 0;
                if (num > cur) {
                    this.db.SEQUENCES[tableName] = num;
                }
            }
        }
    }

    generateNextId(tableName, idField, prefix, padLength = 2) {
        if (!this.db.SEQUENCES) this.db.SEQUENCES = {};

        const table = this.getTable(tableName);

        // Find highest numeric ID currently stored in the relation
        let maxExisting = 0;
        for (const row of table) {
            const val = String(row[idField] || '');
            if (val.startsWith(prefix)) {
                const num = parseInt(val.substring(prefix.length), 10);
                if (!isNaN(num) && num > maxExisting) {
                    maxExisting = num;
                }
            }
        }

        // Persistent sequence counter avoids reusing IDs of deleted/cancelled records
        const currentSeq = parseInt(this.db.SEQUENCES[tableName], 10) || 0;
        let nextNum = Math.max(maxExisting, currentSeq) + 1;

        // Guaranteed collision prevention: loop until an unused ID is found
        let candidateId = `${prefix}${String(nextNum).padStart(padLength, '0')}`;
        while (table.some(row => row[idField] === candidateId)) {
            nextNum++;
            candidateId = `${prefix}${String(nextNum).padStart(padLength, '0')}`;
        }

        // Update persistent sequence counter
        this.db.SEQUENCES[tableName] = nextNum;
        this.save();

        return candidateId;
    }

    generateNextBookingId() {
        return this.generateNextId('BOOKING', 'Booking_ID', 'BK', 2);
    }

    generateNextPaymentId() {
        return this.generateNextId('PAYMENT', 'Payment_ID', 'PAY', 2);
    }

    generateNextCustomerId() {
        return this.generateNextId('CUSTOMER', 'Customer_ID', 'CU', 2);
    }

    generateNextShowId() {
        return this.generateNextId('SHOWS', 'Show_ID', 'SH', 2);
    }

    generateNextMovieId() {
        return this.generateNextId('MOVIE', 'Movie_ID', 'M', 2);
    }

    generateNextScreenId() {
        return this.generateNextId('SCREEN', 'Screen_ID', 'SC', 2);
    }

    generateNextTheaterId() {
        return this.generateNextId('THEATER', 'Theater_ID', 'TH', 2);
    }

    // ------------------------------------------------------------------------
    // TABLE ACCESSORS
    // ------------------------------------------------------------------------
    getTable(tableName) {
        if (!this.db[tableName]) {
            throw new Error(`Relation '${tableName}' does not exist in schema.`);
        }
        return this.db[tableName];
    }

    /**
     * Registers a new legitimate customer account (Requirement 12)
     */
    registerCustomer({ name, email, phone }) {
        if (!name || !email) throw new Error("Name and Email are required to register.");
        const customers = this.getTable('CUSTOMER');
        const existing = customers.find(c => c.Email.toLowerCase() === email.toLowerCase());
        if (existing) {
            return existing; // Return existing customer
        }

        const customerId = this.generateNextCustomerId();
        const newCustomer = {
            Customer_ID: customerId,
            Customer_Name: name.trim(),
            Email: email.trim().toLowerCase(),
            Phone: (phone || '').trim() || '9876543200'
        };

        customers.push(newCustomer);
        this.save();
        return newCustomer;
    }

    // ------------------------------------------------------------------------
    // PROCEDURES & TRIGGERS
    // ------------------------------------------------------------------------

    /**
     * Stored Procedure: sp_CheckSeatAvailability
     * Returns full seat inventory for a show's screen with 'BOOKED' or 'AVAILABLE' status.
     * Generates and respects recorded auditorium capacity with proportional tiers.
     */
    sp_CheckSeatAvailability(showId) {
        const show = this.getTable('SHOWS').find(s => s.Show_ID === showId);
        if (!show) {
            throw new Error(`Show '${showId}' not found in database.`);
        }

        const screen = this.getTable('SCREEN').find(sc => sc.Screen_ID === show.Screen_ID);
        if (!screen) {
            throw new Error(`Screen '${show.Screen_ID}' not found in database.`);
        }

        // Get all seats registered for this screen
        let screenSeats = this.getTable('SEAT').filter(st => st.Screen_ID === show.Screen_ID);

        // Dynamically build rows (VIP, Balcony, Premium, Regular) matching screen.Capacity
        if (screenSeats.length < screen.Capacity && typeof window.generateAuditoriumSeats === 'function') {
            const fullSeats = window.generateAuditoriumSeats(screen, screenSeats);
            if (fullSeats.length > 0) {
                this.db.SEAT = this.db.SEAT.filter(st => st.Screen_ID !== screen.Screen_ID).concat(fullSeats);
                this.save();
                screenSeats = fullSeats;
            }
        }

        // Find all bookings for this show
        const showBookings = this.getTable('BOOKING').filter(b => b.Show_ID === showId);
        const bookingIds = new Set(showBookings.map(b => b.Booking_ID));

        // Find all booked seat IDs for these bookings
        const bookedSeatIds = new Set(
            this.getTable('BOOKED_SEAT')
                .filter(bs => bookingIds.has(bs.Booking_ID))
                .map(bs => bs.Seat_ID)
        );

        return screenSeats.map(seat => ({
            Seat_ID: seat.Seat_ID,
            Screen_ID: seat.Screen_ID,
            Seat_Number: seat.Seat_Number,
            Seat_Type: seat.Seat_Type,
            Status: bookedSeatIds.has(seat.Seat_ID) ? 'BOOKED' : 'AVAILABLE'
        }));
    }

    /**
     * Atomic Transaction: sp_BookTicketTransaction
     * Validates constraints, checks seat conflict via trigger, generates unique IDs,
     * and performs atomic commit with full rollback capability.
     */
    sp_BookTicketTransaction({
        bookingId = null,
        customerId,
        showId,
        format,
        ticketPrice,
        paymentId = null,
        paymentMode = 'UPI',
        amount,
        seatIds
    }) {
        // Snapshot existing tables for true atomic rollback if any error occurs
        const bookingSnapshot = JSON.parse(JSON.stringify(this.getTable('BOOKING')));
        const bookedSeatSnapshot = JSON.parse(JSON.stringify(this.getTable('BOOKED_SEAT')));
        const paymentSnapshot = JSON.parse(JSON.stringify(this.getTable('PAYMENT')));

        const rollback = () => {
            this.db.BOOKING = bookingSnapshot;
            this.db.BOOKED_SEAT = bookedSeatSnapshot;
            this.db.PAYMENT = paymentSnapshot;
            this.save();
        };

        try {
            // 1. Validate Foreign Keys
            if (!customerId) {
                throw new Error("Integrity Error: Customer ID is required.");
            }
            const customer = this.getTable('CUSTOMER').find(c => c.Customer_ID === customerId);
            if (!customer) {
                throw new Error(`Integrity Error: Customer '${customerId}' does not exist.`);
            }

            if (!showId) {
                throw new Error("Integrity Error: Show ID is required.");
            }
            const show = this.getTable('SHOWS').find(s => s.Show_ID === showId);
            if (!show) {
                throw new Error(`Integrity Error: Show '${showId}' does not exist.`);
            }

            // 2. Validate CHECK Constraints
            const canonicalFormats = ['2D', '3D', 'IMAX 2D', 'IMAX 3D', 'P[XL] 2D', 'P[XL] 3D', 'BIGPIX 2D', 'BIGPIX 3D'];
            const normalizedFormat = (format || '').trim();
            const matchedFormat = canonicalFormats.find(f => f.toLowerCase() === normalizedFormat.toLowerCase()) || normalizedFormat;

            if (!canonicalFormats.includes(matchedFormat)) {
                throw new Error(`Check Constraint Violation: Format '${format}' is invalid.`);
            }

            const canonicalModes = ['Credit Card', 'Debit Card', 'UPI', 'Net Banking', 'Cash'];
            const normalizedMode = (paymentMode || '').trim();
            const matchedMode = canonicalModes.find(m => m.toLowerCase() === normalizedMode.toLowerCase()) || normalizedMode;

            if (!canonicalModes.includes(matchedMode)) {
                throw new Error(`Check Constraint Violation: Payment Mode '${paymentMode}' is invalid.`);
            }

            const numericAmount = parseFloat(amount);
            if (isNaN(numericAmount) || numericAmount <= 0) {
                throw new Error(`Check Constraint Violation: Amount must be strictly greater than 0.`);
            }

            const numericTicketPrice = parseFloat(ticketPrice);
            if (isNaN(numericTicketPrice) || numericTicketPrice < 0) {
                throw new Error(`Check Constraint Violation: Ticket Price must be non-negative.`);
            }

            if (!Array.isArray(seatIds) || seatIds.length === 0) {
                throw new Error(`Validation Error: At least one seat must be selected for booking.`);
            }

            // Deduplicate seatIds
            const uniqueSeatIds = [...new Set(seatIds)];

            // 3. TRIGGER 1: trg_PreventDoubleBooking
            // Check if any seat is already booked for this show
            const showBookings = this.getTable('BOOKING').filter(b => b.Show_ID === showId);
            const bookingIds = new Set(showBookings.map(b => b.Booking_ID));
            const alreadyBookedSeats = new Set(
                this.getTable('BOOKED_SEAT')
                    .filter(bs => bookingIds.has(bs.Booking_ID))
                    .map(bs => bs.Seat_ID)
            );

            for (const seatId of uniqueSeatIds) {
                if (alreadyBookedSeats.has(seatId)) {
                    const seatInfo = this.getTable('SEAT').find(s => s.Seat_ID === seatId);
                    const seatNum = seatInfo ? seatInfo.Seat_Number : seatId;
                    throw new Error(`Trigger trg_PreventDoubleBooking Fired: Seat ${seatNum} is already booked for this show!`);
                }
            }

            // 4. TRIGGER 2: trg_ValidateSeatScreen
            // Ensure every seat belongs to the screen hosting the show
            for (const seatId of uniqueSeatIds) {
                const seatObj = this.getTable('SEAT').find(s => s.Seat_ID === seatId);
                if (!seatObj) {
                    throw new Error(`Integrity Error: Seat '${seatId}' does not exist.`);
                }
                if (seatObj.Screen_ID !== show.Screen_ID) {
                    throw new Error(`Trigger trg_ValidateSeatScreen Fired: Seat ${seatObj.Seat_Number} does not belong to Screen ${show.Screen_ID}.`);
                }
            }

            // 5. Unique Primary Key generation & checks
            let finalBookingId = bookingId ? String(bookingId).trim() : null;
            if (finalBookingId) {
                const existingBooking = this.getTable('BOOKING').find(b => b.Booking_ID === finalBookingId);
                if (existingBooking) {
                    throw new Error(`Primary Key Violation: Booking ID '${finalBookingId}' already exists.`);
                }
            } else {
                finalBookingId = this.generateNextBookingId();
            }

            let finalPaymentId = paymentId ? String(paymentId).trim() : null;
            if (finalPaymentId) {
                const existingPayment = this.getTable('PAYMENT').find(p => p.Payment_ID === finalPaymentId);
                if (existingPayment) {
                    throw new Error(`Primary Key Violation: Payment ID '${finalPaymentId}' already exists.`);
                }
            } else {
                finalPaymentId = this.generateNextPaymentId();
            }

            // Ensure sequences track the IDs used
            this.syncSequence('BOOKING', finalBookingId, 'BK');
            this.syncSequence('PAYMENT', finalPaymentId, 'PAY');

            // 6. ATOMIC COMMIT
            const newBooking = {
                Booking_ID: finalBookingId,
                Customer_ID: customerId,
                Show_ID: showId,
                Booking_Date: new Date().toISOString().replace('T', ' ').substring(0, 19),
                Ticket_Price: numericTicketPrice,
                Format: matchedFormat
            };

            const newBookedSeats = uniqueSeatIds.map(seatId => ({
                Booking_ID: finalBookingId,
                Seat_ID: seatId
            }));

            const newPayment = {
                Payment_ID: finalPaymentId,
                Booking_ID: finalBookingId,
                Payment_Mode: matchedMode,
                Amount: numericAmount,
                Payment_Date: new Date().toISOString().replace('T', ' ').substring(0, 19)
            };

            this.getTable('BOOKING').push(newBooking);
            this.getTable('BOOKED_SEAT').push(...newBookedSeats);
            this.getTable('PAYMENT').push(newPayment);

            this.save();

            return {
                success: true,
                booking: newBooking,
                bookedSeats: newBookedSeats,
                payment: newPayment
            };
        } catch (error) {
            rollback();
            throw error;
        }
    }

    /**
     * Stored Procedure: sp_CancelBooking
     * Releases seats, deletes payment and booking record safely.
     */
    sp_CancelBooking(bookingId, customerId) {
        const bookingIndex = this.getTable('BOOKING').findIndex(b => b.Booking_ID === bookingId);
        if (bookingIndex === -1) {
            throw new Error(`Booking '${bookingId}' not found.`);
        }

        const booking = this.getTable('BOOKING')[bookingIndex];
        if (booking.Customer_ID !== customerId) {
            throw new Error(`Security Violation: Booking does not belong to specified customer.`);
        }

        // Delete from PAYMENT
        this.db.PAYMENT = this.db.PAYMENT.filter(p => p.Booking_ID !== bookingId);

        // Delete from BOOKED_SEAT (frees seats immediately)
        this.db.BOOKED_SEAT = this.db.BOOKED_SEAT.filter(bs => bs.Booking_ID !== bookingId);

        // Delete from BOOKING
        this.db.BOOKING.splice(bookingIndex, 1);

        this.save();
        return { success: true, message: `Booking ${bookingId} cancelled successfully and seats released.` };
    }

    /**
     * Stored Procedure: sp_CheckSeatAvailability
     * Returns physical seat inventory with active booking status for local fallback.
     */
    sp_CheckSeatAvailability(showId) {
        const show = this.getTable('SHOWS').find(s => s.Show_ID === showId);
        if (!show) return [];
        const screenSeats = this.getTable('SEAT').filter(s => s.Screen_ID === show.Screen_ID);
        const showBookings = this.getTable('BOOKING').filter(b => b.Show_ID === showId);
        const bookingIds = new Set(showBookings.map(b => b.Booking_ID));
        const bookedSeatIds = new Set(
            this.getTable('BOOKED_SEAT')
                .filter(bs => bookingIds.has(bs.Booking_ID))
                .map(bs => bs.Seat_ID)
        );
        return screenSeats.map(seat => ({
            Seat_ID: seat.Seat_ID,
            Screen_ID: seat.Screen_ID,
            Seat_Number: seat.Seat_Number,
            Seat_Type: seat.Seat_Type,
            Status: bookedSeatIds.has(seat.Seat_ID) ? 'BOOKED' : 'AVAILABLE'
        }));
    }

    /**
     * Stored Procedure: sp_GetShowRevenueReport
     * Returns movie title, theater, screen name, type, occupancy %, and total revenue.
     */
    sp_GetShowRevenueReport(movieId = null) {
        const shows = this.getTable('SHOWS');
        const movies = this.getTable('MOVIE');
        const screens = this.getTable('SCREEN');
        const theaters = this.getTable('THEATER');
        const bookings = this.getTable('BOOKING');
        const bookedSeats = this.getTable('BOOKED_SEAT');
        const payments = this.getTable('PAYMENT');

        const filteredShows = movieId ? shows.filter(s => s.Movie_ID === movieId) : shows;

        return filteredShows.map(show => {
            const movie = movies.find(m => m.Movie_ID === show.Movie_ID) || {};
            const screen = screens.find(s => s.Screen_ID === show.Screen_ID) || {};
            const theater = theaters.find(t => t.Theater_ID === screen.Theater_ID) || {};

            const showBookings = bookings.filter(b => b.Show_ID === show.Show_ID);
            const bookingIds = new Set(showBookings.map(b => b.Booking_ID));

            const totalSeatsSold = bookedSeats.filter(bs => bookingIds.has(bs.Booking_ID)).length;
            const totalRevenue = payments
                .filter(p => bookingIds.has(p.Booking_ID))
                .reduce((sum, p) => sum + parseFloat(p.Amount), 0);

            const capacity = screen.Capacity || 1;
            const occupancy = ((totalSeatsSold / capacity) * 100).toFixed(1);

            return {
                Show_ID: show.Show_ID,
                Movie_Name: movie.Movie_Name,
                Theater_Name: theater.Theater_Name,
                Screen_Number: screen.Screen_Number,
                Screen_Name: screen.Screen_Name || `Screen ${screen.Screen_Number}`,
                Screen_Type: screen.Screen_Type || 'Standard',
                Format: show.Format,
                Show_Date: show.Show_Date,
                Show_Time: show.Show_Time,
                Ticket_Price: `₹${show.Ticket_Price}`,
                Total_Capacity: capacity,
                Seats_Booked: totalSeatsSold,
                Remaining_Seats: capacity - totalSeatsSold,
                Occupancy_Rate: `${occupancy}%`,
                Total_Revenue: `₹${totalRevenue.toFixed(2)}`
            };
        });
    }

    // ------------------------------------------------------------------------
    // ACADEMIC SQL QUERY RUNNER ENGINE
    // Executes any of the 18 DA2 Academic Queries on the live Chennai relational state
    // ------------------------------------------------------------------------
    runAcademicQuery(queryId) {
        const qId = parseInt(queryId, 10);
        const startTime = performance.now();
        let result = { columns: [], rows: [] };

        const movies = this.getTable('MOVIE');
        const theaters = this.getTable('THEATER');
        const screens = this.getTable('SCREEN');
        const shows = this.getTable('SHOWS');
        const customers = this.getTable('CUSTOMER');
        const bookings = this.getTable('BOOKING');
        const bookedSeats = this.getTable('BOOKED_SEAT');
        const payments = this.getTable('PAYMENT');

        switch (qId) {
            case 1: {
                // Q1: Duration > 140 AND Rating >= 8.4
                result.columns = ['Movie_ID', 'Movie_Name', 'Genre', 'Rating', 'Duration (mins)', 'Language'];
                result.rows = movies
                    .filter(m => m.Duration > 140 && m.Rating >= 8.4)
                    .sort((a, b) => b.Rating - a.Rating)
                    .map(m => [m.Movie_ID, m.Movie_Name, m.Genre, m.Rating, m.Duration, m.Language]);
                break;
            }
            case 2: {
                // Q2: PVR Palazzo Chennai shows with technical telemetry
                result.columns = ['Theater_Name', 'Screen_#', 'Screen_Name', 'Screen_Type', 'Projection', 'Audio', 'Movie_Name', 'Show_Date', 'Time', 'Format', 'Price'];
                const rows = [];
                shows.forEach(sh => {
                    const sc = screens.find(s => s.Screen_ID === sh.Screen_ID);
                    const th = theaters.find(t => t.Theater_ID === sc.Theater_ID);
                    const mv = movies.find(m => m.Movie_ID === sh.Movie_ID);
                    if (th && th.Theater_Name.includes('PVR Palazzo')) {
                        rows.push([th.Theater_Name, sc.Screen_Number, sc.Screen_Name, sc.Screen_Type, sc.Projection_Tech, sc.Audio_Tech, mv.Movie_Name, sh.Show_Date, sh.Show_Time, sh.Format, `₹${sh.Ticket_Price}`]);
                    }
                });
                result.rows = rows;
                break;
            }
            case 3: {
                // Q3: Group By Movie with Total Bookings and Total Revenue
                result.columns = ['Movie_ID', 'Movie_Name', 'Genre', 'Total_Bookings', 'Total_Revenue'];
                result.rows = movies.map(m => {
                    const mShows = shows.filter(s => s.Movie_ID === m.Movie_ID).map(s => s.Show_ID);
                    const mBookings = bookings.filter(b => mShows.includes(b.Show_ID));
                    const bIds = new Set(mBookings.map(b => b.Booking_ID));
                    const mRevenue = payments.filter(p => bIds.has(p.Booking_ID)).reduce((sum, p) => sum + p.Amount, 0);
                    return [m.Movie_ID, m.Movie_Name, m.Genre, mBookings.length, `₹${mRevenue.toFixed(2)}`];
                }).sort((a, b) => parseFloat(b[4].replace('₹', '')) - parseFloat(a[4].replace('₹', '')));
                break;
            }
            case 4: {
                // Q4: Theaters where avg ticket price > overall avg
                const overallAvg = shows.reduce((sum, s) => sum + s.Ticket_Price, 0) / (shows.length || 1);
                result.columns = ['Theater_ID', 'Theater_Name', 'City', 'Avg_Theater_Price (₹)', 'Overall_Avg (₹)'];
                result.rows = theaters.map(th => {
                    const thScreens = screens.filter(sc => sc.Theater_ID === th.Theater_ID).map(sc => sc.Screen_ID);
                    const thShows = shows.filter(sh => thScreens.includes(sh.Screen_ID));
                    if (thShows.length === 0) return null;
                    const avg = thShows.reduce((sum, s) => sum + s.Ticket_Price, 0) / thShows.length;
                    return avg > overallAvg ? [th.Theater_ID, th.Theater_Name, th.City, avg.toFixed(2), overallAvg.toFixed(2)] : null;
                }).filter(Boolean);
                break;
            }
            case 5: {
                // Q5: Customers with > 1 booking
                result.columns = ['Customer_ID', 'Customer_Name', 'Email', 'Phone', 'Booking_Count', 'Total_Spent'];
                result.rows = customers.map(c => {
                    const cBookings = bookings.filter(b => b.Customer_ID === c.Customer_ID);
                    const bIds = new Set(cBookings.map(b => b.Booking_ID));
                    const spent = payments.filter(p => bIds.has(p.Booking_ID)).reduce((sum, p) => sum + p.Amount, 0);
                    return cBookings.length > 1 ? [c.Customer_ID, c.Customer_Name, c.Email, c.Phone, cBookings.length, `₹${spent.toFixed(2)}`] : null;
                }).filter(Boolean).sort((a, b) => b[4] - a[4]);
                break;
            }
            case 6: {
                // Q6: 5-Table join for Show SH01 (Palazzo IMAX)
                result.columns = ['Show_ID', 'Movie_Name', 'Seat_Number', 'Seat_Type', 'Customer_Name', 'Email', 'Booking_ID', 'Booking_Date'];
                const rows = [];
                const sh01Bookings = bookings.filter(b => b.Show_ID === 'SH01');
                sh01Bookings.forEach(b => {
                    const cust = customers.find(c => c.Customer_ID === b.Customer_ID);
                    const movie = movies.find(m => m.Movie_ID === 'M01');
                    const bSeats = bookedSeats.filter(bs => bs.Booking_ID === b.Booking_ID);
                    bSeats.forEach(bs => {
                        const seat = this.getTable('SEAT').find(s => s.Seat_ID === bs.Seat_ID);
                        rows.push(['SH01', movie.Movie_Name, seat ? seat.Seat_Number : bs.Seat_ID, seat ? seat.Seat_Type : 'N/A', cust.Customer_Name, cust.Email, b.Booking_ID, b.Booking_Date]);
                    });
                });
                result.rows = rows.sort((a, b) => a[2].localeCompare(b[2]));
                break;
            }
            case 7: {
                // Q7: Movies with zero bookings
                result.columns = ['Movie_ID', 'Movie_Name', 'Genre', 'Language', 'Rating'];
                const bookedMovieIds = new Set(bookings.map(b => {
                    const sh = shows.find(s => s.Show_ID === b.Show_ID);
                    return sh ? sh.Movie_ID : null;
                }).filter(Boolean));
                result.rows = movies.filter(m => !bookedMovieIds.has(m.Movie_ID)).map(m => [m.Movie_ID, m.Movie_Name, m.Genre, m.Language, m.Rating]);
                break;
            }
            case 8: {
                // Q8: Customers who paid exclusively via UPI
                result.columns = ['Customer_ID', 'Customer_Name', 'Email', 'Payment_Mode_Profile'];
                result.rows = customers.map(c => {
                    const cBookings = bookings.filter(b => b.Customer_ID === c.Customer_ID);
                    if (cBookings.length === 0) return null;
                    const bIds = new Set(cBookings.map(b => b.Booking_ID));
                    const cPayments = payments.filter(p => bIds.has(p.Booking_ID));
                    const modes = new Set(cPayments.map(p => p.Payment_Mode));
                    if (modes.size === 1 && modes.has('UPI')) {
                        return [c.Customer_ID, c.Customer_Name, c.Email, '100% UPI Exclusively'];
                    }
                    return null;
                }).filter(Boolean);
                break;
            }
            case 9: {
                // Q9: Shows with zero bookings
                result.columns = ['Show_ID', 'Movie_Name', 'Theater_Name', 'Screen_Name', 'Show_Date', 'Show_Time', 'Format', 'Ticket_Price'];
                const bookedShowIds = new Set(bookings.map(b => b.Show_ID));
                result.rows = shows.filter(sh => !bookedShowIds.has(sh.Show_ID)).map(sh => {
                    const sc = screens.find(s => s.Screen_ID === sh.Screen_ID);
                    const th = theaters.find(t => t.Theater_ID === sc.Theater_ID);
                    const mv = movies.find(m => m.Movie_ID === sh.Movie_ID);
                    return [sh.Show_ID, mv.Movie_Name, th.Theater_Name, sc.Screen_Name || `Screen ${sc.Screen_Number}`, sh.Show_Date, sh.Show_Time, sh.Format, `₹${sh.Ticket_Price}`];
                });
                break;
            }
            case 10: {
                // Q10: Top 3 Highest Revenue Shows
                result.columns = ['Show_ID', 'Movie_Name', 'Theater_Name', 'Screen_Name', 'Format', 'Total_Seats_Sold', 'Total_Revenue'];
                const showStats = shows.map(sh => {
                    const sc = screens.find(s => s.Screen_ID === sh.Screen_ID);
                    const th = theaters.find(t => t.Theater_ID === sc.Theater_ID);
                    const mv = movies.find(m => m.Movie_ID === sh.Movie_ID);
                    const shBookings = bookings.filter(b => b.Show_ID === sh.Show_ID);
                    const bIds = new Set(shBookings.map(b => b.Booking_ID));
                    const seatsSold = bookedSeats.filter(bs => bIds.has(bs.Booking_ID)).length;
                    const rev = payments.filter(p => bIds.has(p.Booking_ID)).reduce((sum, p) => sum + p.Amount, 0);
                    return { id: sh.Show_ID, movie: mv.Movie_Name, theater: th.Theater_Name, screen: sc.Screen_Name || `Screen ${sc.Screen_Number}`, format: sh.Format, seats: seatsSold, rev };
                }).sort((a, b) => b.rev - a.rev).slice(0, 3);
                result.rows = showStats.map(s => [s.id, s.movie, s.theater, s.screen, s.format, s.seats, `₹${s.rev.toFixed(2)}`]);
                break;
            }
            case 11: {
                // Q11: Screen Capacity Utilization (%)
                result.columns = ['Show_ID', 'Movie_Name', 'Screen_Name', 'Total_Capacity', 'Seats_Booked', 'Occupancy (%)'];
                result.rows = shows.map(sh => {
                    const sc = screens.find(s => s.Screen_ID === sh.Screen_ID);
                    const mv = movies.find(m => m.Movie_ID === sh.Movie_ID);
                    const shBookings = bookings.filter(b => b.Show_ID === sh.Show_ID);
                    const bIds = new Set(shBookings.map(b => b.Booking_ID));
                    const seatsSold = bookedSeats.filter(bs => bIds.has(bs.Booking_ID)).length;
                    const occ = ((seatsSold * 100.0) / (sc.Capacity || 1)).toFixed(2);
                    return [sh.Show_ID, mv.Movie_Name, sc.Screen_Name || `Screen ${sc.Screen_Number}`, sc.Capacity, seatsSold, `${occ}%`];
                }).sort((a, b) => parseFloat(b[5]) - parseFloat(a[5]));
                break;
            }
            case 12: {
                // Q12: Customers who booked both Superman and Heat
                result.columns = ['Customer_ID', 'Customer_Name', 'Email', 'Matched_Movies'];
                result.rows = customers.map(c => {
                    const cBookings = bookings.filter(b => b.Customer_ID === c.Customer_ID);
                    const watchedMovies = new Set(cBookings.map(b => {
                        const sh = shows.find(s => s.Show_ID === b.Show_ID);
                        const mv = movies.find(m => m.Movie_ID === sh.Movie_ID);
                        return mv ? mv.Movie_Name : '';
                    }));
                    if ((watchedMovies.has('Superman') || watchedMovies.has('Superman: Legacy')) && watchedMovies.has('Heat')) {
                        return [c.Customer_ID, c.Customer_Name, c.Email, 'Superman & Heat'];
                    }
                    return null;
                }).filter(Boolean);
                break;
            }
            case 13: {
                // Q13: Chennai Theater Show count and distinct genres
                result.columns = ['Theater_Name', 'City', 'Total_Shows', 'Total_Movies_Screened', 'Distinct_Genres_Available'];
                result.rows = theaters.filter(t => t.City === 'Chennai').map(th => {
                    const thScreens = screens.filter(sc => sc.Theater_ID === th.Theater_ID).map(sc => sc.Screen_ID);
                    const thShows = shows.filter(sh => thScreens.includes(sh.Screen_ID));
                    const thMovieIds = new Set(thShows.map(sh => sh.Movie_ID));
                    const thGenres = new Set(movies.filter(m => thMovieIds.has(m.Movie_ID)).map(m => m.Genre));
                    return [th.Theater_Name, th.City, thShows.length, thMovieIds.size, thGenres.size];
                });
                break;
            }
            case 14: {
                // Q14: PLF formats (IMAX, P[XL], BIGPIX) with price >= 380
                result.columns = ['Show_ID', 'Movie_Name', 'Theater_Name', 'Screen_Name', 'Format', 'Show_Date', 'Time', 'Ticket_Price'];
                const plfFormats = ['IMAX 2D', 'IMAX 3D', 'P[XL] 2D', 'P[XL] 3D', 'BIGPIX 2D', 'BIGPIX 3D'];
                result.rows = shows.filter(sh => plfFormats.includes(sh.Format) && sh.Ticket_Price >= 380).map(sh => {
                    const sc = screens.find(s => s.Screen_ID === sh.Screen_ID);
                    const th = theaters.find(t => t.Theater_ID === sc.Theater_ID);
                    const mv = movies.find(m => m.Movie_ID === sh.Movie_ID);
                    return [sh.Show_ID, mv.Movie_Name, th.Theater_Name, sc.Screen_Name || `Screen ${sc.Screen_Number}`, sh.Format, sh.Show_Date, sh.Show_Time, `₹${sh.Ticket_Price}`];
                }).sort((a, b) => parseFloat(b[7].replace('₹', '')) - parseFloat(a[7].replace('₹', '')));
                break;
            }
            case 15: {
                // Q15: Multi-seat bookings (count > 1)
                result.columns = ['Booking_ID', 'Customer_Name', 'Movie_Name', 'Seats_Count', 'Payment_Mode', 'Total_Paid'];
                result.rows = bookings.map(b => {
                    const bSeats = bookedSeats.filter(bs => bs.Booking_ID === b.Booking_ID);
                    if (bSeats.length <= 1) return null;
                    const cust = customers.find(c => c.Customer_ID === b.Customer_ID);
                    const sh = shows.find(s => s.Show_ID === b.Show_ID);
                    const mv = movies.find(m => m.Movie_ID === sh.Movie_ID);
                    const pay = payments.find(p => p.Booking_ID === b.Booking_ID);
                    return [b.Booking_ID, cust.Customer_Name, mv.Movie_Name, bSeats.length, pay ? pay.Payment_Mode : 'N/A', `₹${pay ? pay.Amount : 0}`];
                }).filter(Boolean).sort((a, b) => b[3] - a[3]);
                break;
            }
            case 16: {
                // Q16: Max capacity screen per Chennai theater
                result.columns = ['Theater_Name', 'Screen_ID', 'Screen_Name', 'Screen_Type', 'Capacity (Seats)'];
                result.rows = theaters.map(th => {
                    const thScreens = screens.filter(s => s.Theater_ID === th.Theater_ID);
                    const maxScreen = thScreens.reduce((max, s) => s.Capacity > max.Capacity ? s : max, thScreens[0]);
                    return maxScreen ? [th.Theater_Name, maxScreen.Screen_ID, maxScreen.Screen_Name || `Screen ${maxScreen.Screen_Number}`, maxScreen.Screen_Type, maxScreen.Capacity] : null;
                }).filter(Boolean).sort((a, b) => b[4] - a[4]);
                break;
            }
            case 17: {
                // Q17: Breakdown by Payment Mode
                result.columns = ['Payment_Mode', 'Total_Transactions', 'Total_Revenue', 'Average_Transaction_Value'];
                const modes = ['Credit Card', 'Debit Card', 'UPI', 'Net Banking', 'Cash'];
                result.rows = modes.map(mode => {
                    const modePays = payments.filter(p => p.Payment_Mode === mode);
                    const total = modePays.reduce((sum, p) => sum + p.Amount, 0);
                    const avg = modePays.length > 0 ? (total / modePays.length).toFixed(2) : '0.00';
                    return [mode, modePays.length, `₹${total.toFixed(2)}`, `₹${avg}`];
                }).sort((a, b) => parseFloat(b[2].replace('₹', '')) - parseFloat(a[2].replace('₹', '')));
                break;
            }
            case 18: {
                // Q18: Relational Division - Customers who watched in EVERY theater in Chennai
                result.columns = ['Customer_ID', 'Customer_Name', 'Email', 'Chennai_Theaters_Visited'];
                const chennaiTheaters = theaters.filter(t => t.City === 'Chennai');
                const chennaiTheaterIds = new Set(chennaiTheaters.map(t => t.Theater_ID));

                result.rows = customers.map(c => {
                    const cBookings = bookings.filter(b => b.Customer_ID === c.Customer_ID);
                    const visitedTheaterIds = new Set(cBookings.map(b => {
                        const sh = shows.find(s => s.Show_ID === b.Show_ID);
                        const sc = screens.find(s => s.Screen_ID === sh.Screen_ID);
                        return sc ? sc.Theater_ID : null;
                    }).filter(Boolean));

                    const visitedAll = [...chennaiTheaterIds].every(id => visitedTheaterIds.has(id));
                    if (visitedAll) {
                        return [c.Customer_ID, c.Customer_Name, c.Email, `${visitedTheaterIds.size} / ${chennaiTheaterIds.size} (All 6 Theaters)`];
                    }
                    return null;
                }).filter(Boolean);
                break;
            }
            default:
                throw new Error(`Query Q${queryId} not recognized.`);
        }

        const elapsed = (performance.now() - startTime).toFixed(2);
        return {
            queryId: qId,
            columns: result.columns,
            rows: result.rows,
            rowCount: result.rows.length,
            executionTimeMs: elapsed
        };
    }
}

// Initialize globally
window.MTRSEngine = new MTRSRelationalEngine();
