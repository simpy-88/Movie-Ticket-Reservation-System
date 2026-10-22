-- ============================================================================
-- DATABASE MANAGEMENT SYSTEMS PROJECT: MOVIE TICKET RESERVATION SYSTEM (MTRS)
-- File: database/seed.sql
-- Description: Chennai Cinema Dataset — Sourced from 6 Primary Destinations
--              comprising 49 individual auditoriums with technical specifications.
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
-- 1. SEED DATA: THEATER (6 Chennai Destinations)
-- ----------------------------------------------------------------------------
INSERT INTO THEATER (Theater_ID, Theater_Name, City, State, Country) VALUES
('T01', 'PVR Palazzo — The Nexus Vijaya Mall', 'Chennai', 'Tamil Nadu', 'India'),
('T02', 'INOX Luxe — Phoenix Marketcity', 'Chennai', 'Tamil Nadu', 'India'),
('T03', 'PVR VR Chennai — VR Mall', 'Chennai', 'Tamil Nadu', 'India'),
('T04', 'PVR Sathyam Cinemas', 'Chennai', 'Tamil Nadu', 'India'),
('T05', 'PVR Aerohub — Airport Complex', 'Chennai', 'Tamil Nadu', 'India'),
('T06', 'INOX The Marina Mall', 'Chennai', 'Tamil Nadu', 'India');

-- ----------------------------------------------------------------------------
-- 2. SEED DATA: SCREEN (49 Distinct Auditoriums Across 6 Chennai Destinations)
-- ----------------------------------------------------------------------------
-- A. PVR Palazzo (9 Screens: SC01 to SC09)
INSERT INTO SCREEN (Screen_ID, Theater_ID, Screen_Number, Screen_Name, Screen_Type, Capacity, Projection_Tech, Audio_Tech, Verification_Status) VALUES
('SC01', 'T01', 1, 'Audi 1', 'Standard', 300, '4K Digital', 'Dolby 7.1 Surround', 'Published - Unverified'),
('SC02', 'T01', 2, 'Audi 2', 'Standard', 311, '4K RGB Laser', 'Dolby 7.1 Surround', 'Published - Unverified'),
('SC03', 'T01', 3, 'Audi 3', 'Standard', 244, '4K RGB Laser', 'Dolby 7.1 Surround', 'Published - Unverified'),
('SC04', 'T01', 4, 'Audi 4', 'Standard', 256, '4K RGB Laser', 'Dolby 7.1 Surround', 'Published - Unverified'),
('SC05', 'T01', 5, 'Audi 5 (IMAX)', 'IMAX Laser', 442, 'IMAX Commercial Laser', 'IMAX 12-Channel Immersive', 'Verified'),
('SC06', 'T01', 6, 'Audi 6', 'Standard', 237, '4K Digital', 'Dolby 7.1 Surround', 'Published - Unverified'),
('SC07', 'T01', 7, 'Audi 7', 'Standard', 246, '4K Digital', 'Dolby 7.1 Surround', 'Published - Unverified'),
('SC08', 'T01', 8, 'Audi 8', 'Dolby Atmos', 508, '4K Digital Christie', 'Dolby Atmos 64-Channel', 'Published - Unverified'),
('SC09', 'T01', 9, 'Audi 9', 'Dolby Atmos', 467, '4K Digital Christie', 'Dolby Atmos 64-Channel', 'Published - Unverified');

