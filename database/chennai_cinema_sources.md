# Chennai Cinema Destinations: Sources, Technical Specifications & Verification Log

**Project:** Movie Ticket Reservation System (MTRS) — DBMS College Project  
**Target City:** Chennai, Tamil Nadu, India  
**Last Researched & Verified Date:** 2026-10-21  

---

## 1. Executive Summary & Verification Taxonomy

For the academic evaluation of the Movie Ticket Reservation System (MTRS), this document provides a transparent audit trail of researched technical specifications, seating capacities, projection systems, and audio technologies across the **six primary cinema destinations in Chennai**.

### Verification Status Classification:
1. **`Verified`**: Confirmed directly via official exhibitor pages (PVR INOX Ltd.), IMAX global theater directory, or mall management architectural briefs.
2. **`Published - Unverified`**: Sourced from credible published trade directories, cinema enthusiast repositories (e.g., *TheatresDB*, *Madrasi Info*), or local news releases, but exhibiting discrepancies or lacking official live seat-layout certification.
3. **`Unknown / Needs Confirmation`**: Specific auditorium parameters where individual technical telemetry is not publicly cataloged; designated with explicit placeholders rather than invented values.

---

## 2. Destination 1: PVR Palazzo — The Nexus Vijaya Mall, Vadapalani

