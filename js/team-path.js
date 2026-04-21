/* ============================================================
   "Follow Your Team" — interactive Leaflet map
   - Renders all 16 host stadiums as greyed-out markers.
   - Selecting a team highlights that team's 3 group-stage
     venues and animates a polyline route between them.
   - Leaflet + tiles are lazy-loaded on first scroll-into-view
     so the landing page stays fast on mobile.
   ============================================================ */
(function () {
  const MAP_HOST = document.getElementById('leaflet-map');
  const FLAG_GRID = document.getElementById('team-flag-grid');
  const TEAM_SEARCH = document.getElementById('team-search');
  const TEAM_CHIP = document.getElementById('team-selected-chip');
  if (!MAP_HOST || !FLAG_GRID) return;

  const T = window.TOURNAMENT;
  const teams = [];
  Object.entries(T.groups).forEach(([L, arr]) => {
    arr.forEach(t => teams.push({ ...t, group: L }));
  });
  // Stable, alpha-sorted flag grid
  teams.sort((a, b) => a.name.localeCompare(b.name));

  let map = null;
  let stadiumMarkers = {}; // id → marker
  let routeLayer = null;
  let routeAnim = null;
  let stadiums = [];
  let stadiumById = {};
  let teamPaths = {};
  let selected = null;
  let loaded = false;

  /* Render flag buttons immediately (works even before map loads) */
  function renderFlags(filter = '') {
    FLAG_GRID.innerHTML = '';
    const q = filter.trim().toLowerCase();
    teams.forEach(t => {
      if (q && !t.name.toLowerCase().includes(q) && !t.code.toLowerCase().includes(q)) return;
      const b = document.createElement('button');
      b.type = 'button';
      b.dataset.code = t.code;
      b.title = t.name;
      b.setAttribute('aria-label', t.name);
      b.innerHTML = `<span aria-hidden="true">${t.flag}</span>`;
      if (selected && selected.code === t.code) b.classList.add('active');
      b.addEventListener('click', () => selectTeam(t));
      FLAG_GRID.appendChild(b);
    });
  }
  renderFlags();
  if (TEAM_SEARCH) TEAM_SEARCH.addEventListener('input', e => renderFlags(e.target.value));

  /* Lazy-load Leaflet the first time the map scrolls into view. */
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting && !loaded) {
        loaded = true;
        io.disconnect();
        loadLeaflet().then(bootstrap);
      }
    });
  }, { rootMargin: '200px' });
  io.observe(MAP_HOST);

  function loadLeaflet() {
    if (window.L) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const css = document.createElement('link');
      css.rel = 'stylesheet';
      css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(css);
      const s = document.createElement('script');
      s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      s.onload = resolve;
      s.onerror = () => reject(new Error('Leaflet failed to load'));
      document.head.appendChild(s);
    });
  }

  async function fetchJSON(url) {
    const r = await fetch(url, { cache: 'no-store' });
    if (!r.ok) throw new Error('Could not load ' + url);
    return r.json();
  }

  async function bootstrap() {
    try {
      const [s, p] = await Promise.all([
        fetchJSON('./data/stadiums.json'),
        fetchJSON('./data/team-paths.json'),
      ]);
      stadiums = s.stadiums;
      stadiums.forEach(st => (stadiumById[st.id] = st));
      teamPaths = p.paths;
      initMap();
    } catch (err) {
      MAP_HOST.innerHTML = `<div style="display:grid;place-items:center;height:100%;color:var(--fg-muted);padding:20px;text-align:center;">Map data could not be loaded.<br>Please refresh the page.</div>`;
      console.error(err);
    }
  }

  function initMap() {
    // Bounds covering all three host countries.
    map = L.map(MAP_HOST, {
      zoomControl: true,
      scrollWheelZoom: false,
      attributionControl: true,
      minZoom: 3, maxZoom: 8,
    });
    map.fitBounds([[17, -125], [52, -68]]);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd', maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    }).addTo(map);

    stadiums.forEach(st => {
      const cls = 'stadium-marker' + (st.id === 'MET' ? ' final' : '');
      const icon = L.divIcon({
        className: '',
        html: `<div class="${cls}" data-id="${st.id}"></div>`,
        iconSize: [18, 18], iconAnchor: [9, 9],
      });
      const m = L.marker([st.lat, st.lng], { icon }).addTo(map);
      m.bindPopup(popupHtml(st), { closeButton: true, maxWidth: 280 });
      stadiumMarkers[st.id] = m;
    });

    // Tiny enable wheel-zoom on deliberate click (UX: stops page-scroll hijack).
    map.on('click', () => map.scrollWheelZoom.enable());
    map.getContainer().addEventListener('mouseleave', () => map.scrollWheelZoom.disable());
  }

  function popupHtml(st) {
    return `
      <div class="stadium-popup-hdr">
        <div class="city">${st.flag} ${st.city}</div>
        <div class="country-line">${st.country}</div>
      </div>
      <div class="stadium-popup-body">
        <div class="row"><b>Stadium</b><span>${st.name}</span></div>
        <div class="row"><b>Capacity</b><span>${st.capacity.toLocaleString('en-US')}</span></div>
        <div class="row"><b>Role</b><span>${st.role}</span></div>
      </div>
    `;
  }

  function selectTeam(t) {
    selected = t;
    // Update flag grid highlight
    FLAG_GRID.querySelectorAll('button').forEach(b => b.classList.toggle('active', b.dataset.code === t.code));
    // Update chip
    if (TEAM_CHIP) {
      TEAM_CHIP.innerHTML = `
        <span class="flag" aria-hidden="true">${t.flag}</span>
        <span class="name">${t.name}</span>
        <span class="route">Group ${t.group}</span>
      `;
    }

    if (!map) return;  // not yet loaded — will apply on next call once ready

    // Reset all markers
    Object.entries(stadiumMarkers).forEach(([id, m]) => {
      const dot = m.getElement() && m.getElement().querySelector('.stadium-marker');
      if (!dot) return;
      dot.classList.remove('active');
      if (id === 'MET') dot.classList.add('final');
    });

    // Clear previous route
    if (routeLayer) { map.removeLayer(routeLayer); routeLayer = null; }
    if (routeAnim) { cancelAnimationFrame(routeAnim); routeAnim = null; }

    const ids = teamPaths[t.code] || [];
    if (!ids.length) return;

    const path = ids.map(id => stadiumById[id]).filter(Boolean);

    // Highlight markers
    path.forEach(st => {
      const m = stadiumMarkers[st.id];
      if (!m) return;
      const dot = m.getElement() && m.getElement().querySelector('.stadium-marker');
      if (dot) dot.classList.add('active');
    });

    // Animate polyline using dashed stroke offset
    const latlngs = path.map(st => [st.lat, st.lng]);
    routeLayer = L.polyline(latlngs, {
      color: '#ff2d8a', weight: 3.5, opacity: .95,
      dashArray: '10 12', lineJoin: 'round', lineCap: 'round',
    }).addTo(map);

    // Fit bounds to the route
    map.flyToBounds(L.latLngBounds(latlngs).pad(0.4), { duration: 0.9, maxZoom: 6 });

    // Dash-offset animation
    const el = routeLayer.getElement();
    if (el) {
      let off = 0;
      function tick() {
        off = (off - 0.6);
        el.setAttribute('stroke-dashoffset', off);
        routeAnim = requestAnimationFrame(tick);
      }
      tick();
    }
  }

  // Expose for potential debugging
  window.__wcMap = { selectTeam };
})();