-- B. INOX Luxe (11 Screens: SC10 to SC20)
INSERT INTO SCREEN (Screen_ID, Theater_ID, Screen_Number, Screen_Name, Screen_Type, Capacity, Projection_Tech, Audio_Tech, Verification_Status) VALUES
('SC10', 'T02', 1, 'Audi 1 (Luxe)', 'Luxe Standard', 182, '2K/4K Barco Laser', 'Dolby 7.1 Surround', 'Published - Needs Confirmation'),
('SC11', 'T02', 2, 'Audi 2 (Luxe)', 'Luxe Standard', 210, '2K/4K Barco Laser', 'Dolby 7.1 Surround', 'Published - Needs Confirmation'),
('SC12', 'T02', 3, 'Audi 3 (Luxe Atmos)', 'Luxe Atmos', 245, '4K Barco Laser', 'Dolby Atmos', 'Published - Needs Confirmation'),
('SC13', 'T02', 4, 'Audi 4 (Luxe)', 'Luxe Standard', 278, '2K/4K Laser', 'Dolby 7.1 Surround', 'Published - Needs Confirmation'),
('SC14', 'T02', 5, 'Audi 5 (Luxe Atmos)', 'Luxe Atmos', 290, '4K Barco Laser', 'Dolby Atmos', 'Published - Needs Confirmation'),
('SC15', 'T02', 6, 'Audi 6 (Luxe)', 'Luxe Standard', 230, '2K Laser', 'Dolby 7.1 Surround', 'Published - Needs Confirmation'),
('SC16', 'T02', 7, 'Audi 7 (Luxe)', 'Luxe Standard', 255, '2K Laser', 'Dolby 7.1 Surround', 'Published - Needs Confirmation'),
('SC17', 'T02', 8, 'Audi 8 (Luxe Atmos)', 'Luxe Atmos', 265, '4K Laser', 'Dolby Atmos', 'Published - Needs Confirmation'),
('SC18', 'T02', 9, 'Audi 9 (Luxe)', 'Luxe Standard', 240, '2K Laser', 'Dolby 7.1 Surround', 'Published - Needs Confirmation'),
('SC19', 'T02', 10, 'Audi 10 (Luxe)', 'Luxe Standard', 260, '2K Laser', 'Dolby 7.1 Surround', 'Published - Needs Confirmation'),
('SC20', 'T02', 11, 'Audi 11 (IMAX Luxe)', 'IMAX Laser', 320, 'IMAX Laser Dual 4K', 'IMAX 12-Channel Sound', 'Verified');

-- C. PVR VR Chennai (10 Screens: SC21 to SC30)
INSERT INTO SCREEN (Screen_ID, Theater_ID, Screen_Number, Screen_Name, Screen_Type, Capacity, Projection_Tech, Audio_Tech, Verification_Status) VALUES
('SC21', 'T03', 1, 'P[XL] Flagship Auditorium', 'P[XL] Giant Screen', 450, 'Dual 4K RGB Laser', 'Dolby Atmos SLS', 'Verified'),
('SC22', 'T03', 2, 'Audi 2', 'Standard', 170, '2K Laser', 'Dolby 7.1 Surround', 'Published - Unverified'),
('SC23', 'T03', 3, 'Audi 3', 'Standard', 364, '4K Xenon Digital', 'Dolby 7.1 Surround', 'Published - Unverified'),
('SC24', 'T03', 4, 'Audi 4', 'Dolby Atmos', 388, '4K Laser', 'Dolby Atmos', 'Published - Unverified'),
('SC25', 'T03', 5, 'Audi 5', 'Dolby Atmos', 450, '4K Laser', 'Dolby Atmos', 'Published - Unverified'),
('SC26', 'T03', 6, 'Audi 6', 'Standard', 188, '2K Laser', 'Dolby 7.1 Surround', 'Published - Unverified'),
('SC27', 'T03', 7, 'Audi 7', 'Standard', 126, '2K Xenon Digital', 'Dolby 7.1 Surround', 'Published - Unverified'),
('SC28', 'T03', 8, 'Audi 8', 'Standard', 113, '2K Laser', 'Dolby 7.1 Surround', 'Published - Unverified'),
('SC29', 'T03', 9, 'Audi 9', 'Standard', 135, '2K Laser', 'Dolby 7.1 Surround', 'Published - Unverified'),
('SC30', 'T03', 10, 'Audi 10', 'Standard', 202, '2K Laser', 'Dolby 7.1 Surround', 'Published - Unverified');

-- D. PVR Sathyam Cinemas (6 Heritage Screens: SC31 to SC36)
INSERT INTO SCREEN (Screen_ID, Theater_ID, Screen_Number, Screen_Name, Screen_Type, Capacity, Projection_Tech, Audio_Tech, Verification_Status) VALUES
('SC31', 'T04', 1, 'Sathyam (Main Hall)', 'Heritage Premier', 948, 'Barco 4K RGB Laser', 'Dolby Atmos (Custom SPI)', 'Verified'),
('SC32', 'T04', 2, 'Santham', 'Heritage Premier', 566, 'Barco 4K RGB Laser', 'Dolby Atmos', 'Verified'),
('SC33', 'T04', 3, 'Seasons', 'Heritage Standard', 260, '4K Laser', 'Dolby 7.1 Surround', 'Published - Unverified'),
('SC34', 'T04', 4, 'Serene', 'Heritage Standard', 272, '4K Laser', 'Dolby 7.1 Surround', 'Published - Unverified'),
('SC35', 'T04', 5, 'Studio 5', 'Intimate Cinema', 148, '2K Laser', 'Dolby 7.1 Surround', 'Published - Unverified'),
('SC36', 'T04', 6, 'Six Degrees', 'Intimate Cinema', 184, '2K Laser', 'Dolby 7.1 Surround', 'Published - Unverified');

