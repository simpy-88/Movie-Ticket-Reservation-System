-- ==============================================================================
-- MOVIE TICKET RESERVATION SYSTEM (MTRS)
-- File: supabase/seed.sql
-- Description: Chennai Cinema Seed Dataset for Supabase PostgreSQL
--              6 multiplex destinations, 49 auditoriums, 6 movies (matched to js/db-data.js),
--              18 showtimes, representative seat maps, 5 customer profiles, and
--              existing bookings (BK01 - BK08) with matching payments (PAY01 - PAY08).
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. SEED DATA: THEATERS (6 Chennai Destinations)
-- ------------------------------------------------------------------------------
INSERT INTO theaters (theater_id, theater_name, city, state, country) VALUES
('T01', 'PVR Palazzo — The Nexus Vijaya Mall', 'Chennai', 'Tamil Nadu', 'India'),
('T02', 'INOX Luxe — Phoenix Marketcity', 'Chennai', 'Tamil Nadu', 'India'),
('T03', 'PVR VR Chennai — VR Mall', 'Chennai', 'Tamil Nadu', 'India'),
('T04', 'PVR Sathyam Cinemas', 'Chennai', 'Tamil Nadu', 'India'),
('T05', 'PVR Aerohub — Airport Complex', 'Chennai', 'Tamil Nadu', 'India'),
('T06', 'INOX The Marina Mall', 'Chennai', 'Tamil Nadu', 'India')
ON CONFLICT (theater_id) DO UPDATE SET
    theater_name = EXCLUDED.theater_name,
    city = EXCLUDED.city,
    state = EXCLUDED.state,
    country = EXCLUDED.country;

-- ------------------------------------------------------------------------------
-- 2. SEED DATA: SCREENS (49 Auditoriums Across 6 Chennai Destinations)
-- ------------------------------------------------------------------------------
-- A. PVR Palazzo (9 Screens: SC01 to SC09)
INSERT INTO screens (screen_id, theater_id, screen_number, screen_name, screen_type, capacity, projection_tech, audio_tech, verification_status) VALUES
('SC01', 'T01', 1, 'Audi 1', 'Standard', 300, '4K Digital', 'Dolby 7.1 Surround', 'Published - Unverified'),
('SC02', 'T01', 2, 'Audi 2', 'Standard', 311, '4K RGB Laser', 'Dolby 7.1 Surround', 'Published - Unverified'),
('SC03', 'T01', 3, 'Audi 3', 'Standard', 244, '4K RGB Laser', 'Dolby 7.1 Surround', 'Published - Unverified'),
('SC04', 'T01', 4, 'Audi 4', 'Standard', 256, '4K RGB Laser', 'Dolby 7.1 Surround', 'Published - Unverified'),
('SC05', 'T01', 5, 'Audi 5 (IMAX)', 'IMAX Laser', 442, 'IMAX Commercial Laser', 'IMAX 12-Channel Immersive', 'Verified'),
('SC06', 'T01', 6, 'Audi 6', 'Standard', 237, '4K Digital', 'Dolby 7.1 Surround', 'Published - Unverified'),
('SC07', 'T01', 7, 'Audi 7', 'Standard', 246, '4K Digital', 'Dolby 7.1 Surround', 'Published - Unverified'),
('SC08', 'T01', 8, 'Audi 8', 'Dolby Atmos', 508, '4K Digital Christie', 'Dolby Atmos 64-Channel', 'Published - Unverified'),
('SC09', 'T01', 9, 'Audi 9', 'Dolby Atmos', 467, '4K Digital Christie', 'Dolby Atmos 64-Channel', 'Published - Unverified'),

-- B. INOX Luxe (11 Screens: SC10 to SC20)
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
('SC20', 'T02', 11, 'Audi 11 (IMAX Luxe)', 'IMAX Laser', 320, 'IMAX Laser Dual 4K', 'IMAX 12-Channel Sound', 'Verified'),

