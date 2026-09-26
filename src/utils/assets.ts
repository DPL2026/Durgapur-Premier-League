// High-definition SVG Team Logos and Player Presets

export const TEAM_DEFAULT_LOGOS: Record<string, string> = {
  team_rcd: `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none">
      <defs>
        <linearGradient id="rcd-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#b91c1c" />
          <stop offset="100%" stop-color="#7f1d1d" />
        </linearGradient>
        <linearGradient id="gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#fde047" />
          <stop offset="100%" stop-color="#ca8a04" />
        </linearGradient>
      </defs>
      <path d="M50 4 L88 18 L82 72 Q50 96 50 96 Q50 96 18 72 L12 18 Z" fill="url(#rcd-bg)" stroke="url(#gold-grad)" stroke-width="3"/>
      <!-- Royal Crown -->
      <path d="M32 30 L40 40 L50 24 L60 40 L68 30 L66 48 L34 48 Z" fill="url(#gold-grad)"/>
      <circle cx="32" cy="28" r="2.5" fill="#fff"/>
      <circle cx="50" cy="22" r="3" fill="#fff"/>
      <circle cx="68" cy="28" r="2.5" fill="#fff"/>
      <!-- Roaring Lion Silhouette -->
      <path d="M35 52 C35 52 38 46 50 46 C62 46 65 52 65 52 C68 56 68 64 64 70 C60 76 56 78 50 78 C44 78 40 76 36 70 C32 64 32 56 35 52 Z" fill="#ffffff" fill-opacity="0.95"/>
      <polygon points="46,58 54,58 50,64" fill="#991b1b"/>
      <path d="M42 66 Q50 72 58 66" stroke="#991b1b" stroke-width="2" fill="none"/>
      <!-- Text Banner -->
      <text x="50" y="88" text-anchor="middle" fill="url(#gold-grad)" font-family="sans-serif" font-weight="900" font-size="9" letter-spacing="1">R C D</text>
    </svg>
  `)}`,

  team_dsk: `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none">
      <defs>
        <linearGradient id="dsk-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#facc15" />
          <stop offset="100%" stop-color="#eab308" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="44" fill="url(#dsk-bg)" stroke="#1e3a8a" stroke-width="4"/>
      <circle cx="50" cy="50" r="38" stroke="#ca8a04" stroke-width="1.5" stroke-dasharray="3 2" fill="none"/>
      <!-- Crown -->
      <path d="M30 38 L38 48 L50 32 L62 48 L70 38 L68 54 L32 54 Z" fill="#1e3a8a"/>
      <circle cx="50" cy="28" r="3" fill="#facc15" stroke="#1e3a8a" stroke-width="1.5"/>
      <!-- Lion Crest -->
      <path d="M34 58 C34 54 42 50 50 50 C58 50 66 54 66 58 C68 68 62 76 50 76 C38 76 32 68 34 58 Z" fill="#1e3a8a"/>
      <text x="50" y="70" text-anchor="middle" fill="#facc15" font-family="sans-serif" font-weight="900" font-size="12">SUPER</text>
      <text x="50" y="90" text-anchor="middle" fill="#1e3a8a" font-family="sans-serif" font-weight="900" font-size="8" letter-spacing="1">K I N G S</text>
    </svg>
  `)}`,

  team_dkr: `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none">
      <defs>
        <linearGradient id="dkr-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#6b21a8" />
          <stop offset="100%" stop-color="#3b0764" />
        </linearGradient>
      </defs>
      <path d="M50 6 L86 20 L80 72 Q50 94 50 94 Q50 94 20 72 L14 20 Z" fill="url(#dkr-bg)" stroke="#fbbf24" stroke-width="3"/>
      <!-- Crossed Golden Swords -->
      <line x1="28" y1="28" x2="72" y2="72" stroke="#fbbf24" stroke-width="4" stroke-linecap="round"/>
      <line x1="72" y1="28" x2="28" y2="72" stroke="#fbbf24" stroke-width="4" stroke-linecap="round"/>
      <!-- Knight Corinthian Helmet -->
      <path d="M40 38 Q50 26 60 38 L62 58 Q50 68 38 58 Z" fill="#ffffff" stroke="#fbbf24" stroke-width="2"/>
      <rect x="44" y="44" width="12" height="4" fill="#3b0764"/>
      <rect x="48" y="44" width="4" height="12" fill="#3b0764"/>
      <text x="50" y="86" text-anchor="middle" fill="#fbbf24" font-family="sans-serif" font-weight="900" font-size="9" letter-spacing="1">D K R</text>
    </svg>
  `)}`,

  team_dr: `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none">
      <defs>
        <linearGradient id="dr-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#db2777" />
          <stop offset="100%" stop-color="#9d174d" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="44" fill="url(#dr-bg)" stroke="#60a5fa" stroke-width="3.5"/>
      <path d="M30 36 L40 44 L50 28 L60 44 L70 36 L66 52 L34 52 Z" fill="#fbbf24"/>
      <circle cx="50" cy="24" r="3.5" fill="#ffffff"/>
      <!-- Royal Lion / Shield -->
      <rect x="36" y="52" width="28" height="24" rx="6" fill="#1e3a8a" stroke="#fbbf24" stroke-width="2"/>
      <text x="50" y="69" text-anchor="middle" fill="#ffffff" font-family="sans-serif" font-weight="900" font-size="14">DR</text>
      <text x="50" y="88" text-anchor="middle" fill="#ffffff" font-family="sans-serif" font-weight="800" font-size="8" letter-spacing="1">ROYALS</text>
    </svg>
  `)}`,

  team_dt: `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none">
      <defs>
        <linearGradient id="dt-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0f766e" />
          <stop offset="100%" stop-color="#115e59" />
        </linearGradient>
      </defs>
      <polygon points="50,6 90,26 90,74 50,94 10,74 10,26" fill="url(#dt-bg)" stroke="#facc15" stroke-width="3"/>
      <!-- Lightning Bolt -->
      <polygon points="54,20 34,48 48,48 44,78 68,44 54,44" fill="#facc15" stroke="#ffffff" stroke-width="1.5"/>
      <text x="50" y="86" text-anchor="middle" fill="#ffffff" font-family="sans-serif" font-weight="900" font-size="9" letter-spacing="1">TITANS</text>
    </svg>
  `)}`,

  team_dsr: `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none">
      <defs>
        <linearGradient id="dsr-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#ea580c" />
          <stop offset="100%" stop-color="#9a3412" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="44" fill="url(#dsr-bg)" stroke="#fbbf24" stroke-width="3"/>
      <!-- Rising Sun rays -->
      <circle cx="50" cy="52" r="18" fill="#fbbf24"/>
      <!-- Eagle Wings -->
      <path d="M20 45 Q36 32 50 48 Q64 32 80 45 C74 58 60 62 50 66 C40 62 26 58 20 45 Z" fill="#18181b" stroke="#f97316" stroke-width="1.5"/>
      <text x="50" y="85" text-anchor="middle" fill="#ffffff" font-family="sans-serif" font-weight="900" font-size="9" letter-spacing="1">SUNRISERS</text>
    </svg>
  `)}`,

  team_dc: `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none">
      <defs>
        <linearGradient id="dc-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#1d4ed8" />
          <stop offset="100%" stop-color="#1e3a8a" />
        </linearGradient>
      </defs>
      <path d="M50 6 L86 22 L78 72 Q50 94 50 94 Q50 94 22 72 L14 22 Z" fill="url(#dc-bg)" stroke="#dc2626" stroke-width="3"/>
      <!-- Roaring Tiger Face -->
      <circle cx="50" cy="50" r="22" fill="#dc2626"/>
      <polygon points="32,32 40,42 34,44" fill="#ffffff"/>
      <polygon points="68,32 60,42 66,44" fill="#ffffff"/>
      <!-- Eyes & Snout -->
      <circle cx="43" cy="48" r="2" fill="#facc15"/>
      <circle cx="57" cy="48" r="2" fill="#facc15"/>
      <polygon points="50,56 46,52 54,52" fill="#ffffff"/>
      <text x="50" y="85" text-anchor="middle" fill="#ffffff" font-family="sans-serif" font-weight="900" font-size="9" letter-spacing="1">CAPITALS</text>
    </svg>
  `)}`,

  team_di: `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none">
      <defs>
        <linearGradient id="di-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0284c7" />
          <stop offset="100%" stop-color="#0369a1" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="44" fill="url(#di-bg)" stroke="#fbbf24" stroke-width="3.5"/>
      <!-- Razor Chakra Spinner -->
      <g stroke="#ffffff" stroke-width="2.5" fill="#facc15">
        <circle cx="50" cy="50" r="10" fill="#0369a1" stroke="#facc15" stroke-width="2"/>
        <path d="M50 22 Q58 35 50 40 Q42 35 50 22 Z"/>
        <path d="M78 50 Q65 58 60 50 Q65 42 78 50 Z"/>
        <path d="M50 78 Q42 65 50 60 Q58 65 50 78 Z"/>
        <path d="M22 50 Q35 42 40 50 Q35 58 22 50 Z"/>
      </g>
      <text x="50" y="87" text-anchor="middle" fill="#ffffff" font-family="sans-serif" font-weight="900" font-size="9" letter-spacing="1">INDIANS</text>
    </svg>
  `)}`,

  team_dw: `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none">
      <defs>
        <linearGradient id="dw-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#15803d" />
          <stop offset="100%" stop-color="#14532d" />
        </linearGradient>
      </defs>
      <polygon points="50,6 88,24 78,74 50,94 22,74 12,24" fill="url(#dw-bg)" stroke="#e2e8f0" stroke-width="3"/>
      <!-- Crossed Axes/Swords -->
      <line x1="30" y1="30" x2="70" y2="70" stroke="#facc15" stroke-width="3.5" stroke-linecap="round"/>
      <line x1="70" y1="30" x2="30" y2="70" stroke="#facc15" stroke-width="3.5" stroke-linecap="round"/>
      <circle cx="50" cy="50" r="12" fill="#1e293b" stroke="#ffffff" stroke-width="2"/>
      <text x="50" y="55" text-anchor="middle" fill="#ffffff" font-family="sans-serif" font-weight="900" font-size="12">W</text>
      <text x="50" y="86" text-anchor="middle" fill="#ffffff" font-family="sans-serif" font-weight="900" font-size="8" letter-spacing="1">WARRIORS</text>
    </svg>
  `)}`,

  team_dkxi: `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none">
      <defs>
        <linearGradient id="dkxi-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#b91c1c" />
          <stop offset="100%" stop-color="#7f1d1d" />
        </linearGradient>
      </defs>
      <path d="M50 4 L88 20 L82 72 Q50 96 50 96 Q50 96 18 72 L12 20 Z" fill="url(#dkxi-bg)" stroke="#e2e8f0" stroke-width="3"/>
      <!-- Fire Crest -->
      <path d="M50 24 C44 36 36 42 36 56 C36 68 44 76 50 76 C56 76 64 68 64 56 C64 42 56 36 50 24 Z" fill="#f97316"/>
      <path d="M50 36 C46 44 42 48 42 58 C42 66 46 70 50 70 C54 70 58 66 58 58 C58 48 54 44 50 36 Z" fill="#facc15"/>
      <text x="50" y="88" text-anchor="middle" fill="#ffffff" font-family="sans-serif" font-weight="900" font-size="10" letter-spacing="1">KINGS XI</text>
    </svg>
  `)}`
};

