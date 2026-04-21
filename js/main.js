/* ============================================================
   World Cup 2026 Hub — homepage interactivity
   (vanilla JS, no dependencies, works on GitHub Pages)
   ============================================================ */
(function () {
  const T = window.TOURNAMENT;

  /* ---------------- Countdown ---------------- */
  const cdD = document.getElementById('cd-d');
  const cdH = document.getElementById('cd-h');
  const cdM = document.getElementById('cd-m');
  const cdS = document.getElementById('cd-s');
  const cdMeta = document.getElementById('cd-meta');
  const target = new Date(T.kickoff).getTime();

  function tick() {
    const now = Date.now();
    let diff = Math.max(0, target - now);
    const d = Math.floor(diff / 86400000); diff -= d * 86400000;
    const h = Math.floor(diff / 3600000);  diff -= h * 3600000;
    const m = Math.floor(diff / 60000);    diff -= m * 60000;
    const s = Math.floor(diff / 1000);
    cdD.textContent = String(d).padStart(2, '0');
    cdH.textContent = String(h).padStart(2, '0');
    cdM.textContent = String(m).padStart(2, '0');
    cdS.textContent = String(s).padStart(2, '0');
    if (target - now <= 0) cdMeta.textContent = 'The tournament has begun! Go build your bracket ⚽';
  }
  tick();
  setInterval(tick, 1000);

  /* ---------------- Groups grid ---------------- */
  const groupsGrid = document.getElementById('groups-grid');
  Object.entries(T.groups).forEach(([letter, teams]) => {
    const card = document.createElement('div');
    card.className = 'group-card';
    card.innerHTML = `
      <h3><span class="pill">${letter}</span> Group ${letter}</h3>
      ${teams.map(t => `<div class="team-row">${window.Flags.img(t.flag, t.name)}<span>${t.name}</span></div>`).join('')}
    `;
    groupsGrid.appendChild(card);
  });

  /* ---------------- Fan quiz ---------------- */
  const questions = [
    {
      q: 'What kind of story do you want to root for?',
      opts: [
        { t: 'A favourite adding to their legacy', w: { elite: 3, strong: 1 } },
        { t: 'A dark horse going deep',             w: { dark: 3, rising: 1 } },
        { t: 'A host nation riding home support',   w: { strong: 2, rising: 2, host: 3 } },
        { t: 'A fairy-tale debutant or minnow',     w: { rising: 4 } },
      ]
    },
    {
      q: 'Pick the continent that makes your heart beat faster',
      opts: [
        { t: '🇪🇺 Europe',     w: { continent: 'EUR' } },
        { t: '🌎 South America', w: { continent: 'SAM' } },
        { t: '🌍 Africa',      w: { continent: 'AFR' } },
        { t: '🌏 Asia / Oceania', w: { continent: 'AFC' } },
      ]
    },
    {
      q: 'Which style of play excites you most?',
      opts: [
        { t: 'Tiki-taka possession',          w: { style: 'possession' } },
        { t: 'Counter-attack & pace',         w: { style: 'counter' } },
        { t: 'Gritty, physical, high-press',  w: { style: 'press' } },
        { t: 'Flair, tricks, joga bonito',    w: { style: 'flair' } },
      ]
    },
    {
      q: 'Your ideal kit colour palette?',
      opts: [
        { t: 'Red & white',     w: { color: 'red' } },
        { t: 'Blue & white',    w: { color: 'blue' } },
        { t: 'Yellow / gold',   w: { color: 'yellow' } },
        { t: 'Green stripes',   w: { color: 'green' } },
      ]
    },
    {
      q: 'Weekend football watch is incomplete without…',
      opts: [
        { t: 'Premier League',       w: { league: 'ENG' } },
        { t: 'La Liga',              w: { league: 'ESP' } },
        { t: 'Bundesliga',           w: { league: 'GER' } },
        { t: 'Serie A / Ligue 1',    w: { league: 'ITA' } },
      ]
    },
    {
      q: 'When the going gets tough, your team should…',
      opts: [
        { t: 'Dominate the ball',       w: { style: 'possession' } },
        { t: 'Defend deep and strike',  w: { style: 'counter' } },
        { t: 'Bully the opposition',    w: { style: 'press' } },
        { t: 'Invent magic from nothing', w: { style: 'flair' } },
      ]
    },
  ];

  /* Map quiz attributes onto teams (rough, for entertainment). */
  const teamMeta = {
    BRA: { tier: 'elite',  continent: 'SAM', style: 'flair',      color: 'yellow', league: 'ESP' },
    ARG: { tier: 'elite',  continent: 'SAM', style: 'counter',    color: 'blue',   league: 'ESP' },
    FRA: { tier: 'elite',  continent: 'EUR', style: 'counter',    color: 'blue',   league: 'ITA' },
    ENG: { tier: 'elite',  continent: 'EUR', style: 'press',      color: 'red',    league: 'ENG' },
    ESP: { tier: 'elite',  continent: 'EUR', style: 'possession', color: 'red',    league: 'ESP' },
    GER: { tier: 'elite',  continent: 'EUR', style: 'press',      color: 'red',    league: 'GER' },
    POR: { tier: 'elite',  continent: 'EUR', style: 'flair',      color: 'red',    league: 'ESP' },
    NED: { tier: 'elite',  continent: 'EUR', style: 'possession', color: 'blue',   league: 'ENG' },
    BEL: { tier: 'elite',  continent: 'EUR', style: 'counter',    color: 'red',    league: 'ENG' },
    CRO: { tier: 'strong', continent: 'EUR', style: 'possession', color: 'red',    league: 'ITA' },
    URU: { tier: 'strong', continent: 'SAM', style: 'press',      color: 'blue',   league: 'ITA' },
    COL: { tier: 'strong', continent: 'SAM', style: 'counter',    color: 'yellow', league: 'ENG' },
    MEX: { tier: 'strong', continent: 'AFC', style: 'counter',    color: 'green',  league: 'ESP', host: true },
    USA: { tier: 'strong', continent: 'AFC', style: 'press',      color: 'blue',   league: 'ENG', host: true },
    JPN: { tier: 'strong', continent: 'AFC', style: 'possession', color: 'blue',   league: 'GER' },
    MAR: { tier: 'strong', continent: 'AFR', style: 'counter',    color: 'red',    league: 'ESP' },
    SEN: { tier: 'strong', continent: 'AFR', style: 'counter',    color: 'green',  league: 'ENG' },
    SUI: { tier: 'strong', continent: 'EUR', style: 'press',      color: 'red',    league: 'GER' },
    SCO: { tier: 'dark',   continent: 'EUR', style: 'press',      color: 'blue',   league: 'ENG' },
    SWE: { tier: 'dark',   continent: 'EUR', style: 'counter',    color: 'yellow', league: 'ENG' },
    AUS: { tier: 'dark',   continent: 'AFC', style: 'press',      color: 'yellow', league: 'ENG' },
    KOR: { tier: 'dark',   continent: 'AFC', style: 'press',      color: 'red',    league: 'ENG' },
    ECU: { tier: 'dark',   continent: 'SAM', style: 'press',      color: 'yellow', league: 'ESP' },
    IRN: { tier: 'dark',   continent: 'AFC', style: 'counter',    color: 'red',    league: 'ESP' },
    NOR: { tier: 'dark',   continent: 'EUR', style: 'counter',    color: 'red',    league: 'ENG' },
    GHA: { tier: 'dark',   continent: 'AFR', style: 'counter',    color: 'red',    league: 'ITA' },
    CIV: { tier: 'dark',   continent: 'AFR', style: 'flair',      color: 'green',  league: 'ENG' },
    CAN: { tier: 'dark',   continent: 'AFC', style: 'counter',    color: 'red',    league: 'ENG', host: true },
    EGY: { tier: 'dark',   continent: 'AFR', style: 'flair',      color: 'red',    league: 'ENG' },
    TUR: { tier: 'dark',   continent: 'EUR', style: 'press',      color: 'red',    league: 'ITA' },
    CPV: { tier: 'rising', continent: 'AFR', style: 'counter',    color: 'blue',   league: 'ESP' },
    HAI: { tier: 'rising', continent: 'AFC', style: 'flair',      color: 'red',    league: 'ENG' },
    CUW: { tier: 'rising', continent: 'AFC', style: 'flair',      color: 'blue',   league: 'GER' },
    IRQ: { tier: 'rising', continent: 'AFC', style: 'press',      color: 'green',  league: 'ESP' },
    UZB: { tier: 'rising', continent: 'AFC', style: 'possession', color: 'blue',   league: 'GER' },
    JOR: { tier: 'rising', continent: 'AFC', style: 'counter',    color: 'red',    league: 'ESP' },
    PAN: { tier: 'rising', continent: 'AFC', style: 'press',      color: 'red',    league: 'ESP' },
    QAT: { tier: 'rising', continent: 'AFC', style: 'possession', color: 'red',    league: 'GER' },
    NZL: { tier: 'rising', continent: 'AFC', style: 'press',      color: 'blue',   league: 'ENG' },
    TUN: { tier: 'rising', continent: 'AFR', style: 'press',      color: 'red',    league: 'ITA' },
    ALG: { tier: 'rising', continent: 'AFR', style: 'flair',      color: 'green',  league: 'ESP' },
    AUT: { tier: 'rising', continent: 'EUR', style: 'press',      color: 'red',    league: 'GER' },
    CZE: { tier: 'rising', continent: 'EUR', style: 'possession', color: 'red',    league: 'GER' },
    BIH: { tier: 'rising', continent: 'EUR', style: 'counter',    color: 'blue',   league: 'ITA' },
    RSA: { tier: 'rising', continent: 'AFR', style: 'counter',    color: 'yellow', league: 'ESP' },
    KSA: { tier: 'rising', continent: 'AFC', style: 'possession', color: 'green',  league: 'ESP' },
    COD: { tier: 'rising', continent: 'AFR', style: 'counter',    color: 'blue',   league: 'ENG' },
    GHA: { tier: 'dark',   continent: 'AFR', style: 'counter',    color: 'red',    league: 'ITA' },
    HAI: { tier: 'rising', continent: 'AFC', style: 'flair',      color: 'red',    league: 'ENG' },
    PAR: { tier: 'rising', continent: 'SAM', style: 'press',      color: 'red',    league: 'ESP' },
  };

  const allTeams = [];
  Object.values(T.groups).forEach(gr => gr.forEach(t => allTeams.push(t)));

  const quizCard = document.getElementById('quiz-card');
  let step = 0;
  const score = {};

  function mergeWeights(target, weights) {
    for (const k in weights) target[k] = (target[k] || 0) + weights[k];
  }

  function renderQuestion() {
    const q = questions[step];
    const progress = questions.map((_, i) => `<i class="${i < step ? 'done' : ''}"></i>`).join('');
    quizCard.innerHTML = `
      <div class="quiz-progress">${progress}</div>
      <div class="quiz-q">Q${step + 1}/${questions.length}. ${q.q}</div>
      <div class="quiz-options">
        ${q.opts.map((o, i) => `<button class="quiz-opt" data-i="${i}">${o.t}</button>`).join('')}
      </div>
    `;
    quizCard.querySelectorAll('.quiz-opt').forEach(btn => {
      btn.addEventListener('click', () => {
        const o = q.opts[parseInt(btn.dataset.i, 10)];
        mergeWeights(score, o.w);
        step++;
        if (step >= questions.length) renderResult();
        else renderQuestion();
      });
    });
  }

  function scoreTeam(code) {
    const m = teamMeta[code]; if (!m) return 0;
    let s = 0;
    // tier weights come in as numbers keyed by tier name
    if (score[m.tier]) s += score[m.tier] * 6;
    if (m.host && score.host) s += score.host * 5;
    if (score.continent === m.continent) s += 6;
    if (score.style === m.style) s += 5;
    if (score.color === m.color) s += 4;
    if (score.league === m.league) s += 3;
    // small randomisation so identical answers don't always give the same team
    s += Math.random() * 2;
    return s;
  }

  function renderResult() {
    let best = null, bestScore = -Infinity;
    allTeams.forEach(t => {
      const s = scoreTeam(t.code);
      if (s > bestScore) { bestScore = s; best = t; }
    });

    const blurb = ({
      elite:  'You love watching champions shine on the biggest stage.',
      strong: 'You enjoy heavyweight contenders who always show up.',
      dark:   'You believe the best stories come from teams who defy the odds.',
      rising: "You're here for fairy tales — history-makers, debutants and shocks."
    })[teamMeta[best.code] ? teamMeta[best.code].tier : 'strong'];

    quizCard.innerHTML = `
      <div class="quiz-result">
        <div class="flag">${window.Flags.img(best.flag, best.name, 'quiz-flag')}</div>
        <h3>${best.name}</h3>
        <p>${blurb} In 2026, your team to follow is <strong>${best.name}</strong>.</p>
        <div class="quiz-share">
          <button class="btn btn-primary" id="q-share">📋 Copy result</button>
          <a class="btn btn-ghost" href="https://twitter.com/intent/tweet?text=${encodeURIComponent('My 2026 World Cup team is ' + best.flag + ' ' + best.name + '! Find yours at')}&url=${encodeURIComponent(location.href)}" target="_blank" rel="noopener">𝕏 Share on X</a>
          <a class="btn btn-ghost" href="./predict.html?fav=${encodeURIComponent(best.code)}">Now build my bracket →</a>
          <button class="btn btn-ghost" id="q-again">↻ Take again</button>
        </div>
      </div>
    `;
    document.getElementById('q-share').addEventListener('click', () => {
      const text = `My 2026 World Cup team is ${best.flag} ${best.name}! Find yours at ${location.href}`;
      if (navigator.clipboard) navigator.clipboard.writeText(text);
      toast('Result copied to clipboard');
    });
    document.getElementById('q-again').addEventListener('click', () => {
      step = 0;
      Object.keys(score).forEach(k => delete score[k]);
      renderQuestion();
    });
  }

  renderQuestion();

  /* ---------------- Toast helper ---------------- */
  const toastEl = document.getElementById('toast');
  let toastTimer;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2400);
  }
  window.__toast = toast;
})();