-- C. PVR VR Chennai (10 Screens: SC21 to SC30)
('SC21', 'T03', 1, 'P[XL] Flagship Auditorium', 'P[XL] Giant Screen', 450, 'Dual 4K RGB Laser', 'Dolby Atmos SLS', 'Verified'),
('SC22', 'T03', 2, 'Audi 2', 'Standard', 170, '2K Laser', 'Dolby 7.1 Surround', 'Published - Unverified'),
('SC23', 'T03', 3, 'Audi 3', 'Standard', 364, '4K Xenon Digital', 'Dolby 7.1 Surround', 'Published - Unverified'),
('SC24', 'T03', 4, 'Audi 4', 'Dolby Atmos', 388, '4K Laser', 'Dolby Atmos', 'Published - Unverified'),
('SC25', 'T03', 5, 'Audi 5', 'Dolby Atmos', 450, '4K Laser', 'Dolby Atmos', 'Published - Unverified'),
('SC26', 'T03', 6, 'Audi 6', 'Standard', 188, '2K Laser', 'Dolby 7.1 Surround', 'Published - Unverified'),
('SC27', 'T03', 7, 'Audi 7', 'Standard', 126, '2K Xenon Digital', 'Dolby 7.1 Surround', 'Published - Unverified'),
('SC28', 'T03', 8, 'Audi 8', 'Standard', 113, '2K Laser', 'Dolby 7.1 Surround', 'Published - Unverified'),
('SC29', 'T03', 9, 'Audi 9', 'Standard', 135, '2K Laser', 'Dolby 7.1 Surround', 'Published - Unverified'),
('SC30', 'T03', 10, 'Audi 10', 'Standard', 202, '2K Laser', 'Dolby 7.1 Surround', 'Published - Unverified'),

-- D. PVR Sathyam Cinemas (6 Heritage Screens: SC31 to SC36)
('SC31', 'T04', 1, 'Sathyam (Main Hall)', 'Heritage Premier', 948, 'Barco 4K RGB Laser', 'Dolby Atmos (Custom SPI)', 'Verified'),
('SC32', 'T04', 2, 'Santham', 'Heritage Premier', 566, 'Barco 4K RGB Laser', 'Dolby Atmos', 'Verified'),
('SC33', 'T04', 3, 'Seasons', 'Heritage Standard', 260, '4K Laser', 'Dolby 7.1 Surround', 'Published - Unverified'),
('SC34', 'T04', 4, 'Serene', 'Heritage Standard', 272, '4K Laser', 'Dolby 7.1 Surround', 'Published - Unverified'),
('SC35', 'T04', 5, 'Studio 5', 'Intimate Cinema', 148, '2K Laser', 'Dolby 7.1 Surround', 'Published - Unverified'),
('SC36', 'T04', 6, 'Six Degrees', 'Intimate Cinema', 184, '2K Laser', 'Dolby 7.1 Surround', 'Published - Unverified'),

-- E. PVR Aerohub (5 Airport Screens: SC37 to SC41)
('SC37', 'T05', 1, 'Audi 1', 'Airport Premier', 235, '2K RGB Laser', 'Dolby Atmos', 'Published - Verified Capacity'),
('SC38', 'T05', 2, 'Audi 2', 'Airport Standard', 240, '2K RGB Laser', 'Dolby 7.1 Surround', 'Published - Verified Capacity'),
('SC39', 'T05', 3, 'Audi 3', 'Airport Standard', 220, '2K RGB Laser', 'Dolby 7.1 Surround', 'Published - Verified Capacity'),
('SC40', 'T05', 4, 'Audi 4', 'Airport Standard', 230, '2K RGB Laser', 'Dolby 7.1 Surround', 'Published - Verified Capacity'),
('SC41', 'T05', 5, 'Audi 5', 'Airport Premier', 230, '2K RGB Laser', 'Dolby Atmos', 'Published - Verified Capacity'),