-- E. PVR Aerohub (5 Airport Screens: SC37 to SC41)
INSERT INTO SCREEN (Screen_ID, Theater_ID, Screen_Number, Screen_Name, Screen_Type, Capacity, Projection_Tech, Audio_Tech, Verification_Status) VALUES
('SC37', 'T05', 1, 'Audi 1', 'Airport Premier', 235, '2K RGB Laser', 'Dolby Atmos', 'Published - Verified Capacity'),
('SC38', 'T05', 2, 'Audi 2', 'Airport Standard', 240, '2K RGB Laser', 'Dolby 7.1 Surround', 'Published - Verified Capacity'),
('SC39', 'T05', 3, 'Audi 3', 'Airport Standard', 220, '2K RGB Laser', 'Dolby 7.1 Surround', 'Published - Verified Capacity'),
('SC40', 'T05', 4, 'Audi 4', 'Airport Standard', 230, '2K RGB Laser', 'Dolby 7.1 Surround', 'Published - Verified Capacity'),
('SC41', 'T05', 5, 'Audi 5', 'Airport Premier', 230, '2K RGB Laser', 'Dolby Atmos', 'Published - Verified Capacity');

-- F. INOX The Marina Mall (8 Screens: SC42 to SC49)
INSERT INTO SCREEN (Screen_ID, Theater_ID, Screen_Number, Screen_Name, Screen_Type, Capacity, Projection_Tech, Audio_Tech, Verification_Status) VALUES
('SC42', 'T06', 1, 'Screen 1 (BIGPIX)', 'BIGPIX Giant Screen', 517, '4K Laser Christie', 'Dolby Atmos High-Power', 'Published - Unverified'),
('SC43', 'T06', 2, 'Screen 2', 'Standard', 228, '2K Digital Laser', 'Dolby 7.1 Surround', 'Published - Unverified'),
('SC44', 'T06', 3, 'Screen 3', 'Standard', 195, '2K Digital Laser', 'Dolby 7.1 Surround', 'Published - Needs Confirmation'),
('SC45', 'T06', 4, 'Screen 4', 'Standard', 242, '2K Digital Laser', 'Dolby 7.1 Surround', 'Published - Unverified'),
('SC46', 'T06', 5, 'Screen 5', 'Standard', 210, '2K Digital Laser', 'Dolby 7.1 Surround', 'Published - Needs Confirmation'),
('SC47', 'T06', 6, 'Screen 6', 'Dolby Atmos', 205, '2K Digital Laser', 'Dolby Atmos', 'Published - Needs Confirmation'),
('SC48', 'T06', 7, 'Screen 7', 'Standard', 185, '2K Digital Laser', 'Dolby 7.1 Surround', 'Published - Needs Confirmation'),
('SC49', 'T06', 8, 'Screen 8', 'Standard', 170, '2K Digital Laser', 'Dolby 7.1 Surround', 'Published - Needs Confirmation');

-- ----------------------------------------------------------------------------
-- 3. SEED DATA: MOVIE (M01 - M06)
-- ----------------------------------------------------------------------------
INSERT INTO MOVIE (Movie_ID, Movie_Name, Genre, Rating, Duration, Language) VALUES
('M01', 'Superman', 'Action/Sci-Fi', 8.6, 150, 'English'),
('M02', 'Heat', 'Action/Crime', 8.3, 170, 'English'),
('M03', 'La La Land', 'Musical/Romance', 8.0, 128, 'English'),
('M04', 'Interstellar', 'Sci-Fi/Adventure', 8.7, 169, 'English'),
('M05', 'Dune: Part Two', 'Sci-Fi/Action', 8.8, 166, 'English'),
('M06', 'Kantara: Chapter 1', 'Action/Thriller', 8.4, 148, 'Kannada');

