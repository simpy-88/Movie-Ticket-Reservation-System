-- ============================================================================
-- DATABASE MANAGEMENT SYSTEMS PROJECT: MOVIE TICKET RESERVATION SYSTEM (MTRS)
-- File: database/queries.sql
-- Description: 18 Comprehensive Academic SQL Queries (DA2 Report)
-- Calibrated for Chennai Cinema Destinations & 49 Multi-Auditorium Multiplexes.
-- Covers: Basic SELECT, Multi-table JOINs, GROUP BY/HAVING, Subqueries,
--         Correlated Subqueries, Relational Division, NOT IN, and NOT EXISTS.
-- ============================================================================

USE mtrs_db;

-- ----------------------------------------------------------------------------
-- QUERY 1: Basic Selection and Projection
-- Objective: Retrieve movies with duration > 140 minutes and rating >= 8.4.
-- Concepts: SELECT, WHERE with compound logical conditions (AND), ORDER BY.
-- ----------------------------------------------------------------------------
SELECT 
    Movie_ID, 
    Movie_Name, 
    Genre, 
    Rating, 
    Duration, 
    Language
FROM MOVIE
WHERE Duration > 140 
  AND Rating >= 8.4
ORDER BY Rating DESC;

-- ----------------------------------------------------------------------------
-- QUERY 2: Multi-Table Inner Join (THEATER + SCREEN + SHOWS + MOVIE)
-- Objective: List all scheduled shows at 'PVR Palazzo' in Chennai with 
--            auditorium name, projection, sound, timing, and ticket price.
-- Concepts: Multiple INNER JOINs with foreign key relationships.
-- ----------------------------------------------------------------------------
SELECT 
    t.Theater_Name,
    s.Screen_Number,
    s.Screen_Name,
    s.Screen_Type,
    s.Projection_Tech,
    s.Audio_Tech,
    m.Movie_Name,
    sh.Show_Date,
    sh.Show_Time,
    sh.Format,
    sh.Ticket_Price
FROM SHOWS sh
INNER JOIN SCREEN s ON sh.Screen_ID = s.Screen_ID
INNER JOIN THEATER t ON s.Theater_ID = t.Theater_ID
INNER JOIN MOVIE m ON sh.Movie_ID = m.Movie_ID
WHERE t.Theater_Name LIKE '%PVR Palazzo%'
ORDER BY sh.Show_Date, sh.Show_Time;

-- ----------------------------------------------------------------------------
-- QUERY 3: Group By with Multiple Aggregate Functions (COUNT & SUM)
-- Objective: Find total bookings made and total revenue collected for each movie.
-- Concepts: LEFT JOIN, GROUP BY, COUNT(DISTINCT), COALESCE, SUM.
-- ----------------------------------------------------------------------------
SELECT 
    m.Movie_ID,
    m.Movie_Name,
    m.Genre,
    COUNT(DISTINCT b.Booking_ID) AS Total_Bookings,
    COALESCE(SUM(p.Amount), 0.00) AS Total_Revenue
FROM MOVIE m
LEFT JOIN SHOWS sh ON m.Movie_ID = sh.Movie_ID
LEFT JOIN BOOKING b ON sh.Show_ID = b.Show_ID
LEFT JOIN PAYMENT p ON b.Booking_ID = p.Booking_ID
GROUP BY m.Movie_ID, m.Movie_Name, m.Genre
ORDER BY Total_Revenue DESC;

-- ----------------------------------------------------------------------------
-- QUERY 4: Nested Subquery with Scalar Aggregate
-- Objective: Find all Chennai theaters whose average show ticket price is greater 
--            than the overall average show ticket price across all theaters.
-- Concepts: Subquery with AVG(), GROUP BY, HAVING clause.
-- ----------------------------------------------------------------------------
SELECT 
    t.Theater_ID,
    t.Theater_Name,
    t.City,
    ROUND(AVG(sh.Ticket_Price), 2) AS Avg_Theater_Price
FROM THEATER t
INNER JOIN SCREEN s ON t.Theater_ID = s.Theater_ID
INNER JOIN SHOWS sh ON s.Screen_ID = sh.Screen_ID
GROUP BY t.Theater_ID, t.Theater_Name, t.City
HAVING AVG(sh.Ticket_Price) > (
    SELECT AVG(Ticket_Price) FROM SHOWS
)
ORDER BY Avg_Theater_Price DESC;

