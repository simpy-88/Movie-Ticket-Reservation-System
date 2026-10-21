// ============================================================================
// MOVIE TICKET RESERVATION SYSTEM (MTRS)
// File: js/db-data.js
// Description: Relational seed data matching database/seed.sql and query definitions.
// ============================================================================

const SEED_DATA = {
    THEATER: [
        { Theater_ID: 'T01', Theater_Name: 'PVR Cinemas - Forum Mall', City: 'Bangalore', State: 'Karnataka', Country: 'India' },
        { Theater_ID: 'T02', Theater_Name: 'INOX Multiplex - Garuda', City: 'Bangalore', State: 'Karnataka', Country: 'India' },
        { Theater_ID: 'T03', Theater_Name: 'Cinepolis - Orion Gateway', City: 'Bangalore', State: 'Karnataka', Country: 'India' }
    ],

    SCREEN: [
        { Screen_ID: 'SC01', Theater_ID: 'T01', Screen_Number: 1, Screen_Type: 'IMAX Laser', Capacity: 60 },
        { Screen_ID: 'SC02', Theater_ID: 'T01', Screen_Number: 2, Screen_Type: 'Dolby Atmos', Capacity: 80 },
        { Screen_ID: 'SC03', Theater_ID: 'T02', Screen_Number: 1, Screen_Type: '4DX Dynamic', Capacity: 50 },
        { Screen_ID: 'SC04', Theater_ID: 'T02', Screen_Number: 2, Screen_Type: 'Standard 2K', Capacity: 70 },
        { Screen_ID: 'SC05', Theater_ID: 'T03', Screen_Number: 1, Screen_Type: 'VIP Luxury Lounge', Capacity: 40 }
    ],

    MOVIE: [
        { Movie_ID: 'M01', Movie_Name: 'Superman: Legacy', Genre: 'Action/Sci-Fi', Rating: 8.6, Duration: 150, Language: 'English', Synopsis: 'The iconic hero reconciles his Kryptonian heritage with his human upbringing, standing as the embodiment of truth, justice, and tomorrow.', Cast: 'David Corenswet, Rachel Brosnahan, Nicholas Hoult' },
        { Movie_ID: 'M02', Movie_Name: 'Heat', Genre: 'Action/Crime', Rating: 8.3, Duration: 170, Language: 'English', Synopsis: 'A group of high-end professional thieves start to feel the heat from the LAPD when a loose clue is left at their latest heist.', Cast: 'Al Pacino, Robert De Niro, Val Kilmer' },
        { Movie_ID: 'M03', Movie_Name: 'La La Land', Genre: 'Musical/Romance', Rating: 8.0, Duration: 128, Language: 'English', Synopsis: 'While navigating their careers in Los Angeles, a pianist and an actress fall in love while attempting to reconcile their aspirations for the future.', Cast: 'Ryan Gosling, Emma Stone, John Legend' },
        { Movie_ID: 'M04', Movie_Name: 'Interstellar', Genre: 'Sci-Fi/Adventure', Rating: 8.7, Duration: 169, Language: 'English', Synopsis: 'When Earth becomes uninhabitable in the future, a farmer and ex-NASA pilot, Joseph Cooper, is tasked to pilot a spacecraft along with a team of researchers.', Cast: 'Matthew McConaughey, Anne Hathaway, Jessica Chastain' },
        { Movie_ID: 'M05', Movie_Name: 'Dune: Part Two', Genre: 'Sci-Fi/Action', Rating: 8.8, Duration: 166, Language: 'English', Synopsis: 'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.', Cast: 'Timothée Chalamet, Zendaya, Rebecca Ferguson' },
        { Movie_ID: 'M06', Movie_Name: 'Kantara: Chapter 1', Genre: 'Action/Thriller', Rating: 8.4, Duration: 148, Language: 'Kannada', Synopsis: 'A human and nature conflict set in the sacred coastal forests where divinity, legends, and raw folklore collide.', Cast: 'Rishab Shetty, Sapthami Gowda, Kishore' }
    ],

    SHOWS: [
        { Show_ID: 'SH01', Movie_ID: 'M01', Screen_ID: 'SC01', Show_Date: '2026-10-21', Show_Time: '10:00:00', Format: 'IMAX 3D', Ticket_Price: 450.00 },
        { Show_ID: 'SH02', Movie_ID: 'M01', Screen_ID: 'SC01', Show_Date: '2026-10-21', Show_Time: '14:30:00', Format: 'IMAX 3D', Ticket_Price: 450.00 },
        { Show_ID: 'SH03', Movie_ID: 'M01', Screen_ID: 'SC01', Show_Date: '2026-10-21', Show_Time: '19:15:00', Format: 'IMAX 3D', Ticket_Price: 520.00 },
        { Show_ID: 'SH04', Movie_ID: 'M04', Screen_ID: 'SC01', Show_Date: '2026-10-22', Show_Time: '18:30:00', Format: 'IMAX 2D', Ticket_Price: 420.00 },
        { Show_ID: 'SH05', Movie_ID: 'M02', Screen_ID: 'SC02', Show_Date: '2026-10-21', Show_Time: '11:15:00', Format: '2D', Ticket_Price: 250.00 },
        { Show_ID: 'SH06', Movie_ID: 'M03', Screen_ID: 'SC02', Show_Date: '2026-10-21', Show_Time: '16:00:00', Format: '2D', Ticket_Price: 260.00 },
        { Show_ID: 'SH07', Movie_ID: 'M05', Screen_ID: 'SC03', Show_Date: '2026-10-21', Show_Time: '13:00:00', Format: '3D', Ticket_Price: 390.00 },
        { Show_ID: 'SH08', Movie_ID: 'M04', Screen_ID: 'SC03', Show_Date: '2026-10-21', Show_Time: '17:45:00', Format: '3D', Ticket_Price: 390.00 },
        { Show_ID: 'SH09', Movie_ID: 'M06', Screen_ID: 'SC04', Show_Date: '2026-10-21', Show_Time: '19:00:00', Format: '2D', Ticket_Price: 220.00 },
        { Show_ID: 'SH10', Movie_ID: 'M03', Screen_ID: 'SC05', Show_Date: '2026-10-21', Show_Time: '20:30:00', Format: '2D', Ticket_Price: 550.00 }
    ],

    SEAT: [
        // SC01 Seats (PVR IMAX)
        { Seat_ID: 'S0101', Screen_ID: 'SC01', Seat_Number: 'A1', Seat_Type: 'VIP' },
        { Seat_ID: 'S0102', Screen_ID: 'SC01', Seat_Number: 'A2', Seat_Type: 'VIP' },
        { Seat_ID: 'S0103', Screen_ID: 'SC01', Seat_Number: 'A3', Seat_Type: 'VIP' },
        { Seat_ID: 'S0104', Screen_ID: 'SC01', Seat_Number: 'A4', Seat_Type: 'VIP' },
        { Seat_ID: 'S0105', Screen_ID: 'SC01', Seat_Number: 'A5', Seat_Type: 'VIP' },
        { Seat_ID: 'S0106', Screen_ID: 'SC01', Seat_Number: 'B1', Seat_Type: 'Balcony' },
        { Seat_ID: 'S0107', Screen_ID: 'SC01', Seat_Number: 'B2', Seat_Type: 'Balcony' },
        { Seat_ID: 'S0108', Screen_ID: 'SC01', Seat_Number: 'B3', Seat_Type: 'Balcony' },
        { Seat_ID: 'S0109', Screen_ID: 'SC01', Seat_Number: 'B4', Seat_Type: 'Balcony' },
        { Seat_ID: 'S0110', Screen_ID: 'SC01', Seat_Number: 'B5', Seat_Type: 'Balcony' },
        { Seat_ID: 'S0111', Screen_ID: 'SC01', Seat_Number: 'C1', Seat_Type: 'Premium' },
        { Seat_ID: 'S0112', Screen_ID: 'SC01', Seat_Number: 'C2', Seat_Type: 'Premium' },
        { Seat_ID: 'S0113', Screen_ID: 'SC01', Seat_Number: 'C3', Seat_Type: 'Premium' },
        { Seat_ID: 'S0114', Screen_ID: 'SC01', Seat_Number: 'C4', Seat_Type: 'Premium' },
        { Seat_ID: 'S0115', Screen_ID: 'SC01', Seat_Number: 'C5', Seat_Type: 'Premium' },
        { Seat_ID: 'S0116', Screen_ID: 'SC01', Seat_Number: 'D1', Seat_Type: 'Regular' },
        { Seat_ID: 'S0117', Screen_ID: 'SC01', Seat_Number: 'D2', Seat_Type: 'Regular' },
        { Seat_ID: 'S0118', Screen_ID: 'SC01', Seat_Number: 'D3', Seat_Type: 'Regular' },
        { Seat_ID: 'S0119', Screen_ID: 'SC01', Seat_Number: 'D4', Seat_Type: 'Regular' },
        { Seat_ID: 'S0120', Screen_ID: 'SC01', Seat_Number: 'D5', Seat_Type: 'Regular' },

        // SC02 Seats (PVR Standard)
        { Seat_ID: 'S0201', Screen_ID: 'SC02', Seat_Number: 'A1', Seat_Type: 'VIP' },
        { Seat_ID: 'S0202', Screen_ID: 'SC02', Seat_Number: 'A2', Seat_Type: 'VIP' },
        { Seat_ID: 'S0203', Screen_ID: 'SC02', Seat_Number: 'A3', Seat_Type: 'VIP' },
        { Seat_ID: 'S0204', Screen_ID: 'SC02', Seat_Number: 'A4', Seat_Type: 'VIP' },
        { Seat_ID: 'S0205', Screen_ID: 'SC02', Seat_Number: 'B1', Seat_Type: 'Balcony' },
        { Seat_ID: 'S0206', Screen_ID: 'SC02', Seat_Number: 'B2', Seat_Type: 'Balcony' },
        { Seat_ID: 'S0207', Screen_ID: 'SC02', Seat_Number: 'B3', Seat_Type: 'Balcony' },
        { Seat_ID: 'S0208', Screen_ID: 'SC02', Seat_Number: 'B4', Seat_Type: 'Balcony' },
        { Seat_ID: 'S0209', Screen_ID: 'SC02', Seat_Number: 'C1', Seat_Type: 'Premium' },
        { Seat_ID: 'S0210', Screen_ID: 'SC02', Seat_Number: 'C2', Seat_Type: 'Premium' },
        { Seat_ID: 'S0211', Screen_ID: 'SC02', Seat_Number: 'C3', Seat_Type: 'Premium' },
        { Seat_ID: 'S0212', Screen_ID: 'SC02', Seat_Number: 'C4', Seat_Type: 'Premium' },
        { Seat_ID: 'S0213', Screen_ID: 'SC02', Seat_Number: 'D1', Seat_Type: 'Regular' },
        { Seat_ID: 'S0214', Screen_ID: 'SC02', Seat_Number: 'D2', Seat_Type: 'Regular' },
        { Seat_ID: 'S0215', Screen_ID: 'SC02', Seat_Number: 'D3', Seat_Type: 'Regular' },
        { Seat_ID: 'S0216', Screen_ID: 'SC02', Seat_Number: 'D4', Seat_Type: 'Regular' },

        // SC03 Seats (INOX 4DX)
        { Seat_ID: 'S0301', Screen_ID: 'SC03', Seat_Number: 'A1', Seat_Type: 'VIP' },
        { Seat_ID: 'S0302', Screen_ID: 'SC03', Seat_Number: 'A2', Seat_Type: 'VIP' },
        { Seat_ID: 'S0303', Screen_ID: 'SC03', Seat_Number: 'A3', Seat_Type: 'VIP' },
        { Seat_ID: 'S0304', Screen_ID: 'SC03', Seat_Number: 'B1', Seat_Type: 'Balcony' },
        { Seat_ID: 'S0305', Screen_ID: 'SC03', Seat_Number: 'B2', Seat_Type: 'Balcony' },
        { Seat_ID: 'S0306', Screen_ID: 'SC03', Seat_Number: 'B3', Seat_Type: 'Balcony' },
        { Seat_ID: 'S0307', Screen_ID: 'SC03', Seat_Number: 'C1', Seat_Type: 'Premium' },
        { Seat_ID: 'S0308', Screen_ID: 'SC03', Seat_Number: 'C2', Seat_Type: 'Premium' },
        { Seat_ID: 'S0309', Screen_ID: 'SC03', Seat_Number: 'C3', Seat_Type: 'Premium' },
        { Seat_ID: 'S0310', Screen_ID: 'SC03', Seat_Number: 'D1', Seat_Type: 'Regular' },
        { Seat_ID: 'S0311', Screen_ID: 'SC03', Seat_Number: 'D2', Seat_Type: 'Regular' },
        { Seat_ID: 'S0312', Screen_ID: 'SC03', Seat_Number: 'D3', Seat_Type: 'Regular' },

        // SC04 Seats (INOX Standard)
        { Seat_ID: 'S0401', Screen_ID: 'SC04', Seat_Number: 'A1', Seat_Type: 'VIP' },
        { Seat_ID: 'S0402', Screen_ID: 'SC04', Seat_Number: 'A2', Seat_Type: 'VIP' },
        { Seat_ID: 'S0403', Screen_ID: 'SC04', Seat_Number: 'B1', Seat_Type: 'Balcony' },
        { Seat_ID: 'S0404', Screen_ID: 'SC04', Seat_Number: 'B2', Seat_Type: 'Balcony' },
        { Seat_ID: 'S0405', Screen_ID: 'SC04', Seat_Number: 'C1', Seat_Type: 'Premium' },
        { Seat_ID: 'S0406', Screen_ID: 'SC04', Seat_Number: 'C2', Seat_Type: 'Premium' },
        { Seat_ID: 'S0407', Screen_ID: 'SC04', Seat_Number: 'D1', Seat_Type: 'Regular' },
        { Seat_ID: 'S0408', Screen_ID: 'SC04', Seat_Number: 'D2', Seat_Type: 'Regular' },

        // SC05 Seats (Cinepolis VIP)
        { Seat_ID: 'S0501', Screen_ID: 'SC05', Seat_Number: 'A1', Seat_Type: 'VIP' },
        { Seat_ID: 'S0502', Screen_ID: 'SC05', Seat_Number: 'A2', Seat_Type: 'VIP' },
        { Seat_ID: 'S0503', Screen_ID: 'SC05', Seat_Number: 'A3', Seat_Type: 'VIP' },
        { Seat_ID: 'S0504', Screen_ID: 'SC05', Seat_Number: 'B1', Seat_Type: 'VIP' },
        { Seat_ID: 'S0505', Screen_ID: 'SC05', Seat_Number: 'B2', Seat_Type: 'VIP' },
        { Seat_ID: 'S0506', Screen_ID: 'SC05', Seat_Number: 'B3', Seat_Type: 'VIP' }
    ],

    CUSTOMER: [
        { Customer_ID: 'CU01', Customer_Name: 'Rahul Sharma', Email: 'rahul.s@example.com', Phone: '9876543210', Password: 'hash_pass_123' },
        { Customer_ID: 'CU02', Customer_Name: 'Priya Patel', Email: 'priya.p@example.com', Phone: '9876543211', Password: 'hash_pass_234' },
        { Customer_ID: 'CU03', Customer_Name: 'Ananya Iyer', Email: 'ananya.i@example.com', Phone: '9876543212', Password: 'hash_pass_345' },
        { Customer_ID: 'CU04', Customer_Name: 'Vikram Singh', Email: 'vikram.s@example.com', Phone: '9876543213', Password: 'hash_pass_456' },
        { Customer_ID: 'CU05', Customer_Name: 'Sneha Reddy', Email: 'sneha.r@example.com', Phone: '9876543214', Password: 'hash_pass_567' }
    ],

    BOOKING: [
        { Booking_ID: 'BK01', Customer_ID: 'CU01', Show_ID: 'SH01', Booking_Date: '2026-10-20 11:20:00', Ticket_Price: 450.00, Format: 'IMAX 3D' },
        { Booking_ID: 'BK02', Customer_ID: 'CU02', Show_ID: 'SH01', Booking_Date: '2026-10-20 14:10:00', Ticket_Price: 450.00, Format: 'IMAX 3D' },
        { Booking_ID: 'BK03', Customer_ID: 'CU03', Show_ID: 'SH03', Booking_Date: '2026-10-20 17:00:00', Ticket_Price: 520.00, Format: 'IMAX 3D' },
        { Booking_ID: 'BK04', Customer_ID: 'CU01', Show_ID: 'SH05', Booking_Date: '2026-10-20 19:30:00', Ticket_Price: 250.00, Format: '2D' },
        { Booking_ID: 'BK05', Customer_ID: 'CU04', Show_ID: 'SH06', Booking_Date: '2026-10-21 09:15:00', Ticket_Price: 260.00, Format: '2D' },
        { Booking_ID: 'BK06', Customer_ID: 'CU01', Show_ID: 'SH07', Booking_Date: '2026-10-21 10:45:00', Ticket_Price: 390.00, Format: '3D' },
        { Booking_ID: 'BK07', Customer_ID: 'CU05', Show_ID: 'SH08', Booking_Date: '2026-10-21 12:00:00', Ticket_Price: 390.00, Format: '3D' },
        { Booking_ID: 'BK08', Customer_ID: 'CU02', Show_ID: 'SH10', Booking_Date: '2026-10-21 14:00:00', Ticket_Price: 550.00, Format: '2D' }
    ],

    BOOKED_SEAT: [
        { Booking_ID: 'BK01', Seat_ID: 'S0101' },
        { Booking_ID: 'BK01', Seat_ID: 'S0102' },
        { Booking_ID: 'BK02', Seat_ID: 'S0108' },
        { Booking_ID: 'BK03', Seat_ID: 'S0111' },
        { Booking_ID: 'BK03', Seat_ID: 'S0112' },
        { Booking_ID: 'BK04', Seat_ID: 'S0201' },
        { Booking_ID: 'BK05', Seat_ID: 'S0205' },
        { Booking_ID: 'BK05', Seat_ID: 'S0206' },
        { Booking_ID: 'BK06', Seat_ID: 'S0302' },
        { Booking_ID: 'BK07', Seat_ID: 'S0307' },
        { Booking_ID: 'BK07', Seat_ID: 'S0308' },
        { Booking_ID: 'BK08', Seat_ID: 'S0501' }
    ],

    PAYMENT: [
        { Payment_ID: 'PAY01', Booking_ID: 'BK01', Payment_Mode: 'UPI', Amount: 900.00, Payment_Date: '2026-10-20 11:22:15' },
        { Payment_ID: 'PAY02', Booking_ID: 'BK02', Payment_Mode: 'Credit Card', Amount: 450.00, Payment_Date: '2026-10-20 14:11:40' },
        { Payment_ID: 'PAY03', Booking_ID: 'BK03', Payment_Mode: 'UPI', Amount: 1040.00, Payment_Date: '2026-10-20 17:02:00' },
        { Payment_ID: 'PAY04', Booking_ID: 'BK04', Payment_Mode: 'Debit Card', Amount: 250.00, Payment_Date: '2026-10-20 19:31:10' },
        { Payment_ID: 'PAY05', Booking_ID: 'BK05', Payment_Mode: 'Net Banking', Amount: 520.00, Payment_Date: '2026-10-21 09:16:30' },
        { Payment_ID: 'PAY06', Booking_ID: 'BK06', Payment_Mode: 'UPI', Amount: 390.00, Payment_Date: '2026-10-21 10:46:12' },
        { Payment_ID: 'PAY07', Booking_ID: 'BK07', Payment_Mode: 'Credit Card', Amount: 780.00, Payment_Date: '2026-10-21 12:01:45' },
        { Payment_ID: 'PAY08', Booking_ID: 'BK08', Payment_Mode: 'Cash', Amount: 550.00, Payment_Date: '2026-10-21 14:02:00' }
    ]
};

