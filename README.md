# Movie Ticket Reservation System (MTRS) — Chennai Multiplex Edition

## Project Overview

The **Movie Ticket Reservation System (MTRS)** is a comprehensive Database Management Systems (DBMS) project designed to model, normalize, and implement an end-to-end cinema multiplex ticketing platform. Sourced and calibrated for **Chennai, Tamil Nadu**, it represents **6 premier cinema destinations across 49 individual auditoriums**, featuring authentic technical telemetry (IMAX Laser, P[XL] Giant Screen, BIGPIX, Dolby Atmos, and 4K RGB Laser).

The project strictly follows academic specifications (**DA1 & DA2**) normalized up to **Boyce-Codd Normal Form (BCNF)** with referential integrity, domain check constraints, MySQL stored procedures, concurrency triggers, and an interactive BookMyShow / PVR Cinemas web application.

---

## 6 Chennai Cinema Destinations (49 Auditoriums)

1. **`T01`: PVR Palazzo — The Nexus Vijaya Mall, Vadapalani, Chennai**  
   - 9 Auditoriums (`SC01`–`SC09`), including **Audi 5 (IMAX Laser, 12-channel sound)** and **Audi 8 & 9 (Dolby Atmos)**.
   - *Documented Discrepancy:* Published screen capacities sum to 3,011 seats vs. historical headline marketing ~2,000 seats (see `database/chennai_cinema_sources.md`).
2. **`T02`: INOX Luxe — Phoenix Marketcity, Velachery, Chennai**  
   - 11 Auditoriums (`SC10`–`SC20`), including **Audi 11 (IMAX Luxe Laser)** and select Dolby Atmos Luxe halls (~2,688 total seats).
3. **`T03`: PVR VR Chennai — VR Mall, Anna Nagar, Chennai**  
   - 10 Auditoriums (`SC21`–`SC30`), featuring the flagship **Audi 1 (P[XL] Premium Giant Screen, 475 seats, Dolby Atmos)** (~2,611 total seats vs. headline ~2,590).
4. **`T04`: PVR Sathyam Cinemas — Royapettah, Chennai**  
   - 6 Legendary Heritage Screens (`SC31`–`SC36`): **Sathyam** (948 seats, Barco 4K Laser, Dolby Atmos), **Santham** (566 seats, Dolby Atmos), **Seasons**, **Serene**, **Studio 5**, **Six Degrees** (2,378 total seats).
5. **`T05`: PVR Aerohub — Chennai Airport Complex, Meenambakkam, Chennai**  
   - 5 Auditoriums (`SC37`–`SC41`): South India’s premier airport terminal multiplex (~1,155 seats, RGB Laser & Dolby Atmos).
6. **`T06`: INOX The Marina Mall — Egattur, OMR, Chennai**  
   - 8 Auditoriums (`SC42`–`SC49`), featuring the flagship **Screen 1 (BIGPIX Giant Screen, 517 seats, Dolby Atmos)** (~1,952 total seats).

*Full source links, verification taxonomy, and last-checked audit logs are documented in [`database/chennai_cinema_sources.md`](database/chennai_cinema_sources.md).*

---

## Normalized Relational Schema (9 BCNF Tables)

The database preserves all 9 assignment relations without structural disruption, with backward-compatible auditorium telemetry:

1. **`THEATER`** (`Theater_ID`, `Theater_Name`, `City`, `State`, `Country`)
   - *PK:* `Theater_ID`
2. **`SCREEN`** (`Screen_ID`, `Theater_ID`, `Screen_Number`, `Screen_Name`, `Screen_Type`, `Capacity`, `Projection_Tech`, `Audio_Tech`, `Verification_Status`)
   - *PK:* `Screen_ID` | *FK:* `Theater_ID` references `THEATER`
   - *Constraints:* `CHECK (Capacity > 0)`, `UNIQUE(Theater_ID, Screen_Number)`
3. **`MOVIE`** (`Movie_ID`, `Movie_Name`, `Genre`, `Rating`, `Duration`, `Language`)
   - *PK:* `Movie_ID`
   - *Constraints:* `CHECK (Rating >= 0 AND Rating <= 10)`, `CHECK (Duration > 0)`
4. **`SHOWS`** (`Show_ID`, `Movie_ID`, `Screen_ID`, `Show_Date`, `Show_Time`, `Format`, `Ticket_Price`)
   - *PK:* `Show_ID` | *FK:* `Movie_ID` references `MOVIE`, `Screen_ID` references `SCREEN`
   - *Constraints:* `CHECK (Format IN ('2D', '3D', 'IMAX 2D', 'IMAX 3D', 'P[XL] 2D', 'P[XL] 3D', 'BIGPIX 2D', 'BIGPIX 3D'))`, `CHECK (Ticket_Price > 0)`
5. **`SEAT`** (`Seat_ID`, `Screen_ID`, `Seat_Number`, `Seat_Type`)
   - *PK:* `Seat_ID` | *FK:* `Screen_ID` references `SCREEN`
   - *Constraints:* `CHECK (Seat_Type IN ('VIP', 'Balcony', 'Premium', 'Regular'))`, `UNIQUE(Screen_ID, Seat_Number)`
