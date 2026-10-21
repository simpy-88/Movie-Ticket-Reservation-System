-- ============================================================================
-- DATABASE MANAGEMENT SYSTEMS PROJECT: MOVIE TICKET RESERVATION SYSTEM (MTRS)
-- File: database/seed.sql
-- Description: Realistic sample dataset matching assignment specifications (DA1 & DA2).
-- ============================================================================

USE mtrs_db;

SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE PAYMENT;
TRUNCATE TABLE BOOKED_SEAT;
TRUNCATE TABLE BOOKING;
TRUNCATE TABLE SEAT;
TRUNCATE TABLE SHOWS;
TRUNCATE TABLE MOVIE;
TRUNCATE TABLE SCREEN;
TRUNCATE TABLE THEATER;
TRUNCATE TABLE CUSTOMER;
SET FOREIGN_KEY_CHECKS = 1;

-- ----------------------------------------------------------------------------
-- 1. SEED DATA: THEATER (T01 - T03)
-- ----------------------------------------------------------------------------
INSERT INTO THEATER (Theater_ID, Theater_Name, City, State, Country) VALUES
('T01', 'PVR Cinemas - Forum Mall', 'Bangalore', 'Karnataka', 'India'),
('T02', 'INOX Multiplex - Garuda', 'Bangalore', 'Karnataka', 'India'),
('T03', 'Cinepolis - Orion Gateway', 'Bangalore', 'Karnataka', 'India');

-- ----------------------------------------------------------------------------
-- 2. SEED DATA: SCREEN (SC01 - SC05)
-- ----------------------------------------------------------------------------
INSERT INTO SCREEN (Screen_ID, Theater_ID, Screen_Number, Screen_Type, Capacity) VALUES
('SC01', 'T01', 1, 'IMAX Laser', 60),
('SC02', 'T01', 2, 'Dolby Atmos', 80),
('SC03', 'T02', 1, '4DX Dynamic', 50),
('SC04', 'T02', 2, 'Standard 2K', 70),
('SC05', 'T03', 1, 'VIP Luxury Lounge', 40);

-- ----------------------------------------------------------------------------
-- 3. SEED DATA: MOVIE (M01 - M06)
-- ----------------------------------------------------------------------------
INSERT INTO MOVIE (Movie_ID, Movie_Name, Genre, Rating, Duration, Language) VALUES
('M01', 'Superman: Legacy', 'Action/Sci-Fi', 8.6, 150, 'English'),
('M02', 'Heat', 'Action/Crime', 8.3, 170, 'English'),
('M03', 'La La Land', 'Musical/Romance', 8.0, 128, 'English'),
('M04', 'Interstellar', 'Sci-Fi/Adventure', 8.7, 169, 'English'),
('M05', 'Dune: Part Two', 'Sci-Fi/Action', 8.8, 166, 'English'),
('M06', 'Kantara: Chapter 1', 'Action/Thriller', 8.4, 148, 'Kannada');

-- ----------------------------------------------------------------------------
-- 4. SEED DATA: SHOWS (SH01 - SH10)
-- ----------------------------------------------------------------------------
INSERT INTO SHOWS (Show_ID, Movie_ID, Screen_ID, Show_Date, Show_Time, Format, Ticket_Price) VALUES
('SH01', 'M01', 'SC01', '2026-10-21', '10:00:00', 'IMAX 3D', 450.00),
('SH02', 'M01', 'SC01', '2026-10-21', '14:30:00', 'IMAX 3D', 450.00),
('SH03', 'M01', 'SC01', '2026-10-21', '19:15:00', 'IMAX 3D', 520.00),
('SH04', 'M04', 'SC01', '2026-10-22', '18:30:00', 'IMAX 2D', 420.00),
('SH05', 'M02', 'SC02', '2026-10-21', '11:15:00', '2D', 250.00),
('SH06', 'M03', 'SC02', '2026-10-21', '16:00:00', '2D', 260.00),
('SH07', 'M05', 'SC03', '2026-10-21', '13:00:00', '3D', 390.00),
('SH08', 'M04', 'SC03', '2026-10-21', '17:45:00', '3D', 390.00),
('SH09', 'M06', 'SC04', '2026-10-21', '19:00:00', '2D', 220.00),
('SH10', 'M03', 'SC05', '2026-10-21', '20:30:00', '2D', 550.00);

