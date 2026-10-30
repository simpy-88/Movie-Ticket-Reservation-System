// ============================================================================
// MOVIE TICKET RESERVATION SYSTEM (MTRS)
// File: assets/posters.js
// Description: Centralized Movie Poster & Cinematic Backdrop Asset Management
// Sourced from verified TMDb CDN endpoints, custom local artwork, and bundled SVGs.
// ============================================================================

(function () {
    'use strict';

    // ------------------------------------------------------------------------
    // VERIFIED POSTER & BACKDROP REGISTRY
    // TMDb Direct CDN URL structure: https://image.tmdb.org/t/p/{size}/{file_path}
    // Sizes: w500 (cards), w780 (detail), w1280 (hero backdrops), original
    // ------------------------------------------------------------------------
    const POSTER_REGISTRY = {
        'M01': {
            id: 'M01',
            title: 'Superman',
            alternateTitles: ['Superman: Legacy', 'Superman (2025)'],
            year: 2025,
            tmdbId: 1061474,
            director: 'James Gunn',
            customPoster: '',   // Portrait override (e.g., 'assets/custom-posters/superman.jpg')
            customBackdrop: '', // Landscape hero override (e.g., 'assets/backdrops/superman-hero.jpg')
            posterUrl: 'https://image.tmdb.org/t/p/w500/ldyfo0BKmz5rWtJJKCvwaNS4cJT.jpg',
            posterHiRes: 'https://image.tmdb.org/t/p/w780/ldyfo0BKmz5rWtJJKCvwaNS4cJT.jpg',
            backdropUrl: 'https://image.tmdb.org/t/p/w1280/eGX66zonvc4bXg3rM08RUxdYSDx.jpg',
            sourcePage: 'https://www.themoviedb.org/movie/1061474-superman',
            attribution: 'TMDb / Warner Bros. Pictures / DC Studios',
            verificationStatus: 'Verified',
            fallbackSvg: `<svg viewBox="0 0 300 450" xmlns="http://www.w3.org/2000/svg" class="movie-svg-poster">
                <defs>
                    <linearGradient id="sup-bg" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="#080e1c"/><stop offset="50%" stop-color="#111c38"/><stop offset="100%" stop-color="#070a12"/>
                    </linearGradient>
                    <linearGradient id="sup-shield" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="#FFD700"/><stop offset="50%" stop-color="#E50914"/><stop offset="100%" stop-color="#800000"/>
                    </linearGradient>
                    <radialGradient id="sup-glow" cx="50%" cy="40%" r="50%">
                        <stop offset="0%" stop-color="rgba(255, 77, 77, 0.4)"/><stop offset="100%" stop-color="rgba(0,0,0,0)"/>
                    </radialGradient>
                </defs>
                <rect width="300" height="450" fill="url(#sup-bg)"/>
                <circle cx="150" cy="180" r="130" fill="url(#sup-glow)"/>
                <polygon points="150,110 215,145 190,210 150,240 110,210 85,145" fill="#1a1a2e" stroke="url(#sup-shield)" stroke-width="5"/>
                <path d="M185 138 C175 125 150 125 135 138 C122 149 125 165 140 172 L160 180 C178 188 182 202 172 215 C160 230 135 228 120 218 L125 205 C136 214 155 218 162 208 C168 200 164 192 152 185 L133 178 C115 170 110 152 122 138 C138 120 170 118 190 132 Z" fill="#FFD700"/>
                <path d="M0 380 Q75 360 150 385 T300 380 L300 450 L0 450 Z" fill="#060913"/>
                <text x="150" y="380" font-family="'Outfit', sans-serif" font-weight="900" font-size="28" fill="#FFFFFF" text-anchor="middle" letter-spacing="4">SUPERMAN</text>
                <text x="150" y="405" font-family="'Outfit', sans-serif" font-weight="600" font-size="13" fill="#E50914" text-anchor="middle" letter-spacing="6">2025 THEATRICAL</text>
                <text x="150" y="430" font-family="sans-serif" font-size="9" fill="#8892b0" text-anchor="middle" letter-spacing="2">IN IMAX 3D &amp; 2D</text>
            </svg>`
        },
        'M02': {
            id: 'M02',
            title: 'Heat',
            alternateTitles: ['Heat (1995)'],
            year: 1995,
            tmdbId: 949,
            director: 'Michael Mann',
            customPoster: '',
            customBackdrop: '',
            posterUrl: 'https://a.ltrbxd.com/resized/film-poster/5/1/9/9/4/51994-heat-0-2000-0-3000-crop.jpg?v=54dce97dc6',
            posterHiRes: 'https://a.ltrbxd.com/resized/film-poster/5/1/9/9/4/51994-heat-0-2000-0-3000-crop.jpg?v=54dce97dc6',
            backdropUrl: 'https://image.tmdb.org/t/p/w1280/eSVvx8xys2NuFhl8fevXt41wX7v.jpg',
            sourcePage: 'https://letterboxd.com/film/heat/',
            attribution: 'Letterboxd / Warner Bros. / Regency Enterprises',
            verificationStatus: 'Verified',
            fallbackSvg: `<svg viewBox="0 0 300 450" xmlns="http://www.w3.org/2000/svg" class="movie-svg-poster">
                <defs>
                    <linearGradient id="heat-bg" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stop-color="#080e14"/><stop offset="50%" stop-color="#0d1b2a"/><stop offset="100%" stop-color="#05080c"/>
                    </linearGradient>
                    <radialGradient id="heat-blue" cx="50%" cy="35%" r="50%">
                        <stop offset="0%" stop-color="rgba(0, 229, 255, 0.35)"/><stop offset="100%" stop-color="transparent"/>
                    </radialGradient>
                </defs>
                <rect width="300" height="450" fill="url(#heat-bg)"/>
                <circle cx="150" cy="180" r="140" fill="url(#heat-blue)"/>
                <rect x="70" y="140" width="30" height="180" fill="#0c1825"/>
                <rect x="110" y="100" width="40" height="220" fill="#132338"/>
                <rect x="160" y="120" width="35" height="200" fill="#0e1d2e"/>
                <rect x="205" y="160" width="30" height="160" fill="#0a1520"/>
                <line x1="0" y1="280" x2="300" y2="280" stroke="#00E5FF" stroke-width="2" opacity="0.6"/>
                <rect y="330" width="300" height="120" fill="#040608"/>
                <text x="150" y="375" font-family="'Outfit', sans-serif" font-weight="900" font-size="38" fill="#FFFFFF" text-anchor="middle" letter-spacing="8">HEAT</text>
                <text x="150" y="402" font-family="'Outfit', sans-serif" font-weight="600" font-size="11" fill="#00E5FF" text-anchor="middle" letter-spacing="4">AL PACINO • ROBERT DE NIRO</text>
                <text x="150" y="425" font-family="sans-serif" font-size="9" fill="#64748B" text-anchor="middle" letter-spacing="2">A MICHAEL MANN FILM</text>
            </svg>`
        },
        'M03': {
            id: 'M03',
            title: 'La La Land',
            alternateTitles: ['La La Land (2016)'],
            year: 2016,
            tmdbId: 313369,
            director: 'Damien Chazelle',
            customPoster: '',
            customBackdrop: '',
            posterUrl: 'https://image.tmdb.org/t/p/w500/uDO8zWDhfWwoFdKS4fzkUJt0Rf0.jpg',
            posterHiRes: 'https://image.tmdb.org/t/p/w780/uDO8zWDhfWwoFdKS4fzkUJt0Rf0.jpg',
            backdropUrl: 'https://image.tmdb.org/t/p/w1280/nlPCdZlHtRNcF6C9hzUH4ebmV1w.jpg',
            sourcePage: 'https://www.themoviedb.org/movie/313369-la-la-land',
            attribution: 'TMDb / Summit Entertainment / Lionsgate',
            verificationStatus: 'Verified',
            fallbackSvg: `<svg viewBox="0 0 300 450" xmlns="http://www.w3.org/2000/svg" class="movie-svg-poster">
                <defs>
                    <linearGradient id="lala-bg" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stop-color="#0a0520"/><stop offset="40%" stop-color="#181342"/><stop offset="80%" stop-color="#3d1d4f"/><stop offset="100%" stop-color="#060312"/>
                    </linearGradient>
                </defs>
                <rect width="300" height="450" fill="url(#lala-bg)"/>
                <circle cx="210" cy="90" r="32" fill="#FFE57F" opacity="0.85"/>
                <path d="M0 320 Q150 280 300 310 L300 450 L0 450 Z" fill="#080414"/>
                <text x="150" y="375" font-family="'Outfit', sans-serif" font-weight="900" font-size="30" fill="#FFFFFF" text-anchor="middle" letter-spacing="5">LA LA LAND</text>
                <text x="150" y="402" font-family="'Outfit', sans-serif" font-weight="600" font-size="11" fill="#FFE57F" text-anchor="middle" letter-spacing="4">RYAN GOSLING • EMMA STONE</text>
                <text x="150" y="426" font-family="sans-serif" font-size="9" fill="#A78BFA" text-anchor="middle" letter-spacing="2">WINNER OF 6 ACADEMY AWARDS</text>
            </svg>`
        },
        'M04': {
            id: 'M04',
            title: 'The Odyssey',
            alternateTitles: ['Interstellar', 'The Odyssey (2026)', 'Interstellar (2014)'],
            year: 2026,
            director: 'Christopher Nolan',
            customPoster: 'assets/custom-posters/the-odyssey-2026.svg',
            customBackdrop: '',
            posterUrl: 'https://upload.wikimedia.org/wikipedia/en/9/90/The_Odyssey_%282026_film%29_poster.jpg',
            posterHiRes: 'https://image.tmdb.org/t/p/w780/gEU2QniE6E77NI6lCU6MxlWBvIx.jpg', // Interstellar alternate verified CDN
            backdropUrl: 'https://image.tmdb.org/t/p/w1280/rAiYTfKGqDCRIIqo664sY9XZIvQ.jpg', // Epic 70mm Nolan space backdrop
            sourcePage: 'https://letterboxd.com/film/the-odyssey-2026/',
            attribution: 'Universal Pictures / Syncopy Films / Letterboxd / TMDb',
            verificationStatus: 'Verified',
            fallbackSvg: `<svg viewBox="0 0 300 450" xmlns="http://www.w3.org/2000/svg" class="movie-svg-poster">
                <defs>
                    <radialGradient id="ody-space" cx="50%" cy="40%" r="60%">
                        <stop offset="0%" stop-color="#02040a"/><stop offset="60%" stop-color="#091428"/><stop offset="100%" stop-color="#020306"/>
                    </radialGradient>
                    <linearGradient id="ody-ring" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="#FFD700"/><stop offset="50%" stop-color="#00E5FF"/><stop offset="100%" stop-color="#1E3A8A"/>
                    </linearGradient>
                </defs>
                <rect width="300" height="450" fill="url(#ody-space)"/>
                <ellipse cx="150" cy="180" rx="110" ry="24" fill="none" stroke="url(#ody-ring)" stroke-width="3" transform="rotate(-15 150 180)"/>
                <circle cx="150" cy="180" r="46" fill="#000000" stroke="#00E5FF" stroke-width="1"/>
                <rect y="330" width="300" height="120" fill="#03060c"/>
                <text x="150" y="355" font-family="'Outfit', sans-serif" font-weight="700" font-size="10" fill="#94A3B8" text-anchor="middle" letter-spacing="4">CHRISTOPHER NOLAN</text>
                <text x="150" y="385" font-family="'Outfit', sans-serif" font-weight="900" font-size="26" fill="#FFFFFF" text-anchor="middle" letter-spacing="6">THE ODYSSEY</text>
                <text x="150" y="410" font-family="'Outfit', sans-serif" font-weight="600" font-size="11" fill="#00E5FF" text-anchor="middle" letter-spacing="4">IN IMAX 70MM FILM</text>
            </svg>`
        },
        'M05': {
            id: 'M05',
            title: 'Dune: Part Three',
            alternateTitles: ['Dune: Part Two', 'Dune', 'Dune 3'],
            year: 2026,
            tmdbId: 693134,
            director: 'Denis Villeneuve',
            customPoster: '',
            customBackdrop: '',
            posterUrl: 'https://a.ltrbxd.com/resized/film-poster/1/0/5/7/4/6/1/1057461-dune-part-three-0-2000-0-3000-crop.jpg?v=f577c5b9e7',
            posterHiRes: 'https://a.ltrbxd.com/resized/film-poster/1/0/5/7/4/6/1/1057461-dune-part-three-0-2000-0-3000-crop.jpg?v=f577c5b9e7',
            backdropUrl: 'https://image.tmdb.org/t/p/w1280/eZ239CUp1d6OryZEBPnO2n87gMG.jpg',
            sourcePage: 'https://letterboxd.com/film/dune-part-three/',
            attribution: 'Letterboxd / Legendary Pictures / Warner Bros.',
            verificationStatus: 'Verified',
            fallbackSvg: `<svg viewBox="0 0 300 450" xmlns="http://www.w3.org/2000/svg" class="movie-svg-poster">
                <defs>
                    <linearGradient id="dune-sky" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stop-color="#140a05"/><stop offset="50%" stop-color="#3b1d0c"/><stop offset="100%" stop-color="#0a0503"/>
                    </linearGradient>
                </defs>
                <rect width="300" height="450" fill="url(#dune-sky)"/>
                <circle cx="150" cy="140" r="50" fill="#FF7B00" opacity="0.75"/>
                <circle cx="195" cy="115" r="22" fill="#FFAA00" opacity="0.6"/>
                <path d="M0 240 Q90 190 170 230 T300 200 L300 450 L0 450 Z" fill="#662d0f"/>
                <path d="M0 280 Q100 250 200 280 T300 260 L300 450 L0 450 Z" fill="#3d1806"/>
                <text x="150" y="375" font-family="'Outfit', sans-serif" font-weight="900" font-size="34" fill="#FFFFFF" text-anchor="middle" letter-spacing="8">DUNE</text>
                <text x="150" y="402" font-family="'Outfit', sans-serif" font-weight="600" font-size="12" fill="#FF7B00" text-anchor="middle" letter-spacing="5">PART THREE</text>
                <text x="150" y="426" font-family="sans-serif" font-size="9" fill="#CBD5E1" text-anchor="middle" letter-spacing="3">LONG LIVE THE FIGHTERS</text>
            </svg>`
        },
        'M06': {
            id: 'M06',
            title: 'Avengers: Doomsday',
            alternateTitles: ['Avengers:Doomsday', 'Kantara: Chapter 1', 'Avengers 5'],
            year: 2026,
            tmdbId: 1003596,
            director: 'Anthony & Joe Russo',
            customPoster: '',
            customBackdrop: '',
            posterUrl: 'https://a.ltrbxd.com/resized/film-poster/9/0/3/8/8/9/903889-avengers-doomsday-0-2000-0-3000-crop.jpg?v=fbbc8d1f4f',
            posterHiRes: 'https://a.ltrbxd.com/resized/film-poster/9/0/3/8/8/9/903889-avengers-doomsday-0-2000-0-3000-crop.jpg?v=fbbc8d1f4f',
            backdropUrl: 'https://image.tmdb.org/t/p/w1280/rObL4of4eFA8yWaN9pRFo9aOVNi.jpg',
            sourcePage: 'https://letterboxd.com/film/avengers-doomsday/',
            attribution: 'Letterboxd / Marvel Studios / Walt Disney Studios',
            verificationStatus: 'Verified',
            fallbackSvg: `<svg viewBox="0 0 300 450" xmlns="http://www.w3.org/2000/svg" class="movie-svg-poster">
                <defs>
                    <radialGradient id="av-bg" cx="50%" cy="40%" r="65%">
                        <stop offset="0%" stop-color="#021c10"/><stop offset="60%" stop-color="#062e1c"/><stop offset="100%" stop-color="#020805"/>
                    </radialGradient>
                </defs>
                <rect width="300" height="450" fill="url(#av-bg)"/>
                <circle cx="150" cy="180" r="100" fill="rgba(16, 185, 129, 0.25)"/>
                <path d="M110 140 C125 110 175 110 190 140 C205 180 195 240 150 260 C105 240 95 180 110 140 Z" fill="#044728" stroke="#10B981" stroke-width="2"/>
                <text x="150" y="370" font-family="'Outfit', sans-serif" font-weight="900" font-size="28" fill="#FFFFFF" text-anchor="middle" letter-spacing="4">AVENGERS</text>
                <text x="150" y="398" font-family="'Outfit', sans-serif" font-weight="800" font-size="16" fill="#10B981" text-anchor="middle" letter-spacing="6">DOOMSDAY</text>
                <text x="150" y="424" font-family="sans-serif" font-size="9" fill="#94A3B8" text-anchor="middle" letter-spacing="2">DECEMBER 2026 IN CINEMAS</text>
            </svg>`
        }
    };

    // ------------------------------------------------------------------------
    // CENTRAL POSTER & CINEMATIC BACKDROP RESOLUTION ENGINE
    // Independent pipelines for:
    // 1. Posters (portrait, catalogue cards)
    // 2. Backdrops (landscape, cinematic hero background)
    // ------------------------------------------------------------------------
    class PosterManager {
        constructor() {
            this.registry = POSTER_REGISTRY;
            this.customOverrides = {};
            this.loadOverrides();
        }

        loadOverrides() {
            try {
                const stored = localStorage.getItem('MTRS_POSTER_OVERRIDES');
                if (stored) {
                    this.customOverrides = JSON.parse(stored) || {};
                }
            } catch (e) {
                console.warn('Failed to load custom poster overrides:', e);
                this.customOverrides = {};
            }
        }

        saveOverrides() {
            try {
                localStorage.setItem('MTRS_POSTER_OVERRIDES', JSON.stringify(this.customOverrides));
            } catch (e) {
                console.warn('Failed to persist custom poster overrides:', e);
            }
        }

        /**
         * Resolves the registry record by movie object or identifier (supports title fuzzy search)
         */
        findRecord(movieOrId) {
            if (!movieOrId) return null;
            const id = typeof movieOrId === 'string' ? movieOrId : (movieOrId.Movie_ID || movieOrId.movie_id);
            if (id && this.registry[id]) return this.registry[id];

            // Title-based fuzzy fallback if ID does not match directly
            const queryName = typeof movieOrId === 'string' ? movieOrId : (movieOrId.Movie_Name || movieOrId.movie_name || '');
            if (queryName) {
                const cleanName = queryName.toLowerCase().trim();
                for (const key of Object.keys(this.registry)) {
                    const rec = this.registry[key];
                    if (rec.title && rec.title.toLowerCase() === cleanName) return rec;
                    if (rec.alternateTitles && rec.alternateTitles.some(t => t.toLowerCase() === cleanName)) {
                        return rec;
                    }
                }
            }
            return null;
        }

        /**
         * Extracts normalized { poster: string|null, backdrop: string|null } overrides
         * with seamless backward compatibility for legacy string values and key prefixes.
         */
        getCustomOverrides(movieOrId) {
            const movieId = typeof movieOrId === 'string' ? movieOrId : (movieOrId ? (movieOrId.Movie_ID || movieOrId.movie_id) : '');
            let poster = null;
            let backdrop = null;

            if (movieId && this.customOverrides) {
                const entry = this.customOverrides[movieId];
                if (typeof entry === 'string' && entry.trim() !== '') {
                    // Backward-compatible: older releases stored a single string which was always the poster override
                    poster = entry.trim();
                } else if (entry && typeof entry === 'object') {
                    if (typeof entry.poster === 'string' && entry.poster.trim() !== '') {
                        poster = entry.poster.trim();
                    }
                    if (typeof entry.backdrop === 'string' && entry.backdrop.trim() !== '') {
                        backdrop = entry.backdrop.trim();
                    }
                }

                // Check flat key variants if present
                if (!poster && this.customOverrides[`poster_${movieId}`]) {
                    poster = String(this.customOverrides[`poster_${movieId}`]).trim();
                }
                if (!backdrop && this.customOverrides[`backdrop_${movieId}`]) {
                    backdrop = String(this.customOverrides[`backdrop_${movieId}`]).trim();
                }
            }

            // Fallback to static POSTER_REGISTRY custom fields if not set in localStorage
            const rec = this.findRecord(movieOrId);
            if (!poster && rec && rec.customPoster && typeof rec.customPoster === 'string' && rec.customPoster.trim() !== '') {
                poster = rec.customPoster.trim();
            }
            if (!backdrop && rec && rec.customBackdrop && typeof rec.customBackdrop === 'string' && rec.customBackdrop.trim() !== '') {
                backdrop = rec.customBackdrop.trim();
            }

            // Check custom properties on the movie object if provided
            if (typeof movieOrId === 'object' && movieOrId) {
                const candPoster = movieOrId.Custom_Poster_URL || movieOrId.Custom_Poster_Url || movieOrId.custom_poster_url;
                if (!poster && candPoster && typeof candPoster === 'string' && candPoster.trim() !== '') {
                    poster = candPoster.trim();
                }
                const candBackdrop = movieOrId.Custom_Backdrop_URL || movieOrId.Custom_Backdrop_Url || movieOrId.custom_backdrop_url;
                if (!backdrop && candBackdrop && typeof candBackdrop === 'string' && candBackdrop.trim() !== '') {
                    backdrop = candBackdrop.trim();
                }
            }

            return { poster, backdrop };
        }

        /**
         * Resolves only custom poster override (null if none configured)
         */
        getCustomPoster(movieOrId) {
            return this.getCustomOverrides(movieOrId).poster;
        }

        /**
         * Resolves only custom backdrop override (null if none configured)
         */
        getCustomBackdrop(movieOrId) {
            return this.getCustomOverrides(movieOrId).backdrop;
        }

        /**
         * Sets or clears a custom poster override without touching the backdrop
         */
        setCustomPoster(movieId, customPath) {
            if (!movieId) return;
            const id = String(movieId).trim();
            const currentBackdrop = this.getCustomBackdrop(id);
            const cleanPoster = (customPath && typeof customPath === 'string') ? customPath.trim() : '';

            if (cleanPoster) {
                if (currentBackdrop) {
                    this.customOverrides[id] = { poster: cleanPoster, backdrop: currentBackdrop };
                } else {
                    // Backward-compatible string format if only poster is set
                    this.customOverrides[id] = cleanPoster;
                }
            } else {
                if (currentBackdrop) {
                    this.customOverrides[id] = { poster: null, backdrop: currentBackdrop };
                } else {
                    delete this.customOverrides[id];
                }
            }

            delete this.customOverrides[`poster_${id}`];
            this.saveOverrides();
        }

        /**
         * Sets or clears a custom backdrop override without touching the poster
         */
        setCustomBackdrop(movieId, customPath) {
            if (!movieId) return;
            const id = String(movieId).trim();
            const currentPoster = this.getCustomPoster(id);
            const cleanBackdrop = (customPath && typeof customPath === 'string') ? customPath.trim() : '';

            if (cleanBackdrop) {
                this.customOverrides[id] = {
                    poster: currentPoster || null,
                    backdrop: cleanBackdrop
                };
            } else {
                if (currentPoster) {
                    this.customOverrides[id] = currentPoster;
                } else {
                    delete this.customOverrides[id];
                }
            }

            delete this.customOverrides[`backdrop_${id}`];
            this.saveOverrides();
        }

        /**
         * Programmatically set poster and/or backdrop overrides simultaneously
         */
        setMovieOverrides(movieId, overrides = {}) {
            if (!movieId) return;
            const id = String(movieId).trim();
            const current = this.getCustomOverrides(id);

            const newPoster = (overrides.poster !== undefined) ?
                (overrides.poster ? String(overrides.poster).trim() : null) : current.poster;
            const newBackdrop = (overrides.backdrop !== undefined) ?
                (overrides.backdrop ? String(overrides.backdrop).trim() : null) : current.backdrop;

            if (newPoster && newBackdrop) {
                this.customOverrides[id] = { poster: newPoster, backdrop: newBackdrop };
            } else if (newBackdrop) {
                this.customOverrides[id] = { poster: null, backdrop: newBackdrop };
            } else if (newPoster) {
                this.customOverrides[id] = newPoster;
            } else {
                delete this.customOverrides[id];
            }

            delete this.customOverrides[`poster_${id}`];
            delete this.customOverrides[`backdrop_${id}`];
            this.saveOverrides();
        }

        /**
         * Resolves portrait poster URL for catalogue cards & detail modals.
         * Enforces strict priority order per specification:
         * 1. Valid uploaded Supabase artwork URL from the movie record.
         * 2. Existing custom artwork override (localStorage or IndexedDB store).
         * 3. Existing movie registry/CDN artwork.
         * 4. Existing fallback SVG.
         */
        resolvePoster(movieOrId, options = {}) {
            const size = options.size || 'w780';
            const rec = this.findRecord(movieOrId);
            const movieId = typeof movieOrId === 'string' ? movieOrId : (movieOrId ? (movieOrId.Movie_ID || movieOrId.movie_id) : '');

            // ----------------------------------------------------------------
            // Priority 1: Valid uploaded Supabase artwork URL from the movie record
            // ----------------------------------------------------------------
            // (a) From movie object passed directly
            if (typeof movieOrId === 'object' && movieOrId) {
                const candHires = movieOrId.Poster_Hires_Url || movieOrId.poster_hires_url;
                const candStd = movieOrId.Poster_Url || movieOrId.Poster_URL || movieOrId.poster_url;
                const cand = (size === 'w780' && candHires) ? candHires : (candStd || candHires);
                if (cand && typeof cand === 'string' && cand.trim() !== '') {
                    return cand.trim();
                }
            }

            // (b) From loaded Supabase live catalogue (App.movies or MTRSEngine)
            if (movieId) {
                let liveMovie = null;
                if (window.App && Array.isArray(window.App.movies)) {
                    liveMovie = window.App.movies.find(m => (m.Movie_ID || m.movie_id) === movieId);
                }
                if (!liveMovie && window.MTRSEngine && typeof window.MTRSEngine.getTable === 'function') {
                    try {
                        const dbMovies = window.MTRSEngine.getTable('MOVIE');
                        if (Array.isArray(dbMovies)) {
                            liveMovie = dbMovies.find(m => (m.Movie_ID || m.movie_id) === movieId);
                        }
                    } catch (e) { }
                }

                if (liveMovie) {
                    const candHires = liveMovie.Poster_Hires_Url || liveMovie.poster_hires_url;
                    const candStd = liveMovie.Poster_Url || liveMovie.Poster_URL || liveMovie.poster_url;
                    const cand = (size === 'w780' && candHires) ? candHires : (candStd || candHires);
                    if (cand && typeof cand === 'string' && cand.trim() !== '') {
                        return cand.trim();
                    }
                }
            }

            // ----------------------------------------------------------------
            // Priority 2: Existing custom artwork override
            // ----------------------------------------------------------------
            // (a) Local storage override or static customPoster definition
            const customPoster = this.getCustomPoster(movieOrId);
            if (customPoster && typeof customPoster === 'string' && customPoster.trim() !== '') {
                return customPoster.trim();
            }

            // (b) IndexedDB persistent image store (local browser cache / staging fallback)
            if (movieId && window.MTRSImageStore && typeof window.MTRSImageStore.getPosterUrl === 'function') {
                const uploadedUrl = window.MTRSImageStore.getPosterUrl(movieId);
                if (uploadedUrl && typeof uploadedUrl === 'string' && uploadedUrl.trim() !== '') {
                    return uploadedUrl.trim();
                }
            }

            // ----------------------------------------------------------------
            // Priority 3: Existing movie registry/CDN artwork
            // ----------------------------------------------------------------
            if (rec) {
                if (size === 'w780' && rec.posterHiRes) return rec.posterHiRes;
                if (rec.posterHiRes) return rec.posterHiRes;
                if (rec.posterUrl) return rec.posterUrl;
            }

            // ----------------------------------------------------------------
            // Priority 4: Existing fallback SVG (null returned, rendered by renderPosterHtml)
            // ----------------------------------------------------------------
            return null;
        }

        /**
         * Resolves widescreen backdrop URL for Hero section.
         * Enforces strict priority order per specification:
         * 1. Valid uploaded Supabase artwork URL from the movie record.
         * 2. Existing custom artwork override (localStorage or IndexedDB store).
         * 3. Existing movie registry/CDN artwork.
         * 4. Existing fallback SVG.
         */
        resolveBackdrop(movieOrId, options = {}) {
            const size = options.size || 'w1280';
            const rec = this.findRecord(movieOrId);
            const movieId = typeof movieOrId === 'string' ? movieOrId : (movieOrId ? (movieOrId.Movie_ID || movieOrId.movie_id) : '');

            // ----------------------------------------------------------------
            // Priority 1: Valid uploaded Supabase artwork URL from the movie record
            // ----------------------------------------------------------------
            // (a) From movie object passed directly
            if (typeof movieOrId === 'object' && movieOrId) {
                const cand = movieOrId.Backdrop_Url || movieOrId.backdrop_url || movieOrId.Backdrop_URL;
                if (cand && typeof cand === 'string' && cand.trim() !== '') {
                    return cand.trim();
                }
            }

            // (b) From loaded Supabase live catalogue (App.movies or MTRSEngine)
            if (movieId) {
                let liveMovie = null;
                if (window.App && Array.isArray(window.App.movies)) {
                    liveMovie = window.App.movies.find(m => (m.Movie_ID || m.movie_id) === movieId);
                }
                if (!liveMovie && window.MTRSEngine && typeof window.MTRSEngine.getTable === 'function') {
                    try {
                        const dbMovies = window.MTRSEngine.getTable('MOVIE');
                        if (Array.isArray(dbMovies)) {
                            liveMovie = dbMovies.find(m => (m.Movie_ID || m.movie_id) === movieId);
                        }
                    } catch (e) { }
                }

                if (liveMovie) {
                    const cand = liveMovie.Backdrop_Url || liveMovie.backdrop_url || liveMovie.Backdrop_URL;
                    if (cand && typeof cand === 'string' && cand.trim() !== '') {
                        return cand.trim();
                    }
                }
            }

            // ----------------------------------------------------------------
            // Priority 2: Existing custom artwork override
            // ----------------------------------------------------------------
            // (a) Local storage override or static customBackdrop definition
            const customBackdrop = this.getCustomBackdrop(movieOrId);
            if (customBackdrop && typeof customBackdrop === 'string' && customBackdrop.trim() !== '') {
                return customBackdrop.trim();
            }

            // (b) IndexedDB persistent image store (local browser cache / staging fallback)
            if (movieId && window.MTRSImageStore && typeof window.MTRSImageStore.getBackdropUrl === 'function') {
                const uploadedUrl = window.MTRSImageStore.getBackdropUrl(movieId);
                if (uploadedUrl && typeof uploadedUrl === 'string' && uploadedUrl.trim() !== '') {
                    return uploadedUrl.trim();
                }
            }

            // ----------------------------------------------------------------
            // Priority 3: Existing movie registry/CDN artwork
            // ----------------------------------------------------------------
            if (rec && rec.backdropUrl && typeof rec.backdropUrl === 'string' && rec.backdropUrl.trim() !== '') {
                if (size === 'original') {
                    return rec.backdropUrl.replace('/w1280/', '/original/');
                }
                return rec.backdropUrl.trim();
            }

            // ----------------------------------------------------------------
            // Priority 4: Existing fallback SVG / non-distorted aspect-ratio fallback
            // ----------------------------------------------------------------
            if (rec && rec.fallbackBackdropSvg) {
                return rec.fallbackBackdropSvg;
            }
            if (rec && rec.posterHiRes) {
                return rec.posterHiRes;
            }
            if (typeof movieOrId === 'object' && movieOrId && (movieOrId.Poster_Hires_Url || movieOrId.Poster_Url)) {
                return (movieOrId.Poster_Hires_Url || movieOrId.Poster_Url).trim();
            }

            const movieTitle = (typeof movieOrId === 'object' && (movieOrId.Movie_Name || movieOrId.movie_name)) ?
                (movieOrId.Movie_Name || movieOrId.movie_name) : (rec ? rec.title : 'Featured Movie');
            return this.generateDynamicBackdropSvg(movieTitle);
        }

        /**
         * Generates a bulletproof <img> HTML element with lazy loading and instant SVG fallback
         */
        renderPosterHtml(movieOrId, className = 'movie-poster-img', altText = '') {
            const rec = this.findRecord(movieOrId);
            const posterUrl = this.resolvePoster(movieOrId, { size: 'w780' });
            const movieTitle = (typeof movieOrId === 'object' && (movieOrId.Movie_Name || movieOrId.movie_name)) ?
                (movieOrId.Movie_Name || movieOrId.movie_name) : (rec ? rec.title : 'Movie Poster');
            const alt = altText || `${movieTitle} Theatrical Poster`;
            const fallbackSvg = rec ? rec.fallbackSvg : this.generateDynamicSvg(movieTitle);

            if (posterUrl) {
                return `
                    <img 
                        src="${posterUrl}" 
                        alt="${alt}" 
                        class="${className}" 
                        loading="eager"
                        decoding="async"
                        referrerpolicy="no-referrer"
                        onerror="this.style.display='none'; if(this.nextElementSibling) this.nextElementSibling.style.display='block';"
                    />
                    <div class="poster-svg-fallback" style="display:none; width:100%; height:100%;">
                        ${fallbackSvg}
                    </div>
                `;
            }

            return fallbackSvg;
        }

        /**
         * Generates dynamic vector SVG poster when no registry or URL is available
         */
        generateDynamicSvg(title = 'Now Screening') {
            const cleanTitle = (title || 'Cinema').substring(0, 22).replace(/[<>&"]/g, '');
            return `<svg viewBox="0 0 300 450" xmlns="http://www.w3.org/2000/svg" class="movie-svg-poster">
                <defs>
                    <linearGradient id="dyn-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="#0F172A"/><stop offset="50%" stop-color="#1E1B4B"/><stop offset="100%" stop-color="#020617"/>
                    </linearGradient>
                </defs>
                <rect width="300" height="450" fill="url(#dyn-grad)"/>
                <circle cx="150" cy="180" r="100" fill="rgba(0, 229, 255, 0.12)"/>
                <circle cx="150" cy="180" r="45" fill="none" stroke="#00E5FF" stroke-width="2"/>
                <polygon points="144,162 165,180 144,198" fill="#00E5FF"/>
                <rect y="330" width="300" height="120" fill="rgba(5, 8, 16, 0.95)"/>
                <text x="150" y="370" font-family="'Outfit', sans-serif" font-weight="900" font-size="20" fill="#FFFFFF" text-anchor="middle">${cleanTitle}</text>
                <text x="150" y="398" font-family="'Outfit', sans-serif" font-weight="700" font-size="11" fill="#00E5FF" text-anchor="middle" letter-spacing="3">CHENNAI PREMIER</text>
                <text x="150" y="424" font-family="sans-serif" font-size="9" fill="#94A3B8" text-anchor="middle" letter-spacing="2">MTRS CINEMAS</text>
            </svg>`;
        }

        /**
         * Generates dynamic 16:9 widescreen SVG backdrop data URI for hero background
         */
        generateDynamicBackdropSvg(title = 'Featured Movie') {
            const cleanTitle = (title || 'Cinema').substring(0, 32).replace(/[<>&"]/g, '');
            const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" width="1280" height="720">
                <defs>
                    <linearGradient id="dyn-bd-bg" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="#080b12"/>
                        <stop offset="50%" stop-color="#0f172a"/>
                        <stop offset="100%" stop-color="#04060a"/>
                    </linearGradient>
                    <radialGradient id="dyn-bd-glow" cx="60%" cy="40%" r="65%">
                        <stop offset="0%" stop-color="rgba(0, 229, 255, 0.2)"/>
                        <stop offset="50%" stop-color="rgba(229, 9, 20, 0.08)"/>
                        <stop offset="100%" stop-color="transparent"/>
                    </radialGradient>
                    <pattern id="dyn-bd-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
                    </pattern>
                </defs>
                <rect width="1280" height="720" fill="url(#dyn-bd-bg)"/>
                <rect width="1280" height="720" fill="url(#dyn-bd-grid)"/>
                <rect width="1280" height="720" fill="url(#dyn-bd-glow)"/>
                <circle cx="850" cy="340" r="160" fill="none" stroke="rgba(0, 229, 255, 0.15)" stroke-width="2"/>
                <circle cx="850" cy="340" r="120" fill="none" stroke="rgba(229, 9, 20, 0.15)" stroke-width="2"/>
                <line x1="0" y1="620" x2="1280" y2="620" stroke="rgba(0, 229, 255, 0.4)" stroke-width="2"/>
                <text x="640" y="340" font-family="'Outfit', sans-serif" font-weight="900" font-size="44" fill="#FFFFFF" text-anchor="middle" letter-spacing="6">${cleanTitle}</text>
                <text x="640" y="385" font-family="'Outfit', sans-serif" font-weight="600" font-size="14" fill="#00E5FF" text-anchor="middle" letter-spacing="6">CINEMATIC PREMIER • MTRS EXCLUSIVE</text>
            </svg>`;
            return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
        }

        getRegistry() {
            return this.registry;
        }
    }

    // Instantiate and expose globally
    const manager = new PosterManager();
    window.MTRSPosters = manager;
    window.PosterManager = manager; // Dual alias

    // Backward-compatibility shim for older code calling window.MOVIE_POSTERS
    window.MOVIE_POSTERS = new Proxy({}, {
        get(target, prop) {
            const rec = manager.findRecord(prop);
            if (rec) {
                return {
                    svg: manager.renderPosterHtml(prop)
                };
            }
            return {
                svg: manager.generateDynamicSvg(prop)
            };
        }
    });

})();