-- ----------------------------------------------------------------------------
-- QUERY 5: Group By with HAVING (Filter on Aggregates)
-- Objective: Find frequent customers who have made more than 1 booking.
-- Concepts: INNER JOIN, GROUP BY, HAVING COUNT(*) > 1.
-- ----------------------------------------------------------------------------
SELECT 
    c.Customer_ID,
    c.Customer_Name,
    c.Email,
    c.Phone,
    COUNT(b.Booking_ID) AS Booking_Count,
    SUM(p.Amount) AS Total_Spent
FROM CUSTOMER c
INNER JOIN BOOKING b ON c.Customer_ID = b.Customer_ID
INNER JOIN PAYMENT p ON b.Booking_ID = p.Booking_ID
GROUP BY c.Customer_ID, c.Customer_Name, c.Email, c.Phone
HAVING COUNT(b.Booking_ID) > 1
ORDER BY Booking_Count DESC, Total_Spent DESC;

-- ----------------------------------------------------------------------------
-- QUERY 6: Complex 5-Table Join
-- Objective: Retrieve all seats booked for Show 'SH01' (Palazzo IMAX) with seat numbers, 
--            categories, booking timestamp, and customer details.
-- Concepts: JOIN across BOOKING, BOOKED_SEAT, SEAT, CUSTOMER, SHOWS.
-- ----------------------------------------------------------------------------
SELECT 
    sh.Show_ID,
    m.Movie_Name,
    st.Seat_Number,
    st.Seat_Type,
    c.Customer_Name,
    c.Email,
    b.Booking_ID,
    b.Booking_Date
FROM SHOWS sh
INNER JOIN MOVIE m ON sh.Movie_ID = m.Movie_ID
INNER JOIN BOOKING b ON sh.Show_ID = b.Show_ID
INNER JOIN BOOKED_SEAT bs ON b.Booking_ID = bs.Booking_ID
INNER JOIN SEAT st ON bs.Seat_ID = st.Seat_ID
INNER JOIN CUSTOMER c ON b.Customer_ID = c.Customer_ID
WHERE sh.Show_ID = 'SH01'
ORDER BY st.Seat_Number;

-- ----------------------------------------------------------------------------
-- QUERY 7: Subquery with NOT IN (Set Difference)
-- Objective: Find catalog movies that currently have zero bookings recorded.
-- Concepts: Subquery, NOT IN, Set difference.
-- ----------------------------------------------------------------------------
SELECT 
    Movie_ID,
    Movie_Name,
    Genre,
    Language,
    Rating
FROM MOVIE
WHERE Movie_ID NOT IN (
    SELECT DISTINCT sh.Movie_ID 
    FROM SHOWS sh
    INNER JOIN BOOKING b ON sh.Show_ID = b.Show_ID
);

-- ----------------------------------------------------------------------------
-- QUERY 8: Correlated Subquery with NOT EXISTS
-- Objective: Find customers who have made payments ONLY via 'UPI' 
--            (never used Card, Cash, or Net Banking).
-- Concepts: Correlated Subquery, NOT EXISTS.
-- ----------------------------------------------------------------------------
SELECT 
    c.Customer_ID,
    c.Customer_Name,
    c.Email
FROM CUSTOMER c
WHERE EXISTS (
    SELECT 1 
    FROM BOOKING b 
    INNER JOIN PAYMENT p ON b.Booking_ID = p.Booking_ID
    WHERE b.Customer_ID = c.Customer_ID 
      AND p.Payment_Mode = 'UPI'
)
AND NOT EXISTS (
    SELECT 1 
    FROM BOOKING b 
    INNER JOIN PAYMENT p ON b.Booking_ID = p.Booking_ID
    WHERE b.Customer_ID = c.Customer_ID 
      AND p.Payment_Mode <> 'UPI'
);

-- ----------------------------------------------------------------------------
-- QUERY 9: Outer Join / Anti-Join
-- Objective: Identify scheduled shows that have zero seat bookings so far.
-- Concepts: LEFT JOIN, checking for NULL on joined child table.
-- ----------------------------------------------------------------------------
SELECT 
    sh.Show_ID,
    m.Movie_Name,
    t.Theater_Name,
    s.Screen_Name,
    sh.Show_Date,
    sh.Show_Time,
    sh.Format,
    sh.Ticket_Price