-- ----------------------------------------------------------------------------
-- 5. SEED DATA: SEAT (Representative inventory for screens)
-- Rows: A (VIP), B (Balcony), C (Premium), D (Regular), E (Regular)
-- ----------------------------------------------------------------------------
-- Seats for SC01 (PVR IMAX)
INSERT INTO SEAT (Seat_ID, Screen_ID, Seat_Number, Seat_Type) VALUES
('S0101', 'SC01', 'A1', 'VIP'), ('S0102', 'SC01', 'A2', 'VIP'), ('S0103', 'SC01', 'A3', 'VIP'), ('S0104', 'SC01', 'A4', 'VIP'), ('S0105', 'SC01', 'A5', 'VIP'),
('S0106', 'SC01', 'B1', 'Balcony'), ('S0107', 'SC01', 'B2', 'Balcony'), ('S0108', 'SC01', 'B3', 'Balcony'), ('S0109', 'SC01', 'B4', 'Balcony'), ('S0110', 'SC01', 'B5', 'Balcony'),
('S0111', 'SC01', 'C1', 'Premium'), ('S0112', 'SC01', 'C2', 'Premium'), ('S0113', 'SC01', 'C3', 'Premium'), ('S0114', 'SC01', 'C4', 'Premium'), ('S0115', 'SC01', 'C5', 'Premium'),
('S0116', 'SC01', 'D1', 'Regular'), ('S0117', 'SC01', 'D2', 'Regular'), ('S0118', 'SC01', 'D3', 'Regular'), ('S0119', 'SC01', 'D4', 'Regular'), ('S0120', 'SC01', 'D5', 'Regular');

-- Seats for SC02 (PVR Standard)
INSERT INTO SEAT (Seat_ID, Screen_ID, Seat_Number, Seat_Type) VALUES
('S0201', 'SC02', 'A1', 'VIP'), ('S0202', 'SC02', 'A2', 'VIP'), ('S0203', 'SC02', 'A3', 'VIP'), ('S0204', 'SC02', 'A4', 'VIP'),
('S0205', 'SC02', 'B1', 'Balcony'), ('S0206', 'SC02', 'B2', 'Balcony'), ('S0207', 'SC02', 'B3', 'Balcony'), ('S0208', 'SC02', 'B4', 'Balcony'),
('S0209', 'SC02', 'C1', 'Premium'), ('S0210', 'SC02', 'C2', 'Premium'), ('S0211', 'SC02', 'C3', 'Premium'), ('S0212', 'SC02', 'C4', 'Premium'),
('S0213', 'SC02', 'D1', 'Regular'), ('S0214', 'SC02', 'D2', 'Regular'), ('S0215', 'SC02', 'D3', 'Regular'), ('S0216', 'SC02', 'D4', 'Regular');

-- Seats for SC03 (INOX 4DX)
INSERT INTO SEAT (Seat_ID, Screen_ID, Seat_Number, Seat_Type) VALUES
('S0301', 'SC03', 'A1', 'VIP'), ('S0302', 'SC03', 'A2', 'VIP'), ('S0303', 'SC03', 'A3', 'VIP'),
('S0304', 'SC03', 'B1', 'Balcony'), ('S0305', 'SC03', 'B2', 'Balcony'), ('S0306', 'SC03', 'B3', 'Balcony'),
('S0307', 'SC03', 'C1', 'Premium'), ('S0308', 'SC03', 'C2', 'Premium'), ('S0309', 'SC03', 'C3', 'Premium'),
('S0310', 'SC03', 'D1', 'Regular'), ('S0311', 'SC03', 'D2', 'Regular'), ('S0312', 'SC03', 'D3', 'Regular');

-- Seats for SC04 (INOX Standard)
INSERT INTO SEAT (Seat_ID, Screen_ID, Seat_Number, Seat_Type) VALUES
('S0401', 'SC04', 'A1', 'VIP'), ('S0402', 'SC04', 'A2', 'VIP'),
('S0403', 'SC04', 'B1', 'Balcony'), ('S0404', 'SC04', 'B2', 'Balcony'),
('S0405', 'SC04', 'C1', 'Premium'), ('S0406', 'SC04', 'C2', 'Premium'),
('S0407', 'SC04', 'D1', 'Regular'), ('S0408', 'SC04', 'D2', 'Regular');

-- Seats for SC05 (Cinepolis VIP)
INSERT INTO SEAT (Seat_ID, Screen_ID, Seat_Number, Seat_Type) VALUES
('S0501', 'SC05', 'A1', 'VIP'), ('S0502', 'SC05', 'A2', 'VIP'), ('S0503', 'SC05', 'A3', 'VIP'),
('S0504', 'SC05', 'B1', 'VIP'), ('S0505', 'SC05', 'B2', 'VIP'), ('S0506', 'SC05', 'B3', 'VIP');