-- F. INOX The Marina Mall (8 Screens: SC42 to SC49)
('SC42', 'T06', 1, 'Screen 1 (BIGPIX)', 'BIGPIX Giant Screen', 517, '4K Laser Christie', 'Dolby Atmos High-Power', 'Published - Unverified'),
('SC43', 'T06', 2, 'Screen 2', 'Standard', 228, '2K Digital Laser', 'Dolby 7.1 Surround', 'Published - Unverified'),
('SC44', 'T06', 3, 'Screen 3', 'Standard', 195, '2K Digital Laser', 'Dolby 7.1 Surround', 'Published - Needs Confirmation'),
('SC45', 'T06', 4, 'Screen 4', 'Standard', 242, '2K Digital Laser', 'Dolby 7.1 Surround', 'Published - Unverified'),
('SC46', 'T06', 5, 'Screen 5', 'Standard', 210, '2K Digital Laser', 'Dolby 7.1 Surround', 'Published - Needs Confirmation'),
('SC47', 'T06', 6, 'Screen 6', 'Dolby Atmos', 205, '2K Digital Laser', 'Dolby Atmos', 'Published - Needs Confirmation'),
('SC48', 'T06', 7, 'Screen 7', 'Standard', 185, '2K Digital Laser', 'Dolby 7.1 Surround', 'Published - Needs Confirmation'),
('SC49', 'T06', 8, 'Screen 8', 'Standard', 170, '2K Digital Laser', 'Dolby 7.1 Surround', 'Published - Needs Confirmation')
ON CONFLICT (screen_id) DO UPDATE SET
    screen_name = EXCLUDED.screen_name,
    capacity = EXCLUDED.capacity,
    projection_tech = EXCLUDED.projection_tech,
    audio_tech = EXCLUDED.audio_tech;

-- ------------------------------------------------------------------------------
-- 3. SEED DATA: MOVIES (M01 to M06 - Sourced from js/db-data.js and assets/posters.js)
-- ------------------------------------------------------------------------------
INSERT INTO movies (movie_id, movie_name, genre, rating, duration, language, synopsis, cast_members, poster_url, poster_hires_url, backdrop_url, tmdb_id) VALUES
('M01', 'Superman', 'Action/Sci-Fi', 8.6, 150, 'English', 
 'Superman reconciles his Kryptonian heritage with his human upbringing as Clark Kent, standing as the embodiment of truth, justice, and tomorrow.', 
 'David Corenswet, Rachel Brosnahan, Nicholas Hoult', 
 'https://image.tmdb.org/t/p/w500/ldyfo0BKmz5rWtJJKCvwaNS4cJT.jpg',
 'https://image.tmdb.org/t/p/w780/ldyfo0BKmz5rWtJJKCvwaNS4cJT.jpg',
 'https://image.tmdb.org/t/p/w1280/eGX66zonvc4bXg3rM08RUxdYSDx.jpg',
 1061474),

('M02', 'Heat', 'Action/Crime', 8.3, 170, 'English', 
 'A group of high-end professional thieves start to feel the heat from the LAPD when a loose clue is left at their latest heist.', 
 'Al Pacino, Robert De Niro, Val Kilmer', 
 'https://a.ltrbxd.com/resized/film-poster/5/1/9/9/4/51994-heat-0-2000-0-3000-crop.jpg?v=54dce97dc6',
 'https://a.ltrbxd.com/resized/film-poster/5/1/9/9/4/51994-heat-0-2000-0-3000-crop.jpg?v=54dce97dc6',
 'https://image.tmdb.org/t/p/w1280/eSVvx8xys2NuFhl8fevXt41wX7v.jpg',
 949),

