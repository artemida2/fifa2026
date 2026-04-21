/* FIFA World Cup 2026 — static data.
   Sources: FIFA official draw (Dec 2025), confirmed groups (Apr 2026). */
window.TOURNAMENT = (function () {
  const kickoff = '2026-06-11T18:00:00-05:00'; // Mexico City, opening match at Estadio Azteca
  const final   = '2026-07-19T15:00:00-04:00'; // MetLife Stadium, East Rutherford NJ

  // 16 host cities. x/y are approximate percentages on a stylised North-America map
  // (0,0 = top-left of the #na-map SVG viewBox; set in styles.css).
  const cities = [
    // ------ MEXICO (3) ------
    { code: 'MEX-MEX', city: 'Mexico City',   country: 'Mexico', flag: '🇲🇽', stadium: 'Estadio Azteca',      capacity: 87000, role: 'Opening match & group stage',           x: 31.5, y: 78 },
    { code: 'MEX-GDL', city: 'Guadalajara',   country: 'Mexico', flag: '🇲🇽', stadium: 'Estadio Akron',       capacity: 48000, role: 'Group stage',                           x: 24,   y: 74 },
    { code: 'MEX-MTY', city: 'Monterrey',     country: 'Mexico', flag: '🇲🇽', stadium: 'Estadio BBVA',        capacity: 53500, role: 'Group stage',                           x: 28,   y: 63 },
    // ------ CANADA (2) ------
    { code: 'CAN-YVR', city: 'Vancouver',     country: 'Canada', flag: '🇨🇦', stadium: 'BC Place',            capacity: 54500, role: 'Group stage & knockouts',               x: 14,   y: 18 },
    { code: 'CAN-YYZ', city: 'Toronto',       country: 'Canada', flag: '🇨🇦', stadium: 'BMO Field',           capacity: 45000, role: 'Group stage',                           x: 66,   y: 26 },
    // ------ USA (11) ------
    { code: 'USA-SEA', city: 'Seattle',       country: 'USA',    flag: '🇺🇸', stadium: 'Lumen Field',          capacity: 68000, role: 'Group stage & knockouts',               x: 14,   y: 26 },
    { code: 'USA-SFO', city: 'San Francisco Bay', country: 'USA', flag: '🇺🇸', stadium: "Levi's Stadium",      capacity: 68500, role: 'Group stage & knockouts',               x: 12,   y: 42 },
    { code: 'USA-LAX', city: 'Los Angeles',   country: 'USA',    flag: '🇺🇸', stadium: 'SoFi Stadium',         capacity: 70000, role: 'Group stage & knockouts',               x: 16,   y: 52 },
    { code: 'USA-KAN', city: 'Kansas City',   country: 'USA',    flag: '🇺🇸', stadium: 'Arrowhead Stadium',    capacity: 76000, role: 'Group stage & knockouts',               x: 46,   y: 48 },
    { code: 'USA-DAL', city: 'Dallas',        country: 'USA',    flag: '🇺🇸', stadium: 'AT&T Stadium',         capacity: 80000, role: 'Group stage & knockouts',               x: 44,   y: 58 },
    { code: 'USA-HOU', city: 'Houston',       country: 'USA',    flag: '🇺🇸', stadium: 'NRG Stadium',          capacity: 72000, role: 'Group stage & knockouts',               x: 48,   y: 64 },
    { code: 'USA-ATL', city: 'Atlanta',       country: 'USA',    flag: '🇺🇸', stadium: 'Mercedes-Benz Stadium', capacity: 71000, role: 'Group stage & knockouts',              x: 60,   y: 56 },
    { code: 'USA-MIA', city: 'Miami',         country: 'USA',    flag: '🇺🇸', stadium: 'Hard Rock Stadium',    capacity: 65000, role: 'Group stage & knockouts',               x: 66,   y: 66 },
    { code: 'USA-BOS', city: 'Boston',        country: 'USA',    flag: '🇺🇸', stadium: 'Gillette Stadium',     capacity: 65000, role: 'Group stage & knockouts',               x: 78,   y: 34 },
    { code: 'USA-PHI', city: 'Philadelphia',  country: 'USA',    flag: '🇺🇸', stadium: 'Lincoln Financial Field', capacity: 67500, role: 'Group stage & knockouts',            x: 76,   y: 40 },
    { code: 'USA-NYC', city: 'New York / New Jersey', country: 'USA', flag: '🇺🇸', stadium: 'MetLife Stadium', capacity: 82500, role: 'FINAL · Knockouts · Group stage',       x: 78,   y: 38 },
  ];

  // 12 groups, 4 teams each. Flags are emoji for zero-asset cost.
  // Official final draw (Apr 1 2026).
  const groups = {
    A: [
      { name: 'Mexico',            code: 'MEX', flag: '🇲🇽' },
      { name: 'South Africa',      code: 'RSA', flag: '🇿🇦' },
      { name: 'South Korea',       code: 'KOR', flag: '🇰🇷' },
      { name: 'Czechia',           code: 'CZE', flag: '🇨🇿' },
    ],
    B: [
      { name: 'Canada',            code: 'CAN', flag: '🇨🇦' },
      { name: 'Switzerland',       code: 'SUI', flag: '🇨🇭' },
      { name: 'Qatar',             code: 'QAT', flag: '🇶🇦' },
      { name: 'Bosnia & Herzegovina', code: 'BIH', flag: '🇧🇦' },
    ],
    C: [
      { name: 'Brazil',            code: 'BRA', flag: '🇧🇷' },
      { name: 'Morocco',           code: 'MAR', flag: '🇲🇦' },
      { name: 'Scotland',          code: 'SCO', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿' },
      { name: 'Haiti',             code: 'HAI', flag: '🇭🇹' },
    ],
    D: [
      { name: 'USA',               code: 'USA', flag: '🇺🇸' },
      { name: 'Paraguay',          code: 'PAR', flag: '🇵🇾' },
      { name: 'Australia',         code: 'AUS', flag: '🇦🇺' },
      { name: 'Türkiye',           code: 'TUR', flag: '🇹🇷' },
    ],
    E: [
      { name: 'Germany',           code: 'GER', flag: '🇩🇪' },
      { name: 'Ecuador',           code: 'ECU', flag: '🇪🇨' },
      { name: 'Ivory Coast',       code: 'CIV', flag: '🇨🇮' },
      { name: 'Curaçao',           code: 'CUW', flag: '🇨🇼' },
    ],
    F: [
      { name: 'Netherlands',       code: 'NED', flag: '🇳🇱' },
      { name: 'Japan',             code: 'JPN', flag: '🇯🇵' },
      { name: 'Sweden',            code: 'SWE', flag: '🇸🇪' },
      { name: 'Tunisia',           code: 'TUN', flag: '🇹🇳' },
    ],
    G: [
      { name: 'Belgium',           code: 'BEL', flag: '🇧🇪' },
      { name: 'Egypt',             code: 'EGY', flag: '🇪🇬' },
      { name: 'Iran',              code: 'IRN', flag: '🇮🇷' },
      { name: 'New Zealand',       code: 'NZL', flag: '🇳🇿' },
    ],
    H: [
      { name: 'Spain',             code: 'ESP', flag: '🇪🇸' },
      { name: 'Uruguay',           code: 'URU', flag: '🇺🇾' },
      { name: 'Saudi Arabia',      code: 'KSA', flag: '🇸🇦' },
      { name: 'Cape Verde',        code: 'CPV', flag: '🇨🇻' },
    ],
    I: [
      { name: 'France',            code: 'FRA', flag: '🇫🇷' },
      { name: 'Senegal',           code: 'SEN', flag: '🇸🇳' },
      { name: 'Norway',            code: 'NOR', flag: '🇳🇴' },
      { name: 'Iraq',              code: 'IRQ', flag: '🇮🇶' },
    ],
    J: [
      { name: 'Argentina',         code: 'ARG', flag: '🇦🇷' },
      { name: 'Algeria',           code: 'ALG', flag: '🇩🇿' },
      { name: 'Austria',           code: 'AUT', flag: '🇦🇹' },
      { name: 'Jordan',            code: 'JOR', flag: '🇯🇴' },
    ],
    K: [
      { name: 'Portugal',          code: 'POR', flag: '🇵🇹' },
      { name: 'Colombia',          code: 'COL', flag: '🇨🇴' },
      { name: 'Uzbekistan',        code: 'UZB', flag: '🇺🇿' },
      { name: 'DR Congo',          code: 'COD', flag: '🇨🇩' },
    ],
    L: [
      { name: 'England',           code: 'ENG', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
      { name: 'Croatia',           code: 'CRO', flag: '🇭🇷' },
      { name: 'Ghana',             code: 'GHA', flag: '🇬🇭' },
      { name: 'Panama',            code: 'PAN', flag: '🇵🇦' },
    ],
  };

  // Title-contender tier used only for the "Which team should you support?" quiz weighting.
  const tiers = {
    elite:    ['BRA','ARG','FRA','ENG','ESP','GER','POR','NED','BEL'],
    strong:   ['CRO','URU','COL','MEX','USA','JPN','MAR','SEN','SUI'],
    dark:     ['SCO','SWE','AUS','KOR','ECU','IRN','NOR','GHA','CIV','CAN','EGY','TUR','POL'],
    rising:   ['CPV','HAI','CUW','IRQ','UZB','JOR','HAI','PAN','QAT','NZL','TUN','ALG','AUT','CZE','BIH','RSA','KSA','COD']
  };

  return { kickoff, final, cities, groups, tiers };
})();