// 18 Academic SQL Queries Catalogue for the Sandbox
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
        title: 'Q2: Multi-Table Inner Join (4 Relations)',
        concept: 'Natural / Theta Joins across THEATER, SCREEN, SHOWS, and MOVIE',
        sql: `SELECT t.Theater_Name, s.Screen_Number, s.Screen_Type, m.Movie_Name, sh.Show_Date, sh.Show_Time, sh.Format, sh.Ticket_Price
FROM SHOWS sh
INNER JOIN SCREEN s ON sh.Screen_ID = s.Screen_ID
INNER JOIN THEATER t ON s.Theater_ID = t.Theater_ID
INNER JOIN MOVIE m ON sh.Movie_ID = m.Movie_ID
WHERE t.Theater_Name LIKE '%PVR Cinemas%'
ORDER BY sh.Show_Date, sh.Show_Time;`,
        description: 'Lists all scheduled movie shows at PVR Cinemas with theater, screen type, timing, and ticket price.'
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
        description: 'Finds theaters where the average ticket price exceeds the system-wide average across all theaters.'
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
        description: 'Retrieves all specific seats reserved for Show SH01 with customer names and booking timestamps.'
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
        description: 'Finds catalog movies that currently have zero customer bookings.'
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
        sql: `SELECT sh.Show_ID, m.Movie_Name, t.Theater_Name, sh.Show_Date, sh.Show_Time, sh.Format, sh.Ticket_Price
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
        sql: `SELECT sh.Show_ID, m.Movie_Name, t.Theater_Name, sh.Format,
       COUNT(bs.Seat_ID) AS Total_Seats_Sold,
       SUM(p.Amount) AS Total_Revenue
