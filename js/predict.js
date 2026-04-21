/* ============================================================
   World Cup 2026 Bracket Predictor
   - Step 1: pick 1st/2nd/3rd in every group
   - Step 2: Round of 32 seeded from picks + best-thirds
   - Step 3: knockouts until a champion emerges
   - State persisted in localStorage and optionally shareable via URL
   ============================================================ */
(function () {
  const T = window.TOURNAMENT;
  const LS = 'wc2026-predictor-v1';

  /* ----------- State ----------- */
  const state = loadState() || {
    groupPicks: {},   // { A: { 1: 'MEX', 2: 'RSA', 3: 'KOR' }, ... }
    bracket: {},      // { 'R32-0-home': 'USA', 'R32-0-win': 'USA', ... }
    nextSlot: {},     // { A: 1|2|3 } — cursor that cycles 1→2→3→1... per group
  };
  // Migrate state loaded from older versions where nextSlot didn't exist.
  if (!state.nextSlot) state.nextSlot = {};
  function saveState() { try { localStorage.setItem(LS, JSON.stringify(state)); } catch (e) {} }
  function loadState() {
    try {
      const fromUrl = new URLSearchParams(location.search).get('s');
      if (fromUrl) {
        const decoded = JSON.parse(atob(decodeURIComponent(fromUrl)));
        localStorage.setItem(LS, JSON.stringify(decoded));
        // strip ?s= so we don't keep loading the shared state on refresh after edits
        history.replaceState(null, '', location.pathname);
        return decoded;
      }
      return JSON.parse(localStorage.getItem(LS));
    } catch (e) { return null; }
  }

  /* ----------- Team lookup ----------- */
  const teamByCode = {};
  Object.entries(T.groups).forEach(([letter, teams]) => {
    teams.forEach(t => { t.group = letter; teamByCode[t.code] = t; });
  });

  /* ----------- Tabs ----------- */
  const tabs = document.querySelectorAll('.tab-bar button');
  tabs.forEach(btn => btn.addEventListener('click', () => {
    tabs.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('tab-groups').classList.toggle('hidden', btn.dataset.tab !== 'groups');
    document.getElementById('tab-bracket').classList.toggle('hidden', btn.dataset.tab !== 'bracket');
    if (btn.dataset.tab === 'bracket') { renderBracket(); }
  }));

  /* ----------- Groups UI ----------- */
  const groupsHost = document.getElementById('predict-groups');
  function renderGroups() {
    groupsHost.innerHTML = '';
    Object.entries(T.groups).forEach(([letter, teams]) => {
      const card = document.createElement('div');
      card.className = 'predict-group';
      card.innerHTML = `<h3>Group ${letter}</h3>`;
      teams.forEach(t => {
        const picks = state.groupPicks[letter] || {};
        let slot = '';
        if (picks[1] === t.code) slot = '1';
        else if (picks[2] === t.code) slot = '2';
        else if (picks[3] === t.code) slot = '3';
        const badge = slot === '1' ? '1st' : slot === '2' ? '2nd' : slot === '3' ? '3rd' : '';
        const row = document.createElement('div');
        row.className = 'predict-row';
        if (slot) row.dataset.slot = slot;
        row.innerHTML = `${window.Flags.img(t.flag, t.name)}<span class="n">${t.name}</span><span class="badge">${badge}</span>`;
        row.addEventListener('click', () => cycleGroupPick(letter, t.code));
        card.appendChild(row);
      });
      groupsHost.appendChild(card);
    });
    updateProgress();
  }

  /**
   * Per-group counter logic.
   *  - Each group has an independent cursor that cycles 1 → 2 → 3 → 1 → 2 → 3…
   *  - The N-th click on *any* team in that group assigns the current cursor
   *    value to that team (and steals that rank from whoever had it before).
   *  - After assigning, cursor advances to the next rank.
   *  Example: click A twice → A=1st, cursor=2 → A=2nd (1st is now empty).
   *  Then click B (3rd click) → B=3rd, cursor=1. Final: A=2nd, B=3rd. ✓
   */
  function cycleGroupPick(letter, code) {
    state.groupPicks[letter] = state.groupPicks[letter] || {};
    const p = state.groupPicks[letter];
    const slot = state.nextSlot[letter] || 1;  // 1..3 cursor
    // Remove `code` from wherever it currently sits.
    [1, 2, 3].forEach(s => { if (p[s] === code) delete p[s]; });
    // Assign (displacing whoever had this rank).
    p[slot] = code;
    // Advance cursor 1 → 2 → 3 → 1 …
    state.nextSlot[letter] = slot === 3 ? 1 : slot + 1;
    // Picks changed → invalidate dependent bracket.
    state.bracket = {};
    saveState();
    renderGroups();
  }

  /* ----------- Round-of-32 seeding ----------- */
  /* Simplified, bracket-maker friendly pairing that gives a readable,
     balanced single-elimination draw. Not the exact FIFA Crossover Logic™,
     but uses all 12 winners, 12 runners-up and 8 best thirds.  */
  function seedRoundOf32() {
    const winners  = [];
    const runners  = [];
    const thirds   = [];
    'ABCDEFGHIJKL'.split('').forEach(L => {
      const p = state.groupPicks[L] || {};
      if (p[1]) winners.push(p[1]);
      if (p[2]) runners.push(p[2]);
      if (p[3]) thirds.push(p[3]);
    });
    if (winners.length < 12 || runners.length < 12 || thirds.length < 8) return null;
    // Take the first 8 third-placed teams (user implicitly ranks them by picking order).
    const bestThirds = thirds.slice(0, 8);
    // Build 32-team array: alternate pots for visual spread.
    // R32 match list (32 teams = 16 matches):
    const pairs = [
      // Each entry is [teamA, teamB] codes
      [winners[0],  bestThirds[0]],
      [runners[2],  runners[5]],
      [winners[4],  bestThirds[4]],
      [runners[1],  runners[8]],
      [winners[2],  bestThirds[2]],
      [runners[3],  runners[7]],
      [winners[6],  bestThirds[6]],
      [runners[0],  runners[9]],
      [winners[1],  bestThirds[1]],
      [runners[4],  runners[10]],
      [winners[5],  bestThirds[5]],
      [runners[6],  runners[11]],
      [winners[3],  bestThirds[3]],
      [winners[9],  bestThirds[7]],
      [winners[7],  winners[11]],
      [winners[8],  winners[10]],
    ];
    return pairs;
  }

  /* ----------- Bracket UI ----------- */
  const bracketHost = document.getElementById('bracket');
  const rounds = [
    { key: 'R32', label: 'Round of 32', size: 16 },
    { key: 'R16', label: 'Round of 16', size: 8  },
    { key: 'QF',  label: 'Quarter-finals', size: 4 },
    { key: 'SF',  label: 'Semi-finals',    size: 2 },
    { key: 'F',   label: 'Final',          size: 1 },
  ];

  function keyFor(round, idx, side) { return `${round}-${idx}-${side}`; }

  function resolveMatchTeams(round, idx, seedPairs) {
    if (round === 'R32') {
      const pair = seedPairs ? seedPairs[idx] : [null, null];
      return [pair ? pair[0] : null, pair ? pair[1] : null];
    }
    // Next round teams = winners of two parents from previous round
    const prevIdx = rounds.findIndex(r => r.key === round) - 1;
    const prev = rounds[prevIdx];
    const a = state.bracket[keyFor(prev.key, idx * 2,     'win')] || null;
    const b = state.bracket[keyFor(prev.key, idx * 2 + 1, 'win')] || null;
    return [a, b];
  }

  function renderBracket() {
    bracketHost.innerHTML = '';
    const seedPairs = seedRoundOf32();
    if (!seedPairs) {
      bracketHost.innerHTML = `<div style="padding:40px; text-align:center; color:var(--fg-muted); background:var(--bg-2); border:1px solid var(--border); border-radius:var(--radius); min-width: 100%;">
        <p style="margin:0 0 10px; font-size:18px; color:var(--fg);">You still need to finish Step 1</p>
        <p style="margin:0 0 16px;">Pick 1st and 2nd in <strong>all 12 groups</strong>, plus a 3rd-placed team in at least <strong>8 groups</strong>, then your bracket will appear here.</p>
        <button class="btn btn-primary" onclick="document.querySelector('.tab-bar button[data-tab=groups]').click()">← Back to Group Picks</button>
      </div>`;
      document.getElementById('champion-banner').classList.add('hidden');
      return;
    }

    rounds.forEach(r => {
      const col = document.createElement('div');
      col.className = 'bracket-col';
      col.innerHTML = `<h4>${r.label}</h4>`;
      for (let i = 0; i < r.size; i++) {
        const [a, b] = resolveMatchTeams(r.key, i, seedPairs);
        const winner = state.bracket[keyFor(r.key, i, 'win')];
        col.appendChild(matchEl(r.key, i, a, b, winner));
      }
      bracketHost.appendChild(col);
    });

    // Champion
    const champ = state.bracket[keyFor('F', 0, 'win')];
    const banner = document.getElementById('champion-banner');
    if (champ && teamByCode[champ]) {
      banner.classList.remove('hidden');
      const champFlagEl = document.getElementById('champion-flag');
      champFlagEl.textContent = '';
      champFlagEl.insertAdjacentHTML('beforeend', window.Flags.img(teamByCode[champ].flag, teamByCode[champ].name, 'champ-flag'));
      document.getElementById('champion-name').textContent = teamByCode[champ].name;
      const shareText = `My 2026 World Cup champion: ${teamByCode[champ].flag} ${teamByCode[champ].name}! Make your own bracket:`;
      document.getElementById('champion-share-x').href =
        'https://twitter.com/intent/tweet?text=' + encodeURIComponent(shareText) + '&url=' + encodeURIComponent(buildShareUrl());
    } else {
      banner.classList.add('hidden');
    }

    updateProgress();
  }

  function matchEl(round, idx, aCode, bCode, winner) {
    const el = document.createElement('div');
    el.className = 'match';
    el.appendChild(slotEl(round, idx, 'home', aCode, winner));
    el.appendChild(slotEl(round, idx, 'away', bCode, winner));
    return el;
  }

  function slotEl(round, idx, side, code, winnerCode) {
    const el = document.createElement('div');
    el.className = 'match-slot';
    if (!code) {
      el.className += ' empty';
      el.innerHTML = `<span class="n">—</span>`;
      return el;
    }
    const team = teamByCode[code];
    if (winnerCode === code) el.className += ' winner';
    el.innerHTML = `${window.Flags.img(team.flag, team.name)}<span class="n">${team.name}</span>`;
    el.addEventListener('click', () => {
      state.bracket[keyFor(round, idx, 'win')] = code;
      // Invalidate all downstream rounds for this branch
      clearDownstream(round, idx);
      saveState();
      renderBracket();
    });
    return el;
  }

  function clearDownstream(round, idx) {
    // The bracket is a binary tree: match idx in round N feeds match floor(idx/2) in round N+1.
    // Walk the chain of ancestors and clear their recorded winners.
    const rIdx = rounds.findIndex(r => r.key === round);
    let cur = idx;
    for (let k = rIdx + 1; k < rounds.length; k++) {
      cur = Math.floor(cur / 2);
      delete state.bracket[keyFor(rounds[k].key, cur, 'win')];
    }
  }

  /* ----------- Progress ----------- */
  function updateProgress() {
    const fillEl = document.getElementById('progress-fill');
    const labelEl = document.getElementById('progress-label');
    // 12 groups × 3 picks = 36 points from groups; 31 bracket wins = 31 points
    let gPoints = 0;
    Object.values(state.groupPicks).forEach(p => { if (p[1]) gPoints++; if (p[2]) gPoints++; if (p[3]) gPoints++; });
    let bPoints = 0;
    Object.keys(state.bracket).forEach(k => { if (k.endsWith('-win')) bPoints++; });
    const total = 36 + 31;
    const done = gPoints + bPoints;
    const pct = Math.min(100, Math.round(done / total * 100));
    fillEl.style.width = pct + '%';
    labelEl.textContent = `Progress · ${pct}% · Group picks ${gPoints}/36 · Bracket ${bPoints}/31`;
  }

  /* ----------- Auto-fill using rough tier weights ----------- */
  function strength(code) {
    const t = teamByCode[code]; if (!t) return 1;
    if (T.tiers.elite.includes(code))  return 90 + Math.random() * 10;
    if (T.tiers.strong.includes(code)) return 70 + Math.random() * 15;
    if (T.tiers.dark.includes(code))   return 50 + Math.random() * 20;
    return 35 + Math.random() * 20;
  }
  function autofill() {
    // Groups: rank teams by strength, 1st/2nd/3rd per group
    Object.entries(T.groups).forEach(([L, teams]) => {
      const ranked = teams.slice().sort((a, b) => strength(b.code) - strength(a.code));
      state.groupPicks[L] = { 1: ranked[0].code, 2: ranked[1].code, 3: ranked[2].code };
      state.nextSlot[L] = 1;  // cursor back to 1st
    });
    // Clear bracket and then fill winners
    state.bracket = {};
    const pairs = seedRoundOf32();
    // Round of 32
    pairs.forEach((p, i) => {
      const [a, b] = p;
      state.bracket[keyFor('R32', i, 'win')] = strength(a) >= strength(b) ? a : b;
    });
    // Subsequent rounds
    for (let k = 1; k < rounds.length; k++) {
      const prev = rounds[k - 1], cur = rounds[k];
      for (let i = 0; i < cur.size; i++) {
        const a = state.bracket[keyFor(prev.key, i * 2, 'win')];
        const b = state.bracket[keyFor(prev.key, i * 2 + 1, 'win')];
        if (!a || !b) continue;
        state.bracket[keyFor(cur.key, i, 'win')] = strength(a) >= strength(b) ? a : b;
      }
    }
    saveState();
    renderGroups();
    renderBracket();
    toast('Smart picks applied — tweak them to your heart\'s content!');
  }

  /* ----------- Share link ----------- */
  function buildShareUrl() {
    const payload = btoa(JSON.stringify(state));
    return location.origin + location.pathname + '?s=' + encodeURIComponent(payload);
  }
  function copyShare() {
    const url = buildShareUrl();
    const text = 'My 2026 World Cup bracket → ' + url;
    if (navigator.clipboard) navigator.clipboard.writeText(text).then(() => toast('Share link copied!'), () => fallbackCopy(text));
    else fallbackCopy(text);
  }
  function fallbackCopy(text) {
    const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); toast('Share link copied!'); } catch (e) { toast('Could not copy — please copy the URL manually.'); }
    ta.remove();
  }

  /* ----------- Reset ----------- */
  function reset() {
    if (!confirm('Reset all your picks? This cannot be undone.')) return;
    state.groupPicks = {};
    state.bracket = {};
    state.nextSlot = {};
    saveState();
    renderGroups();
    renderBracket();
    toast('All picks cleared');
  }

  /* ----------- Toast ----------- */
  const toastEl = document.getElementById('toast');
  let toastTimer;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2400);
  }

  /* ----------- Wire up ----------- */
  document.getElementById('btn-auto').addEventListener('click', autofill);
  document.getElementById('btn-share').addEventListener('click', copyShare);
  document.getElementById('btn-share2').addEventListener('click', copyShare);
  document.getElementById('btn-reset').addEventListener('click', reset);

  renderGroups();
})();