FROM SHOWS sh
INNER JOIN MOVIE m ON sh.Movie_ID = m.Movie_ID
INNER JOIN SCREEN s ON sh.Screen_ID = s.Screen_ID
INNER JOIN THEATER t ON s.Theater_ID = t.Theater_ID
LEFT JOIN BOOKING b ON sh.Show_ID = b.Show_ID
WHERE b.Booking_ID IS NULL;

-- ----------------------------------------------------------------------------
-- QUERY 10: Top-N Query with ORDER BY and LIMIT
-- Objective: Retrieve the top 3 highest revenue-generating shows.
-- Concepts: Aggregation, SUM, ORDER BY DESC, LIMIT.
-- ----------------------------------------------------------------------------
SELECT 
    sh.Show_ID,
    m.Movie_Name,
    t.Theater_Name,
    s.Screen_Name,
    sh.Format,
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
LIMIT 3;

-- ----------------------------------------------------------------------------
-- QUERY 11: Screen Capacity Utilization Rate (%)
-- Objective: Compute the percentage of screen seats booked for each show.
-- Concepts: Mathematical calculation, ROUND, COUNT, Type conversion.
-- ----------------------------------------------------------------------------
SELECT 
    sh.Show_ID,
    m.Movie_Name,
    s.Screen_Name,
    s.Capacity AS Total_Capacity,
    COUNT(bs.Seat_ID) AS Seats_Booked,
    ROUND((COUNT(bs.Seat_ID) * 100.0 / s.Capacity), 2) AS Occupancy_Percentage
FROM SHOWS sh
INNER JOIN MOVIE m ON sh.Movie_ID = m.Movie_ID
INNER JOIN SCREEN s ON sh.Screen_ID = s.Screen_ID
LEFT JOIN BOOKING b ON sh.Show_ID = b.Show_ID
LEFT JOIN BOOKED_SEAT bs ON b.Booking_ID = bs.Booking_ID
GROUP BY sh.Show_ID, m.Movie_Name, s.Screen_Name, s.Capacity
ORDER BY Occupancy_Percentage DESC;

-- ----------------------------------------------------------------------------
-- QUERY 12: Relational Intersection Simulation
-- Objective: Find customers who booked tickets for both 'Superman: Legacy' 
--            AND 'Heat'.
-- Concepts: Intersection using compound IN subqueries.
-- ----------------------------------------------------------------------------
SELECT c.Customer_ID, c.Customer_Name, c.Email
FROM CUSTOMER c
WHERE c.Customer_ID IN (
    SELECT b.Customer_ID
    FROM BOOKING b
    INNER JOIN SHOWS sh ON b.Show_ID = sh.Show_ID
    INNER JOIN MOVIE m ON sh.Movie_ID = m.Movie_ID
    WHERE m.Movie_Name = 'Superman: Legacy'
)
AND c.Customer_ID IN (
    SELECT b.Customer_ID
    FROM BOOKING b
    INNER JOIN SHOWS sh ON b.Show_ID = sh.Show_ID
    INNER JOIN MOVIE m ON sh.Movie_ID = m.Movie_ID
    WHERE m.Movie_Name = 'Heat'
);

-- ----------------------------------------------------------------------------
-- QUERY 13: Summary by Chennai Theater & Genre Diversity
-- Objective: Count total active shows and distinct movie genres per theater in Chennai.
-- Concepts: COUNT(DISTINCT), GROUP BY with multiple dimensions.
-- ----------------------------------------------------------------------------
SELECT 
    t.Theater_Name,
    t.City,
    COUNT(DISTINCT sh.Show_ID) AS Total_Shows,
    COUNT(DISTINCT m.Movie_ID) AS Total_Movies_Screened,
    COUNT(DISTINCT m.Genre) AS Distinct_Genres_Available
FROM THEATER t
INNER JOIN SCREEN s ON t.Theater_ID = s.Theater_ID
INNER JOIN SHOWS sh ON s.Screen_ID = sh.Screen_ID
INNER JOIN MOVIE m ON sh.Movie_ID = m.Movie_ID
WHERE t.City = 'Chennai'
GROUP BY t.Theater_Name, t.City;

-- ----------------------------------------------------------------------------
-- QUERY 14: Premium Large Format (PLF) Filter (IMAX, P[XL], BIGPIX)
-- Objective: Retrieve all Premium Large Format screenings priced >= 380.
-- Concepts: IN operator with extended PLF formats, numeric comparison, sorting.
-- ----------------------------------------------------------------------------
SELECT 
    sh.Show_ID,
    m.Movie_Name,
    t.Theater_Name,
    s.Screen_Name,
    sh.Format,
    sh.Show_Date,
    sh.Show_Time,
    sh.Ticket_Price