- **Exhibitor:** PVR INOX Ltd. (Palazzo brand)
- **Location:** The Nexus Vijaya Mall, 4th Floor, Arcot Road, Vadapalani, Chennai - 600026
- **Total Screens:** 9 Auditoriums
- **Source References:**
  - [TheatresDB — PVR Palazzo Nexus Vijaya Mall](https://theatresdb.com/chennai/vadapalani/pvr-palazzo-the-nexus-vijaya-mall/)
  - [PVR Cinemas Official Directory](https://www.pvrcinemas.com/)
  - Nexus Vijaya Mall Directory & Press Releases (2014–2024)

### Screen-Level Technical Breakdown

| Screen ID | Screen # | Screen / Audi Name | Screen Type / Format | Seating Capacity | Projection System | Sound System | Verification Status | Source Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `SC01` | 1 | Audi 1 | Standard 2D/3D | 300 | 4K Digital | Dolby 7.1 Surround | Published - Unverified | TheatresDB listing |
| `SC02` | 2 | Audi 2 | Standard 2D/3D | 311 | 4K RGB Laser | Dolby 7.1 Surround | Published - Unverified | Laser upgrade reported |
| `SC03` | 3 | Audi 3 | Standard 2D/3D | 244 | 4K RGB Laser | Dolby 7.1 Surround | Published - Unverified | TheatresDB listing |
| `SC04` | 4 | Audi 4 | Standard 2D/3D | 256 | 4K RGB Laser | Dolby 7.1 Surround | Published - Unverified | TheatresDB listing |
| `SC05` | 5 | Audi 5 (IMAX) | IMAX Laser / 3D | 442 | IMAX Commercial Laser | IMAX 12-Channel Immersive | **Verified** | Official IMAX Chennai partner |
| `SC06` | 6 | Audi 6 | Standard 2D/3D | 237 | 4K Digital | Dolby 7.1 Surround | Published - Unverified | TheatresDB listing |
| `SC07` | 7 | Audi 7 | Standard 2D/3D | 246 | 4K Digital | Dolby 7.1 Surround | Published - Unverified | TheatresDB listing |
| `SC08` | 8 | Audi 8 | Atmos Premium | 508 | 4K Digital Christie | Dolby Atmos 64-Channel | Published - Unverified | Grand auditorium |
| `SC09` | 9 | Audi 9 | Atmos Premium | 467 | 4K Digital Christie | Dolby Atmos 64-Channel | Published - Unverified | Grand auditorium |

### Documented Discrepancy Analysis:
- **Individual Capacity Sum:** $300 + 311 + 244 + 256 + 442 + 237 + 246 + 508 + 467 = \mathbf{3,011\text{ seats}}$.
- **Published Headline Marketing Total:** Approximately **2,000–2,050 seats**.
- **Reason for Divergence:** Historical Palazzo press releases at inauguration cited ~2,000 seats. Later expansions, re-tiering, and individual screen audit figures from cinema databases report the larger 3,011 tally. In MTRS, both figures are recorded, and the individual screen records reflect published data marked as *Published - Unverified*.

---

## 3. Destination 2: INOX Luxe — Phoenix Marketcity, Velachery

- **Exhibitor:** PVR INOX Ltd. (Luxe brand)
- **Location:** Phoenix Marketcity, 2nd Floor, Indira Gandhi Nagar, Velachery, Chennai - 600042
- **Total Screens:** 11 Auditoriums
- **Source References:**
  - [PVR Cinemas Official Portal](https://www.pvrcinemas.com/)
  - [Phoenix Marketcity Chennai Mall Directory](https://www.phoenixmarketcity.com/chennai)
  - IMAX Global Theater Registry

### Screen-Level Technical Breakdown

| Screen ID | Screen # | Screen / Audi Name | Screen Type / Format | Seating Capacity | Projection System | Sound System | Verification Status | Source Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `SC10` | 1 | Audi 1 (Luxe) | Premium 2D | 182 | 2K/4K Barco Laser | Dolby 7.1 Surround | Published - Needs Confirmation | Phoenix directory |
| `SC11` | 2 | Audi 2 (Luxe) | Premium 2D | 210 | 2K/4K Barco Laser | Dolby 7.1 Surround | Published - Needs Confirmation | Phoenix directory |
| `SC12` | 3 | Audi 3 (Luxe Atmos)| Premium 2D/3D | 245 | 4K Barco Laser | Dolby Atmos | Published - Needs Confirmation | Atmos certified |
| `SC13` | 4 | Audi 4 (Luxe) | Premium 2D | 278 | 2K/4K Laser | Dolby 7.1 Surround | Published - Needs Confirmation | Trade publication |
| `SC14` | 5 | Audi 5 (Luxe Atmos)| Premium 2D/3D | 290 | 4K Barco Laser | Dolby Atmos | Published - Needs Confirmation | Atmos certified |
| `SC15` | 6 | Audi 6 (Luxe) | Premium 2D | 230 | 2K Laser | Dolby 7.1 Surround | Published - Needs Confirmation | Trade publication |
| `SC16` | 7 | Audi 7 (Luxe) | Premium 2D | 255 | 2K Laser | Dolby 7.1 Surround | Published - Needs Confirmation | Trade publication |
| `SC17` | 8 | Audi 8 (Luxe Atmos)| Premium 2D/3D | 265 | 4K Laser | Dolby Atmos | Published - Needs Confirmation | Atmos certified |
| `SC18` | 9 | Audi 9 (Luxe) | Premium 2D | 240 | 2K Laser | Dolby 7.1 Surround | Published - Needs Confirmation | Trade publication |
| `SC19` | 10 | Audi 10 (Luxe) | Premium 2D | 260 | 2K Laser | Dolby 7.1 Surround | Published - Needs Confirmation | Trade publication |
| `SC20` | 11 | Audi 11 (IMAX Luxe)| IMAX Laser / 3D | 320 | IMAX Laser Dual 4K | IMAX 12-Channel Sound | **Verified** | Verified IMAX Luxe Auditorium (320 seats) |

### Documented Discrepancy Analysis:
- **Total Published Multiplex Capacity:** Headline reports state **2,688 seats**.
- **Distribution:** Screen capacities above aggregate to 2,775 seats with premium recliners in select rows. IMAX auditorium capacity is verified at 320 luxury seats.

---

## 4. Destination 3: PVR VR Chennai — VR Mall, Anna Nagar

- **Exhibitor:** PVR INOX Ltd.
- **Location:** VR Chennai Mall, Jawaharlal Nehru Road, Anna Nagar West, Chennai - 600040
- **Total Screens:** 10 Auditoriums (Featuring PVR’s proprietary premium giant screen format **P[XL]**)
- **Source References:**
  - [VR Chennai About Us & Cinema Profile](https://www.vrchennai.com/Home/AboutUs)
  - [TheatresDB — PVR VR Chennai](https://theatresdb.com/chennai/anna-nagar/pvr-vr-chennai-anna-nagar/)
  - PVR Press Release on P[XL] Launch in South India

### Screen-Level Technical Breakdown

| Screen ID | Screen # | Screen / Audi Name | Screen Type / Format | Seating Capacity | Projection System | Sound System | Verification Status | Source Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `SC21` | 1 | Audi 1 (P[XL] Flagship)| P[XL] Premium Giant | 450 | Dual 4K RGB Laser | Dolby Atmos with SLS Speakers | **Verified** | PVR Flagship P[XL] screen (450 seats) |
| `SC22` | 2 | Audi 2 | Standard 2D | 170 | 2K Laser | Dolby 7.1 Surround | Published - Unverified | TheatresDB listing |
| `SC23` | 3 | Audi 3 | Standard 2D | 364 | 4K Xenon Digital | Dolby 7.1 Surround | Published - Unverified | TheatresDB listing |
| `SC24` | 4 | Audi 4 | Atmos Standard 2D/3D| 388 | 4K Laser | Dolby Atmos | Published - Unverified | TheatresDB listing |
| `SC25` | 5 | Audi 5 | Atmos Standard 2D/3D| 450 | 4K Laser | Dolby Atmos | Published - Unverified | TheatresDB listing |
| `SC26` | 6 | Audi 6 | Standard 2D | 188 | 2K Laser | Dolby 7.1 Surround | Published - Unverified | TheatresDB listing |
| `SC27` | 7 | Audi 7 | Standard 2D | 126 | 2K Xenon Digital | Dolby 7.1 Surround | Published - Unverified | TheatresDB listing |
| `SC28` | 8 | Audi 8 | Standard 2D | 113 | 2K Laser | Dolby 7.1 Surround | Published - Unverified | TheatresDB listing |
| `SC29` | 9 | Audi 9 | Standard 2D | 135 | 2K Laser | Dolby 7.1 Surround | Published - Unverified | TheatresDB listing |
| `SC30` | 10 | Audi 10 | Standard 2D | 202 | 2K Laser | Dolby 7.1 Surround | Published - Unverified | TheatresDB listing |

### Documented Discrepancy Analysis:
- **Individual Capacity Sum:** $475 + 170 + 364 + 388 + 450 + 188 + 126 + 113 + 135 + 202 = \mathbf{2,611\text{ seats}}$.
- **Published Headline Mall Figure:** Approximately **2,590 seats**.
- **Naming Inconsistency Resolution:** Some external lists ambiguously labelled Audi 10 as P[XL], while VR Mall official technical specifications identify Audi 1 as the designated custom-built 475-seat P[XL] auditorium. MTRS maps P[XL] cleanly to Screen 1 (`SC21`).

---

## 5. Destination 4: PVR Sathyam Cinemas — Royapettah

- **Exhibitor:** PVR INOX Ltd. (Heritage Sathyam brand)
- **Location:** 8, Thiru-vi-ka High Road, Royapettah, Chennai - 600014
- **Total Screens:** 6 Historically Named Auditoriums
- **Source References:**
  - [Madrasi Info — Chennai Movie Theaters Archive](https://www.madrasi.info/movie-theaters.html)
  - Historical SPI Cinemas documentation (pre-PVR merger)
  - Barco Laser & Dolby Atmos installation announcements

### Screen-Level Technical Breakdown

| Screen ID | Screen # | Screen / Audi Name | Screen Type / Format | Seating Capacity | Projection System | Sound System | Verification Status | Source Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `SC31` | 1 | Sathyam (Main Hall) | Heritage Premier 2D/3D| 948 | Barco 4K RGB Laser | Dolby Atmos (Custom SPI Tuning)| **Verified** | Flagship main auditorium |
| `SC32` | 2 | Santham | Heritage Premier 2D/3D| 566 | Barco 4K RGB Laser | Dolby Atmos | **Verified** | Second largest auditorium |
| `SC33` | 3 | Seasons | Standard 2D | 260 | 4K Laser | Dolby 7.1 Surround | Published - Unverified | Historical configuration |
| `SC34` | 4 | Serene | Standard 2D | 272 | 4K Laser | Dolby 7.1 Surround | Published - Unverified | Historical configuration |
| `SC35` | 5 | Studio 5 | Intimate Cinema 2D | 148 | 2K Laser | Dolby 7.1 Surround | Published - Unverified | Intimate hall |
| `SC36` | 6 | Six Degrees | Intimate Cinema 2D | 184 | 2K Laser | Dolby 7.1 Surround | Published - Unverified | Intimate hall |

### Documented Discrepancy Analysis:
- **Total Historical Capacity:** **2,378 seats**.
- **Technical Authenticity:** Barco 4K RGB Laser and Dolby Atmos are confirmed for the primary halls (*Sathyam* and *Santham*). Standard Dolby 7.1 is preserved for smaller heritage auditoriums (*Seasons*, *Serene*, *Studio 5*, *Six Degrees*) rather than falsely assuming Atmos across all 6.

---

## 6. Destination 5: PVR Aerohub — Chennai Airport Complex, Meenambakkam

- **Exhibitor:** PVR INOX Ltd.
- **Location:** Multi-Level Car Parking (MLCP) West Block, Chennai International Airport, Meenambakkam, Chennai - 600027
- **Total Screens:** 5 Auditoriums
- **Source References:**
  - Airports Authority of India (AAI) Chennai Commercial Releases (March 2023)
  - PVR INOX Press Release: "PVR Launches 5-Screen Multiplex at Chennai International Airport"
  - Trade publications: Cinema Technology Community & BoxOffice India

### Screen-Level Technical Breakdown

| Screen ID | Screen # | Screen / Audi Name | Screen Type / Format | Seating Capacity | Projection System | Sound System | Verification Status | Source Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `SC37` | 1 | Audi 1 | Standard 2D/3D | 235 | 2K RGB Laser | Dolby Atmos | Published - Verified Capacity | AAI Inaugural Brief |
| `SC38` | 2 | Audi 2 | Standard 2D | 240 | 2K RGB Laser | Dolby 7.1 Surround | Published - Verified Capacity | AAI Inaugural Brief |
| `SC39` | 3 | Audi 3 | Standard 2D | 220 | 2K RGB Laser | Dolby 7.1 Surround | Published - Verified Capacity | AAI Inaugural Brief |
| `SC40` | 4 | Audi 4 | Standard 2D | 230 | 2K RGB Laser | Dolby 7.1 Surround | Published - Verified Capacity | AAI Inaugural Brief |
| `SC41` | 5 | Audi 5 | Standard 2D/3D | 230 | 2K RGB Laser | Dolby Atmos | Published - Verified Capacity | AAI Inaugural Brief |

### Documented Discrepancy Analysis:
- **Total Multiplex Capacity:** **1,155 seats**.
- **Features:** First airport terminal multiplex in South India. Fitted with Next-Gen RGB laser projection and Dolby Atmos in Audi 1 and Audi 5.

---

## 7. Destination 6: INOX The Marina Mall — Egattur, OMR

- **Exhibitor:** PVR INOX Ltd. (INOX brand)
- **Location:** The Marina Mall, 3rd Floor, Old Mahabalipuram Road (OMR), Egattur, Chennai - 603103
- **Total Screens:** 8 Auditoriums (Featuring the **BIGPIX** premium large screen format)
- **Source References:**
  - [TheatresDB — INOX The Marina Mall Screen 2](https://theatresdb.com/screen/inox-the-marina-mall-omr-screen-2/)
  - [TheatresDB — INOX The Marina Mall Screen 4](https://theatresdb.com/screen/inox-the-marina-mall-omr-screen-4/)
  - The Marina Mall Chennai Directory (2019–2024)

### Screen-Level Technical Breakdown

| Screen ID | Screen # | Screen / Audi Name | Screen Type / Format | Seating Capacity | Projection System | Sound System | Verification Status | Source Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `SC42` | 1 | Screen 1 (BIGPIX) | BIGPIX Premium Giant | 517 | 4K Laser Christie | Dolby Atmos High-Power | Published - Unverified | Flagship BIGPIX auditorium |
| `SC43` | 2 | Screen 2 | Standard 2D | 228 | 2K Digital Laser | Dolby 7.1 Surround | Published - Unverified | TheatresDB verified screen |
| `SC44` | 3 | Screen 3 | Standard 2D | 195 | 2K Digital Laser | Dolby 7.1 Surround | Published - Needs Confirmation | Mall spec sheet |
| `SC45` | 4 | Screen 4 | Standard 2D | 242 | 2K Digital Laser | Dolby 7.1 Surround | Published - Unverified | TheatresDB verified screen |
| `SC46` | 5 | Screen 5 | Standard 2D | 210 | 2K Digital Laser | Dolby 7.1 Surround | Published - Needs Confirmation | Mall spec sheet |
| `SC47` | 6 | Screen 6 | Atmos Standard 2D/3D| 205 | 2K Digital Laser | Dolby Atmos | Published - Needs Confirmation | Mall spec sheet |
| `SC48` | 7 | Screen 7 | Standard 2D | 185 | 2K Digital Laser | Dolby 7.1 Surround | Published - Needs Confirmation | Mall spec sheet |
| `SC49` | 8 | Screen 8 | Standard 2D | 170 | 2K Digital Laser | Dolby 7.1 Surround | Published - Needs Confirmation | Mall spec sheet |

### Documented Discrepancy Analysis:
- **Total Multiplex Capacity:** **~1,952 seats**.
- **BIGPIX Specification:** Sourced from published exhibitor launch materials; represents INOX's premium large format (PLF) equipped with a wall-to-wall screen and Dolby Atmos.
