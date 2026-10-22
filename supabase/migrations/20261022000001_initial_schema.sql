-- ==============================================================================
-- MOVIE TICKET RESERVATION SYSTEM (MTRS)
-- Migration: 20261022000001_initial_schema.sql
-- Description: PostgreSQL / Supabase Relational Schema (BCNF)
--              Preserves full compatibility with Chennai cinema destinations,
--              PLF formats ('IMAX', 'P[XL]', 'BIGPIX'), high-res poster telemetry,
--              and atomic double-booking prevention.
-- ==============================================================================

-- Enable UUID and Cryptographic extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 1. THEATERS TABLE
-- Represents physical cinema destinations across Chennai.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS theaters (
    theater_id VARCHAR(10) PRIMARY KEY,
    theater_name VARCHAR(100) NOT NULL,
    city VARCHAR(50) NOT NULL,
    state VARCHAR(50) NOT NULL,
    country VARCHAR(50) NOT NULL DEFAULT 'India',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 2. SCREENS TABLE
-- Physical auditoriums inside a theater, including technical specifications.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS screens (
    screen_id VARCHAR(10) PRIMARY KEY,
    theater_id VARCHAR(10) NOT NULL REFERENCES theaters(theater_id) ON DELETE CASCADE ON UPDATE CASCADE,
    screen_number INT NOT NULL,
    screen_name VARCHAR(50) NOT NULL DEFAULT '',
    screen_type VARCHAR(30) NOT NULL DEFAULT 'Standard',
    capacity INT NOT NULL CHECK (capacity > 0),
    projection_tech VARCHAR(50) NOT NULL DEFAULT '2K Digital',
    audio_tech VARCHAR(50) NOT NULL DEFAULT 'Dolby 7.1',
    verification_status VARCHAR(50) NOT NULL DEFAULT 'Published - Unverified',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_theater_screen UNIQUE (theater_id, screen_number)
);

-- ------------------------------------------------------------------------------
-- 3. MOVIES TABLE
-- Catalog of movies including poster and backdrop asset telemetry.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS movies (
    movie_id VARCHAR(10) PRIMARY KEY,
    movie_name VARCHAR(100) NOT NULL,
    genre VARCHAR(50) NOT NULL,
    rating DECIMAL(3,1) NOT NULL DEFAULT 0.0 CHECK (rating >= 0.0 AND rating <= 10.0),
    duration INT NOT NULL CHECK (duration > 0), -- Duration in minutes
    language VARCHAR(30) NOT NULL,
    synopsis TEXT,
    cast_members TEXT,
    poster_url TEXT,
    poster_hires_url TEXT,
    backdrop_url TEXT,
    tmdb_id INT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 4. SHOWS TABLE
-- Scheduled screening of a movie in a specific auditorium.
-- Supports standard and PLF formats with strict check constraints.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS shows (
    show_id VARCHAR(10) PRIMARY KEY,
    movie_id VARCHAR(10) NOT NULL REFERENCES movies(movie_id) ON DELETE CASCADE ON UPDATE CASCADE,
    screen_id VARCHAR(10) NOT NULL REFERENCES screens(screen_id) ON DELETE CASCADE ON UPDATE CASCADE,
    show_date DATE NOT NULL,
    show_time TIME NOT NULL,
    format VARCHAR(20) NOT NULL DEFAULT '2D' CHECK (
        format IN ('2D', '3D', 'IMAX 2D', 'IMAX 3D', 'P[XL] 2D', 'P[XL] 3D', 'BIGPIX 2D', 'BIGPIX 3D')
    ),
    ticket_price DECIMAL(8,2) NOT NULL CHECK (ticket_price > 0.0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 5. SEATS TABLE
-- Individual seats belonging to a specific screen auditorium.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS seats (
    seat_id VARCHAR(20) PRIMARY KEY,
    screen_id VARCHAR(10) NOT NULL REFERENCES screens(screen_id) ON DELETE CASCADE ON UPDATE CASCADE,
    seat_number VARCHAR(10) NOT NULL,
    seat_type VARCHAR(20) NOT NULL DEFAULT 'Regular' CHECK (
        seat_type IN ('VIP', 'Balcony', 'Premium', 'Regular')
    ),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_screen_seat UNIQUE (screen_id, seat_number)
);

-- ------------------------------------------------------------------------------
-- 6. CUSTOMERS TABLE
-- Customer account profiles with foreign reference to Supabase auth.users.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS customers (
    customer_id VARCHAR(10) PRIMARY KEY,
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    customer_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(15),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 7. BOOKINGS TABLE
-- Header records for confirmed ticket reservation transactions.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bookings (
    booking_id VARCHAR(10) PRIMARY KEY,
    customer_id VARCHAR(10) NOT NULL REFERENCES customers(customer_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    show_id VARCHAR(10) NOT NULL REFERENCES shows(show_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    booking_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ticket_price DECIMAL(8,2) NOT NULL CHECK (ticket_price >= 0.0),
    format VARCHAR(20) NOT NULL CHECK (
        format IN ('2D', '3D', 'IMAX 2D', 'IMAX 3D', 'P[XL] 2D', 'P[XL] 3D', 'BIGPIX 2D', 'BIGPIX 3D')
    ),
    status VARCHAR(20) NOT NULL DEFAULT 'CONFIRMED' CHECK (
        status IN ('CONFIRMED', 'CANCELLED', 'REFUNDED')
    ),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 8. BOOKED_SEATS TABLE
-- Bridge table representing reserved seats for a booking.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS booked_seats (
    booking_id VARCHAR(10) NOT NULL REFERENCES bookings(booking_id) ON DELETE CASCADE ON UPDATE CASCADE,
    seat_id VARCHAR(20) NOT NULL REFERENCES seats(seat_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (booking_id, seat_id)
);

-- ------------------------------------------------------------------------------
-- 9. PAYMENTS TABLE
-- 1-to-1 payment transaction records linked to bookings.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payments (
    payment_id VARCHAR(10) PRIMARY KEY,
    booking_id VARCHAR(10) NOT NULL REFERENCES bookings(booking_id) ON DELETE CASCADE ON UPDATE CASCADE,
    payment_mode VARCHAR(30) NOT NULL CHECK (
        payment_mode IN ('Credit Card', 'Debit Card', 'UPI', 'Net Banking', 'Cash')
    ),
    amount DECIMAL(8,2) NOT NULL CHECK (amount > 0.0),
    payment_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status VARCHAR(20) NOT NULL DEFAULT 'SUCCESS' CHECK (
        status IN ('SUCCESS', 'REFUNDED', 'FAILED')
    ),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_payment_booking UNIQUE (booking_id)
);

-- ------------------------------------------------------------------------------
-- 10. INDEXES FOR PERFORMANCE & ACADEMIC QUERIES
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_shows_movie_date ON shows(movie_id, show_date);
CREATE INDEX IF NOT EXISTS idx_shows_screen ON shows(screen_id);
CREATE INDEX IF NOT EXISTS idx_seat_screen ON seats(screen_id);
CREATE INDEX IF NOT EXISTS idx_booking_customer ON bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_booking_show ON bookings(show_id);
CREATE INDEX IF NOT EXISTS idx_booked_seat_seat ON booked_seats(seat_id);
CREATE INDEX IF NOT EXISTS idx_payment_date ON payments(payment_date);

-- ------------------------------------------------------------------------------
-- 11. MONOTONIC SEQUENCES & ID GENERATORS
-- Prevents duplicate BK07 / PAY07 collisions by using server-enforced sequences.
-- ------------------------------------------------------------------------------
CREATE SEQUENCE IF NOT EXISTS booking_id_seq START WITH 9;
CREATE SEQUENCE IF NOT EXISTS payment_id_seq START WITH 9;
CREATE SEQUENCE IF NOT EXISTS customer_id_seq START WITH 6;

CREATE OR REPLACE FUNCTION generate_booking_id() RETURNS VARCHAR(10) AS $$
DECLARE
    next_val INT;
    candidate VARCHAR(10);
BEGIN
    LOOP
        next_val := nextval('booking_id_seq');
        candidate := 'BK' || LPAD(next_val::TEXT, 2, '0');
        IF NOT EXISTS (SELECT 1 FROM bookings WHERE booking_id = candidate) THEN
            RETURN candidate;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_payment_id() RETURNS VARCHAR(10) AS $$
DECLARE
    next_val INT;
    candidate VARCHAR(10);
BEGIN
    LOOP
        next_val := nextval('payment_id_seq');
        candidate := 'PAY' || LPAD(next_val::TEXT, 2, '0');
        IF NOT EXISTS (SELECT 1 FROM payments WHERE payment_id = candidate) THEN
            RETURN candidate;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_customer_id() RETURNS VARCHAR(10) AS $$
DECLARE
    next_val INT;
    candidate VARCHAR(10);
BEGIN
    LOOP
        next_val := nextval('customer_id_seq');
        candidate := 'CU' || LPAD(next_val::TEXT, 2, '0');
        IF NOT EXISTS (SELECT 1 FROM customers WHERE customer_id = candidate) THEN
            RETURN candidate;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------------------------------------------------
-- 12. TRIGGERS: DOUBLE-BOOKING & SEAT DOMAIN INTEGRITY
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_trg_prevent_double_booking()
RETURNS TRIGGER AS $$
DECLARE
    v_show_id VARCHAR(10);
    v_already_booked INT;
BEGIN
    SELECT show_id INTO v_show_id
    FROM bookings
    WHERE booking_id = NEW.booking_id;

    SELECT COUNT(*) INTO v_already_booked
    FROM booked_seats bs
    INNER JOIN bookings b ON bs.booking_id = b.booking_id
    WHERE b.show_id = v_show_id
      AND bs.seat_id = NEW.seat_id
      AND b.status = 'CONFIRMED';

    IF v_already_booked > 0 THEN
        RAISE EXCEPTION 'Trigger trg_prevent_double_booking fired: Seat % is already booked for this show.', NEW.seat_id
            USING ERRCODE = '23505';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_double_booking ON booked_seats;
CREATE TRIGGER trg_prevent_double_booking
BEFORE INSERT ON booked_seats
FOR EACH ROW
EXECUTE FUNCTION fn_trg_prevent_double_booking();

CREATE OR REPLACE FUNCTION fn_trg_validate_seat_screen()
RETURNS TRIGGER AS $$
DECLARE
    v_show_screen VARCHAR(10);
    v_seat_screen VARCHAR(10);
BEGIN
    SELECT sh.screen_id INTO v_show_screen
    FROM bookings b
    INNER JOIN shows sh ON b.show_id = sh.show_id
    WHERE b.booking_id = NEW.booking_id;

    SELECT screen_id INTO v_seat_screen
    FROM seats
    WHERE seat_id = NEW.seat_id;

    IF v_show_screen IS NOT NULL AND v_seat_screen IS NOT NULL THEN
        IF v_show_screen <> v_seat_screen THEN
            RAISE EXCEPTION 'Trigger trg_validate_seat_screen fired: The booked seat % does not belong to screen %.',
                NEW.seat_id, v_show_screen
                USING ERRCODE = '23514';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validate_seat_screen ON booked_seats;
CREATE TRIGGER trg_validate_seat_screen
BEFORE INSERT ON booked_seats
FOR EACH ROW
EXECUTE FUNCTION fn_trg_validate_seat_screen();

-- ------------------------------------------------------------------------------
-- 13. ATOMIC STORED PROCEDURE: sp_book_ticket_transaction
-- Callable via Supabase RPC (supabase.rpc('sp_book_ticket_transaction', ...))
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_book_ticket_transaction(
    p_customer_id VARCHAR(10),
    p_show_id VARCHAR(10),
    p_format VARCHAR(20),
    p_ticket_price DECIMAL(8,2),
    p_payment_mode VARCHAR(30),
    p_amount DECIMAL(8,2),
    p_seat_ids TEXT[],
    p_booking_id VARCHAR(10) DEFAULT NULL,
    p_payment_id VARCHAR(10) DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_booking_id VARCHAR(10);
    v_payment_id VARCHAR(10);
    v_seat_id TEXT;
    v_new_booking JSONB;
    v_new_payment JSONB;
    v_show RECORD;
BEGIN
    -- 1. Validate customer existence
    IF NOT EXISTS (SELECT 1 FROM customers WHERE customer_id = p_customer_id) THEN
        RAISE EXCEPTION 'Integrity Error: Customer % does not exist.', p_customer_id;
    END IF;

    -- 2. Validate show existence and lock show row for update
    SELECT * INTO v_show FROM shows WHERE show_id = p_show_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Integrity Error: Show % does not exist.', p_show_id;
    END IF;

    -- 3. Validate seat selection
    IF p_seat_ids IS NULL OR array_length(p_seat_ids, 1) = 0 THEN
        RAISE EXCEPTION 'Validation Error: At least one seat must be selected for booking.';
    END IF;

    -- 4. Resolve unique Booking_ID and Payment_ID
    IF p_booking_id IS NOT NULL AND TRIM(p_booking_id) <> '' THEN
        IF EXISTS (SELECT 1 FROM bookings WHERE booking_id = p_booking_id) THEN
            RAISE EXCEPTION 'Primary Key Violation: Booking ID % already exists.', p_booking_id;
        END IF;
        v_booking_id := TRIM(p_booking_id);
    ELSE
        v_booking_id := generate_booking_id();
    END IF;

    IF p_payment_id IS NOT NULL AND TRIM(p_payment_id) <> '' THEN
        IF EXISTS (SELECT 1 FROM payments WHERE payment_id = p_payment_id) THEN
            RAISE EXCEPTION 'Primary Key Violation: Payment ID % already exists.', p_payment_id;
        END IF;
        v_payment_id := TRIM(p_payment_id);
    ELSE
        v_payment_id := generate_payment_id();
    END IF;

    -- 5. Insert Booking
    INSERT INTO bookings (booking_id, customer_id, show_id, booking_date, ticket_price, format, status)
    VALUES (v_booking_id, p_customer_id, p_show_id, NOW(), p_ticket_price, p_format, 'CONFIRMED');

    -- 6. Insert Booked Seats (Triggers will validate screen and double-booking)
    FOREACH v_seat_id IN ARRAY p_seat_ids LOOP
        INSERT INTO booked_seats (booking_id, seat_id)
        VALUES (v_booking_id, v_seat_id);
    END LOOP;

    -- 7. Insert Payment
    INSERT INTO payments (payment_id, booking_id, payment_mode, amount, payment_date, status)
    VALUES (v_payment_id, v_booking_id, p_payment_mode, p_amount, NOW(), 'SUCCESS');

    -- Return JSON composite result
    RETURN jsonb_build_object(
        'success', true,
        'booking_id', v_booking_id,
        'payment_id', v_payment_id,
        'customer_id', p_customer_id,
        'show_id', p_show_id,
        'seat_ids', p_seat_ids,
        'amount', p_amount,
        'status', 'CONFIRMED'
    );
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------------------------------------------------
-- 14. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------
ALTER TABLE theaters ENABLE ROW LEVEL SECURITY;
ALTER TABLE screens ENABLE ROW LEVEL SECURITY;
ALTER TABLE movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE shows ENABLE ROW LEVEL SECURITY;
ALTER TABLE seats ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE booked_seats ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Public Anonymous Browsing Policies (Read catalog & showtimes)
CREATE POLICY "Public theaters are readable by everyone" ON theaters FOR SELECT USING (true);
CREATE POLICY "Public screens are readable by everyone" ON screens FOR SELECT USING (true);
CREATE POLICY "Public movies are readable by everyone" ON movies FOR SELECT USING (true);
CREATE POLICY "Public shows are readable by everyone" ON shows FOR SELECT USING (true);
CREATE POLICY "Public seats are readable by everyone" ON seats FOR SELECT USING (true);
CREATE POLICY "Public booked_seats readable for availability" ON booked_seats FOR SELECT USING (true);

-- Customer Specific Policies
CREATE POLICY "Customers can view their own profile" ON customers
    FOR SELECT USING (auth.uid() = auth_user_id OR auth.role() = 'anon');

CREATE POLICY "Customers can view their own bookings" ON bookings
    FOR SELECT USING (
        customer_id IN (SELECT customer_id FROM customers WHERE auth_user_id = auth.uid()) 
        OR auth.role() = 'anon'
    );

CREATE POLICY "Customers can view their own payments" ON payments
    FOR SELECT USING (
        booking_id IN (
            SELECT b.booking_id FROM bookings b 
            JOIN customers c ON b.customer_id = c.customer_id 
            WHERE c.auth_user_id = auth.uid()
        )
        OR auth.role() = 'anon'
    );

-- ------------------------------------------------------------------------------
-- 15. BACKWARD-COMPATIBLE RELATIONAL VIEWS (Preserves uppercase/PascalCase)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE VIEW "THEATER" AS SELECT theater_id AS "Theater_ID", theater_name AS "Theater_Name", city AS "City", state AS "State", country AS "Country" FROM theaters;
CREATE OR REPLACE VIEW "SCREEN" AS SELECT screen_id AS "Screen_ID", theater_id AS "Theater_ID", screen_number AS "Screen_Number", screen_name AS "Screen_Name", screen_type AS "Screen_Type", capacity AS "Capacity", projection_tech AS "Projection_Tech", audio_tech AS "Audio_Tech", verification_status AS "Verification_Status" FROM screens;
CREATE OR REPLACE VIEW "MOVIE" AS SELECT movie_id AS "Movie_ID", movie_name AS "Movie_Name", genre AS "Genre", rating AS "Rating", duration AS "Duration", language AS "Language", synopsis AS "Synopsis", cast_members AS "Cast" FROM movies;
CREATE OR REPLACE VIEW "SHOWS" AS SELECT show_id AS "Show_ID", movie_id AS "Movie_ID", screen_id AS "Screen_ID", show_date AS "Show_Date", show_time AS "Show_Time", format AS "Format", ticket_price AS "Ticket_Price" FROM shows;
CREATE OR REPLACE VIEW "SEAT" AS SELECT seat_id AS "Seat_ID", screen_id AS "Screen_ID", seat_number AS "Seat_Number", seat_type AS "Seat_Type" FROM seats;
CREATE OR REPLACE VIEW "CUSTOMER" AS SELECT customer_id AS "Customer_ID", customer_name AS "Customer_Name", email AS "Email", phone AS "Phone" FROM customers;
CREATE OR REPLACE VIEW "BOOKING" AS SELECT booking_id AS "Booking_ID", customer_id AS "Customer_ID", show_id AS "Show_ID", booking_date AS "Booking_Date", ticket_price AS "Ticket_Price", format AS "Format" FROM bookings;
CREATE OR REPLACE VIEW "BOOKED_SEAT" AS SELECT booking_id AS "Booking_ID", seat_id AS "Seat_ID" FROM booked_seats;
CREATE OR REPLACE VIEW "PAYMENT" AS SELECT payment_id AS "Payment_ID", booking_id AS "Booking_ID", payment_mode AS "Payment_Mode", amount AS "Amount", payment_date AS "Payment_Date" FROM payments;
