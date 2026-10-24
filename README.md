# MTRS — Movie Ticket Reservation System

A full-stack cinema ticket reservation platform built with HTML, CSS, JavaScript, Supabase, and PostgreSQL. Designed around a cinematic multiplex experience, MTRS combines interactive seat selection, transactional booking, customer authentication, e-ticket generation, administrative operations, and booking confirmation emails.

**Repository:** [Movie Ticket Reservation System](https://github.com/simpy-88/Movie-Ticket-Reservation-System)

---

## Table of Contents

* [Project Overview](#project-overview)
* [Features](#features)
* [Technology Stack](#technology-stack)
* [Cinema Network](#cinema-network)
* [System Architecture](#system-architecture)
* [Database Design](#database-design)
* [Project Structure](#project-structure)
* [Getting Started](#getting-started)
* [Supabase Configuration](#supabase-configuration)
* [Booking and Transaction Workflow](#booking-and-transaction-workflow)
* [Email Notifications](#email-notifications)
* [Security](#security)
* [Academic Relevance](#academic-relevance)
* [Limitations and Future Improvements](#limitations-and-future-improvements)

---

## Project Overview

MTRS is a cinema ticket reservation system developed as a Database Management Systems (DBMS) project. It combines relational database concepts with an interactive web application to demonstrate how cinema discovery, show scheduling, seat inventory, customer accounts, reservations, payments, and administrative operations can work together.

The application features a Chennai-based multiplex network containing **6 cinema destinations, 49 screens, and 13,857 physical seat records**.

Unlike a purely static booking interface, MTRS integrates with Supabase for persistent data storage, authentication, database operations, and server-side booking confirmation emails.

The project also includes database constraints, row-level security policies, transactional booking logic, and safeguards against duplicate seat reservations.

> **Payment note:** The current checkout uses a simulated payment workflow. It does not represent a live payment gateway integration.

---

## Features

### 1. Movie Discovery

* Browse the available movie catalogue.
* View movie posters and cinematic artwork.
* Explore movie information and available showtimes.
* Navigate between movies, theatres, and show details.

### 2. Cinema and Showtime Selection

* Explore six cinema destinations across Chennai.
* Browse shows across 49 screens.
* View screen capacity, projection technology, audio technology, and supported formats.
* Select an available show before choosing seats.

### 3. Interactive Seat Selection

* Cinematic seating interface with a curved screen presentation.
* Visually differentiated seating categories.
* Live selection of available seats.
* Seat availability retrieved from the database.
* Occupied seats disabled during selection.
* Dynamic seat count and booking subtotal.
* Scrollable seating layouts for large auditoriums.

The database contains physical seat inventory for the configured screens. Availability is determined for the selected show, rather than treating every seat as permanently occupied or available.

### 4. Customer Authentication

* Customer registration and sign-in through Supabase Authentication.
* Customer profile resolution and account linking.
* Authenticated access to customer-specific booking information.
* User-scoped access to protected booking and payment records.

### 5. Booking and Checkout

* Review selected seats before confirming a reservation.
* Calculate the booking amount and applicable checkout charges.
* Associate bookings with the authenticated customer.
* Store booking and booked-seat information in PostgreSQL.
* Apply transactional database logic to help prevent conflicting reservations.
* Maintain booking and payment-status information.

### 6. E-Ticket and Booking History

* View booking information after confirmation.
* Display an e-ticket with booking details and seat information.
* Access previously created bookings.
* Print the displayed ticket.
* Cancel eligible bookings through the cancellation workflow, subject to the application's booking rules.

### 7. Booking Confirmation Emails

MTRS includes a Supabase Edge Function that sends booking confirmation emails through Resend.

The notification workflow includes:

* Verification of the authenticated user's identity.
* Verification that the booking belongs to the requesting customer.
* Retrieval of booking details from the database.
* HTML and plain-text email content.
* Booking notification status tracking.
* Idempotency protections intended to reduce duplicate email delivery.

Email delivery depends on the Resend configuration, sender verification requirements, and recipient eligibility.

### 8. Administrative Dashboard

The administrative interface provides tools for inspecting and managing cinema operations.

Depending on the configured permissions and application state, the interface includes:

* Booking and revenue-related KPIs.
* Movie and show information.
* Show scheduling and ticket pricing controls.
* Screen capacity and physical seat inventory information.
* Occupied and available seat counts for individual shows.
* Database table inspection.
* Academic SQL query demonstrations.

**Important:** Dashboard visibility alone does not establish authorization. Administrative operations should be protected by server-side authorization and database policies appropriate to the deployed environment.

---

## Technology Stack

| Technology                | Purpose                                                  |
| ------------------------- | -------------------------------------------------------- |
| HTML5                     | Application structure and interface                      |
| CSS3                      | Responsive styling, cinematic theme, and seating layouts |
| Vanilla JavaScript (ES6+) | Application logic, state management, and interactions    |
| Supabase                  | Backend services and application integration             |
| PostgreSQL                | Persistent relational database                           |
| Supabase Auth             | Customer authentication and session management           |
| Supabase Edge Functions   | Server-side booking confirmation emails                  |
| Resend                    | Transactional email delivery                             |
| Git and GitHub            | Version control and source-code hosting                  |

The frontend is implemented using vanilla JavaScript rather than a framework-based build system. The project can be run locally without installing a frontend package manager or bundler.

---

## Cinema Network

The application models six cinema destinations in Chennai.

| Theatre ID | Cinema               | Location                              | Screens |
| ---------- | -------------------- | ------------------------------------- | ------: |
| T01        | PVR Palazzo          | Nexus Vijaya Mall, Vadapalani         |       9 |
| T02        | INOX Luxe            | Phoenix Marketcity, Velachery         |      11 |
| T03        | PVR VR Chennai       | VR Mall, Anna Nagar                   |      10 |
| T04        | PVR Sathyam Cinemas  | Royapettah                            |       6 |
| T05        | PVR Aerohub          | Chennai Airport Complex, Meenambakkam |       5 |
| T06        | INOX The Marina Mall | Egattur, OMR                          |       8 |
| **Total**  | **6 destinations**   | **Chennai, Tamil Nadu**               |  **49** |

The configured screen inventory contains **13,857 physical seats**.

Cinema names, capacities, screen technology, and other descriptive information are application data. They should not be interpreted as a guarantee of current commercial operating status or independently verified real-world specifications.

---

## System Architecture

MTRS follows a client–backend architecture.

```text
                 CUSTOMER / ADMIN
                        |
                        v
                HTML + CSS + JS
                        |
                        v
                 MTRS APPLICATION
                        |
             +----------+----------+
             |                     |
             v                     v
      Supabase Auth          Supabase Client
                                   |
                                   v
                            PostgreSQL
                                   |
                    +--------------+--------------+
                    |              |              |
                    v              v              v
                 Movies          Shows        Seat Inventory
                    |              |              |
                    +--------------+--------------+
                                   |
                                   v
                       Booking and Payment Data
                                   |
                                   v
                    Supabase Edge Function
                                   |
                                   v
                               Resend
                                   |
                                   v
                       Booking Confirmation Email
```

### Architectural responsibilities

**Frontend**

Handles movie discovery, show selection, seat selection, checkout, e-ticket presentation, booking history, and administrative interfaces.

**Supabase Authentication**

Manages customer authentication and provides the identity used for protected application operations.

**PostgreSQL**

Stores the cinema catalogue, screens, show schedules, seats, customer profiles, bookings, booked seats, payments, and booking notification records.

**Database functions and constraints**

Implement transactional booking operations and database-level safeguards against invalid or conflicting reservations.

**Supabase Edge Function**

Verifies the requesting user's identity and booking ownership before retrieving booking details and requesting email delivery through Resend.

---

## Database Design

MTRS uses PostgreSQL through Supabase. The current schema contains the following core relations.

| Table                   | Responsibility                                  |
| ----------------------- | ----------------------------------------------- |
| `movies`                | Movie catalogue and descriptive information     |
| `theaters`              | Cinema destinations                             |
| `screens`               | Auditoriums, capacities, and technical details  |
| `shows`                 | Movie schedules, formats, and ticket pricing    |
| `seats`                 | Physical seat inventory associated with screens |
| `customers`             | Customer profile information                    |
| `bookings`              | Customer reservations and booking status        |
| `booked_seats`          | Seats associated with individual bookings       |
| `payments`              | Payment-related records and status              |
| `booking_notifications` | Booking confirmation email notification status  |

The schema also includes supporting views and database functions.

### Relational integrity

The database uses primary keys, foreign keys, uniqueness constraints, and validation rules to maintain consistent relationships between movies, screens, shows, customers, bookings, seats, and payments.

### Seat reservation integrity

Seat reservation safeguards include database-level uniqueness enforcement and transactional booking logic. These measures help prevent the same seat from being assigned to conflicting active bookings for a show.

### Transactional booking

The booking workflow uses the `sp_book_ticket_transaction` database function to coordinate reservation operations. Database locking and constraints help maintain consistency when booking requests overlap.

### Cancellation

The cancellation workflow uses `sp_cancel_booking` to process eligible cancellations and update the corresponding booking state according to the database implementation.

### Row-Level Security

Row-Level Security (RLS) policies restrict access to protected customer and transaction data. Public catalogue access and authenticated customer access are handled separately.

---

## Project Structure

The principal files and directories are organized as follows.

```text
mtrs/
├── assets/
│   └── posters.js
├── css/
│   ├── style.css
│   └── seat-layout.css
├── js/
│   ├── app.js
│   ├── admin.js
│   ├── db-data.js
│   ├── db-engine.js
│   └── supabase-client.js
├── supabase/
│   ├── functions/
│   │   └── send-booking-confirmation/
│   │       └── index.ts
│   ├── migrations/
│   │   └── 20261023000001_booking_notifications.sql
│   ├── config.toml
│   ├── README.md
│   ├── seed.sql
│   ├── reconcile_physical_seats.sql
│   ├── repair_existing_database.sql
│   └── seed_full_auditorium_seats.sql
├── index.html
├── .gitignore
└── README.md
```

### Important files

| File                                                           | Description                                     |
| -------------------------------------------------------------- | ----------------------------------------------- |
| `index.html`                                                   | Main application interface                      |
| `css/style.css`                                                | Global styling and visual design                |
| `css/seat-layout.css`                                          | Cinema seating layout and ticket styling        |
| `assets/posters.js`                                            | Movie poster and artwork assets                 |
| `js/app.js`                                                    | Main application workflows                      |
| `js/admin.js`                                                  | Administrative interface                        |
| `js/supabase-client.js`                                        | Supabase client integration and database access |
| `js/db-data.js`                                                | Application data and local data definitions     |
| `js/db-engine.js`                                              | Relational data and fallback execution logic    |
| `supabase/functions/send-booking-confirmation/index.ts`        | Booking confirmation email Edge Function        |
| `supabase/migrations/20261023000001_booking_notifications.sql` | Booking notification database migration         |
| `supabase/seed.sql`                                            | Cinema and application seed data                |
| `supabase/reconcile_physical_seats.sql`                        | Physical seat inventory reconciliation script   |

The SQL files serve different purposes. Do not execute repair, reconciliation, or seed scripts indiscriminately against a populated database. Review their contents and intended effects before running them.

---

## Getting Started

### Prerequisites

* A modern web browser.
* A local web server, such as the VS Code Live Server extension.
* A Supabase project.
* Access to the Supabase project configuration.
* Resend credentials if booking confirmation emails are required.

### 1. Clone the repository

```bash
git clone https://github.com/simpy-88/Movie-Ticket-Reservation-System.git
cd Movie-Ticket-Reservation-System
```

### 2. Configure Supabase

Create or use a Supabase project and configure the frontend with its project URL and publishable key.

Review `js/supabase-client.js` and `supabase/config.toml` to understand the application's existing configuration.

For a new database, follow the setup instructions in `supabase/README.md` and apply the required schema, policies, functions, and seed data in the correct order.

**Do not blindly rerun seed, repair, or seat reconciliation scripts against an existing database.** Some scripts may insert or modify large amounts of data.

### 3. Start the application

Open the project directory in your editor.

Using VS Code:

1. Install the Live Server extension if it is not already installed.
2. Open `index.html`.
3. Select **Open with Live Server**.

Alternatively, serve the project directory using any suitable static HTTP server.

Opening the HTML file directly may work for some interface features, but a local HTTP server is preferable for testing browser authentication, module loading, and network requests.

### 4. Test the application

Verify the following workflows:

* Movie catalogue loading.
* Cinema and show selection.
* Seat availability retrieval.
* Customer registration and sign-in.
* Booking confirmation and database persistence.
* E-ticket display and booking history.
* Cancellation behavior.
* Administrative operations allowed by your account.
* Booking confirmation email delivery, if configured.

---

## Supabase Configuration

MTRS uses Supabase for persistent storage, authentication, and backend operations.

### Frontend configuration

The browser-side application needs the Supabase project URL and a publishable key.

Publishable keys are intended for frontend use, provided that database permissions and RLS policies are correctly configured.

Never place a Supabase secret key or service-role key in browser JavaScript, HTML, CSS, or other publicly accessible files.

### Database setup

The project includes SQL scripts and a booking notification migration.

Before deploying a fresh instance, verify that the following are configured:

* Required database tables and relationships.
* Primary keys, foreign keys, and uniqueness constraints.
* Booking functions and associated triggers.
* RLS policies.
* Required views.
* Seed data and physical seat inventory.
* Booking notification table and constraints.

Consult `supabase/README.md` for the repository-specific database setup instructions.

### Edge Function deployment

The booking confirmation function is named `send-booking-confirmation`.

Install or invoke the Supabase CLI, authenticate, and link the local project to your Supabase project before deploying.

Example deployment command:

```powershell
npx.cmd supabase functions deploy send-booking-confirmation --project-ref YOUR_PROJECT_REF
```

Replace `YOUR_PROJECT_REF` with your own Supabase project reference.

Configure the function's required secrets in Supabase before testing email delivery.

---

## Booking and Transaction Workflow

A typical reservation follows this sequence:

1. The customer selects a movie.
2. The customer selects a cinema, screen, and show.
3. The application retrieves seat availability.
4. The customer selects available seats.
5. The customer reviews the booking amount.
6. The authenticated customer confirms the reservation.
7. The database validates the booking and applies transactional safeguards.
8. Booking and booked-seat records are persisted.
9. The application displays the resulting booking details and e-ticket.
10. The application requests booking confirmation email delivery.

The email request is designed not to invalidate a successfully completed booking merely because email delivery fails. Email delivery status is tracked separately.

**Payment processing is simulated.** A booking or payment record in this application must not be interpreted as evidence of a real financial transaction.

---

## Email Notifications

MTRS sends booking confirmation emails through a Supabase Edge Function integrated with Resend.

### Required configuration

Configure the following secrets in your Supabase project:

| Secret              | Purpose                                            |
| ------------------- | -------------------------------------------------- |
| `RESEND_API_KEY`    | Authenticates requests to Resend                   |
| `MTRS_SENDER_EMAIL` | Configures the sender address used by the function |

Set these values through the Supabase project dashboard or an appropriate secure CLI workflow. Never commit actual secret values to GitHub.

### Sender verification

Resend restricts sending from its onboarding sender address to eligible recipients. For production use, verify a domain with Resend and configure an authorized sender address.

### Testing

After deploying the function:

1. Sign in to MTRS.
2. Complete a test booking.
3. Confirm that the booking exists in the database.
4. Inspect the Edge Function logs.
5. Check the corresponding `booking_notifications` record.
6. Verify receipt of the email.

A successful booking does not, by itself, guarantee successful email delivery.

---

## Security

The project incorporates several security-related controls.

* **Authentication:** Supabase Auth manages customer identities.
* **Row-Level Security:** Database policies restrict access to protected customer and transaction records.
* **Booking ownership checks:** The confirmation function verifies that the requesting user owns the booking.
* **Transactional integrity:** Database functions, constraints, and locking help prevent conflicting reservations.
* **Server-side secrets:** Resend and service-role credentials belong in protected server-side configuration.
* **Notification idempotency:** Database constraints and request-level protections help reduce duplicate notification processing.
* **HTML escaping:** Dynamic values are escaped before being inserted into HTML email content.
* **Ignored local configuration:** `.gitignore` excludes environment files and Supabase CLI temporary files.

These controls reduce risk but do not guarantee that the application is secure in every deployment scenario.

Before a public production launch, review administrative authorization, all RLS policies, error handling, rate limiting, logging, and the complete booking and cancellation lifecycle.

---

## Academic Relevance

MTRS demonstrates practical applications of DBMS concepts, including:

* Relational modelling and normalization.
* Primary keys and foreign keys.
* Referential integrity and domain constraints.
* One-to-many and many-to-many relationships.
* Database functions and triggers.
* Transaction management and concurrency control.
* Unique constraints for preventing duplicate active seat reservations.
* Row-Level Security.
* SQL queries, views, and aggregate reporting.
* Database-backed application development.

The project also demonstrates how a relational database can support a stateful application with authentication, seat inventory, reservations, and external service integration.

---

## Limitations and Future Improvements

Potential areas for further development include:

* Integration with a real payment gateway.
* Automated expiration of temporary seat reservations.
* More extensive automated integration and concurrency testing.
* Improved deployment automation and environment management.
* Stronger server-side administrative role enforcement.
* Expanded accessibility and mobile usability testing.
* Production monitoring and notification retry management.
* Automated database migration deployment.
* Additional booking analytics and reporting.

These are potential improvements and should not be interpreted as completed features.

---

## Repository

**GitHub:** [simpy-88/Movie-Ticket-Reservation-System](https://github.com/simpy-88/Movie-Ticket-Reservation-System)

MTRS is an academic DBMS project that combines relational database design with a cinema reservation interface and backend integration.
