-- ============================================================================
-- DATABASE MANAGEMENT SYSTEMS PROJECT: MOVIE TICKET RESERVATION SYSTEM (MTRS)
-- File: database/procedures.sql
-- Description: Stored Procedures, Functions, and Triggers for business logic,
--              concurrency protection (prevent double-booking), and transactions.
-- Engine: MySQL 8.0+
-- ============================================================================

USE mtrs_db;

DELIMITER $$

-- ----------------------------------------------------------------------------
-- TRIGGER 1: trg_PreventDoubleBooking
-- Objective: Ensure that a seat cannot be booked more than once for the same show.
-- Fires: BEFORE INSERT on BOOKED_SEAT
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_PreventDoubleBooking$$
CREATE TRIGGER trg_PreventDoubleBooking
BEFORE INSERT ON BOOKED_SEAT
FOR EACH ROW
BEGIN
    DECLARE v_show_id VARCHAR(10);
    DECLARE v_already_booked INT DEFAULT 0;

    -- Retrieve the show_id associated with the new booking
    SELECT Show_ID INTO v_show_id
    FROM BOOKING
    WHERE Booking_ID = NEW.Booking_ID;

    -- Check if this seat is already booked for the exact same show
    SELECT COUNT(*) INTO v_already_booked
    FROM BOOKED_SEAT bs
    INNER JOIN BOOKING b ON bs.Booking_ID = b.Booking_ID
    WHERE b.Show_ID = v_show_id 
      AND bs.Seat_ID = NEW.Seat_ID;

    IF v_already_booked > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Integrity Violation: Seat is already booked for this show.';
    END IF;
END$$

-- ----------------------------------------------------------------------------
-- TRIGGER 2: trg_ValidateSeatScreen
-- Objective: Ensure that the seat being booked actually belongs to the 
--            screen where the show is scheduled.
-- Fires: BEFORE INSERT on BOOKED_SEAT
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_ValidateSeatScreen$$
CREATE TRIGGER trg_ValidateSeatScreen
BEFORE INSERT ON BOOKED_SEAT
FOR EACH ROW
BEGIN
    DECLARE v_show_screen VARCHAR(10);
    DECLARE v_seat_screen VARCHAR(10);

    -- Find the screen hosting the show for this booking
    SELECT sh.Screen_ID INTO v_show_screen
    FROM BOOKING b
    INNER JOIN SHOWS sh ON b.Show_ID = sh.Show_ID
    WHERE b.Booking_ID = NEW.Booking_ID;

    -- Find the screen the seat belongs to
    SELECT Screen_ID INTO v_seat_screen
    FROM SEAT
    WHERE Seat_ID = NEW.Seat_ID;

    IF v_show_screen IS NOT NULL AND v_seat_screen IS NOT NULL THEN
        IF v_show_screen <> v_seat_screen THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Domain Violation: The booked seat does not belong to the screen hosting this show.';
        END IF;
    END IF;
END$$

-- ----------------------------------------------------------------------------
-- TRIGGER 3: trg_ValidatePaymentAmount
-- Objective: Validate payment amount is positive and matches transaction rules.
-- Fires: BEFORE INSERT on PAYMENT
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_ValidatePaymentAmount$$
CREATE TRIGGER trg_ValidatePaymentAmount
BEFORE INSERT ON PAYMENT
FOR EACH ROW
BEGIN
    IF NEW.Amount <= 0.00 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Validation Error: Payment amount must be strictly greater than 0.';
    END IF;
END$$

-- ----------------------------------------------------------------------------
-- PROCEDURE 1: sp_CheckSeatAvailability
-- Objective: Return the full seat map for a show with current status.
-- Parameters:
--   IN p_Show_ID VARCHAR(10)
-- ----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_CheckSeatAvailability$$
CREATE PROCEDURE sp_CheckSeatAvailability(
    IN p_Show_ID VARCHAR(10)
)
BEGIN
    DECLARE v_screen_id VARCHAR(10);

    -- Find screen for the given show
    SELECT Screen_ID INTO v_screen_id
    FROM SHOWS
    WHERE Show_ID = p_Show_ID;

    IF v_screen_id IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Error: Show ID not found.';
    END IF;

    -- Return all seats with status 'BOOKED' or 'AVAILABLE'
    SELECT 
        s.Seat_ID,
        s.Seat_Number,
        s.Seat_Type,
        CASE 
            WHEN bs.Seat_ID IS NOT NULL THEN 'BOOKED'
            ELSE 'AVAILABLE'
        END AS Status
    FROM SEAT s
    LEFT JOIN (
        SELECT bs_inner.Seat_ID
        FROM BOOKED_SEAT bs_inner
        INNER JOIN BOOKING b_inner ON bs_inner.Booking_ID = b_inner.Booking_ID
        WHERE b_inner.Show_ID = p_Show_ID
    ) bs ON s.Seat_ID = bs.Seat_ID
    WHERE s.Screen_ID = v_screen_id
    ORDER BY s.Seat_Number;
END$$

