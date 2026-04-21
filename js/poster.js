/* ============================================================
   "I'm going to World Cup 2026" — client-side poster generator
   - Pure HTML5 Canvas, no external libraries, instant rendering.
   - User picks a name + team + background template; we render a
     shareable 1200×1600 poster and expose a direct download link.
   ============================================================ */
(function () {
  const form = document.getElementById('poster-form');
  if (!form) return;

  const T = window.TOURNAMENT;
  const nameInput = document.getElementById('poster-name');
  const counter   = document.getElementById('poster-name-counter');
  const flagGrid  = document.getElementById('poster-team-grid');
  const bgGrid    = document.getElementById('poster-bg-grid');
  const btnGen    = document.getElementById('poster-generate');
  const btnDl     = document.getElementById('poster-download');
  const stage     = document.getElementById('poster-stage');
  const canvas    = document.getElementById('poster-canvas');
  const placeholder = document.getElementById('poster-placeholder');

  /* ---- State ---- */
  const state = {
    name: '',
    team: null,
    bg: 1,
  };

  /* ---- Teams alphabetical ---- */
  const teams = [];
  Object.entries(T.groups).forEach(([L, arr]) => arr.forEach(t => teams.push({ ...t, group: L })));
  teams.sort((a, b) => a.name.localeCompare(b.name));

  /* ---- Flag grid ---- */
  function renderFlags() {
    flagGrid.innerHTML = '';
    teams.forEach(t => {
      const b = document.createElement('button');
      b.type = 'button';
      b.dataset.code = t.code;
      b.title = t.name;
      b.setAttribute('aria-label', t.name);
      b.innerHTML = `<span aria-hidden="true">${t.flag}</span>`;
      if (state.team && state.team.code === t.code) b.classList.add('active');
      b.addEventListener('click', () => {
        state.team = t;
        renderFlags();
      });
      flagGrid.appendChild(b);
    });
  }
  renderFlags();

  /* ---- Background selector ---- */
  const BG_COUNT = 4;
  for (let i = 1; i <= BG_COUNT; i++) {
    const b = document.createElement('button');
    b.type = 'button';
    b.style.backgroundImage = `url("./assets/posters/bg${i}.webp")`;
    b.dataset.bg = i;
    b.setAttribute('aria-label', `Poster style ${i}`);
    if (i === state.bg) b.classList.add('active');
    b.addEventListener('click', () => {
      state.bg = i;
      bgGrid.querySelectorAll('button').forEach(btn => btn.classList.toggle('active', +btn.dataset.bg === i));
    });
    bgGrid.appendChild(b);
  }

  /* ---- Name input ---- */
  nameInput.addEventListener('input', () => {
    // Hard-cap 20 chars
    if (nameInput.value.length > 20) nameInput.value = nameInput.value.slice(0, 20);
    state.name = nameInput.value;
    counter.textContent = `${state.name.length}/20`;
  });

  /* ---- Background cache ---- */
  const bgCache = {};
  function loadBg(i) {
    if (bgCache[i]) return Promise.resolve(bgCache[i]);
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => { bgCache[i] = img; resolve(img); };
      img.onerror = reject;
      img.src = `./assets/posters/bg${i}.webp`;
    });
  }
  // Pre-warm first bg so click feels instant
  loadBg(1).catch(() => {});

  /* ---- Canvas draw primitives ---- */
  function drawRoundedRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y,     x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x,     y + h, r);
    ctx.arcTo(x,     y + h, x,     y,     r);
    ctx.arcTo(x,     y,     x + w, y,     r);
    ctx.closePath();
  }

  function wrapName(ctx, text, maxWidth) {
    // Very short strings (1 word) just return as-is.
    if (ctx.measureText(text).width <= maxWidth) return [text];
    const words = text.split(/\s+/);
    const lines = []; let line = '';
    for (const w of words) {
      const candidate = line ? line + ' ' + w : w;
      if (ctx.measureText(candidate).width > maxWidth && line) {
        lines.push(line); line = w;
      } else {
        line = candidate;
      }
    }
    if (line) lines.push(line);
    return lines;
  }

  function drawPoster() {
    const W = 1200, H = 1600;
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, W, H);

    // 1. Background
    const bg = bgCache[state.bg];
    if (bg) {
      ctx.drawImage(bg, 0, 0, W, H);
    } else {
      ctx.fillStyle = '#0d0d34';
      ctx.fillRect(0, 0, W, H);
    }

    // 2. Soft gradient scrim so text stays readable
    const scrim = ctx.createLinearGradient(0, H * 0.45, 0, H);
    scrim.addColorStop(0, 'rgba(5, 5, 31, 0)');
    scrim.addColorStop(0.6, 'rgba(5, 5, 31, .55)');
    scrim.addColorStop(1, 'rgba(5, 5, 31, .85)');
    ctx.fillStyle = scrim;
    ctx.fillRect(0, 0, W, H);

    // 3. Logo badge "26" — top-left
    ctx.save();
    const badgeSize = 150;
    const bx = 60, by = 60;
    const grad = ctx.createLinearGradient(bx, by, bx + badgeSize, by + badgeSize);
    grad.addColorStop(0, '#ff2d8a');
    grad.addColorStop(0.5, '#00a3ff');
    grad.addColorStop(1, '#00e5a0');
    ctx.fillStyle = grad;
    drawRoundedRect(ctx, bx, by, badgeSize, badgeSize, 28);
    ctx.fill();
    ctx.shadowColor = 'rgba(255, 45, 138, .6)';
    ctx.shadowBlur = 40;
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#fff';
    ctx.font = '900 96px "Inter", "Arial Black", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('26', bx + badgeSize / 2, by + badgeSize / 2 + 6);
    ctx.restore();

    // 4. Small tagline next to badge
    ctx.fillStyle = 'rgba(255,255,255,.85)';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.font = '700 28px "Inter", sans-serif';
    ctx.fillText('FIFA WORLD CUP', bx + badgeSize + 28, by + 22);
    ctx.font = '800 48px "Inter", sans-serif';
    ctx.fillText('USA · CAN · MEX', bx + badgeSize + 28, by + 64);

    // 5. Giant flag of team (center, above text)
    const team = state.team;
    if (team) {
      ctx.save();
      ctx.font = '520px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(0,0,0,.55)';
      ctx.shadowBlur = 60;
      ctx.shadowOffsetY = 20;
      ctx.fillText(team.flag, W / 2, 760);
      ctx.restore();
    }

    // 6. Main headline: "NAME is going to support TEAM!"
    const name = (state.name || 'Your name').toUpperCase();
    const teamName = team ? team.name : 'THE WORLD CUP';

    // Name — very large, uses gradient fill
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const nameFont = (s) => `900 ${s}px "Inter","Arial Black",sans-serif`;
    // Pick size that fits
    let size = 160;
    ctx.font = nameFont(size);
    while (ctx.measureText(name).width > W - 160 && size > 64) {
      size -= 8; ctx.font = nameFont(size);
    }
    const nameGrad = ctx.createLinearGradient(0, 1120 - size/2, 0, 1120 + size/2);
    nameGrad.addColorStop(0, '#ffe45c');
    nameGrad.addColorStop(1, '#ff2d8a');
    ctx.fillStyle = nameGrad;
    ctx.shadowColor = 'rgba(0,0,0,.45)';
    ctx.shadowBlur = 20; ctx.shadowOffsetY = 6;
    ctx.fillText(name, W / 2, 1120);
    ctx.restore();

    // Subtitle line 1
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(255,255,255,.92)';
    ctx.font = '600 44px "Inter", sans-serif';
    ctx.fillText('is going to support', W / 2, 1240);
    ctx.restore();

    // Team name — second highlight
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    let tSize = 110;
    const tFont = (s) => `900 ${s}px "Inter","Arial Black",sans-serif`;
    ctx.font = tFont(tSize);
    while (ctx.measureText(teamName.toUpperCase() + '!').width > W - 160 && tSize > 54) {
      tSize -= 6; ctx.font = tFont(tSize);
    }
    const tGrad = ctx.createLinearGradient(0, 1330 - tSize/2, 0, 1330 + tSize/2);
    tGrad.addColorStop(0, '#ffffff');
    tGrad.addColorStop(1, '#4fd0ff');
    ctx.fillStyle = tGrad;
    ctx.shadowColor = 'rgba(0, 163, 255, .5)';
    ctx.shadowBlur = 22;
    ctx.fillText(teamName.toUpperCase() + '!', W / 2, 1330);
    ctx.restore();

    // Footer ribbon
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(255,255,255,.7)';
    ctx.font = '600 28px "Inter", sans-serif';
    ctx.fillText('JUNE 11 — JULY 19, 2026', W / 2, 1470);
    ctx.font = '700 22px "Inter", sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,.55)';
    ctx.fillText('worldcup2026hub · bracket predictor · host cities', W / 2, 1520);
    ctx.restore();
  }

  async function generate() {
    if (!state.team) {
      nameInput.focus();
      alert('Pick a team first ✈️');
      return;
    }
    if (!state.name.trim()) {
      nameInput.focus();
      return;
    }
    btnGen.disabled = true;
    btnGen.textContent = 'Generating…';
    try {
      await loadBg(state.bg);
      drawPoster();
      placeholder.classList.add('hidden');
      canvas.classList.remove('hidden');
      btnDl.classList.remove('hidden');
      // Provide download link
      btnDl.onclick = () => {
        const link = document.createElement('a');
        const safe = state.name.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'fan';
        link.download = `wc2026-${safe}.png`;
        link.href = canvas.toDataURL('image/png');
        document.body.appendChild(link);
        link.click();
        link.remove();
      };
    } catch (e) {
      console.error(e);
      alert('Could not generate poster. Please try again.');
    } finally {
      btnGen.disabled = false;
      btnGen.textContent = '✨ Generate Poster';
    }
  }

  btnGen.addEventListener('click', generate);

  // Allow Enter in the name field to trigger generation.
  nameInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); generate(); }
  });
})();