6. **`CUSTOMER`** (`Customer_ID`, `Customer_Name`, `Email`, `Phone`, `Password`)
   - *PK:* `Customer_ID` | *Constraint:* `UNIQUE (Email)`
7. **`BOOKING`** (`Booking_ID`, `Customer_ID`, `Show_ID`, `Booking_Date`, `Ticket_Price`, `Format`)
   - *PK:* `Booking_ID` | *FK:* `Customer_ID` references `CUSTOMER`, `Show_ID` references `SHOWS`
   - *Constraints:* `CHECK (Format IN ('2D', '3D', 'IMAX 2D', 'IMAX 3D', 'P[XL] 2D', 'P[XL] 3D', 'BIGPIX 2D', 'BIGPIX 3D'))`
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
│   ├── schema.sql                 # DDL script creating all 9 tables in dependency order with constraints & indexes
│   ├── seed.sql                   # Chennai dataset (6 Theaters, 49 Screens, M01-M06, CU01-CU05, Bookings, Payments)
│   ├── queries.sql                # 18 academic SQL queries (DA2 report) updated for Chennai multiplexes & PLF formats
│   ├── procedures.sql             # Stored procedures & triggers (double-booking prevention, telemetry reports)
│   └── chennai_cinema_sources.md  # Detailed verification taxonomy, source URLs, and discrepancy analyses
├── assets/
│   └── posters.js                 # Native high-resolution vector SVG movie posters (Superman, Heat, Interstellar, etc.)
├── css/
│   ├── style.css                  # Design system: BookMyShow/PVR dark cinema palette, PLF badges, glassmorphism
│   └── seat-layout.css            # Curved cinema projection screen, tiered seating grid, and boarding pass ticket pass
├── js/
│   ├── db-data.js                 # In-memory seed state and catalog of 18 academic SQL queries
│   ├── db-engine.js               # Relational database engine (BCNF constraints, triggers, atomic transaction runner)
│   ├── app.js                     # Client SPA controller (movie browsing, showtime picker, seat selection, checkout)
│   └── admin.js                   # Admin dashboard, show schedule manager, capacity updater, live SQL runner
├── index.html                     # Standalone modern web interface (BookMyShow / PVR luxury aesthetic)
└── README.md                      # Project documentation
```

---

## Database Execution Instructions (MySQL)

If MySQL is installed on your machine, you can run the SQL scripts directly:

```bash
mysql -u root -p < database/schema.sql
mysql -u root -p < database/seed.sql
mysql -u root -p < database/procedures.sql
mysql -u root -p < database/queries.sql
```

*(Note: If MySQL is not running locally, the included web application contains a standalone relational database engine that executes these exact relational models, constraints, and 18 queries in-browser).*

---

## Interactive Web Application Features

1. **Chennai Destinations & Multi-Screen Showtimes:**
   - Select any movie to view showtimes across all 6 Chennai destinations.
   - Distinct badges for formats: `IMAX Laser`, `P[XL] Giant`, `BIGPIX`, `2D`, and `3D`.
   - Displays auditorium names (`Audi 5 (IMAX)`, `P[XL] Flagship Auditorium`, `Sathyam (Main Hall)`, `Screen 1 (BIGPIX)`).
2. **Interactive Cinema Seating Hall:**
   - Visual curved cinema screen with ambient light glow (`ALL EYES THIS WAY PLEASE`).
   - Tiered seat pricing: VIP Recliners, Balcony Prime, Premium, Regular.
   - Real-time seat reservation locking; already-booked seats from `BOOKED_SEAT` are disabled to prevent double-booking.
   - Floating action dock displaying selected seats, seat count, and live subtotal.
3. **Checkout & Transaction Simulator:**
   - Itemized fare breakdown: Ticket Base Fare, Fixed Convenience Fee (₹30), and 18% GST.
   - Payment modes: `UPI`, `Credit Card`, `Debit Card`, `Net Banking`, `Cash`.
   - Triggers `sp_BookTicketTransaction` with atomic commit to relational state.
4. **Boarding Pass / E-Ticket Modal:**
   - Cinema boarding pass with perforated edge styling, QR code graphic, booking ID, payment ID, and print option.
5. **My Bookings View:**
   - Booking history for the active student/customer persona (`CU01`–`CU05`).
   - Live cancellation via `sp_CancelBooking` that immediately releases occupied seats back to the auditorium.
6. **Admin Operations Panel:**
   - Real-time KPI summary (Total Revenue, Confirmed Bookings, Active Movies, Total Shows).
   - **Show Schedule Manager:** Add shows, edit ticket pricing, or remove slots.
   - **49 Auditoriums & Telemetry:** Inspect capacities, projection technology, and verification statuses.
   - **Relational Schema Browser:** Inspect live rows and row counts across all 9 tables.
7. **Academic SQL Query Sandbox (DA2):**
   - Interactive runner with all 18 academic queries from the DA2 submission.
   - Displays academic concept, formatted SQL syntax, execution time (in ms), and tabular results.

---

## How to Run the Web Application

Simply open [`index.html`](index.html) in any modern browser:
- Double-click on `index.html` in Windows File Explorer.
- Or right-click `index.html` and select **"Open with Live Server"** or open in Chrome / Edge.