FROM SHOWS sh
INNER JOIN MOVIE m ON sh.Movie_ID = m.Movie_ID
INNER JOIN SCREEN s ON sh.Screen_ID = s.Screen_ID
INNER JOIN THEATER t ON s.Theater_ID = t.Theater_ID
WHERE sh.Format IN ('IMAX 2D', 'IMAX 3D', 'P[XL] 2D', 'P[XL] 3D', 'BIGPIX 2D', 'BIGPIX 3D')
  AND sh.Ticket_Price >= 380.00
ORDER BY sh.Ticket_Price DESC;

-- ----------------------------------------------------------------------------
-- QUERY 15: Multi-Seat Booking Analysis
-- Objective: Find all bookings where multiple seats were purchased in a 
--            single transaction, along with customer and payment details.
-- Concepts: Subquery with GROUP BY & HAVING, JOIN.
-- ----------------------------------------------------------------------------
SELECT 
    b.Booking_ID,
    c.Customer_Name,
    m.Movie_Name,
    COUNT(bs.Seat_ID) AS Seats_Count,
    p.Payment_Mode,
    p.Amount AS Total_Paid
FROM BOOKING b
INNER JOIN CUSTOMER c ON b.Customer_ID = c.Customer_ID
INNER JOIN SHOWS sh ON b.Show_ID = sh.Show_ID
INNER JOIN MOVIE m ON sh.Movie_ID = m.Movie_ID
INNER JOIN BOOKED_SEAT bs ON b.Booking_ID = bs.Booking_ID
INNER JOIN PAYMENT p ON b.Booking_ID = p.Booking_ID
GROUP BY b.Booking_ID, c.Customer_Name, m.Movie_Name, p.Payment_Mode, p.Amount
HAVING COUNT(bs.Seat_ID) > 1
ORDER BY Seats_Count DESC, Total_Paid DESC;

-- ----------------------------------------------------------------------------
-- QUERY 16: Correlated Subquery (Screen with Largest Seating Capacity per Theater)
-- Objective: For each of the 6 Chennai theaters, find its largest auditorium.
-- Concepts: Correlated subquery in WHERE clause.
-- ----------------------------------------------------------------------------
SELECT 
    t.Theater_Name,
    s1.Screen_ID,
    s1.Screen_Number,
    s1.Screen_Name,
    s1.Screen_Type,
    s1.Capacity
FROM SCREEN s1
INNER JOIN THEATER t ON s1.Theater_ID = t.Theater_ID
WHERE s1.Capacity = (
    SELECT MAX(s2.Capacity)
    FROM SCREEN s2
    WHERE s2.Theater_ID = s1.Theater_ID
)
ORDER BY s1.Capacity DESC;

-- ----------------------------------------------------------------------------
-- QUERY 17: Financial Breakdown by Payment Mode
-- Objective: Summarize total revenue, transaction count, and average payment 
--            value for each payment mode.
-- Concepts: GROUP BY, COUNT, SUM, AVG.
-- ----------------------------------------------------------------------------
SELECT 
    Payment_Mode,
    COUNT(Payment_ID) AS Total_Transactions,
    SUM(Amount) AS Total_Revenue,
    ROUND(AVG(Amount), 2) AS Average_Transaction_Value
FROM PAYMENT
GROUP BY Payment_Mode
ORDER BY Total_Revenue DESC;

-- ----------------------------------------------------------------------------
-- QUERY 18: Relational Division Simulation (Universal Quantification)
-- Objective: Find all customers who have booked at least one show in EVERY 
--            theater located in 'Chennai'.
-- Concepts: Double NOT EXISTS (Relational Division in SQL).
-- ----------------------------------------------------------------------------
SELECT c.Customer_ID, c.Customer_Name, c.Email
FROM CUSTOMER c
WHERE NOT EXISTS (
    -- All Chennai theaters
    SELECT t.Theater_ID 
    FROM THEATER t
    WHERE t.City = 'Chennai'
    AND NOT EXISTS (
        -- Shows booked by this customer in this theater
        SELECT 1
        FROM BOOKING b
        INNER JOIN SHOWS sh ON b.Show_ID = sh.Show_ID
        INNER JOIN SCREEN s ON sh.Screen_ID = s.Screen_ID
        WHERE b.Customer_ID = c.Customer_ID 
          AND s.Theater_ID = t.Theater_ID
    )
);