-- ----------------------------------------------------------------------------
-- PROCEDURE 2: sp_BookTicketTransaction
-- Objective: Atomic transaction to create Booking, Booked Seats, and Payment.
-- Parameters:
--   p_Booking_ID, p_Customer_ID, p_Show_ID, p_Format, p_Ticket_Price,
--   p_Payment_ID, p_Payment_Mode, p_Amount, p_Seat_ID_1, p_Seat_ID_2 (Optional)
-- ----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_BookTicketTransaction$$
CREATE PROCEDURE sp_BookTicketTransaction(
    IN p_Booking_ID VARCHAR(10),
    IN p_Customer_ID VARCHAR(10),
    IN p_Show_ID VARCHAR(10),
    IN p_Format VARCHAR(20),
    IN p_Ticket_Price DECIMAL(8,2),
    IN p_Payment_ID VARCHAR(10),
    IN p_Payment_Mode VARCHAR(30),
    IN p_Amount DECIMAL(8,2),
    IN p_Seat_ID_1 VARCHAR(10),
    IN p_Seat_ID_2 VARCHAR(10)
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        -- Roll back all operations upon any integrity error
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    -- 1. Insert Booking Record
    INSERT INTO BOOKING (Booking_ID, Customer_ID, Show_ID, Booking_Date, Ticket_Price, Format)
    VALUES (p_Booking_ID, p_Customer_ID, p_Show_ID, NOW(), p_Ticket_Price, p_Format);

    -- 2. Insert First Seat (Trigger trg_PreventDoubleBooking will fire here)
    IF p_Seat_ID_1 IS NOT NULL AND p_Seat_ID_1 <> '' THEN
        INSERT INTO BOOKED_SEAT (Booking_ID, Seat_ID)
        VALUES (p_Booking_ID, p_Seat_ID_1);
    END IF;

    -- 3. Insert Second Seat if provided
    IF p_Seat_ID_2 IS NOT NULL AND p_Seat_ID_2 <> '' THEN
        INSERT INTO BOOKED_SEAT (Booking_ID, Seat_ID)
        VALUES (p_Booking_ID, p_Seat_ID_2);
    END IF;

    -- 4. Insert Payment Record
    INSERT INTO PAYMENT (Payment_ID, Booking_ID, Payment_Mode, Amount, Payment_Date)
    VALUES (p_Payment_ID, p_Booking_ID, p_Payment_Mode, p_Amount, NOW());

    -- Commit transaction
    COMMIT;
END$$

-- ----------------------------------------------------------------------------
-- PROCEDURE 3: sp_GetShowRevenueReport
-- Objective: Generate comprehensive revenue report for all shows or specific movie.
-- ----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_GetShowRevenueReport$$
CREATE PROCEDURE sp_GetShowRevenueReport(
    IN p_Movie_ID VARCHAR(10)
)
BEGIN
    SELECT 
        sh.Show_ID,
        m.Movie_Name,
        t.Theater_Name,
        s.Screen_Number,
        sh.Show_Date,
        sh.Show_Time,
        sh.Format,
        sh.Ticket_Price,
        s.Capacity AS Total_Seats,
        COUNT(bs.Seat_ID) AS Booked_Seats,
        s.Capacity - COUNT(bs.Seat_ID) AS Remaining_Seats,
        ROUND((COUNT(bs.Seat_ID) * 100.0 / s.Capacity), 1) AS Occupancy_Rate,
        COALESCE(SUM(p.Amount), 0.00) AS Total_Revenue
    FROM SHOWS sh
    INNER JOIN MOVIE m ON sh.Movie_ID = m.Movie_ID
    INNER JOIN SCREEN s ON sh.Screen_ID = s.Screen_ID
    INNER JOIN THEATER t ON s.Theater_ID = t.Theater_ID
    LEFT JOIN BOOKING b ON sh.Show_ID = b.Show_ID
    LEFT JOIN BOOKED_SEAT bs ON b.Booking_ID = bs.Booking_ID
    LEFT JOIN PAYMENT p ON b.Booking_ID = p.Booking_ID
    WHERE (p_Movie_ID IS NULL OR p_Movie_ID = '' OR sh.Movie_ID = p_Movie_ID)
    GROUP BY 
        sh.Show_ID, m.Movie_Name, t.Theater_Name, s.Screen_Number, 
        sh.Show_Date, sh.Show_Time, sh.Format, sh.Ticket_Price, s.Capacity
    ORDER BY Total_Revenue DESC, Occupancy_Rate DESC;
END$$

-- ----------------------------------------------------------------------------
-- PROCEDURE 4: sp_CancelBooking
-- Objective: Safely cancel a customer booking and release the seats.
-- ----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_CancelBooking$$
CREATE PROCEDURE sp_CancelBooking(
    IN p_Booking_ID VARCHAR(10),
    IN p_Customer_ID VARCHAR(10)
)
BEGIN
    DECLARE v_exists INT DEFAULT 0;

    -- Verify booking exists and belongs to the customer
    SELECT COUNT(*) INTO v_exists
    FROM BOOKING
    WHERE Booking_ID = p_Booking_ID 
      AND Customer_ID = p_Customer_ID;

    IF v_exists = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Authorization Error: Booking not found or does not belong to specified customer.';
    END IF;

    START TRANSACTION;
        -- Remove payment record
        DELETE FROM PAYMENT WHERE Booking_ID = p_Booking_ID;

        -- Remove booked seats (freeing seats for others)
        DELETE FROM BOOKED_SEAT WHERE Booking_ID = p_Booking_ID;

        -- Remove booking header
        DELETE FROM BOOKING WHERE Booking_ID = p_Booking_ID;
    COMMIT;
END$$

DELIMITER ;