// High-definition cricket avatar presets
export const CRICKET_PLAYER_PRESETS: { name: string; role: string; photo: string }[] = [
  {
    name: 'Priyam Roy',
    role: 'All-rounder',
    photo: `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 240" fill="none">
        <defs>
          <linearGradient id="p-bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#1e3a8a"/>
            <stop offset="100%" stop-color="#0f172a"/>
          </linearGradient>
          <linearGradient id="skin" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#f5d0b0"/>
            <stop offset="100%" stop-color="#e0ac82"/>
          </linearGradient>
        </defs>
        <rect width="200" height="240" rx="16" fill="url(#p-bg)"/>
        <!-- India Athletic Jersey -->
        <path d="M40 180 Q100 150 160 180 L170 240 L30 240 Z" fill="#1d4ed8"/>
        <!-- Jersey Collar & Stripes -->
        <polygon points="100,185 85,160 115,160" fill="#f97316"/>
        <line x1="60" y1="185" x2="60" y2="240" stroke="#f97316" stroke-width="4"/>
        <line x1="140" y1="185" x2="140" y2="240" stroke="#f97316" stroke-width="4"/>
        <!-- Neck -->
        <rect x="88" y="125" width="24" height="35" rx="6" fill="url(#skin)"/>
        <!-- Head & Face -->
        <path d="M72 75 Q100 45 128 75 Q130 115 100 135 Q70 115 72 75 Z" fill="url(#skin)"/>
        <!-- Modern Haircut -->
        <path d="M68 70 Q100 35 132 70 Q125 50 100 48 Q75 50 68 70 Z" fill="#18181b"/>
        <!-- Athletic Beard & Stubble -->
        <path d="M74 95 Q100 140 126 95 Q118 130 100 132 Q82 130 74 95 Z" fill="#27272a"/>
        <!-- Eyes & Eyebrows -->
        <ellipse cx="88" cy="82" rx="3.5" ry="2" fill="#18181b"/>
        <ellipse cx="112" cy="82" rx="3.5" ry="2" fill="#18181b"/>
        <path d="M82 76 Q88 74 94 77" stroke="#18181b" stroke-width="2" fill="none"/>
        <path d="M106 77 Q112 74 118 76" stroke="#18181b" stroke-width="2" fill="none"/>
        <!-- Smile -->
        <path d="M92 108 Q100 114 108 108" stroke="#78350f" stroke-width="2" fill="none"/>
      </svg>
    `)}`
  },
  {
    name: 'Top Batter',
    role: 'Batter',
    photo: `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 240" fill="none">
        <rect width="200" height="240" rx="16" fill="#0f172a"/>
        <circle cx="100" cy="80" r="50" fill="#3b82f6" fill-opacity="0.2"/>
        <path d="M40 180 Q100 150 160 180 L170 240 L30 240 Z" fill="#2563eb"/>
        <!-- Helmet -->
        <path d="M70 70 C70 42 130 42 130 70 C130 85 125 95 100 96 C75 95 70 85 70 70 Z" fill="#1e3a8a" stroke="#60a5fa" stroke-width="2"/>
        <rect x="65" y="75" width="70" height="8" rx="3" fill="#334155"/>
        <rect x="75" y="85" width="50" height="3" fill="#cbd5e1"/>
        <rect x="80" y="93" width="40" height="3" fill="#cbd5e1"/>
        <rect x="88" y="105" width="24" height="25" fill="#f5d0b0"/>
      </svg>
    `)}`
  },
  {
    name: 'Fast Bowler',
    role: 'Fast Bowler',
    photo: `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 240" fill="none">
        <rect width="200" height="240" rx="16" fill="#111827"/>
        <circle cx="100" cy="80" r="50" fill="#ef4444" fill-opacity="0.2"/>
        <path d="M40 180 Q100 150 160 180 L170 240 L30 240 Z" fill="#991b1b"/>
        <!-- Head & Headband -->
        <path d="M74 80 Q100 50 126 80 Q128 115 100 135 Q72 115 74 80 Z" fill="#e0ac82"/>
        <path d="M70 65 Q100 35 130 65 Q125 50 100 48 Q75 50 70 65 Z" fill="#18181b"/>
        <!-- Red Sweat Headband -->
        <rect x="70" y="66" width="60" height="9" rx="2" fill="#ef4444"/>
        <rect x="88" y="130" width="24" height="30" fill="#e0ac82"/>
      </svg>
    `)}`
  },
  {
    name: 'Spin Magician',
    role: 'Spin Bowler',
    photo: `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 240" fill="none">
        <rect width="200" height="240" rx="16" fill="#064e3b"/>
        <circle cx="100" cy="80" r="50" fill="#10b981" fill-opacity="0.25"/>
        <path d="M40 180 Q100 150 160 180 L170 240 L30 240 Z" fill="#047857"/>
        <path d="M74 80 Q100 50 126 80 Q128 115 100 135 Q72 115 74 80 Z" fill="#f5d0b0"/>
        <path d="M70 70 Q100 40 130 70 Q125 50 100 48 Q75 50 70 70 Z" fill="#1f2937"/>
        <rect x="88" y="130" width="24" height="30" fill="#f5d0b0"/>
      </svg>
    `)}`
  },
  {
    name: 'Wicketkeeper Ace',
    role: 'Wicketkeeper',
    photo: `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 240" fill="none">
        <rect width="200" height="240" rx="16" fill="#581c87"/>
        <circle cx="100" cy="80" r="50" fill="#c084fc" fill-opacity="0.25"/>
        <path d="M40 180 Q100 150 160 180 L170 240 L30 240 Z" fill="#7e22ce"/>
        <!-- Cap with Visor -->
        <path d="M70 75 Q100 45 130 75 Z" fill="#3b0764"/>
        <rect x="65" y="70" width="70" height="7" rx="3" fill="#fbbf24"/>
        <path d="M74 80 Q100 50 126 80 Q128 115 100 135 Q72 115 74 80 Z" fill="#f5d0b0"/>
        <rect x="88" y="130" width="24" height="30" fill="#f5d0b0"/>
      </svg>
    `)}`
  }
];
