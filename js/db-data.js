// ============================================================================
// MOVIE TICKET RESERVATION SYSTEM (MTRS)
// File: js/db-data.js
// Description: Relational seed data matching database/seed.sql and query definitions.
// Sourced from 6 Primary Chennai Cinema Destinations across 49 Auditoriums.
// ============================================================================

const SEED_DATA = {
    THEATER: [
        { Theater_ID: 'T01', Theater_Name: 'PVR Palazzo — The Nexus Vijaya Mall', City: 'Chennai', State: 'Tamil Nadu', Country: 'India' },
        { Theater_ID: 'T02', Theater_Name: 'INOX Luxe — Phoenix Marketcity', City: 'Chennai', State: 'Tamil Nadu', Country: 'India' },
        { Theater_ID: 'T03', Theater_Name: 'PVR VR Chennai — VR Mall', City: 'Chennai', State: 'Tamil Nadu', Country: 'India' },
        { Theater_ID: 'T04', Theater_Name: 'PVR Sathyam Cinemas', City: 'Chennai', State: 'Tamil Nadu', Country: 'India' },
        { Theater_ID: 'T05', Theater_Name: 'PVR Aerohub — Airport Complex', City: 'Chennai', State: 'Tamil Nadu', Country: 'India' },
        { Theater_ID: 'T06', Theater_Name: 'INOX The Marina Mall', City: 'Chennai', State: 'Tamil Nadu', Country: 'India' }
    ],

    SCREEN: [
        // A. PVR Palazzo (9 Screens)
        { Screen_ID: 'SC01', Theater_ID: 'T01', Screen_Number: 1, Screen_Name: 'Audi 1', Screen_Type: 'Standard', Capacity: 300, Projection_Tech: '4K Digital', Audio_Tech: 'Dolby 7.1 Surround', Verification_Status: 'Published - Unverified' },
        { Screen_ID: 'SC02', Theater_ID: 'T01', Screen_Number: 2, Screen_Name: 'Audi 2', Screen_Type: 'Standard', Capacity: 311, Projection_Tech: '4K RGB Laser', Audio_Tech: 'Dolby 7.1 Surround', Verification_Status: 'Published - Unverified' },
        { Screen_ID: 'SC03', Theater_ID: 'T01', Screen_Number: 3, Screen_Name: 'Audi 3', Screen_Type: 'Standard', Capacity: 244, Projection_Tech: '4K RGB Laser', Audio_Tech: 'Dolby 7.1 Surround', Verification_Status: 'Published - Unverified' },
        { Screen_ID: 'SC04', Theater_ID: 'T01', Screen_Number: 4, Screen_Name: 'Audi 4', Screen_Type: 'Standard', Capacity: 256, Projection_Tech: '4K RGB Laser', Audio_Tech: 'Dolby 7.1 Surround', Verification_Status: 'Published - Unverified' },
        { Screen_ID: 'SC05', Theater_ID: 'T01', Screen_Number: 5, Screen_Name: 'Audi 5 (IMAX)', Screen_Type: 'IMAX Laser', Capacity: 442, Projection_Tech: 'IMAX Commercial Laser', Audio_Tech: 'IMAX 12-Channel Immersive', Verification_Status: 'Verified' },
        { Screen_ID: 'SC06', Theater_ID: 'T01', Screen_Number: 6, Screen_Name: 'Audi 6', Screen_Type: 'Standard', Capacity: 237, Projection_Tech: '4K Digital', Audio_Tech: 'Dolby 7.1 Surround', Verification_Status: 'Published - Unverified' },
        { Screen_ID: 'SC07', Theater_ID: 'T01', Screen_Number: 7, Screen_Name: 'Audi 7', Screen_Type: 'Standard', Capacity: 246, Projection_Tech: '4K Digital', Audio_Tech: 'Dolby 7.1 Surround', Verification_Status: 'Published - Unverified' },
        { Screen_ID: 'SC08', Theater_ID: 'T01', Screen_Number: 8, Screen_Name: 'Audi 8', Screen_Type: 'Dolby Atmos', Capacity: 508, Projection_Tech: '4K Digital Christie', Audio_Tech: 'Dolby Atmos 64-Channel', Verification_Status: 'Published - Unverified' },
        { Screen_ID: 'SC09', Theater_ID: 'T01', Screen_Number: 9, Screen_Name: 'Audi 9', Screen_Type: 'Dolby Atmos', Capacity: 467, Projection_Tech: '4K Digital Christie', Audio_Tech: 'Dolby Atmos 64-Channel', Verification_Status: 'Published - Unverified' },

        // B. INOX Luxe (11 Screens)
        { Screen_ID: 'SC10', Theater_ID: 'T02', Screen_Number: 1, Screen_Name: 'Audi 1 (Luxe)', Screen_Type: 'Luxe Standard', Capacity: 182, Projection_Tech: '2K/4K Barco Laser', Audio_Tech: 'Dolby 7.1 Surround', Verification_Status: 'Published - Needs Confirmation' },
        { Screen_ID: 'SC11', Theater_ID: 'T02', Screen_Number: 2, Screen_Name: 'Audi 2 (Luxe)', Screen_Type: 'Luxe Standard', Capacity: 210, Projection_Tech: '2K/4K Barco Laser', Audio_Tech: 'Dolby 7.1 Surround', Verification_Status: 'Published - Needs Confirmation' },
        { Screen_ID: 'SC12', Theater_ID: 'T02', Screen_Number: 3, Screen_Name: 'Audi 3 (Luxe Atmos)', Screen_Type: 'Luxe Atmos', Capacity: 245, Projection_Tech: '4K Barco Laser', Audio_Tech: 'Dolby Atmos', Verification_Status: 'Published - Needs Confirmation' },
        { Screen_ID: 'SC13', Theater_ID: 'T02', Screen_Number: 4, Screen_Name: 'Audi 4 (Luxe)', Screen_Type: 'Luxe Standard', Capacity: 278, Projection_Tech: '2K/4K Laser', Audio_Tech: 'Dolby 7.1 Surround', Verification_Status: 'Published - Needs Confirmation' },
        { Screen_ID: 'SC14', Theater_ID: 'T02', Screen_Number: 5, Screen_Name: 'Audi 5 (Luxe Atmos)', Screen_Type: 'Luxe Atmos', Capacity: 290, Projection_Tech: '4K Barco Laser', Audio_Tech: 'Dolby Atmos', Verification_Status: 'Published - Needs Confirmation' },
        { Screen_ID: 'SC15', Theater_ID: 'T02', Screen_Number: 6, Screen_Name: 'Audi 6 (Luxe)', Screen_Type: 'Luxe Standard', Capacity: 230, Projection_Tech: '2K Laser', Audio_Tech: 'Dolby 7.1 Surround', Verification_Status: 'Published - Needs Confirmation' },
        { Screen_ID: 'SC16', Theater_ID: 'T02', Screen_Number: 7, Screen_Name: 'Audi 7 (Luxe)', Screen_Type: 'Luxe Standard', Capacity: 255, Projection_Tech: '2K Laser', Audio_Tech: 'Dolby 7.1 Surround', Verification_Status: 'Published - Needs Confirmation' },
        { Screen_ID: 'SC17', Theater_ID: 'T02', Screen_Number: 8, Screen_Name: 'Audi 8 (Luxe Atmos)', Screen_Type: 'Luxe Atmos', Capacity: 265, Projection_Tech: '4K Laser', Audio_Tech: 'Dolby Atmos', Verification_Status: 'Published - Needs Confirmation' },
        { Screen_ID: 'SC18', Theater_ID: 'T02', Screen_Number: 9, Screen_Name: 'Audi 9 (Luxe)', Screen_Type: 'Luxe Standard', Capacity: 240, Projection_Tech: '2K Laser', Audio_Tech: 'Dolby 7.1 Surround', Verification_Status: 'Published - Needs Confirmation' },
        { Screen_ID: 'SC19', Theater_ID: 'T02', Screen_Number: 10, Screen_Name: 'Audi 10 (Luxe)', Screen_Type: 'Luxe Standard', Capacity: 260, Projection_Tech: '2K Laser', Audio_Tech: 'Dolby 7.1 Surround', Verification_Status: 'Published - Needs Confirmation' },
        { Screen_ID: 'SC20', Theater_ID: 'T02', Screen_Number: 11, Screen_Name: 'Audi 11 (IMAX Luxe)', Screen_Type: 'IMAX Laser', Capacity: 320, Projection_Tech: 'IMAX Laser Dual 4K', Audio_Tech: 'IMAX 12-Channel Sound', Verification_Status: 'Verified' },

        // C. PVR VR Chennai (10 Screens)
        { Screen_ID: 'SC21', Theater_ID: 'T03', Screen_Number: 1, Screen_Name: 'P[XL] Flagship Auditorium', Screen_Type: 'P[XL] Giant Screen', Capacity: 450, Projection_Tech: 'Dual 4K RGB Laser', Audio_Tech: 'Dolby Atmos SLS', Verification_Status: 'Verified' },
        { Screen_ID: 'SC22', Theater_ID: 'T03', Screen_Number: 2, Screen_Name: 'Audi 2', Screen_Type: 'Standard', Capacity: 170, Projection_Tech: '2K Laser', Audio_Tech: 'Dolby 7.1 Surround', Verification_Status: 'Published - Unverified' },
        { Screen_ID: 'SC23', Theater_ID: 'T03', Screen_Number: 3, Screen_Name: 'Audi 3', Screen_Type: 'Standard', Capacity: 364, Projection_Tech: '4K Xenon Digital', Audio_Tech: 'Dolby 7.1 Surround', Verification_Status: 'Published - Unverified' },
        { Screen_ID: 'SC24', Theater_ID: 'T03', Screen_Number: 4, Screen_Name: 'Audi 4', Screen_Type: 'Dolby Atmos', Capacity: 388, Projection_Tech: '4K Laser', Audio_Tech: 'Dolby Atmos', Verification_Status: 'Published - Unverified' },
        { Screen_ID: 'SC25', Theater_ID: 'T03', Screen_Number: 5, Screen_Name: 'Audi 5', Screen_Type: 'Dolby Atmos', Capacity: 450, Projection_Tech: '4K Laser', Audio_Tech: 'Dolby Atmos', Verification_Status: 'Published - Unverified' },
        { Screen_ID: 'SC26', Theater_ID: 'T03', Screen_Number: 6, Screen_Name: 'Audi 6', Screen_Type: 'Standard', Capacity: 188, Projection_Tech: '2K Laser', Audio_Tech: 'Dolby 7.1 Surround', Verification_Status: 'Published - Unverified' },
        { Screen_ID: 'SC27', Theater_ID: 'T03', Screen_Number: 7, Screen_Name: 'Audi 7', Screen_Type: 'Standard', Capacity: 126, Projection_Tech: '2K Xenon Digital', Audio_Tech: 'Dolby 7.1 Surround', Verification_Status: 'Published - Unverified' },
        { Screen_ID: 'SC28', Theater_ID: 'T03', Screen_Number: 8, Screen_Name: 'Audi 8', Screen_Type: 'Standard', Capacity: 113, Projection_Tech: '2K Laser', Audio_Tech: 'Dolby 7.1 Surround', Verification_Status: 'Published - Unverified' },
        { Screen_ID: 'SC29', Theater_ID: 'T03', Screen_Number: 9, Screen_Name: 'Audi 9', Screen_Type: 'Standard', Capacity: 135, Projection_Tech: '2K Laser', Audio_Tech: 'Dolby 7.1 Surround', Verification_Status: 'Published - Unverified' },
        { Screen_ID: 'SC30', Theater_ID: 'T03', Screen_Number: 10, Screen_Name: 'Audi 10', Screen_Type: 'Standard', Capacity: 202, Projection_Tech: '2K Laser', Audio_Tech: 'Dolby 7.1 Surround', Verification_Status: 'Published - Unverified' },

        // D. PVR Sathyam Cinemas (6 Screens)
        { Screen_ID: 'SC31', Theater_ID: 'T04', Screen_Number: 1, Screen_Name: 'Sathyam (Main Hall)', Screen_Type: 'Heritage Premier', Capacity: 948, Projection_Tech: 'Barco 4K RGB Laser', Audio_Tech: 'Dolby Atmos (Custom SPI)', Verification_Status: 'Verified' },
        { Screen_ID: 'SC32', Theater_ID: 'T04', Screen_Number: 2, Screen_Name: 'Santham', Screen_Type: 'Heritage Premier', Capacity: 566, Projection_Tech: 'Barco 4K RGB Laser', Audio_Tech: 'Dolby Atmos', Verification_Status: 'Verified' },
        { Screen_ID: 'SC33', Theater_ID: 'T04', Screen_Number: 3, Screen_Name: 'Seasons', Screen_Type: 'Heritage Standard', Capacity: 260, Projection_Tech: '4K Laser', Audio_Tech: 'Dolby 7.1 Surround', Verification_Status: 'Published - Unverified' },
        { Screen_ID: 'SC34', Theater_ID: 'T04', Screen_Number: 4, Screen_Name: 'Serene', Screen_Type: 'Heritage Standard', Capacity: 272, Projection_Tech: '4K Laser', Audio_Tech: 'Dolby 7.1 Surround', Verification_Status: 'Published - Unverified' },
        { Screen_ID: 'SC35', Theater_ID: 'T04', Screen_Number: 5, Screen_Name: 'Studio 5', Screen_Type: 'Intimate Cinema', Capacity: 148, Projection_Tech: '2K Laser', Audio_Tech: 'Dolby 7.1 Surround', Verification_Status: 'Published - Unverified' },
        { Screen_ID: 'SC36', Theater_ID: 'T04', Screen_Number: 6, Screen_Name: 'Six Degrees', Screen_Type: 'Intimate Cinema', Capacity: 184, Projection_Tech: '2K Laser', Audio_Tech: 'Dolby 7.1 Surround', Verification_Status: 'Published - Unverified' },

        // E. PVR Aerohub (5 Screens)
        { Screen_ID: 'SC37', Theater_ID: 'T05', Screen_Number: 1, Screen_Name: 'Audi 1', Screen_Type: 'Airport Premier', Capacity: 235, Projection_Tech: '2K RGB Laser', Audio_Tech: 'Dolby Atmos', Verification_Status: 'Published - Verified Capacity' },
        { Screen_ID: 'SC38', Theater_ID: 'T05', Screen_Number: 2, Screen_Name: 'Audi 2', Screen_Type: 'Airport Standard', Capacity: 240, Projection_Tech: '2K RGB Laser', Audio_Tech: 'Dolby 7.1 Surround', Verification_Status: 'Published - Verified Capacity' },
        { Screen_ID: 'SC39', Theater_ID: 'T05', Screen_Number: 3, Screen_Name: 'Audi 3', Screen_Type: 'Airport Standard', Capacity: 220, Projection_Tech: '2K RGB Laser', Audio_Tech: 'Dolby 7.1 Surround', Verification_Status: 'Published - Verified Capacity' },
        { Screen_ID: 'SC40', Theater_ID: 'T05', Screen_Number: 4, Screen_Name: 'Audi 4', Screen_Type: 'Airport Standard', Capacity: 230, Projection_Tech: '2K RGB Laser', Audio_Tech: 'Dolby 7.1 Surround', Verification_Status: 'Published - Verified Capacity' },
        { Screen_ID: 'SC41', Theater_ID: 'T05', Screen_Number: 5, Screen_Name: 'Audi 5', Screen_Type: 'Airport Premier', Capacity: 230, Projection_Tech: '2K RGB Laser', Audio_Tech: 'Dolby Atmos', Verification_Status: 'Published - Verified Capacity' },

        // F. INOX The Marina Mall (8 Screens)
        { Screen_ID: 'SC42', Theater_ID: 'T06', Screen_Number: 1, Screen_Name: 'Screen 1 (BIGPIX)', Screen_Type: 'BIGPIX Giant Screen', Capacity: 517, Projection_Tech: '4K Laser Christie', Audio_Tech: 'Dolby Atmos High-Power', Verification_Status: 'Published - Unverified' },
        { Screen_ID: 'SC43', Theater_ID: 'T06', Screen_Number: 2, Screen_Name: 'Screen 2', Screen_Type: 'Standard', Capacity: 228, Projection_Tech: '2K Digital Laser', Audio_Tech: 'Dolby 7.1 Surround', Verification_Status: 'Published - Unverified' },
        { Screen_ID: 'SC44', Theater_ID: 'T06', Screen_Number: 3, Screen_Name: 'Screen 3', Screen_Type: 'Standard', Capacity: 195, Projection_Tech: '2K Digital Laser', Audio_Tech: 'Dolby 7.1 Surround', Verification_Status: 'Published - Needs Confirmation' },
        { Screen_ID: 'SC45', Theater_ID: 'T06', Screen_Number: 4, Screen_Name: 'Screen 4', Screen_Type: 'Standard', Capacity: 242, Projection_Tech: '2K Digital Laser', Audio_Tech: 'Dolby 7.1 Surround', Verification_Status: 'Published - Unverified' },
        { Screen_ID: 'SC46', Theater_ID: 'T06', Screen_Number: 5, Screen_Name: 'Screen 5', Screen_Type: 'Standard', Capacity: 210, Projection_Tech: '2K Digital Laser', Audio_Tech: 'Dolby 7.1 Surround', Verification_Status: 'Published - Needs Confirmation' },
        { Screen_ID: 'SC47', Theater_ID: 'T06', Screen_Number: 6, Screen_Name: 'Screen 6', Screen_Type: 'Dolby Atmos', Capacity: 205, Projection_Tech: '2K Digital Laser', Audio_Tech: 'Dolby Atmos', Verification_Status: 'Published - Needs Confirmation' },
        { Screen_ID: 'SC48', Theater_ID: 'T06', Screen_Number: 7, Screen_Name: 'Screen 7', Screen_Type: 'Standard', Capacity: 185, Projection_Tech: '2K Digital Laser', Audio_Tech: 'Dolby 7.1 Surround', Verification_Status: 'Published - Needs Confirmation' },
        { Screen_ID: 'SC49', Theater_ID: 'T06', Screen_Number: 8, Screen_Name: 'Screen 8', Screen_Type: 'Standard', Capacity: 170, Projection_Tech: '2K Digital Laser', Audio_Tech: 'Dolby 7.1 Surround', Verification_Status: 'Published - Needs Confirmation' }
    ],

    MOVIE: [
        { Movie_ID: 'M01', Movie_Name: 'Superman', Genre: 'Action/Sci-Fi', Rating: 8.6, Duration: 150, Language: 'English', Synopsis: 'Superman reconciles his Kryptonian heritage with his human upbringing as Clark Kent, standing as the embodiment of truth, justice, and tomorrow.', Cast: 'David Corenswet, Rachel Brosnahan, Nicholas Hoult' },
        { Movie_ID: 'M02', Movie_Name: 'Heat', Genre: 'Action/Crime', Rating: 8.3, Duration: 170, Language: 'English', Synopsis: 'A group of high-end professional thieves start to feel the heat from the LAPD when a loose clue is left at their latest heist.', Cast: 'Al Pacino, Robert De Niro, Val Kilmer' },
        { Movie_ID: 'M03', Movie_Name: 'La La Land', Genre: 'Musical/Romance', Rating: 8.0, Duration: 128, Language: 'English', Synopsis: 'While navigating their careers in Los Angeles, a jazz pianist and an aspiring actress fall in love while attempting to reconcile their artistic dreams.', Cast: 'Ryan Gosling, Emma Stone, John Legend' },
        { Movie_ID: 'M04', Movie_Name: 'The Odyssey', Genre: 'Sci-Fi/Adventure', Rating: 8.7, Duration: 169, Language: 'English', Synopsis: 'Christopher Nolan\'s sweeping, 70mm large-format epic chronicling humanity\'s ancient voyages across uncharted cosmic boundaries and gravitational singularities.', Cast: 'Cillian Murphy, Anne Hathaway, Matt Damon' },
        { Movie_ID: 'M05', Movie_Name: 'Dune: Part Three', Genre: 'Sci-Fi/Action', Rating: 8.8, Duration: 166, Language: 'English', Synopsis: 'Paul Atreides consolidates his empire across Arrakis, confronting the perils of prophetic messianism and universal holy war.', Cast: 'Timothée Chalamet, Zendaya, Florence Pugh' },
        { Movie_ID: 'M06', Movie_Name: 'Avengers: Doomsday', Genre: 'Action/Sci-Fi', Rating: 8.4, Duration: 155, Language: 'English', Synopsis: 'Earth\'s mightiest heroes collide with the sinister intellect of Victor Von Doom in a colossal battle across fractured dimensional timelines.', Cast: 'Robert Downey Jr., Benedict Cumberbatch, Anthony Mackie' }
    ],

    SHOWS: [
        // PVR Palazzo (Vadapalani)
        { Show_ID: 'SH01', Movie_ID: 'M01', Screen_ID: 'SC05', Show_Date: '2026-10-21', Show_Time: '10:00:00', Format: 'IMAX 3D', Ticket_Price: 480.00 },
        { Show_ID: 'SH02', Movie_ID: 'M01', Screen_ID: 'SC05', Show_Date: '2026-10-21', Show_Time: '14:30:00', Format: 'IMAX 3D', Ticket_Price: 480.00 },
        { Show_ID: 'SH03', Movie_ID: 'M01', Screen_ID: 'SC05', Show_Date: '2026-10-21', Show_Time: '19:15:00', Format: 'IMAX 3D', Ticket_Price: 550.00 },
        { Show_ID: 'SH04', Movie_ID: 'M04', Screen_ID: 'SC08', Show_Date: '2026-10-21', Show_Time: '18:30:00', Format: '2D', Ticket_Price: 320.00 },

        // INOX Luxe (Phoenix Marketcity)
        { Show_ID: 'SH05', Movie_ID: 'M05', Screen_ID: 'SC20', Show_Date: '2026-10-21', Show_Time: '13:00:00', Format: 'IMAX 3D', Ticket_Price: 520.00 },
        { Show_ID: 'SH06', Movie_ID: 'M04', Screen_ID: 'SC20', Show_Date: '2026-10-21', Show_Time: '17:45:00', Format: 'IMAX 2D', Ticket_Price: 460.00 },
        { Show_ID: 'SH07', Movie_ID: 'M03', Screen_ID: 'SC12', Show_Date: '2026-10-21', Show_Time: '15:30:00', Format: '2D', Ticket_Price: 290.00 },

        // PVR VR Chennai (Anna Nagar)
        { Show_ID: 'SH08', Movie_ID: 'M01', Screen_ID: 'SC21', Show_Date: '2026-10-21', Show_Time: '11:00:00', Format: 'P[XL] 3D', Ticket_Price: 420.00 },
        { Show_ID: 'SH09', Movie_ID: 'M04', Screen_ID: 'SC21', Show_Date: '2026-10-21', Show_Time: '16:00:00', Format: 'P[XL] 2D', Ticket_Price: 380.00 },
        { Show_ID: 'SH10', Movie_ID: 'M02', Screen_ID: 'SC24', Show_Date: '2026-10-21', Show_Time: '20:15:00', Format: '2D', Ticket_Price: 260.00 },

        // PVR Sathyam (Royapettah)
        { Show_ID: 'SH11', Movie_ID: 'M01', Screen_ID: 'SC31', Show_Date: '2026-10-21', Show_Time: '10:30:00', Format: '2D', Ticket_Price: 250.00 },
        { Show_ID: 'SH12', Movie_ID: 'M05', Screen_ID: 'SC31', Show_Date: '2026-10-21', Show_Time: '15:00:00', Format: '2D', Ticket_Price: 250.00 },
        { Show_ID: 'SH13', Movie_ID: 'M03', Screen_ID: 'SC32', Show_Date: '2026-10-21', Show_Time: '18:45:00', Format: '2D', Ticket_Price: 240.00 },

        // PVR Aerohub (Airport Complex)
        { Show_ID: 'SH14', Movie_ID: 'M02', Screen_ID: 'SC37', Show_Date: '2026-10-21', Show_Time: '12:15:00', Format: '2D', Ticket_Price: 270.00 },
        { Show_ID: 'SH15', Movie_ID: 'M06', Screen_ID: 'SC41', Show_Date: '2026-10-21', Show_Time: '19:00:00', Format: '2D', Ticket_Price: 280.00 },

        // INOX The Marina Mall (Egattur, OMR)
        { Show_ID: 'SH16', Movie_ID: 'M01', Screen_ID: 'SC42', Show_Date: '2026-10-21', Show_Time: '13:30:00', Format: 'BIGPIX 3D', Ticket_Price: 420.00 },
        { Show_ID: 'SH17', Movie_ID: 'M05', Screen_ID: 'SC42', Show_Date: '2026-10-21', Show_Time: '18:00:00', Format: 'BIGPIX 2D', Ticket_Price: 380.00 },
        { Show_ID: 'SH18', Movie_ID: 'M06', Screen_ID: 'SC45', Show_Date: '2026-10-21', Show_Time: '20:30:00', Format: '2D', Ticket_Price: 220.00 }
    ],

    // Pre-seeded base seats maintaining explicit IDs for existing bookings
    BASE_PRESEEDED_SEATS: [
        // Palazzo IMAX (SC05)
        { Seat_ID: 'S0501', Screen_ID: 'SC05', Seat_Number: 'A1', Seat_Type: 'VIP' },
        { Seat_ID: 'S0502', Screen_ID: 'SC05', Seat_Number: 'A2', Seat_Type: 'VIP' },
        { Seat_ID: 'S0503', Screen_ID: 'SC05', Seat_Number: 'A3', Seat_Type: 'VIP' },
        { Seat_ID: 'S0504', Screen_ID: 'SC05', Seat_Number: 'A4', Seat_Type: 'VIP' },
        { Seat_ID: 'S0505', Screen_ID: 'SC05', Seat_Number: 'A5', Seat_Type: 'VIP' },
        { Seat_ID: 'S0506', Screen_ID: 'SC05', Seat_Number: 'B1', Seat_Type: 'Balcony' },
        { Seat_ID: 'S0507', Screen_ID: 'SC05', Seat_Number: 'B2', Seat_Type: 'Balcony' },
        { Seat_ID: 'S0508', Screen_ID: 'SC05', Seat_Number: 'B3', Seat_Type: 'Balcony' },
        { Seat_ID: 'S0509', Screen_ID: 'SC05', Seat_Number: 'B4', Seat_Type: 'Balcony' },
        { Seat_ID: 'S0510', Screen_ID: 'SC05', Seat_Number: 'B5', Seat_Type: 'Balcony' },
        { Seat_ID: 'S0511', Screen_ID: 'SC05', Seat_Number: 'C1', Seat_Type: 'Premium' },
        { Seat_ID: 'S0512', Screen_ID: 'SC05', Seat_Number: 'C2', Seat_Type: 'Premium' },
        { Seat_ID: 'S0513', Screen_ID: 'SC05', Seat_Number: 'C3', Seat_Type: 'Premium' },
        { Seat_ID: 'S0514', Screen_ID: 'SC05', Seat_Number: 'C4', Seat_Type: 'Premium' },
        { Seat_ID: 'S0515', Screen_ID: 'SC05', Seat_Number: 'C5', Seat_Type: 'Premium' },
        { Seat_ID: 'S0516', Screen_ID: 'SC05', Seat_Number: 'D1', Seat_Type: 'Regular' },
        { Seat_ID: 'S0517', Screen_ID: 'SC05', Seat_Number: 'D2', Seat_Type: 'Regular' },
        { Seat_ID: 'S0518', Screen_ID: 'SC05', Seat_Number: 'D3', Seat_Type: 'Regular' },
        { Seat_ID: 'S0519', Screen_ID: 'SC05', Seat_Number: 'D4', Seat_Type: 'Regular' },
        { Seat_ID: 'S0520', Screen_ID: 'SC05', Seat_Number: 'D5', Seat_Type: 'Regular' },

        // Luxe IMAX (SC20)
        { Seat_ID: 'S2001', Screen_ID: 'SC20', Seat_Number: 'A1', Seat_Type: 'VIP' },
        { Seat_ID: 'S2002', Screen_ID: 'SC20', Seat_Number: 'A2', Seat_Type: 'VIP' },
        { Seat_ID: 'S2003', Screen_ID: 'SC20', Seat_Number: 'A3', Seat_Type: 'VIP' },
        { Seat_ID: 'S2004', Screen_ID: 'SC20', Seat_Number: 'A4', Seat_Type: 'VIP' },
        { Seat_ID: 'S2005', Screen_ID: 'SC20', Seat_Number: 'B1', Seat_Type: 'Balcony' },
        { Seat_ID: 'S2006', Screen_ID: 'SC20', Seat_Number: 'B2', Seat_Type: 'Balcony' },
        { Seat_ID: 'S2007', Screen_ID: 'SC20', Seat_Number: 'B3', Seat_Type: 'Balcony' },
        { Seat_ID: 'S2008', Screen_ID: 'SC20', Seat_Number: 'B4', Seat_Type: 'Balcony' },
        { Seat_ID: 'S2009', Screen_ID: 'SC20', Seat_Number: 'C1', Seat_Type: 'Premium' },
        { Seat_ID: 'S2010', Screen_ID: 'SC20', Seat_Number: 'C2', Seat_Type: 'Premium' },
        { Seat_ID: 'S2011', Screen_ID: 'SC20', Seat_Number: 'C3', Seat_Type: 'Premium' },
        { Seat_ID: 'S2012', Screen_ID: 'SC20', Seat_Number: 'C4', Seat_Type: 'Premium' },
        { Seat_ID: 'S2013', Screen_ID: 'SC20', Seat_Number: 'D1', Seat_Type: 'Regular' },
        { Seat_ID: 'S2014', Screen_ID: 'SC20', Seat_Number: 'D2', Seat_Type: 'Regular' },
        { Seat_ID: 'S2015', Screen_ID: 'SC20', Seat_Number: 'D3', Seat_Type: 'Regular' },
        { Seat_ID: 'S2016', Screen_ID: 'SC20', Seat_Number: 'D4', Seat_Type: 'Regular' },

        // VR Chennai P[XL] (SC21)
        { Seat_ID: 'S2101', Screen_ID: 'SC21', Seat_Number: 'A1', Seat_Type: 'VIP' },
        { Seat_ID: 'S2102', Screen_ID: 'SC21', Seat_Number: 'A2', Seat_Type: 'VIP' },
        { Seat_ID: 'S2103', Screen_ID: 'SC21', Seat_Number: 'A3', Seat_Type: 'VIP' },
        { Seat_ID: 'S2104', Screen_ID: 'SC21', Seat_Number: 'A4', Seat_Type: 'VIP' },
        { Seat_ID: 'S2105', Screen_ID: 'SC21', Seat_Number: 'B1', Seat_Type: 'Balcony' },
        { Seat_ID: 'S2106', Screen_ID: 'SC21', Seat_Number: 'B2', Seat_Type: 'Balcony' },
        { Seat_ID: 'S2107', Screen_ID: 'SC21', Seat_Number: 'B3', Seat_Type: 'Balcony' },
        { Seat_ID: 'S2108', Screen_ID: 'SC21', Seat_Number: 'B4', Seat_Type: 'Balcony' },
        { Seat_ID: 'S2109', Screen_ID: 'SC21', Seat_Number: 'C1', Seat_Type: 'Premium' },
        { Seat_ID: 'S2110', Screen_ID: 'SC21', Seat_Number: 'C2', Seat_Type: 'Premium' },
        { Seat_ID: 'S2111', Screen_ID: 'SC21', Seat_Number: 'C3', Seat_Type: 'Premium' },
        { Seat_ID: 'S2112', Screen_ID: 'SC21', Seat_Number: 'C4', Seat_Type: 'Premium' },
        { Seat_ID: 'S2113', Screen_ID: 'SC21', Seat_Number: 'D1', Seat_Type: 'Regular' },
        { Seat_ID: 'S2114', Screen_ID: 'SC21', Seat_Number: 'D2', Seat_Type: 'Regular' },
        { Seat_ID: 'S2115', Screen_ID: 'SC21', Seat_Number: 'D3', Seat_Type: 'Regular' },
        { Seat_ID: 'S2116', Screen_ID: 'SC21', Seat_Number: 'D4', Seat_Type: 'Regular' },

        // Sathyam Main Hall (SC31)
        { Seat_ID: 'S3101', Screen_ID: 'SC31', Seat_Number: 'A1', Seat_Type: 'VIP' },
        { Seat_ID: 'S3102', Screen_ID: 'SC31', Seat_Number: 'A2', Seat_Type: 'VIP' },
        { Seat_ID: 'S3103', Screen_ID: 'SC31', Seat_Number: 'A3', Seat_Type: 'VIP' },
        { Seat_ID: 'S3104', Screen_ID: 'SC31', Seat_Number: 'B1', Seat_Type: 'Balcony' },
        { Seat_ID: 'S3105', Screen_ID: 'SC31', Seat_Number: 'B2', Seat_Type: 'Balcony' },
        { Seat_ID: 'S3106', Screen_ID: 'SC31', Seat_Number: 'B3', Seat_Type: 'Balcony' },
        { Seat_ID: 'S3107', Screen_ID: 'SC31', Seat_Number: 'C1', Seat_Type: 'Premium' },
        { Seat_ID: 'S3108', Screen_ID: 'SC31', Seat_Number: 'C2', Seat_Type: 'Premium' },
        { Seat_ID: 'S3109', Screen_ID: 'SC31', Seat_Number: 'C3', Seat_Type: 'Premium' },
        { Seat_ID: 'S3110', Screen_ID: 'SC31', Seat_Number: 'D1', Seat_Type: 'Regular' },
        { Seat_ID: 'S3111', Screen_ID: 'SC31', Seat_Number: 'D2', Seat_Type: 'Regular' },
        { Seat_ID: 'S3112', Screen_ID: 'SC31', Seat_Number: 'D3', Seat_Type: 'Regular' },

        // Aerohub Audi 1 (SC37)
        { Seat_ID: 'S3701', Screen_ID: 'SC37', Seat_Number: 'A1', Seat_Type: 'VIP' },
        { Seat_ID: 'S3702', Screen_ID: 'SC37', Seat_Number: 'A2', Seat_Type: 'VIP' },
        { Seat_ID: 'S3703', Screen_ID: 'SC37', Seat_Number: 'B1', Seat_Type: 'Balcony' },
        { Seat_ID: 'S3704', Screen_ID: 'SC37', Seat_Number: 'B2', Seat_Type: 'Balcony' },
        { Seat_ID: 'S3705', Screen_ID: 'SC37', Seat_Number: 'C1', Seat_Type: 'Premium' },
        { Seat_ID: 'S3706', Screen_ID: 'SC37', Seat_Number: 'C2', Seat_Type: 'Premium' },
        { Seat_ID: 'S3707', Screen_ID: 'SC37', Seat_Number: 'D1', Seat_Type: 'Regular' },
        { Seat_ID: 'S3708', Screen_ID: 'SC37', Seat_Number: 'D2', Seat_Type: 'Regular' },

        // Marina Mall BIGPIX (SC42)
        { Seat_ID: 'S4201', Screen_ID: 'SC42', Seat_Number: 'A1', Seat_Type: 'VIP' },
        { Seat_ID: 'S4202', Screen_ID: 'SC42', Seat_Number: 'A2', Seat_Type: 'VIP' },
        { Seat_ID: 'S4203', Screen_ID: 'SC42', Seat_Number: 'A3', Seat_Type: 'VIP' },
        { Seat_ID: 'S4204', Screen_ID: 'SC42', Seat_Number: 'B1', Seat_Type: 'Balcony' },
        { Seat_ID: 'S4205', Screen_ID: 'SC42', Seat_Number: 'B2', Seat_Type: 'Balcony' },
        { Seat_ID: 'S4206', Screen_ID: 'SC42', Seat_Number: 'B3', Seat_Type: 'Balcony' },
        { Seat_ID: 'S4207', Screen_ID: 'SC42', Seat_Number: 'C1', Seat_Type: 'Premium' },
        { Seat_ID: 'S4208', Screen_ID: 'SC42', Seat_Number: 'C2', Seat_Type: 'Premium' },
        { Seat_ID: 'S4209', Screen_ID: 'SC42', Seat_Number: 'C3', Seat_Type: 'Premium' },
        { Seat_ID: 'S4210', Screen_ID: 'SC42', Seat_Number: 'D1', Seat_Type: 'Regular' },
        { Seat_ID: 'S4211', Screen_ID: 'SC42', Seat_Number: 'D2', Seat_Type: 'Regular' },
        { Seat_ID: 'S4212', Screen_ID: 'SC42', Seat_Number: 'D3', Seat_Type: 'Regular' }
    ],

    SEAT: [], // Populated dynamically below matching each screen's real capacity

    CUSTOMER: [
        { Customer_ID: 'CU01', Customer_Name: 'Rahul Sharma', Email: 'rahul.s@example.com', Phone: '9876543210' },
        { Customer_ID: 'CU02', Customer_Name: 'Priya Patel', Email: 'priya.p@example.com', Phone: '9876543211' },
        { Customer_ID: 'CU03', Customer_Name: 'Ananya Iyer', Email: 'ananya.i@example.com', Phone: '9876543212' },
        { Customer_ID: 'CU04', Customer_Name: 'Vikram Singh', Email: 'vikram.s@example.com', Phone: '9876543213' },
        { Customer_ID: 'CU05', Customer_Name: 'Sneha Reddy', Email: 'sneha.r@example.com', Phone: '9876543214' }
    ],

    BOOKING: [
        { Booking_ID: 'BK01', Customer_ID: 'CU01', Show_ID: 'SH01', Booking_Date: '2026-10-20 11:20:00', Ticket_Price: 480.00, Format: 'IMAX 3D' },
        { Booking_ID: 'BK02', Customer_ID: 'CU02', Show_ID: 'SH01', Booking_Date: '2026-10-20 14:10:00', Ticket_Price: 480.00, Format: 'IMAX 3D' },
        { Booking_ID: 'BK03', Customer_ID: 'CU03', Show_ID: 'SH03', Booking_Date: '2026-10-20 17:00:00', Ticket_Price: 550.00, Format: 'IMAX 3D' },
        { Booking_ID: 'BK04', Customer_ID: 'CU01', Show_ID: 'SH05', Booking_Date: '2026-10-20 19:30:00', Ticket_Price: 520.00, Format: 'IMAX 3D' },
        { Booking_ID: 'BK05', Customer_ID: 'CU04', Show_ID: 'SH08', Booking_Date: '2026-10-21 09:15:00', Ticket_Price: 420.00, Format: 'P[XL] 3D' },
        { Booking_ID: 'BK06', Customer_ID: 'CU01', Show_ID: 'SH11', Booking_Date: '2026-10-21 10:45:00', Ticket_Price: 250.00, Format: '2D' },
        { Booking_ID: 'BK07', Customer_ID: 'CU05', Show_ID: 'SH16', Booking_Date: '2026-10-21 12:00:00', Ticket_Price: 420.00, Format: 'BIGPIX 3D' },
        { Booking_ID: 'BK08', Customer_ID: 'CU02', Show_ID: 'SH14', Booking_Date: '2026-10-21 14:00:00', Ticket_Price: 270.00, Format: '2D' }
    ],

    BOOKED_SEAT: [
        { Booking_ID: 'BK01', Seat_ID: 'S0501' },
        { Booking_ID: 'BK01', Seat_ID: 'S0502' },
        { Booking_ID: 'BK02', Seat_ID: 'S0508' },
        { Booking_ID: 'BK03', Seat_ID: 'S0511' },
        { Booking_ID: 'BK03', Seat_ID: 'S0512' },
        { Booking_ID: 'BK04', Seat_ID: 'S2001' },
        { Booking_ID: 'BK05', Seat_ID: 'S2105' },
        { Booking_ID: 'BK05', Seat_ID: 'S2106' },
        { Booking_ID: 'BK06', Seat_ID: 'S3102' },
        { Booking_ID: 'BK07', Seat_ID: 'S4207' },
        { Booking_ID: 'BK07', Seat_ID: 'S4208' },
        { Booking_ID: 'BK08', Seat_ID: 'S3701' }
    ],

    PAYMENT: [
        { Payment_ID: 'PAY01', Booking_ID: 'BK01', Payment_Mode: 'UPI', Amount: 960.00, Payment_Date: '2026-10-20 11:22:15' },
        { Payment_ID: 'PAY02', Booking_ID: 'BK02', Payment_Mode: 'Credit Card', Amount: 480.00, Payment_Date: '2026-10-20 14:11:40' },
        { Payment_ID: 'PAY03', Booking_ID: 'BK03', Payment_Mode: 'UPI', Amount: 1100.00, Payment_Date: '2026-10-20 17:02:00' },
        { Payment_ID: 'PAY04', Booking_ID: 'BK04', Payment_Mode: 'Debit Card', Amount: 520.00, Payment_Date: '2026-10-20 19:31:10' },
        { Payment_ID: 'PAY05', Booking_ID: 'BK05', Payment_Mode: 'Net Banking', Amount: 840.00, Payment_Date: '2026-10-21 09:16:30' },
        { Payment_ID: 'PAY06', Booking_ID: 'BK06', Payment_Mode: 'UPI', Amount: 250.00, Payment_Date: '2026-10-21 10:46:12' },
        { Payment_ID: 'PAY07', Booking_ID: 'BK07', Payment_Mode: 'Credit Card', Amount: 840.00, Payment_Date: '2026-10-21 12:01:45' },
        { Payment_ID: 'PAY08', Booking_ID: 'BK08', Payment_Mode: 'Cash', Amount: 270.00, Payment_Date: '2026-10-21 14:02:00' }
    ]
};