-- ----------------------------------------------------------------------------
-- 4. SEED DATA: SHOWS (Distributed across Chennai multiplexes and special PLFs)
-- ----------------------------------------------------------------------------
INSERT INTO SHOWS (Show_ID, Movie_ID, Screen_ID, Show_Date, Show_Time, Format, Ticket_Price) VALUES
-- PVR Palazzo: IMAX Laser & Atmos
('SH01', 'M01', 'SC05', '2026-10-21', '10:00:00', 'IMAX 3D', 480.00),
('SH02', 'M01', 'SC05', '2026-10-21', '14:30:00', 'IMAX 3D', 480.00),
('SH03', 'M01', 'SC05', '2026-10-21', '19:15:00', 'IMAX 3D', 550.00),
('SH04', 'M04', 'SC08', '2026-10-21', '18:30:00', '2D', 320.00),
-- INOX Luxe (Phoenix): IMAX Luxe & Luxe Atmos
('SH05', 'M05', 'SC20', '2026-10-21', '13:00:00', 'IMAX 3D', 520.00),
('SH06', 'M04', 'SC20', '2026-10-21', '17:45:00', 'IMAX 2D', 460.00),
('SH07', 'M03', 'SC12', '2026-10-21', '15:30:00', '2D', 290.00),
-- PVR VR Chennai: P[XL] Flagship & Atmos
('SH08', 'M01', 'SC21', '2026-10-21', '11:00:00', 'P[XL] 3D', 420.00),
('SH09', 'M04', 'SC21', '2026-10-21', '16:00:00', 'P[XL] 2D', 380.00),
('SH10', 'M02', 'SC24', '2026-10-21', '20:15:00', '2D', 260.00),
-- PVR Sathyam: Sathyam Main Hall & Santham
('SH11', 'M01', 'SC31', '2026-10-21', '10:30:00', '2D', 250.00),
('SH12', 'M05', 'SC31', '2026-10-21', '15:00:00', '2D', 250.00),
('SH13', 'M03', 'SC32', '2026-10-21', '18:45:00', '2D', 240.00),
-- PVR Aerohub: Airport Multiplex
('SH14', 'M02', 'SC37', '2026-10-21', '12:15:00', '2D', 270.00),
('SH15', 'M06', 'SC41', '2026-10-21', '19:00:00', '2D', 280.00),
-- INOX The Marina Mall: BIGPIX & 3D
('SH16', 'M01', 'SC42', '2026-10-21', '13:30:00', 'BIGPIX 3D', 420.00),
('SH17', 'M05', 'SC42', '2026-10-21', '18:00:00', 'BIGPIX 2D', 380.00),
('SH18', 'M06', 'SC45', '2026-10-21', '20:30:00', '2D', 220.00);

-- ----------------------------------------------------------------------------
-- 5. SEED DATA: SEAT (Representative seat map for Chennai screens)
-- Rows: A (VIP Recliner), B (Balcony), C (Premium), D (Regular), E (Regular)
-- ----------------------------------------------------------------------------
-- Palazzo IMAX (SC05)
INSERT INTO SEAT (Seat_ID, Screen_ID, Seat_Number, Seat_Type) VALUES
('S0501', 'SC05', 'A1', 'VIP'), ('S0502', 'SC05', 'A2', 'VIP'), ('S0503', 'SC05', 'A3', 'VIP'), ('S0504', 'SC05', 'A4', 'VIP'), ('S0505', 'SC05', 'A5', 'VIP'),
('S0506', 'SC05', 'B1', 'Balcony'), ('S0507', 'SC05', 'B2', 'Balcony'), ('S0508', 'SC05', 'B3', 'Balcony'), ('S0509', 'SC05', 'B4', 'Balcony'), ('S0510', 'SC05', 'B5', 'Balcony'),
('S0511', 'SC05', 'C1', 'Premium'), ('S0512', 'SC05', 'C2', 'Premium'), ('S0513', 'SC05', 'C3', 'Premium'), ('S0514', 'SC05', 'C4', 'Premium'), ('S0515', 'SC05', 'C5', 'Premium'),
('S0516', 'SC05', 'D1', 'Regular'), ('S0517', 'SC05', 'D2', 'Regular'), ('S0518', 'SC05', 'D3', 'Regular'), ('S0519', 'SC05', 'D4', 'Regular'), ('S0520', 'SC05', 'D5', 'Regular');