FROM SHOWS sh
INNER JOIN MOVIE m ON sh.Movie_ID = m.Movie_ID
INNER JOIN SCREEN s ON sh.Screen_ID = s.Screen_ID
INNER JOIN THEATER t ON s.Theater_ID = t.Theater_ID
INNER JOIN BOOKING b ON sh.Show_ID = b.Show_ID
INNER JOIN BOOKED_SEAT bs ON b.Booking_ID = bs.Booking_ID
INNER JOIN PAYMENT p ON b.Booking_ID = p.Booking_ID
GROUP BY sh.Show_ID, m.Movie_Name, t.Theater_Name, sh.Format
ORDER BY Total_Revenue DESC
LIMIT 3;`,
        description: 'Retrieves the top 3 highest revenue-generating shows.'
    },
    {
        id: 11,
        title: 'Q11: Screen Capacity Utilization (%)',
        concept: 'Arithmetic expression on aggregates to calculate percentage ratio',
        sql: `SELECT sh.Show_ID, m.Movie_Name, s.Screen_Number, s.Capacity AS Total_Capacity,
       COUNT(bs.Seat_ID) AS Seats_Booked,
       ROUND((COUNT(bs.Seat_ID) * 100.0 / s.Capacity), 2) AS Occupancy_Percentage
