# Movie Ticket Reservation System (MTRS)

## Project Overview

The **Movie Ticket Reservation System (MTRS)** is a comprehensive Database Management Systems (DBMS) project designed to model, normalize, and implement an end-to-end cinema multiplex ticketing workflow. It handles multi-city theaters, auditoriums/screens, movie catalogs, show scheduling, tiered seat reservations, atomic booking transactions, payment processing, and revenue reporting.

The project is structured according to academic specifications (DA1 & DA2) normalized up to **Boyce-Codd Normal Form (BCNF)** with strict referential integrity, domain constraints, PL/SQL stored procedures, and concurrency protection triggers.

---

## Normalized Relational Schema (9 BCNF Tables)

The database consists of 9 core normalized relations with explicit Primary Keys (PK), Foreign Keys (FK), and CHECK constraints:

1. **`THEATER`** (`Theater_ID`, `Theater_Name`, `City`, `State`, `Country`)
   - *PK:* `Theater_ID`
2. **`SCREEN`** (`Screen_ID`, `Theater_ID`, `Screen_Number`, `Screen_Type`, `Capacity`)
   - *PK:* `Screen_ID` | *FK:* `Theater_ID` references `THEATER`
   - *Constraints:* `CHECK (Capacity > 0)`, `UNIQUE(Theater_ID, Screen_Number)`
3. **`MOVIE`** (`Movie_ID`, `Movie_Name`, `Genre`, `Rating`, `Duration`, `Language`)
   - *PK:* `Movie_ID`
   - *Constraints:* `CHECK (Rating >= 0 AND Rating <= 10)`, `CHECK (Duration > 0)`
4. **`SHOWS`** (`Show_ID`, `Movie_ID`, `Screen_ID`, `Show_Date`, `Show_Time`, `Format`, `Ticket_Price`)
   - *PK:* `Show_ID` | *FK:* `Movie_ID` references `MOVIE`, `Screen_ID` references `SCREEN`
   - *Constraints:* `CHECK (Format IN ('2D', '3D', 'IMAX 2D', 'IMAX 3D'))`, `CHECK (Ticket_Price > 0)`
5. **`SEAT`** (`Seat_ID`, `Screen_ID`, `Seat_Number`, `Seat_Type`)
   - *PK:* `Seat_ID` | *FK:* `Screen_ID` references `SCREEN`
   - *Constraints:* `CHECK (Seat_Type IN ('VIP', 'Balcony', 'Premium', 'Regular'))`, `UNIQUE(Screen_ID, Seat_Number)`
6. **`CUSTOMER`** (`Customer_ID`, `Customer_Name`, `Email`, `Phone`, `Password`)
   - *PK:* `Customer_ID` | *Constraint:* `UNIQUE (Email)`
7. **`BOOKING`** (`Booking_ID`, `Customer_ID`, `Show_ID`, `Booking_Date`, `Ticket_Price`, `Format`)
   - *PK:* `Booking_ID` | *FK:* `Customer_ID` references `CUSTOMER`, `Show_ID` references `SHOWS`
   - *Constraints:* `CHECK (Format IN ('2D', '3D', 'IMAX 2D', 'IMAX 3D'))`
8. **`BOOKED_SEAT`** (`Booking_ID`, `Seat_ID`)
   - *Composite PK:* `(Booking_ID, Seat_ID)`
   - *FK:* `Booking_ID` references `BOOKING`, `Seat_ID` references `SEAT`
9. **`PAYMENT`** (`Payment_ID`, `Booking_ID`, `Payment_Mode`, `Amount`, `Payment_Date`)
   - *PK:* `Payment_ID` | *FK:* `Booking_ID` references `BOOKING`
   - *Constraints:* `UNIQUE(Booking_ID)` (1-to-1 relationship with Booking), `CHECK (Payment_Mode IN ('Credit Card', 'Debit Card', 'UPI', 'Net Banking', 'Cash'))`, `CHECK (Amount > 0)`

---

## Repository & Project Architecture

```
mtrs/
├── database/
│   ├── schema.sql         # DDL script creating all 9 tables in dependency order with constraints & indexes
│   ├── seed.sql           # Realistic seed dataset (T01-T03, SC01-SC05, M01-M06, CU01-CU05, Bookings, Payments)
│   ├── queries.sql        # 18 academic SQL queries (joins, aggregates, nested subqueries, relational division)
│   └── procedures.sql     # Stored procedures & triggers (seat availability, prevent double booking, cancellation)
├── assets/
│   └── posters.js         # Native high-resolution vector SVG movie posters (Superman, Heat, Interstellar, etc.)
├── css/
│   ├── style.css          # Design system, glassmorphism, BookMyShow/PVR dark cinema palette, typography
│   └── seat-layout.css    # Curved cinema projection screen, tiered seating grid, and boarding pass ticket pass
├── js/
│   ├── db-data.js         # In-memory seed state and catalog of 18 academic SQL queries
│   ├── db-engine.js       # Relational database engine (BCNF constraints, triggers, atomic transaction runner)
│   ├── app.js             # Client SPA controller (movie browsing, showtime picker, seat selection, checkout)
│   └── admin.js           # Admin dashboard, show schedule manager, capacity updater, live SQL runner
├── index.html             # Standalone modern web interface (BookMyShow / PVR luxury aesthetic)
└── README.md              # Project documentation
```

