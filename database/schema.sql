-- ============================================================================
-- DATABASE MANAGEMENT SYSTEMS PROJECT: MOVIE TICKET RESERVATION SYSTEM (MTRS)
-- File: database/schema.sql
-- Description: DDL script creating all 9 normalized relational tables (up to BCNF).
-- Engine: MySQL 8.0+ compatible (InnoDB with strict referential integrity)
-- Enhanced for Chennai Cinema Destinations: Supports Screen Names, Tech telemetry,
-- and Premium Large Formats ('IMAX', 'P[XL]', 'BIGPIX', '2D', '3D').
-- ============================================================================

DROP DATABASE IF EXISTS mtrs_db;
CREATE DATABASE mtrs_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE mtrs_db;

-- Disable foreign key checks during schema re-creation
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS PAYMENT;
DROP TABLE IF EXISTS BOOKED_SEAT;
DROP TABLE IF EXISTS BOOKING;
DROP TABLE IF EXISTS SEAT;
DROP TABLE IF EXISTS SHOWS;
DROP TABLE IF EXISTS MOVIE;
DROP TABLE IF EXISTS SCREEN;
DROP TABLE IF EXISTS THEATER;
DROP TABLE IF EXISTS CUSTOMER;

SET FOREIGN_KEY_CHECKS = 1;