FROM SHOWS sh
INNER JOIN MOVIE m ON sh.Movie_ID = m.Movie_ID
INNER JOIN SCREEN s ON sh.Screen_ID = s.Screen_ID
LEFT JOIN BOOKING b ON sh.Show_ID = b.Show_ID
LEFT JOIN BOOKED_SEAT bs ON b.Booking_ID = bs.Booking_ID
GROUP BY sh.Show_ID, m.Movie_Name, s.Screen_Number, s.Capacity
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
    INNER JOIN MOVIE m ON sh.Movie_ID = m.Movie_ID WHERE m.Movie_Name = 'Superman: Legacy'
)
AND c.Customer_ID IN (
    SELECT b.Customer_ID FROM BOOKING b INNER JOIN SHOWS sh ON b.Show_ID = sh.Show_ID
    INNER JOIN MOVIE m ON sh.Movie_ID = m.Movie_ID WHERE m.Movie_Name = 'Heat'
);`,
        description: 'Finds customers who booked tickets for both Superman: Legacy AND Heat.'
    },
    {
        id: 13,
        title: 'Q13: Aggregation across Relations & Diversity',
        concept: 'COUNT(DISTINCT) across multiple joined entities',
        sql: `SELECT t.Theater_Name, t.City,
       COUNT(DISTINCT sh.Show_ID) AS Total_Shows,
       COUNT(DISTINCT m.Movie_ID) AS Total_Movies_Screened,
       COUNT(DISTINCT m.Genre) AS Distinct_Genres_Available