---

## Phase 1: Database Implementation

### Running the Database Scripts in MySQL

1. **Create the Database and Schema:**
   ```bash
   mysql -u root -p < database/schema.sql
   ```
2. **Load Initial Seed Data:**
   ```bash
   mysql -u root -p < database/seed.sql
   ```
3. **Load Stored Procedures and Triggers:**
   ```bash
   mysql -u root -p < database/procedures.sql
   ```
4. **Execute Academic Queries:**
   ```bash
   mysql -u root -p < database/queries.sql
   ```

### Stored Procedures & Triggers Overview

- **`trg_PreventDoubleBooking` (Trigger):** Fires `BEFORE INSERT` on `BOOKED_SEAT` to verify that the seat is not already reserved in another booking for the same show. Throws `SIGNAL SQLSTATE '45000'` upon collision.
- **`trg_ValidateSeatScreen` (Trigger):** Fires `BEFORE INSERT` on `BOOKED_SEAT` to enforce that the selected `Seat_ID` belongs to the screen hosting the show.
- **`sp_CheckSeatAvailability` (Procedure):** Returns the full screen layout with status `'AVAILABLE'` or `'BOOKED'`.
- **`sp_BookTicketTransaction` (Procedure):** Atomic transaction (`START TRANSACTION` ... `COMMIT` / `ROLLBACK`) that creates `BOOKING`, `BOOKED_SEAT`, and `PAYMENT` synchronously.
- **`sp_GetShowRevenueReport` (Procedure):** Returns total seats booked, occupancy percentage, and total revenue for each show.
- **`sp_CancelBooking` (Procedure):** Safely deletes payments, frees booked seats, and cancels the booking header.

---

## Phase 2 & 3: Interactive Application Features

1. **Movie Catalog & Live Search:**
   - Visual cards with HD vector poster art, ratings, runtime, genre, and language tags.
   - Live filtering by Genre, Language, and Format (2D, 3D, IMAX 3D).
2. **Theater & Showtime Selector:**
   - Multi-day date selector (`Wed 21`, `Thu 22`, `Fri 23`).
   - Grouping by Theaters (PVR Cinemas Forum Mall, INOX Multiplex Garuda, Cinepolis Orion Gateway).
   - Show slots with screen format badges, seat capacity info, and ticket fares.
3. **Interactive Cinema Seating Hall:**
   - Curved screen visualization with ambient light glow (`ALL EYES THIS WAY PLEASE`).
   - Tiered seat pricing: VIP Recliners (Row A), Balcony Prime (Row B), Premium (Row C), Regular (Rows D & E).
   - Real-time seat reservation locking (prevents double-booking).
   - Floating action dock displaying selected seats, seat count, and live subtotal.
4. **Checkout & Transaction Simulator:**
   - Itemized fare breakdown: Ticket Fare, Format charges, ₹30 Convenience Fee, and 18% GST.
   - Payment mode selector (`UPI`, `Credit Card`, `Debit Card`, `Net Banking`, `Cash`).
   - Triggers `sp_BookTicketTransaction` with instantaneous commit to database state.
5. **Boarding Pass / E-Ticket Modal:**
   - Boarding pass with perforated edge, QR code graphic, booking ID, payment ID, and print option.
6. **My Bookings View:**
   - Full booking history for the logged-in customer persona (CU01-CU05).
   - Live cancellation with seat release.
7. **Admin Operations Panel:**
   - Real-time KPI summary (Total Revenue, Confirmed Bookings, Active Movies, Total Shows).
   - Show Schedule Manager: Add shows, edit ticket pricing, or remove slots.
   - Screen Capacity Manager: Modify auditorium capacities with `Capacity > 0` validation.
   - Relational Database Inspector: Browse raw rows across all 9 tables.
8. **Academic SQL Query Sandbox (DA2):**
   - Interactive runner with all 18 academic queries from the DA2 submission.
   - Displays academic concept, formatted SQL syntax, execution time (in ms), and tabular results.

---

## How to Run the Web Application

Simply open [`index.html`](file:///C:/Users/Bharadvaj/Documents/mtrs/index.html) in any modern browser (Chrome, Edge, Firefox):

- **Double-click:** Double-click on `index.html` in Windows File Explorer.
- **Or via VS Code / IDE:** Right-click `index.html` and select **"Open with Live Server"** or open directly in your browser.