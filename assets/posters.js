// ============================================================================
// MOVIE POSTER ASSETS (Vector SVG Artwork)
// Ultra-crisp, high-definition cinematic posters rendered natively via SVG.
// ============================================================================

const MOVIE_POSTERS = {
    'M01': { // Superman: Legacy
        title: 'Superman: Legacy',
        theme: '#0F2042',
        accent: '#E50914',
        svg: `<svg viewBox="0 0 300 450" xmlns="http://www.w3.org/2000/svg" class="movie-svg-poster">
            <defs>
                <linearGradient id="sup-bg" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#080e1c"/>
                    <stop offset="40%" stop-color="#111c38"/>
                    <stop offset="70%" stop-color="#2d132c"/>
                    <stop offset="100%" stop-color="#070a12"/>
                </linearGradient>
                <linearGradient id="sup-shield" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#FFD700"/>
                    <stop offset="50%" stop-color="#E50914"/>
                    <stop offset="100%" stop-color="#800000"/>
                </linearGradient>
                <radialGradient id="sup-glow" cx="50%" cy="40%" r="50%">
                    <stop offset="0%" stop-color="rgba(255, 77, 77, 0.4)"/>
                    <stop offset="100%" stop-color="rgba(0,0,0,0)"/>
                </radialGradient>
            </defs>
            <rect width="300" height="450" fill="url(#sup-bg)"/>
            <circle cx="150" cy="180" r="140" fill="url(#sup-glow)"/>
            
            <!-- Sun rays -->
            <path d="M150 40 L160 160 L140 160 Z" fill="rgba(255,215,0,0.15)"/>
            <path d="M80 80 L150 170 L135 180 Z" fill="rgba(255,215,0,0.12)"/>
            <path d="M220 80 L165 180 L150 170 Z" fill="rgba(255,215,0,0.12)"/>
            
            <!-- Cape & Silhouette -->
            <path d="M110 200 C80 290 60 380 40 430 L260 430 C240 380 220 290 190 200 Z" fill="#b30000" opacity="0.85"/>
            <path d="M125 170 C110 230 100 320 85 410 L215 410 C200 320 190 230 175 170 Z" fill="#112244"/>

            <!-- S Shield Diamond -->
            <polygon points="150,110 215,145 190,210 150,240 110,210 85,145" fill="#1a1a2e" stroke="url(#sup-shield)" stroke-width="6"/>
            <!-- S Emblem -->
            <path d="M185 138 C175 125 150 125 135 138 C122 149 125 165 140 172 L160 180 C178 188 182 202 172 215 C160 230 135 228 120 218 L125 205 C136 214 155 218 162 208 C168 200 164 192 152 185 L133 178 C115 170 110 152 122 138 C138 120 170 118 190 132 Z" fill="#FFD700"/>
            
            <!-- Clouds & Horizon -->
            <path d="M0 380 Q75 360 150 385 T300 380 L300 450 L0 450 Z" fill="#060913"/>
            
            <!-- Title Typography -->
            <text x="150" y="380" font-family="'Outfit', sans-serif" font-weight="900" font-size="28" fill="#FFFFFF" text-anchor="middle" letter-spacing="4">SUPERMAN</text>
            <text x="150" y="405" font-family="'Outfit', sans-serif" font-weight="600" font-size="14" fill="#E50914" text-anchor="middle" letter-spacing="6">LEGACY</text>
            <text x="150" y="430" font-family="sans-serif" font-size="9" fill="#8892b0" text-anchor="middle" letter-spacing="2">IN IMAX 3D & 2D</text>
        </svg>`
    },
    'M02': { // Heat
        title: 'Heat',
        theme: '#0A1118',
        accent: '#00E5FF',
        svg: `<svg viewBox="0 0 300 450" xmlns="http://www.w3.org/2000/svg" class="movie-svg-poster">
            <defs>
                <linearGradient id="heat-bg" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stop-color="#050a10"/>
                    <stop offset="50%" stop-color="#0c1a29"/>
                    <stop offset="100%" stop-color="#020408"/>
                </linearGradient>
                <linearGradient id="neon-cyan" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stop-color="#00e5ff"/>
                    <stop offset="100%" stop-color="#ffffff"/>
                </linearGradient>
            </defs>
            <rect width="300" height="450" fill="url(#heat-bg)"/>
            
            <!-- LA City Skyline Silhouettes -->
            <rect x="20" y="240" width="30" height="130" fill="#08101a"/>
            <rect x="55" y="210" width="25" height="160" fill="#0b1726"/>
            <rect x="85" y="180" width="40" height="190" fill="#0f2035"/>
            <polygon points="105,150 95,180 115,180" fill="#0f2035"/>
            <rect x="130" y="230" width="35" height="140" fill="#08121f"/>
            <rect x="170" y="195" width="45" height="175" fill="#11253d"/>
            <rect x="220" y="220" width="30" height="150" fill="#0a1524"/>
            <rect x="255" y="250" width="35" height="120" fill="#070e17"/>

            <!-- Window Lights -->
            <circle cx="100" cy="200" r="1.5" fill="#00e5ff" opacity="0.8"/>
            <circle cx="110" cy="220" r="1.5" fill="#ffd700" opacity="0.8"/>
            <circle cx="180" cy="210" r="1.5" fill="#00e5ff" opacity="0.7"/>
            <circle cx="195" cy="240" r="1.5" fill="#ffffff" opacity="0.9"/>
            
            <!-- Crime Noir Street Light Cone -->
            <polygon points="150,60 0,380 300,380" fill="rgba(0, 229, 255, 0.04)"/>
            
            <!-- Duel Silhouettes -->
            <path d="M70 340 L80 310 L90 310 L95 340 Z" fill="#000000"/>
            <path d="M210 340 L218 308 L230 312 L235 340 Z" fill="#000000"/>
            
            <!-- Neon Heat Horizon -->
            <line x1="0" y1="360" x2="300" y2="360" stroke="#00e5ff" stroke-width="2" opacity="0.6"/>
            
            <!-- Typography -->
            <text x="150" y="120" font-family="'Plus Jakarta Sans', sans-serif" font-weight="900" font-size="58" fill="url(#neon-cyan)" text-anchor="middle" letter-spacing="12">HEAT</text>
            <text x="150" y="150" font-family="sans-serif" font-size="10" fill="#8baac7" text-anchor="middle" letter-spacing="4">AL PACINO  •  ROBERT DE NIRO</text>
            
            <rect x="0" y="365" width="300" height="85" fill="#03060a"/>
            <text x="150" y="405" font-family="'Outfit', sans-serif" font-weight="700" font-size="13" fill="#ffffff" text-anchor="middle" letter-spacing="3">A MICHAEL MANN MASTERPIECE</text>
            <text x="150" y="425" font-family="sans-serif" font-size="9" fill="#00e5ff" text-anchor="middle" letter-spacing="2">4K REMASTERED SOUND & DOLBY</text>
        </svg>`
    },
    'M03': { // La La Land
        title: 'La La Land',
        theme: '#1A0E2E',
        accent: '#FFB800',
        svg: `<svg viewBox="0 0 300 450" xmlns="http://www.w3.org/2000/svg" class="movie-svg-poster">
            <defs>
                <linearGradient id="lal-bg" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stop-color="#0d0421"/>
                    <stop offset="45%" stop-color="#2a0d45"/>
                    <stop offset="75%" stop-color="#551a66"/>
                    <stop offset="100%" stop-color="#18072b"/>
                </linearGradient>
                <radialGradient id="twilight-glow" cx="65%" cy="30%" r="50%">
                    <stop offset="0%" stop-color="rgba(255, 184, 0, 0.5)"/>
                    <stop offset="50%" stop-color="rgba(209, 64, 129, 0.3)"/>
                    <stop offset="100%" stop-color="rgba(0,0,0,0)"/>
                </radialGradient>
            </defs>
            <rect width="300" height="450" fill="url(#lal-bg)"/>
            <circle cx="190" cy="140" r="120" fill="url(#twilight-glow)"/>
            
            <!-- Starry Sky -->
            <circle cx="50" cy="50" r="1.5" fill="#fff" opacity="0.9"/>
            <circle cx="90" cy="80" r="1" fill="#fff" opacity="0.8"/>
            <circle cx="140" cy="40" r="2" fill="#ffd700" opacity="0.9"/>
            <circle cx="230" cy="60" r="1.5" fill="#fff" opacity="0.7"/>
            <circle cx="270" cy="110" r="1" fill="#fff" opacity="0.8"/>
            <circle cx="180" cy="70" r="1.5" fill="#fff" opacity="0.9"/>
            
            <!-- Crescent Moon -->
            <path d="M220 50 A 20 20 0 0 0 238 78 A 24 24 0 1 1 220 50 Z" fill="#FFE57F"/>
            
            <!-- Griffith Observatory Hill -->
            <path d="M0 310 Q120 270 300 295 L300 450 L0 450 Z" fill="#0b0317"/>
            
            <!-- Lamppost -->
            <line x1="85" y1="210" x2="85" y2="330" stroke="#FFD54F" stroke-width="3"/>
            <circle cx="85" cy="205" r="7" fill="#FFF59D"/>
            <circle cx="85" cy="205" r="22" fill="rgba(255, 245, 157, 0.25)"/>
            
            <!-- Dancing Silhouette: Sebastian & Mia -->
            <!-- Mia in yellow dress, Seb in suit -->
            <path d="M140 275 C135 255 145 240 152 235 C158 240 162 255 158 275 L168 315 L145 315 Z" fill="#FFC107"/>
            <circle cx="150" cy="226" r="6" fill="#FFC107"/>
            <!-- Sebastian -->
            <path d="M165 270 C165 250 172 238 180 235 C185 240 188 255 185 270 L195 320 L175 320 Z" fill="#FFFFFF"/>
            <circle cx="178" cy="226" r="6" fill="#FFFFFF"/>
            
            <!-- Title -->
            <text x="150" y="375" font-family="'Outfit', serif" font-weight="900" font-size="34" fill="#FFE082" text-anchor="middle" letter-spacing="4">LA LA LAND</text>
            <text x="150" y="402" font-family="sans-serif" font-weight="600" font-size="11" fill="#FFFFFF" text-anchor="middle" letter-spacing="5">RYAN GOSLING • EMMA STONE</text>
            <text x="150" y="425" font-family="sans-serif" font-size="9" fill="#CE93D8" text-anchor="middle" letter-spacing="2">WINNER OF 6 ACADEMY AWARDS</text>
        </svg>`
    },
    'M04': { // Interstellar
        title: 'Interstellar',
        theme: '#040812',
        accent: '#00E5FF',
        svg: `<svg viewBox="0 0 300 450" xmlns="http://www.w3.org/2000/svg" class="movie-svg-poster">
            <defs>
                <linearGradient id="int-bg" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stop-color="#02040a"/>
                    <stop offset="60%" stop-color="#071124"/>
                    <stop offset="100%" stop-color="#000000"/>
                </linearGradient>
                <radialGradient id="gargantua-acc" cx="50%" cy="40%" r="45%">
                    <stop offset="0%" stop-color="#ffffff"/>
                    <stop offset="25%" stop-color="#ffb74d"/>
                    <stop offset="60%" stop-color="#e65100"/>
                    <stop offset="85%" stop-color="#3e1a00"/>
                    <stop offset="100%" stop-color="rgba(0,0,0,0)"/>
                </radialGradient>
            </defs>
            <rect width="300" height="450" fill="url(#int-bg)"/>
            
            <!-- Gargantua Black Hole Accretion Disk -->
            <ellipse cx="150" cy="180" rx="125" ry="40" fill="url(#gargantua-acc)"/>
            <!-- Warp Arc above -->
            <path d="M35 180 C35 90 265 90 265 180" stroke="#ffb74d" stroke-width="12" fill="none" opacity="0.85"/>
            <path d="M50 180 C50 110 250 110 250 180" stroke="#fff" stroke-width="3" fill="none" opacity="0.9"/>
            <!-- Event Horizon Black Sphere -->
            <circle cx="150" cy="180" r="48" fill="#000000"/>
            <ellipse cx="150" cy="180" rx="120" ry="12" fill="#fff" opacity="0.9"/>
            
            <!-- Endurance Spacecraft -->
            <g transform="translate(140, 260) scale(0.6)">
                <circle cx="15" cy="15" r="18" fill="none" stroke="#cfd8dc" stroke-width="3"/>
                <rect x="12" y="-3" width="6" height="6" fill="#fff"/>
                <rect x="12" y="27" width="6" height="6" fill="#fff"/>
                <rect x="-3" y="12" width="6" height="6" fill="#fff"/>
                <rect x="27" y="12" width="6" height="6" fill="#fff"/>
            </g>
            
            <!-- Planet Ice Wave Horizon -->
            <path d="M0 350 Q80 320 150 345 T300 330 L300 450 L0 450 Z" fill="#050d1a"/>
            
            <!-- Title -->
            <text x="150" y="380" font-family="'Outfit', sans-serif" font-weight="900" font-size="28" fill="#FFFFFF" text-anchor="middle" letter-spacing="8">INTERSTELLAR</text>
            <text x="150" y="405" font-family="'Outfit', sans-serif" font-weight="500" font-size="11" fill="#90caf9" text-anchor="middle" letter-spacing="3">A CHRISTOPHER NOLAN FILM</text>
            <text x="150" y="428" font-family="sans-serif" font-size="9" fill="#546e7a" text-anchor="middle" letter-spacing="2">MANKIND WAS BORN ON EARTH. IT WAS NEVER MEANT TO DIE HERE.</text>
        </svg>`
    },
    'M05': { // Dune: Part Two
        title: 'Dune: Part Two',
        theme: '#1C1005',
        accent: '#FF9900',
        svg: `<svg viewBox="0 0 300 450" xmlns="http://www.w3.org/2000/svg" class="movie-svg-poster">
            <defs>
                <linearGradient id="dune-bg" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stop-color="#120800"/>
                    <stop offset="40%" stop-color="#3d1e03"/>
                    <stop offset="75%" stop-color="#a65208"/>
                    <stop offset="100%" stop-color="#140700"/>
                </linearGradient>
                <radialGradient id="arrakis-sun" cx="50%" cy="30%" r="40%">
                    <stop offset="0%" stop-color="#ffe082"/>
                    <stop offset="40%" stop-color="#ff9800"/>
                    <stop offset="100%" stop-color="rgba(0,0,0,0)"/>
                </radialGradient>
            </defs>
            <rect width="300" height="450" fill="url(#dune-bg)"/>
            <circle cx="150" cy="130" r="90" fill="url(#arrakis-sun)"/>
            
            <!-- Eclipse ring -->
            <circle cx="150" cy="130" r="88" fill="#170c02"/>
            <circle cx="150" cy="130" r="90" fill="none" stroke="#ffb74d" stroke-width="2" opacity="0.8"/>
            
            <!-- Sand Dunes -->
            <path d="M0 240 Q100 200 210 260 T300 220 L300 450 L0 450 Z" fill="#803800"/>
            <path d="M0 290 Q90 260 170 300 T300 270 L300 450 L0 450 Z" fill="#542300"/>
            <path d="M0 340 Q130 310 230 350 T300 330 L300 450 L0 450 Z" fill="#291000"/>
            
            <!-- Shai-Hulud Sandworm Maw in distance -->
            <circle cx="240" cy="235" r="16" fill="#140600"/>
            <circle cx="240" cy="235" r="16" fill="none" stroke="#ffa726" stroke-width="1.5"/>
            
            <!-- Paul Atreides Silhouette on Ridge -->
            <path d="M80 275 L86 250 L92 250 L96 275 Z" fill="#000000"/>
            <circle cx="89" cy="245" r="4" fill="#00e5ff"/> <!-- Blue in Blue Eyes -->
            
            <!-- Title -->
            <text x="150" y="380" font-family="'Outfit', sans-serif" font-weight="900" font-size="42" fill="#FFFFFF" text-anchor="middle" letter-spacing="14">DUNE</text>
            <text x="150" y="406" font-family="'Outfit', sans-serif" font-weight="700" font-size="14" fill="#FFA726" text-anchor="middle" letter-spacing="6">PART TWO</text>
            <text x="150" y="430" font-family="sans-serif" font-size="9" fill="#d7ccc8" text-anchor="middle" letter-spacing="3">LONG LIVE THE FIGHTERS</text>
        </svg>`
    },
    'M06': { // Kantara
        title: 'Kantara: Chapter 1',
        theme: '#120202',
        accent: '#FF3300',
        svg: `<svg viewBox="0 0 300 450" xmlns="http://www.w3.org/2000/svg" class="movie-svg-poster">
            <defs>
                <linearGradient id="kan-bg" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stop-color="#080000"/>
                    <stop offset="45%" stop-color="#240202"/>
                    <stop offset="80%" stop-color="#4d0505"/>
                    <stop offset="100%" stop-color="#0a0000"/>
                </linearGradient>
                <radialGradient id="fire-glow" cx="50%" cy="45%" r="50%">
                    <stop offset="0%" stop-color="rgba(255, 69, 0, 0.6)"/>
                    <stop offset="60%" stop-color="rgba(255, 140, 0, 0.2)"/>
                    <stop offset="100%" stop-color="rgba(0,0,0,0)"/>
                </radialGradient>
            </defs>
            <rect width="300" height="450" fill="url(#kan-bg)"/>
            <circle cx="150" cy="180" r="130" fill="url(#fire-glow)"/>
            
            <!-- Forest & Fire Torches -->
            <path d="M20 200 L30 400 L10 400 Z" fill="#0d0000"/>
            <path d="M50 160 L65 400 L35 400 Z" fill="#120101"/>
            <path d="M250 170 L270 400 L240 400 Z" fill="#120101"/>
            <path d="M280 210 L290 400 L270 400 Z" fill="#0d0000"/>
            
            <!-- Fire Embers Sparks -->
            <circle cx="110" cy="140" r="2.5" fill="#FFD700"/>
            <circle cx="130" cy="90" r="1.5" fill="#FF4500"/>
            <circle cx="170" cy="110" r="2" fill="#FFA500"/>
            <circle cx="190" cy="150" r="3" fill="#FFD700"/>
            <circle cx="150" cy="70" r="2" fill="#FF6347"/>
            
            <!-- Daiva / Bhoota Kola Mask Motif -->
            <path d="M150 110 C120 130 110 180 130 220 C140 240 160 240 170 220 C190 180 180 130 150 110 Z" fill="#300303" stroke="#FF4500" stroke-width="3"/>
            <!-- Trishul / Horn Crown -->
            <path d="M150 75 L150 120" stroke="#FFD700" stroke-width="4"/>
            <path d="M130 90 Q150 105 170 90" stroke="#FFD700" stroke-width="3" fill="none"/>
            <circle cx="140" cy="165" r="6" fill="#FF3300"/>
            <circle cx="160" cy="165" r="6" fill="#FF3300"/>
            <path d="M140 195 Q150 205 160 195" stroke="#FFFFFF" stroke-width="3" fill="none"/>
            
            <!-- Title -->
            <text x="150" y="375" font-family="'Outfit', sans-serif" font-weight="900" font-size="34" fill="#FFD700" text-anchor="middle" letter-spacing="8">KANTARA</text>
            <text x="150" y="402" font-family="'Outfit', sans-serif" font-weight="700" font-size="13" fill="#FF4500" text-anchor="middle" letter-spacing="4">CHAPTER 1: A LEGEND</text>
            <text x="150" y="425" font-family="sans-serif" font-size="9" fill="#ffab91" text-anchor="middle" letter-spacing="2">EXPERIENCE THE DIVINE ROAR</text>
        </svg>`
    }
};

window.MOVIE_POSTERS = MOVIE_POSTERS;