FROM THEATER t
INNER JOIN SCREEN s ON t.Theater_ID = s.Theater_ID
INNER JOIN SHOWS sh ON s.Screen_ID = sh.Screen_ID
INNER JOIN MOVIE m ON sh.Movie_ID = m.Movie_ID
GROUP BY t.Theater_Name, t.City;`,
        description: 'Summarizes show counts and unique genre offerings at each theater.'
    },
    {
        id: 14,
        title: 'Q14: Complex String & Numerical Constraints',
        concept: 'Domain filtering with IN clause on format and inequality on price',
        sql: `SELECT sh.Show_ID, m.Movie_Name, t.Theater_Name, sh.Format, sh.Show_Date, sh.Show_Time, sh.Ticket_Price
FROM SHOWS sh
INNER JOIN MOVIE m ON sh.Movie_ID = m.Movie_ID
INNER JOIN SCREEN s ON sh.Screen_ID = s.Screen_ID
INNER JOIN THEATER t ON s.Theater_ID = t.Theater_ID
WHERE sh.Format IN ('IMAX 2D', 'IMAX 3D') AND sh.Ticket_Price >= 400.00
ORDER BY sh.Ticket_Price DESC;`,
        description: 'Lists all premium IMAX screenings priced at ₹400 or above.'
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
        title: 'Q16: Correlated Subquery (Max Capacity Screen)',
        concept: 'Correlated subquery finding the maximum capacity screen per theater',
        sql: `SELECT t.Theater_Name, s1.Screen_ID, s1.Screen_Number, s1.Screen_Type, s1.Capacity
FROM SCREEN s1
INNER JOIN THEATER t ON s1.Theater_ID = t.Theater_ID
WHERE s1.Capacity = (
    SELECT MAX(s2.Capacity) FROM SCREEN s2 WHERE s2.Theater_ID = s1.Theater_ID
)
ORDER BY s1.Capacity DESC;`,
        description: 'Identifies the flagship (largest capacity) screen for every theater.'
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
    SELECT t.Theater_ID FROM THEATER t WHERE t.City = 'Bangalore'
    AND NOT EXISTS (
        SELECT 1 FROM BOOKING b INNER JOIN SHOWS sh ON b.Show_ID = sh.Show_ID
        INNER JOIN SCREEN s ON sh.Screen_ID = s.Screen_ID
        WHERE b.Customer_ID = c.Customer_ID AND s.Theater_ID = t.Theater_ID
    )
);`,
        description: 'Finds loyal customers who have watched a movie in EVERY theater in Bangalore.'
    }
];

window.SEED_DATA = SEED_DATA;
window.ACADEMIC_QUERIES = ACADEMIC_QUERIES;