-- Luxe IMAX (SC20)
INSERT INTO SEAT (Seat_ID, Screen_ID, Seat_Number, Seat_Type) VALUES
('S2001', 'SC20', 'A1', 'VIP'), ('S2002', 'SC20', 'A2', 'VIP'), ('S2003', 'SC20', 'A3', 'VIP'), ('S2004', 'SC20', 'A4', 'VIP'),
('S2005', 'SC20', 'B1', 'Balcony'), ('S2006', 'SC20', 'B2', 'Balcony'), ('S2007', 'SC20', 'B3', 'Balcony'), ('S2008', 'SC20', 'B4', 'Balcony'),
('S2009', 'SC20', 'C1', 'Premium'), ('S2010', 'SC20', 'C2', 'Premium'), ('S2011', 'SC20', 'C3', 'Premium'), ('S2012', 'SC20', 'C4', 'Premium'),
('S2013', 'SC20', 'D1', 'Regular'), ('S2014', 'SC20', 'D2', 'Regular'), ('S2015', 'SC20', 'D3', 'Regular'), ('S2016', 'SC20', 'D4', 'Regular');

-- VR Chennai P[XL] (SC21)
INSERT INTO SEAT (Seat_ID, Screen_ID, Seat_Number, Seat_Type) VALUES
('S2101', 'SC21', 'A1', 'VIP'), ('S2102', 'SC21', 'A2', 'VIP'), ('S2103', 'SC21', 'A3', 'VIP'), ('S2104', 'SC21', 'A4', 'VIP'),
('S2105', 'SC21', 'B1', 'Balcony'), ('S2106', 'SC21', 'B2', 'Balcony'), ('S2107', 'SC21', 'B3', 'Balcony'), ('S2108', 'SC21', 'B4', 'Balcony'),
('S2109', 'SC21', 'C1', 'Premium'), ('S2110', 'SC21', 'C2', 'Premium'), ('S2111', 'SC21', 'C3', 'Premium'), ('S2112', 'SC21', 'C4', 'Premium'),
('S2113', 'SC21', 'D1', 'Regular'), ('S2114', 'SC21', 'D2', 'Regular'), ('S2115', 'SC21', 'D3', 'Regular'), ('S2116', 'SC21', 'D4', 'Regular');

-- Sathyam Main Hall (SC31)
INSERT INTO SEAT (Seat_ID, Screen_ID, Seat_Number, Seat_Type) VALUES
('S3101', 'SC31', 'A1', 'VIP'), ('S3102', 'SC31', 'A2', 'VIP'), ('S3103', 'SC31', 'A3', 'VIP'),
('S3104', 'SC31', 'B1', 'Balcony'), ('S3105', 'SC31', 'B2', 'Balcony'), ('S3106', 'SC31', 'B3', 'Balcony'),
('S3107', 'SC31', 'C1', 'Premium'), ('S3108', 'SC31', 'C2', 'Premium'), ('S3109', 'SC31', 'C3', 'Premium'),
('S3110', 'SC31', 'D1', 'Regular'), ('S3111', 'SC31', 'D2', 'Regular'), ('S3112', 'SC31', 'D3', 'Regular');

-- Aerohub Audi 1 (SC37)
INSERT INTO SEAT (Seat_ID, Screen_ID, Seat_Number, Seat_Type) VALUES
('S3701', 'SC37', 'A1', 'VIP'), ('S3702', 'SC37', 'A2', 'VIP'),
('S3703', 'SC37', 'B1', 'Balcony'), ('S3704', 'SC37', 'B2', 'Balcony'),
('S3705', 'SC37', 'C1', 'Premium'), ('S3706', 'SC37', 'C2', 'Premium'),
('S3707', 'SC37', 'D1', 'Regular'), ('S3708', 'SC37', 'D2', 'Regular');