('M03', 'La La Land', 'Musical/Romance', 8.0, 128, 'English', 
 'While navigating their careers in Los Angeles, a jazz pianist and an aspiring actress fall in love while attempting to reconcile their artistic dreams.', 
 'Ryan Gosling, Emma Stone, John Legend', 
 'https://image.tmdb.org/t/p/w500/uDO8zWDhfWwoFdKS4fzkUJt0Rf0.jpg',
 'https://image.tmdb.org/t/p/w780/uDO8zWDhfWwoFdKS4fzkUJt0Rf0.jpg',
 'https://image.tmdb.org/t/p/w1280/nadTlnTE6DdgmYsN4iWc2a2wiaI.jpg',
 313369),

('M04', 'The Odyssey', 'Sci-Fi/Adventure', 8.7, 169, 'English', 
 'Christopher Nolan''s sweeping, 70mm large-format epic chronicling humanity''s ancient voyages across uncharted cosmic boundaries and gravitational singularities.', 
 'Cillian Murphy, Anne Hathaway, Matt Damon', 
 'https://upload.wikimedia.org/wikipedia/en/9/90/The_Odyssey_%282026_film%29_poster.jpg',
 'https://image.tmdb.org/t/p/w780/gEU2QniE6E77NI6lCU6MxlWBvIx.jpg',
 'https://image.tmdb.org/t/p/w1280/rAiYTfKGqDCRIIqo664sY9XZIvQ.jpg',
 NULL),

('M05', 'Dune: Part Three', 'Sci-Fi/Action', 8.8, 166, 'English', 
 'Paul Atreides consolidates his empire across Arrakis, confronting the perils of prophetic messianism and universal holy war.', 
 'Timothée Chalamet, Zendaya, Florence Pugh', 
 'https://a.ltrbxd.com/resized/film-poster/1/0/5/7/4/6/1/1057461-dune-part-three-0-2000-0-3000-crop.jpg?v=f577c5b9e7',
 'https://a.ltrbxd.com/resized/film-poster/1/0/5/7/4/6/1/1057461-dune-part-three-0-2000-0-3000-crop.jpg?v=f577c5b9e7',
 'https://image.tmdb.org/t/p/w1280/xOMo8BRK7PfcJv9JCnx7s520QIq.jpg',
 693134),

('M06', 'Avengers: Doomsday', 'Action/Sci-Fi', 8.4, 155, 'English', 
 'Earth''s mightiest heroes collide with the sinister intellect of Victor Von Doom in a colossal battle across fractured dimensional timelines.', 
 'Robert Downey Jr., Benedict Cumberbatch, Anthony Mackie', 
 'https://a.ltrbxd.com/resized/film-poster/9/0/3/8/8/9/903889-avengers-doomsday-0-2000-0-3000-crop.jpg?v=fbbc8d1f4f',
 'https://a.ltrbxd.com/resized/film-poster/9/0/3/8/8/9/903889-avengers-doomsday-0-2000-0-3000-crop.jpg?v=fbbc8d1f4f',
 'https://image.tmdb.org/t/p/w1280/xOMo8BRK7PfcJv9JCnx7s520QIq.jpg',
 1003596)
ON CONFLICT (movie_id) DO UPDATE SET
    movie_name = EXCLUDED.movie_name,
    genre = EXCLUDED.genre,
    rating = EXCLUDED.rating,
    duration = EXCLUDED.duration,
    language = EXCLUDED.language,
    synopsis = EXCLUDED.synopsis,
    cast_members = EXCLUDED.cast_members,
    poster_url = EXCLUDED.poster_url,
    poster_hires_url = EXCLUDED.poster_hires_url,
    backdrop_url = EXCLUDED.backdrop_url,
    tmdb_id = EXCLUDED.tmdb_id;

-- ------------------------------------------------------------------------------
-- 4. SEED DATA: SHOWS (18 Showtimes across Chennai Multiplexes)
-- ------------------------------------------------------------------------------
INSERT INTO shows (show_id, movie_id, screen_id, show_date, show_time, format, ticket_price) VALUES
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
('SH18', 'M06', 'SC45', '2026-10-21', '20:30:00', '2D', 220.00)
ON CONFLICT (show_id) DO UPDATE SET
    ticket_price = EXCLUDED.ticket_price,
    format = EXCLUDED.format;