-- ----------------------------------------------------------------------------
-- 6. SEED DATA: CUSTOMER (CU01 - CU05)
-- ----------------------------------------------------------------------------
INSERT INTO CUSTOMER (Customer_ID, Customer_Name, Email, Phone, Password) VALUES
('CU01', 'Rahul Sharma', 'rahul.s@example.com', '9876543210', 'hash_pass_123'),
('CU02', 'Priya Patel', 'priya.p@example.com', '9876543211', 'hash_pass_234'),
('CU03', 'Ananya Iyer', 'ananya.i@example.com', '9876543212', 'hash_pass_345'),
('CU04', 'Vikram Singh', 'vikram.s@example.com', '9876543213', 'hash_pass_456'),
('CU05', 'Sneha Reddy', 'sneha.r@example.com', '9876543214', 'hash_pass_567');

-- ----------------------------------------------------------------------------
-- 7. SEED DATA: BOOKING (BK01 - BK08)
-- ----------------------------------------------------------------------------
INSERT INTO BOOKING (Booking_ID, Customer_ID, Show_ID, Booking_Date, Ticket_Price, Format) VALUES
('BK01', 'CU01', 'SH01', '2026-10-20 11:20:00', 450.00, 'IMAX 3D'),
('BK02', 'CU02', 'SH01', '2026-10-20 14:10:00', 450.00, 'IMAX 3D'),
('BK03', 'CU03', 'SH03', '2026-10-20 17:00:00', 520.00, 'IMAX 3D'),
('BK04', 'CU01', 'SH05', '2026-10-20 19:30:00', 250.00, '2D'),
('BK05', 'CU04', 'SH06', '2026-10-21 09:15:00', 260.00, '2D'),
('BK06', 'CU01', 'SH07', '2026-10-21 10:45:00', 390.00, '3D'),
('BK07', 'CU05', 'SH08', '2026-10-21 12:00:00', 390.00, '3D'),
('BK08', 'CU02', 'SH10', '2026-10-21 14:00:00', 550.00, '2D');

-- ----------------------------------------------------------------------------
-- 8. SEED DATA: BOOKED_SEAT
-- ----------------------------------------------------------------------------
INSERT INTO BOOKED_SEAT (Booking_ID, Seat_ID) VALUES
-- BK01 (SH01 in SC01): Seats A1, A2
('BK01', 'S0101'),
('BK01', 'S0102'),
-- BK02 (SH01 in SC01): Seat B3
('BK02', 'S0108'),
-- BK03 (SH03 in SC01): Seats C1, C2
('BK03', 'S0111'),
('BK03', 'S0112'),
-- BK04 (SH05 in SC02): Seat A1
('BK04', 'S0201'),
-- BK05 (SH06 in SC02): Seats B1, B2
('BK05', 'S0205'),
('BK05', 'S0206'),
-- BK06 (SH07 in SC03): Seat A2
('BK06', 'S0302'),
-- BK07 (SH08 in SC03): Seats C1, C2
('BK07', 'S0307'),
('BK07', 'S0308'),
-- BK08 (SH10 in SC05): Seat A1
('BK08', 'S0501');

-- ----------------------------------------------------------------------------
-- 9. SEED DATA: PAYMENT (PAY01 - PAY08)
-- Amount = Ticket_Price * Number of Seats Booked
-- ----------------------------------------------------------------------------
INSERT INTO PAYMENT (Payment_ID, Booking_ID, Payment_Mode, Amount, Payment_Date) VALUES
('PAY01', 'BK01', 'UPI', 900.00, '2026-10-20 11:22:15'),
('PAY02', 'BK02', 'Credit Card', 450.00, '2026-10-20 14:11:40'),
('PAY03', 'BK03', 'UPI', 1040.00, '2026-10-20 17:02:00'),
('PAY04', 'BK04', 'Debit Card', 250.00, '2026-10-20 19:31:10'),
('PAY05', 'BK05', 'Net Banking', 520.00, '2026-10-21 09:16:30'),
('PAY06', 'BK06', 'UPI', 390.00, '2026-10-21 10:46:12'),
('PAY07', 'BK07', 'Credit Card', 780.00, '2026-10-21 12:01:45'),
('PAY08', 'BK08', 'Cash', 550.00, '2026-10-21 14:02:00');