// 18 Academic SQL Queries Catalogue for Chennai MTRS Sandbox
const ACADEMIC_QUERIES = [
    {
        id: 1,
        title: 'Q1: Basic Selection & Projection',
        concept: 'Relational Selection (sigma) and Projection (pi) with compound predicate',
        sql: `SELECT Movie_ID, Movie_Name, Genre, Rating, Duration, Language
FROM MOVIE
WHERE Duration > 140 AND Rating >= 8.4
ORDER BY Rating DESC;`,
        description: 'Retrieves all movies having duration greater than 140 minutes and rating at least 8.4.'
    },
    {
        id: 2,
        title: 'Q2: Multi-Table Inner Join (4 Relations - Chennai)',
        concept: 'Natural / Theta Joins across THEATER, SCREEN, SHOWS, and MOVIE',
        sql: `SELECT t.Theater_Name, s.Screen_Number, s.Screen_Name, s.Screen_Type, s.Projection_Tech, s.Audio_Tech,
       m.Movie_Name, sh.Show_Date, sh.Show_Time, sh.Format, sh.Ticket_Price
FROM SHOWS sh
INNER JOIN SCREEN s ON sh.Screen_ID = s.Screen_ID
INNER JOIN THEATER t ON s.Theater_ID = t.Theater_ID
INNER JOIN MOVIE m ON sh.Movie_ID = m.Movie_ID
WHERE t.Theater_Name LIKE '%PVR Palazzo%'
ORDER BY sh.Show_Date, sh.Show_Time;`,
        description: 'Lists all scheduled movie shows at PVR Palazzo Vadapalani with screen name, projection, audio, timing, and ticket price.'
    },
    {
        id: 3,
        title: 'Q3: Group By with Aggregates (COUNT & SUM)',
        concept: 'Relational Aggregation (gamma) with LEFT JOIN and COALESCE',
        sql: `SELECT m.Movie_ID, m.Movie_Name, m.Genre,
       COUNT(DISTINCT b.Booking_ID) AS Total_Bookings,
       COALESCE(SUM(p.Amount), 0.00) AS Total_Revenue
FROM MOVIE m
LEFT JOIN SHOWS sh ON m.Movie_ID = sh.Movie_ID
LEFT JOIN BOOKING b ON sh.Show_ID = b.Show_ID
LEFT JOIN PAYMENT p ON b.Booking_ID = p.Booking_ID
GROUP BY m.Movie_ID, m.Movie_Name, m.Genre
ORDER BY Total_Revenue DESC;`,
        description: 'Aggregates the total number of bookings and total revenue collected for each movie in the system.'
    },
    {
        id: 4,
        title: 'Q4: Nested Subquery with Scalar Aggregate',
        concept: 'Non-correlated Subquery evaluating scalar AVG() in HAVING clause',
        sql: `SELECT t.Theater_ID, t.Theater_Name, t.City, ROUND(AVG(sh.Ticket_Price), 2) AS Avg_Theater_Price
FROM THEATER t
INNER JOIN SCREEN s ON t.Theater_ID = s.Theater_ID
INNER JOIN SHOWS sh ON s.Screen_ID = sh.Screen_ID
GROUP BY t.Theater_ID, t.Theater_Name, t.City
HAVING AVG(sh.Ticket_Price) > (SELECT AVG(Ticket_Price) FROM SHOWS)
ORDER BY Avg_Theater_Price DESC;`,
        description: 'Finds Chennai theaters where the average ticket price exceeds the system-wide average across all theaters.'
    },
    {
        id: 5,
        title: 'Q5: Group By with HAVING (Filter on Aggregates)',
        concept: 'Aggregate filtering using HAVING clause to find high-frequency entities',
        sql: `SELECT c.Customer_ID, c.Customer_Name, c.Email, c.Phone,
       COUNT(b.Booking_ID) AS Booking_Count,
       SUM(p.Amount) AS Total_Spent
FROM CUSTOMER c
INNER JOIN BOOKING b ON c.Customer_ID = b.Customer_ID
INNER JOIN PAYMENT p ON b.Booking_ID = p.Booking_ID
GROUP BY c.Customer_ID, c.Customer_Name, c.Email, c.Phone
HAVING COUNT(b.Booking_ID) > 1
ORDER BY Booking_Count DESC, Total_Spent DESC;`,
        description: 'Identifies loyal customers who have made multiple distinct bookings along with their total spend.'
    },
    {
        id: 6,
        title: 'Q6: Complex 5-Table Join',
        concept: 'Multi-table join traversal: SHOWS -> MOVIE -> BOOKING -> BOOKED_SEAT -> SEAT -> CUSTOMER',
        sql: `SELECT sh.Show_ID, m.Movie_Name, st.Seat_Number, st.Seat_Type, c.Customer_Name, c.Email, b.Booking_ID, b.Booking_Date
FROM SHOWS sh
INNER JOIN MOVIE m ON sh.Movie_ID = m.Movie_ID
INNER JOIN BOOKING b ON sh.Show_ID = b.Show_ID
INNER JOIN BOOKED_SEAT bs ON b.Booking_ID = bs.Booking_ID
INNER JOIN SEAT st ON bs.Seat_ID = st.Seat_ID
INNER JOIN CUSTOMER c ON b.Customer_ID = c.Customer_ID
WHERE sh.Show_ID = 'SH01'
ORDER BY st.Seat_Number;`,
        description: 'Retrieves all specific seats reserved for Show SH01 (Palazzo IMAX Laser) with customer names and booking timestamps.'
    },
    {
        id: 7,
        title: 'Q7: Subquery with NOT IN (Set Difference)',
        concept: 'Set difference (R - S) using NOT IN subquery predicate',
        sql: `SELECT Movie_ID, Movie_Name, Genre, Language, Rating
FROM MOVIE
WHERE Movie_ID NOT IN (
    SELECT DISTINCT sh.Movie_ID 
    FROM SHOWS sh
    INNER JOIN BOOKING b ON sh.Show_ID = b.Show_ID
);`,
        description: 'Finds catalog movies that currently have zero customer bookings recorded.'
    },
    {
        id: 8,
        title: 'Q8: Correlated Subquery with NOT EXISTS',
        concept: 'Universal constraint simulation: Customer who paid via UPI and NEVER any other mode',
        sql: `SELECT c.Customer_ID, c.Customer_Name, c.Email
FROM CUSTOMER c
WHERE EXISTS (
    SELECT 1 FROM BOOKING b INNER JOIN PAYMENT p ON b.Booking_ID = p.Booking_ID
    WHERE b.Customer_ID = c.Customer_ID AND p.Payment_Mode = 'UPI'
)
AND NOT EXISTS (
    SELECT 1 FROM BOOKING b INNER JOIN PAYMENT p ON b.Booking_ID = p.Booking_ID
    WHERE b.Customer_ID = c.Customer_ID AND p.Payment_Mode <> 'UPI'
);`,
        description: 'Returns customers whose payment history is exclusively UPI.'
    },
    {
        id: 9,
        title: 'Q9: Outer Join / Anti-Join',
        concept: 'Anti-semijoin via LEFT JOIN ... WHERE right_table.PK IS NULL',
        sql: `SELECT sh.Show_ID, m.Movie_Name, t.Theater_Name, s.Screen_Name, sh.Show_Date, sh.Show_Time, sh.Format, sh.Ticket_Price
FROM SHOWS sh
INNER JOIN MOVIE m ON sh.Movie_ID = m.Movie_ID
INNER JOIN SCREEN s ON sh.Screen_ID = s.Screen_ID
INNER JOIN THEATER t ON s.Theater_ID = t.Theater_ID
LEFT JOIN BOOKING b ON sh.Show_ID = b.Show_ID
WHERE b.Booking_ID IS NULL;`,
        description: 'Finds all scheduled shows that currently have 0 bookings sold.'
    },
    {
        id: 10,
        title: 'Q10: Top-N Query with ORDER BY & LIMIT',
        concept: 'Ranking and Top-N selection based on aggregate summation',
        sql: `SELECT sh.Show_ID, m.Movie_Name, t.Theater_Name, s.Screen_Name, sh.Format,
       COUNT(bs.Seat_ID) AS Total_Seats_Sold,
       SUM(p.Amount) AS Total_Revenue
FROM SHOWS sh
INNER JOIN MOVIE m ON sh.Movie_ID = m.Movie_ID
INNER JOIN SCREEN s ON sh.Screen_ID = s.Screen_ID
INNER JOIN THEATER t ON s.Theater_ID = t.Theater_ID
INNER JOIN BOOKING b ON sh.Show_ID = b.Show_ID
INNER JOIN BOOKED_SEAT bs ON b.Booking_ID = bs.Booking_ID
INNER JOIN PAYMENT p ON b.Booking_ID = p.Booking_ID
GROUP BY sh.Show_ID, m.Movie_Name, t.Theater_Name, s.Screen_Name, sh.Format
ORDER BY Total_Revenue DESC
LIMIT 3;`,
        description: 'Retrieves the top 3 highest revenue-generating shows.'
    },
    {
        id: 11,
        title: 'Q11: Screen Capacity Utilization (%)',
        concept: 'Arithmetic expression on aggregates to calculate percentage ratio',
        sql: `SELECT sh.Show_ID, m.Movie_Name, s.Screen_Name, s.Capacity AS Total_Capacity,
       COUNT(bs.Seat_ID) AS Seats_Booked,
       ROUND((COUNT(bs.Seat_ID) * 100.0 / s.Capacity), 2) AS Occupancy_Percentage
FROM SHOWS sh
INNER JOIN MOVIE m ON sh.Movie_ID = m.Movie_ID
INNER JOIN SCREEN s ON sh.Screen_ID = s.Screen_ID
LEFT JOIN BOOKING b ON sh.Show_ID = b.Show_ID
LEFT JOIN BOOKED_SEAT bs ON b.Booking_ID = bs.Booking_ID
GROUP BY sh.Show_ID, m.Movie_Name, s.Screen_Name, s.Capacity
ORDER BY Occupancy_Percentage DESC;`,
        description: 'Computes the seat occupancy percentage for each scheduled screening.'
    },
    {
        id: 12,
        title: 'Q12: Relational Intersection Simulation',
        concept: 'Intersection (R intersect S) via compound IN subqueries',
        sql: `SELECT c.Customer_ID, c.Customer_Name, c.Email
FROM CUSTOMER c
WHERE c.Customer_ID IN (
    SELECT b.Customer_ID FROM BOOKING b INNER JOIN SHOWS sh ON b.Show_ID = sh.Show_ID
    INNER JOIN MOVIE m ON sh.Movie_ID = m.Movie_ID WHERE m.Movie_Name = 'Superman'
)
AND c.Customer_ID IN (
    SELECT b.Customer_ID FROM BOOKING b INNER JOIN SHOWS sh ON b.Show_ID = sh.Show_ID
    INNER JOIN MOVIE m ON sh.Movie_ID = m.Movie_ID WHERE m.Movie_Name = 'Heat'
);`,
        description: 'Finds customers who booked tickets for both Superman AND Heat.'
    },
    {
        id: 13,
        title: 'Q13: Aggregation across Chennai Relations & Diversity',
        concept: 'COUNT(DISTINCT) across multiple joined entities',
        sql: `SELECT t.Theater_Name, t.City,
       COUNT(DISTINCT sh.Show_ID) AS Total_Shows,
       COUNT(DISTINCT m.Movie_ID) AS Total_Movies_Screened,
       COUNT(DISTINCT m.Genre) AS Distinct_Genres_Available
FROM THEATER t
INNER JOIN SCREEN s ON t.Theater_ID = s.Theater_ID
INNER JOIN SHOWS sh ON s.Screen_ID = sh.Screen_ID
INNER JOIN MOVIE m ON sh.Movie_ID = m.Movie_ID
WHERE t.City = 'Chennai'
GROUP BY t.Theater_Name, t.City;`,
        description: 'Summarizes show counts and unique genre offerings at each Chennai multiplex.'
    },
    {
        id: 14,
        title: 'Q14: Premium Large Format (PLF) Filtering (IMAX, P[XL], BIGPIX)',
        concept: 'Domain filtering with IN clause on PLF formats and price comparison',
        sql: `SELECT sh.Show_ID, m.Movie_Name, t.Theater_Name, s.Screen_Name, sh.Format, sh.Show_Date, sh.Show_Time, sh.Ticket_Price
FROM SHOWS sh
INNER JOIN MOVIE m ON sh.Movie_ID = m.Movie_ID
INNER JOIN SCREEN s ON sh.Screen_ID = s.Screen_ID
INNER JOIN THEATER t ON s.Theater_ID = t.Theater_ID
WHERE sh.Format IN ('IMAX 2D', 'IMAX 3D', 'P[XL] 2D', 'P[XL] 3D', 'BIGPIX 2D', 'BIGPIX 3D')
  AND sh.Ticket_Price >= 380.00
ORDER BY sh.Ticket_Price DESC;`,
        description: 'Lists all premium large format screenings (IMAX, P[XL], BIGPIX) priced at ₹380 or above.'
    },
    {
        id: 15,
        title: 'Q15: Multi-Seat Booking Analysis',
        concept: 'Grouping on composite transaction and filtering on seat count > 1',
        sql: `SELECT b.Booking_ID, c.Customer_Name, m.Movie_Name,
       COUNT(bs.Seat_ID) AS Seats_Count, p.Payment_Mode, p.Amount AS Total_Paid
FROM BOOKING b
INNER JOIN CUSTOMER c ON b.Customer_ID = c.Customer_ID
INNER JOIN SHOWS sh ON b.Show_ID = sh.Show_ID
INNER JOIN MOVIE m ON sh.Movie_ID = m.Movie_ID
INNER JOIN BOOKED_SEAT bs ON b.Booking_ID = bs.Booking_ID
INNER JOIN PAYMENT p ON b.Booking_ID = p.Booking_ID
GROUP BY b.Booking_ID, c.Customer_Name, m.Movie_Name, p.Payment_Mode, p.Amount
HAVING COUNT(bs.Seat_ID) > 1
ORDER BY Seats_Count DESC, Total_Paid DESC;`,
        description: 'Finds group or couple bookings where more than 1 seat was reserved.'
    },
    {
        id: 16,
        title: 'Q16: Correlated Subquery (Max Capacity Screen per Theater)',
        concept: 'Correlated subquery finding the maximum capacity screen per theater',
        sql: `SELECT t.Theater_Name, s1.Screen_ID, s1.Screen_Number, s1.Screen_Name, s1.Screen_Type, s1.Capacity
FROM SCREEN s1
INNER JOIN THEATER t ON s1.Theater_ID = t.Theater_ID
WHERE s1.Capacity = (
    SELECT MAX(s2.Capacity) FROM SCREEN s2 WHERE s2.Theater_ID = s1.Theater_ID
)
ORDER BY s1.Capacity DESC;`,
        description: 'Identifies the flagship (largest capacity) auditorium for every Chennai theater.'
    },
    {
        id: 17,
        title: 'Q17: Financial Breakdown by Payment Mode',
        concept: 'Transaction analytics grouping by categorical payment channel',
        sql: `SELECT Payment_Mode,
       COUNT(Payment_ID) AS Total_Transactions,
       SUM(Amount) AS Total_Revenue,
       ROUND(AVG(Amount), 2) AS Average_Transaction_Value
FROM PAYMENT
GROUP BY Payment_Mode
ORDER BY Total_Revenue DESC;`,
        description: 'Provides a revenue and transaction volume summary grouped by payment mode.'
    },
    {
        id: 18,
        title: 'Q18: Relational Division (Universal Quantification)',
        concept: 'Classic Relational Division (R / S) simulated via double NOT EXISTS',
        sql: `SELECT c.Customer_ID, c.Customer_Name, c.Email
FROM CUSTOMER c
WHERE NOT EXISTS (
    SELECT t.Theater_ID FROM THEATER t WHERE t.City = 'Chennai'
    AND NOT EXISTS (
        SELECT 1 FROM BOOKING b INNER JOIN SHOWS sh ON b.Show_ID = sh.Show_ID
        INNER JOIN SCREEN s ON sh.Screen_ID = s.Screen_ID
        WHERE b.Customer_ID = c.Customer_ID AND s.Theater_ID = t.Theater_ID
    )
);`,
        description: 'Finds loyal customers who have watched a movie in EVERY theater in Chennai.'
    }
];