-- ------------------------------------------------------------------------------
-- 5. SEED DATA: SEATS (Representative seat maps for Chennai Screens)
-- ------------------------------------------------------------------------------
-- Palazzo IMAX (SC05)
INSERT INTO seats (seat_id, screen_id, seat_number, seat_type) VALUES
('S0501', 'SC05', 'A1', 'VIP'), ('S0502', 'SC05', 'A2', 'VIP'), ('S0503', 'SC05', 'A3', 'VIP'), ('S0504', 'SC05', 'A4', 'VIP'), ('S0505', 'SC05', 'A5', 'VIP'),
('S0506', 'SC05', 'B1', 'Balcony'), ('S0507', 'SC05', 'B2', 'Balcony'), ('S0508', 'SC05', 'B3', 'Balcony'), ('S0509', 'SC05', 'B4', 'Balcony'), ('S0510', 'SC05', 'B5', 'Balcony'),
('S0511', 'SC05', 'C1', 'Premium'), ('S0512', 'SC05', 'C2', 'Premium'), ('S0513', 'SC05', 'C3', 'Premium'), ('S0514', 'SC05', 'C4', 'Premium'), ('S0515', 'SC05', 'C5', 'Premium'),
('S0516', 'SC05', 'D1', 'Regular'), ('S0517', 'SC05', 'D2', 'Regular'), ('S0518', 'SC05', 'D3', 'Regular'), ('S0519', 'SC05', 'D4', 'Regular'), ('S0520', 'SC05', 'D5', 'Regular'),

-- Luxe IMAX (SC20)
('S2001', 'SC20', 'A1', 'VIP'), ('S2002', 'SC20', 'A2', 'VIP'), ('S2003', 'SC20', 'A3', 'VIP'), ('S2004', 'SC20', 'A4', 'VIP'),
('S2005', 'SC20', 'B1', 'Balcony'), ('S2006', 'SC20', 'B2', 'Balcony'), ('S2007', 'SC20', 'B3', 'Balcony'), ('S2008', 'SC20', 'B4', 'Balcony'),
('S2009', 'SC20', 'C1', 'Premium'), ('S2010', 'SC20', 'C2', 'Premium'), ('S2011', 'SC20', 'C3', 'Premium'), ('S2012', 'SC20', 'C4', 'Premium'),
('S2013', 'SC20', 'D1', 'Regular'), ('S2014', 'SC20', 'D2', 'Regular'), ('S2015', 'SC20', 'D3', 'Regular'), ('S2016', 'SC20', 'D4', 'Regular'),

-- VR Chennai P[XL] (SC21)
('S2101', 'SC21', 'A1', 'VIP'), ('S2102', 'SC21', 'A2', 'VIP'), ('S2103', 'SC21', 'A3', 'VIP'), ('S2104', 'SC21', 'A4', 'VIP'),
('S2105', 'SC21', 'B1', 'Balcony'), ('S2106', 'SC21', 'B2', 'Balcony'), ('S2107', 'SC21', 'B3', 'Balcony'), ('S2108', 'SC21', 'B4', 'Balcony'),
('S2109', 'SC21', 'C1', 'Premium'), ('S2110', 'SC21', 'C2', 'Premium'), ('S2111', 'SC21', 'C3', 'Premium'), ('S2112', 'SC21', 'C4', 'Premium'),
('S2113', 'SC21', 'D1', 'Regular'), ('S2114', 'SC21', 'D2', 'Regular'), ('S2115', 'SC21', 'D3', 'Regular'), ('S2116', 'SC21', 'D4', 'Regular'),