-- Marina Mall BIGPIX (SC42)
INSERT INTO SEAT (Seat_ID, Screen_ID, Seat_Number, Seat_Type) VALUES
('S4201', 'SC42', 'A1', 'VIP'), ('S4202', 'SC42', 'A2', 'VIP'), ('S4203', 'SC42', 'A3', 'VIP'),
('S4204', 'SC42', 'B1', 'Balcony'), ('S4205', 'SC42', 'B2', 'Balcony'), ('S4206', 'SC42', 'B3', 'Balcony'),
('S4207', 'SC42', 'C1', 'Premium'), ('S4208', 'SC42', 'C2', 'Premium'), ('S4209', 'SC42', 'C3', 'Premium'),
('S4210', 'SC42', 'D1', 'Regular'), ('S4211', 'SC42', 'D2', 'Regular'), ('S4212', 'SC42', 'D3', 'Regular');

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
-- 7. SEED DATA: BOOKING (BK01 - BK08 across Chennai shows)
-- ----------------------------------------------------------------------------
INSERT INTO BOOKING (Booking_ID, Customer_ID, Show_ID, Booking_Date, Ticket_Price, Format) VALUES
('BK01', 'CU01', 'SH01', '2026-10-20 11:20:00', 480.00, 'IMAX 3D'),
('BK02', 'CU02', 'SH01', '2026-10-20 14:10:00', 480.00, 'IMAX 3D'),
('BK03', 'CU03', 'SH03', '2026-10-20 17:00:00', 550.00, 'IMAX 3D'),
('BK04', 'CU01', 'SH05', '2026-10-20 19:30:00', 520.00, 'IMAX 3D'),
('BK05', 'CU04', 'SH08', '2026-10-21 09:15:00', 420.00, 'P[XL] 3D'),
('BK06', 'CU01', 'SH11', '2026-10-21 10:45:00', 250.00, '2D'),
('BK07', 'CU05', 'SH16', '2026-10-21 12:00:00', 420.00, 'BIGPIX 3D'),
('BK08', 'CU02', 'SH14', '2026-10-21 14:00:00', 270.00, '2D');

-- ----------------------------------------------------------------------------
-- 8. SEED DATA: BOOKED_SEAT
-- ----------------------------------------------------------------------------
INSERT INTO BOOKED_SEAT (Booking_ID, Seat_ID) VALUES
-- BK01 (SH01 in SC05 Palazzo IMAX): Seats A1, A2
('BK01', 'S0501'),
('BK01', 'S0502'),
-- BK02 (SH01 in SC05 Palazzo IMAX): Seat B3
('BK02', 'S0508'),
-- BK03 (SH03 in SC05 Palazzo IMAX): Seats C1, C2
('BK03', 'S0511'),
('BK03', 'S0512'),
-- BK04 (SH05 in SC20 Luxe IMAX): Seat A1
('BK04', 'S2001'),
-- BK05 (SH08 in SC21 VR P[XL]): Seats B1, B2
('BK05', 'S2105'),
('BK05', 'S2106'),
-- BK06 (SH11 in SC31 Sathyam Main): Seat A2
('BK06', 'S3102'),
-- BK07 (SH16 in SC42 Marina BIGPIX): Seats C1, C2
('BK07', 'S4207'),
('BK07', 'S4208'),
-- BK08 (SH14 in SC37 Aerohub Audi 1): Seat A1
('BK08', 'S3701');

-- ----------------------------------------------------------------------------
-- 9. SEED DATA: PAYMENT (PAY01 - PAY08)
-- Amount = Ticket_Price * Number of Seats Booked
-- ----------------------------------------------------------------------------
INSERT INTO PAYMENT (Payment_ID, Booking_ID, Payment_Mode, Amount, Payment_Date) VALUES
('PAY01', 'BK01', 'UPI', 960.00, '2026-10-20 11:22:15'),
('PAY02', 'BK02', 'Credit Card', 480.00, '2026-10-20 14:11:40'),
('PAY03', 'BK03', 'UPI', 1100.00, '2026-10-20 17:02:00'),
('PAY04', 'BK04', 'Debit Card', 520.00, '2026-10-20 19:31:10'),
('PAY05', 'BK05', 'Net Banking', 840.00, '2026-10-21 09:16:30'),
('PAY06', 'BK06', 'UPI', 250.00, '2026-10-21 10:46:12'),
('PAY07', 'BK07', 'Credit Card', 840.00, '2026-10-21 12:01:45'),
('PAY08', 'BK08', 'Cash', 270.00, '2026-10-21 14:02:00');