// ============================================================================
// DYNAMIC SEAT GENERATOR FOR AUDITORIUM CAPACITIES
// Builds rows (VIP, Balcony, Premium, Regular) matching exact screen.Capacity
// ============================================================================
function generateAuditoriumSeats(screen, existingSeeds = []) {
    const capacity = parseInt(screen.Capacity, 10) || 200;
    
    // Choose proportional columns per row based on auditorium capacity
    let colsPerRow = 20;
    if (capacity <= 160) {
        colsPerRow = 12;
    } else if (capacity <= 260) {
        colsPerRow = 16;
    } else if (capacity <= 360) {
        colsPerRow = 20;
    } else if (capacity <= 550) {
        colsPerRow = 22;
    } else {
        colsPerRow = 28; // Mega halls like Sathyam Main (948 seats)
    }

    const numRows = Math.ceil(capacity / colsPerRow);

    // Standard cinema row letters (skipping 'I' and 'O' for visual clarity)
    const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
    const rowLabels = [];
    for (let r = 0; r < numRows; r++) {
        if (r < LETTERS.length) {
            rowLabels.push(LETTERS[r]);
        } else {
            const idx = r - LETTERS.length;
            const letter = LETTERS[idx % LETTERS.length];
            rowLabels.push(letter + letter);
        }
    }

    // Map existing pre-seeded seats by Seat_Number to preserve exact Seat_ID for booking relations
    const existingMap = new Map();
    if (Array.isArray(existingSeeds)) {
        existingSeeds.forEach(st => {
            if (st.Screen_ID === screen.Screen_ID) {
                existingMap.set(st.Seat_Number, st);
            }
        });
    }

    // Physical Row Position & Pricing Hierarchy:
    // Screen is at the FRONT (Row A is physically closest to the screen, cheapest)
    // Front rows (0 to regularEnd): 'Regular' (Classic / Standard - Lowest Price)
    // Middle rows (regularEnd to premiumEnd): 'Premium' (Executive - Moderate Price)
    // Rear rows (premiumEnd to balconyEnd): 'Balcony' (Prime / Superior - High Price)
    // Rearmost rows (balconyEnd to numRows): 'VIP' (Luxury Recliners - Highest Price)
    const regularEnd = Math.max(1, Math.round(numRows * 0.28));
    const premiumEnd = Math.max(regularEnd + 1, Math.round(numRows * 0.62));
    const balconyEnd = Math.max(premiumEnd + 1, Math.round(numRows * 0.88));

    const seats = [];
    let count = 0;

    for (let r = 0; r < numRows && count < capacity; r++) {
        const rowLetter = rowLabels[r];
        let tier = 'VIP'; // Rearmost rows
        if (r < regularEnd) {
            tier = 'Regular'; // Front rows closest to screen
        } else if (r < premiumEnd) {
            tier = 'Premium'; // Middle rows
        } else if (r < balconyEnd) {
            tier = 'Balcony'; // Rear rows
        }

        const seatsInThisRow = Math.min(colsPerRow, capacity - count);

        for (let c = 1; c <= seatsInThisRow; c++) {
            const seatNum = `${rowLetter}${c}`;
            let seatObj;

            if (existingMap.has(seatNum)) {
                const ex = existingMap.get(seatNum);
                seatObj = {
                    Seat_ID: ex.Seat_ID,
                    Screen_ID: screen.Screen_ID,
                    Seat_Number: seatNum,
                    Seat_Type: ex.Seat_Type || tier
                };
            } else {
                seatObj = {
                    Seat_ID: `S_${screen.Screen_ID}_${seatNum}`,
                    Screen_ID: screen.Screen_ID,
                    Seat_Number: seatNum,
                    Seat_Type: tier
                };
            }

            seats.push(seatObj);
            count++;
        }
    }

    return seats;
}

// Populate SEED_DATA.SEAT for all 49 screens matching their exact capacity
SEED_DATA.SCREEN.forEach(sc => {
    const screenSeats = generateAuditoriumSeats(sc, SEED_DATA.BASE_PRESEEDED_SEATS);
    SEED_DATA.SEAT.push(...screenSeats);
});

window.generateAuditoriumSeats = generateAuditoriumSeats;
window.SEED_DATA = SEED_DATA;
window.ACADEMIC_QUERIES = ACADEMIC_QUERIES;