-- Sathyam Main Hall (SC31)
('S3101', 'SC31', 'A1', 'VIP'), ('S3102', 'SC31', 'A2', 'VIP'), ('S3103', 'SC31', 'A3', 'VIP'),
('S3104', 'SC31', 'B1', 'Balcony'), ('S3105', 'SC31', 'B2', 'Balcony'), ('S3106', 'SC31', 'B3', 'Balcony'),
('S3107', 'SC31', 'C1', 'Premium'), ('S3108', 'SC31', 'C2', 'Premium'), ('S3109', 'SC31', 'C3', 'Premium'),
('S3110', 'SC31', 'D1', 'Regular'), ('S3111', 'SC31', 'D2', 'Regular'), ('S3112', 'SC31', 'D3', 'Regular'),

-- Aerohub Audi 1 (SC37)
('S3701', 'SC37', 'A1', 'VIP'), ('S3702', 'SC37', 'A2', 'VIP'),
('S3703', 'SC37', 'B1', 'Balcony'), ('S3704', 'SC37', 'B2', 'Balcony'),
('S3705', 'SC37', 'C1', 'Premium'), ('S3706', 'SC37', 'C2', 'Premium'),
('S3707', 'SC37', 'D1', 'Regular'), ('S3708', 'SC37', 'D2', 'Regular'),