-- ----------------------------------------------------------------------------
-- 1. THEATER RELATION
-- Represents physical cinema locations across Chennai.
-- ----------------------------------------------------------------------------
CREATE TABLE THEATER (
    Theater_ID VARCHAR(10) NOT NULL,
    Theater_Name VARCHAR(100) NOT NULL,
    City VARCHAR(50) NOT NULL,
    State VARCHAR(50) NOT NULL,
    Country VARCHAR(50) NOT NULL DEFAULT 'India',
    CONSTRAINT pk_theater PRIMARY KEY (Theater_ID)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 2. SCREEN RELATION
-- Physical auditorium/hall inside a theater.
-- Includes auditorium name, projection/audio telemetry, and research verification.
-- CHECK (Capacity > 0)
-- ----------------------------------------------------------------------------
CREATE TABLE SCREEN (
    Screen_ID VARCHAR(10) NOT NULL,
    Theater_ID VARCHAR(10) NOT NULL,
    Screen_Number INT NOT NULL,
    Screen_Name VARCHAR(50) NOT NULL DEFAULT '',
    Screen_Type VARCHAR(30) NOT NULL DEFAULT 'Standard',
    Capacity INT NOT NULL,
    Projection_Tech VARCHAR(50) NOT NULL DEFAULT '2K Digital',
    Audio_Tech VARCHAR(50) NOT NULL DEFAULT 'Dolby 7.1',
    Verification_Status VARCHAR(30) NOT NULL DEFAULT 'Published - Unverified',
    CONSTRAINT pk_screen PRIMARY KEY (Screen_ID),
    CONSTRAINT fk_screen_theater FOREIGN KEY (Theater_ID) 
        REFERENCES THEATER(Theater_ID) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT chk_screen_capacity CHECK (Capacity > 0),
    CONSTRAINT uq_theater_screen UNIQUE (Theater_ID, Screen_Number)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 3. MOVIE RELATION
-- Catalog of movies available for screening.
-- CHECK (Rating >= 0 AND Rating <= 10), CHECK (Duration > 0)
-- ----------------------------------------------------------------------------
CREATE TABLE MOVIE (
    Movie_ID VARCHAR(10) NOT NULL,
    Movie_Name VARCHAR(100) NOT NULL,
    Genre VARCHAR(50) NOT NULL,
    Rating DECIMAL(3,1) NOT NULL DEFAULT 0.0,
    Duration INT NOT NULL COMMENT 'Duration in minutes',
    Language VARCHAR(30) NOT NULL,
    CONSTRAINT pk_movie PRIMARY KEY (Movie_ID),
    CONSTRAINT chk_movie_rating CHECK (Rating >= 0.0 AND Rating <= 10.0),
    CONSTRAINT chk_movie_duration CHECK (Duration > 0)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 4. SHOW RELATION
-- Scheduled screening of a movie in a specific screen at a given date/time.
-- Supports: '2D', '3D', 'IMAX 2D', 'IMAX 3D', 'P[XL] 2D', 'P[XL] 3D', 'BIGPIX 2D', 'BIGPIX 3D'
-- CHECK (Ticket_Price > 0)
-- ----------------------------------------------------------------------------
CREATE TABLE SHOWS (
    Show_ID VARCHAR(10) NOT NULL,
    Movie_ID VARCHAR(10) NOT NULL,
    Screen_ID VARCHAR(10) NOT NULL,
    Show_Date DATE NOT NULL,
    Show_Time TIME NOT NULL,
    Format VARCHAR(20) NOT NULL DEFAULT '2D',
    Ticket_Price DECIMAL(8,2) NOT NULL,
    CONSTRAINT pk_shows PRIMARY KEY (Show_ID),
    CONSTRAINT fk_show_movie FOREIGN KEY (Movie_ID) 
        REFERENCES MOVIE(Movie_ID) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_show_screen FOREIGN KEY (Screen_ID) 
        REFERENCES SCREEN(Screen_ID) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT chk_show_format CHECK (
        Format IN ('2D', '3D', 'IMAX 2D', 'IMAX 3D', 'P[XL] 2D', 'P[XL] 3D', 'BIGPIX 2D', 'BIGPIX 3D')
    ),
    CONSTRAINT chk_show_price CHECK (Ticket_Price > 0.0)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 5. SEAT RELATION
-- Individual seats belonging to a specific screen.
-- CHECK (Seat_Type IN ('VIP', 'Balcony', 'Premium', 'Regular'))
-- ----------------------------------------------------------------------------
CREATE TABLE SEAT (
    Seat_ID VARCHAR(10) NOT NULL,
    Screen_ID VARCHAR(10) NOT NULL,
    Seat_Number VARCHAR(10) NOT NULL,
    Seat_Type VARCHAR(20) NOT NULL DEFAULT 'Regular',
    CONSTRAINT pk_seat PRIMARY KEY (Seat_ID),
    CONSTRAINT fk_seat_screen FOREIGN KEY (Screen_ID) 
        REFERENCES SCREEN(Screen_ID) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT uq_screen_seat UNIQUE (Screen_ID, Seat_Number),
    CONSTRAINT chk_seat_type CHECK (Seat_Type IN ('VIP', 'Balcony', 'Premium', 'Regular'))
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 6. CUSTOMER RELATION
-- Registered users who make bookings.
-- UNIQUE (Email)
-- ----------------------------------------------------------------------------
CREATE TABLE CUSTOMER (
    Customer_ID VARCHAR(10) NOT NULL,
    Customer_Name VARCHAR(100) NOT NULL,
    Email VARCHAR(100) NOT NULL,
    Phone VARCHAR(15) NOT NULL,
    Password VARCHAR(255) NOT NULL,
    CONSTRAINT pk_customer PRIMARY KEY (Customer_ID),
    CONSTRAINT uq_customer_email UNIQUE (Email)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 7. BOOKING RELATION
-- Header record for a ticket booking transaction.
-- Supports all verified standard and PLF cinema formats.
-- ----------------------------------------------------------------------------
CREATE TABLE BOOKING (
    Booking_ID VARCHAR(10) NOT NULL,
    Customer_ID VARCHAR(10) NOT NULL,
    Show_ID VARCHAR(10) NOT NULL,
    Booking_Date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    Ticket_Price DECIMAL(8,2) NOT NULL,
    Format VARCHAR(20) NOT NULL,
    CONSTRAINT pk_booking PRIMARY KEY (Booking_ID),
    CONSTRAINT fk_booking_customer FOREIGN KEY (Customer_ID) 
        REFERENCES CUSTOMER(Customer_ID) 
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_booking_show FOREIGN KEY (Show_ID) 
        REFERENCES SHOWS(Show_ID) 
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_booking_format CHECK (
        Format IN ('2D', '3D', 'IMAX 2D', 'IMAX 3D', 'P[XL] 2D', 'P[XL] 3D', 'BIGPIX 2D', 'BIGPIX 3D')
    ),
    CONSTRAINT chk_booking_price CHECK (Ticket_Price >= 0.0)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 8. BOOKED_SEAT RELATION
-- Bridge table representing the seats reserved in a booking.
-- Composite Primary Key (Booking_ID, Seat_ID)
-- ----------------------------------------------------------------------------
CREATE TABLE BOOKED_SEAT (
    Booking_ID VARCHAR(10) NOT NULL,
    Seat_ID VARCHAR(10) NOT NULL,
    CONSTRAINT pk_booked_seat PRIMARY KEY (Booking_ID, Seat_ID),
    CONSTRAINT fk_bs_booking FOREIGN KEY (Booking_ID) 
        REFERENCES BOOKING(Booking_ID) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_bs_seat FOREIGN KEY (Seat_ID) 
        REFERENCES SEAT(Seat_ID) 
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 9. PAYMENT RELATION
-- Payment details for a booking. Exactly 1 payment per booking.
-- UNIQUE (Booking_ID) ensures 1-to-1 relationship.
-- CHECK (Payment_Mode IN ('Credit Card', 'Debit Card', 'UPI', 'Net Banking', 'Cash'))
-- CHECK (Amount > 0)
-- ----------------------------------------------------------------------------
CREATE TABLE PAYMENT (
    Payment_ID VARCHAR(10) NOT NULL,
    Booking_ID VARCHAR(10) NOT NULL,
    Payment_Mode VARCHAR(30) NOT NULL,
    Amount DECIMAL(8,2) NOT NULL,
    Payment_Date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_payment PRIMARY KEY (Payment_ID),
    CONSTRAINT uq_payment_booking UNIQUE (Booking_ID),
    CONSTRAINT fk_payment_booking FOREIGN KEY (Booking_ID) 
        REFERENCES BOOKING(Booking_ID) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT chk_payment_mode CHECK (Payment_Mode IN ('Credit Card', 'Debit Card', 'UPI', 'Net Banking', 'Cash')),
    CONSTRAINT chk_payment_amount CHECK (Amount > 0.0)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- Performance Indexes for Academic Evaluation
-- ----------------------------------------------------------------------------
CREATE INDEX idx_shows_movie_date ON SHOWS(Movie_ID, Show_Date);
CREATE INDEX idx_shows_screen ON SHOWS(Screen_ID);
CREATE INDEX idx_seat_screen ON SEAT(Screen_ID);
CREATE INDEX idx_booking_customer ON BOOKING(Customer_ID);
CREATE INDEX idx_booking_show ON BOOKING(Show_ID);
CREATE INDEX idx_booked_seat_seat ON BOOKED_SEAT(Seat_ID);
CREATE INDEX idx_payment_date ON PAYMENT(Payment_Date);