-- Marina Mall BIGPIX (SC42)
('S4201', 'SC42', 'A1', 'VIP'), ('S4202', 'SC42', 'A2', 'VIP'), ('S4203', 'SC42', 'A3', 'VIP'),
('S4204', 'SC42', 'B1', 'Balcony'), ('S4205', 'SC42', 'B2', 'Balcony'), ('S4206', 'SC42', 'B3', 'Balcony'),
('S4207', 'SC42', 'C1', 'Premium'), ('S4208', 'SC42', 'C2', 'Premium'), ('S4209', 'SC42', 'C3', 'Premium'),
('S4210', 'SC42', 'D1', 'Regular'), ('S4211', 'SC42', 'D2', 'Regular'), ('S4212', 'SC42', 'D3', 'Regular')
ON CONFLICT (seat_id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 6. SEED DATA: CUSTOMERS (CU01 to CU05)
-- No plain passwords or demo credentials; ready for Supabase Auth linking.
-- ------------------------------------------------------------------------------
INSERT INTO customers (customer_id, customer_name, email, phone) VALUES
('CU01', 'Rahul Sharma', 'rahul.s@example.com', '9876543210'),
('CU02', 'Priya Patel', 'priya.p@example.com', '9876543211'),
('CU03', 'Ananya Iyer', 'ananya.i@example.com', '9876543212'),
('CU04', 'Vikram Singh', 'vikram.s@example.com', '9876543213'),
('CU05', 'Sneha Reddy', 'sneha.r@example.com', '9876543214')
ON CONFLICT (customer_id) DO UPDATE SET
    customer_name = EXCLUDED.customer_name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone;

-- ------------------------------------------------------------------------------
-- 7. SEED DATA: BOOKINGS (BK01 to BK08)
-- Preserves existing transaction history including BK07.
-- ------------------------------------------------------------------------------
INSERT INTO bookings (booking_id, customer_id, show_id, booking_date, ticket_price, format, status) VALUES
('BK01', 'CU01', 'SH01', '2026-10-20 11:20:00+05:30', 480.00, 'IMAX 3D', 'CONFIRMED'),
('BK02', 'CU02', 'SH01', '2026-10-20 14:10:00+05:30', 480.00, 'IMAX 3D', 'CONFIRMED'),
('BK03', 'CU03', 'SH03', '2026-10-20 17:00:00+05:30', 550.00, 'IMAX 3D', 'CONFIRMED'),
('BK04', 'CU01', 'SH05', '2026-10-20 19:30:00+05:30', 520.00, 'IMAX 3D', 'CONFIRMED'),
('BK05', 'CU04', 'SH08', '2026-10-21 09:15:00+05:30', 420.00, 'P[XL] 3D', 'CONFIRMED'),
('BK06', 'CU01', 'SH11', '2026-10-21 10:45:00+05:30', 250.00, '2D', 'CONFIRMED'),
('BK07', 'CU05', 'SH16', '2026-10-21 12:00:00+05:30', 420.00, 'BIGPIX 3D', 'CONFIRMED'),
('BK08', 'CU02', 'SH14', '2026-10-21 14:00:00+05:30', 270.00, '2D', 'CONFIRMED')
ON CONFLICT (booking_id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 8. SEED DATA: BOOKED_SEATS (Reserved seat associations with show_id & status)
-- ------------------------------------------------------------------------------
INSERT INTO booked_seats (booking_id, seat_id, show_id, status) VALUES
-- BK01 (SH01 in SC05 Palazzo IMAX): Seats A1, A2
('BK01', 'S0501', 'SH01', 'CONFIRMED'),
('BK01', 'S0502', 'SH01', 'CONFIRMED'),
-- BK02 (SH01 in SC05 Palazzo IMAX): Seat B3
('BK02', 'S0508', 'SH01', 'CONFIRMED'),
-- BK03 (SH03 in SC05 Palazzo IMAX): Seats C1, C2
('BK03', 'S0511', 'SH03', 'CONFIRMED'),
('BK03', 'S0512', 'SH03', 'CONFIRMED'),
-- BK04 (SH05 in SC20 Luxe IMAX): Seat A1
('BK04', 'S2001', 'SH05', 'CONFIRMED'),
-- BK05 (SH08 in SC21 VR P[XL]): Seats B1, B2
('BK05', 'S2105', 'SH08', 'CONFIRMED'),
('BK05', 'S2106', 'SH08', 'CONFIRMED'),
-- BK06 (SH11 in SC31 Sathyam Main): Seat A2
('BK06', 'S3102', 'SH11', 'CONFIRMED'),
-- BK07 (SH16 in SC42 Marina BIGPIX): Seats C1, C2
('BK07', 'S4207', 'SH16', 'CONFIRMED'),
('BK07', 'S4208', 'SH16', 'CONFIRMED'),
-- BK08 (SH14 in SC37 Aerohub Audi 1): Seat A1
('BK08', 'S3701', 'SH14', 'CONFIRMED')
ON CONFLICT (booking_id, seat_id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 9. SEED DATA: PAYMENTS (PAY01 to PAY08)
-- ------------------------------------------------------------------------------
INSERT INTO payments (payment_id, booking_id, payment_mode, amount, payment_date, status) VALUES
('PAY01', 'BK01', 'UPI', 960.00, '2026-10-20 11:22:15+05:30', 'SUCCESS'),
('PAY02', 'BK02', 'Credit Card', 480.00, '2026-10-20 14:11:40+05:30', 'SUCCESS'),
('PAY03', 'BK03', 'UPI', 1100.00, '2026-10-20 17:02:00+05:30', 'SUCCESS'),
('PAY04', 'BK04', 'Debit Card', 520.00, '2026-10-20 19:31:10+05:30', 'SUCCESS'),
('PAY05', 'BK05', 'Net Banking', 840.00, '2026-10-21 09:16:30+05:30', 'SUCCESS'),
('PAY06', 'BK06', 'UPI', 250.00, '2026-10-21 10:46:12+05:30', 'SUCCESS'),
('PAY07', 'BK07', 'Credit Card', 840.00, '2026-10-21 12:01:45+05:30', 'SUCCESS'),
('PAY08', 'BK08', 'Cash', 270.00, '2026-10-21 14:02:00+05:30', 'SUCCESS')
ON CONFLICT (payment_id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 10. SYNCHRONIZE SEQUENCE COUNTERS
-- Ensures future bookings, payments, customers, and shows generate non-colliding IDs.
-- ------------------------------------------------------------------------------
SELECT setval('booking_id_seq', 9, false);
SELECT setval('payment_id_seq', 9, false);
SELECT setval('customer_id_seq', 6, false);
SELECT setval('show_id_seq', 19, false);
