/* ============================================================
   "I'm going to World Cup 2026" — client-side poster generator
   - Pure HTML5 Canvas, no external libraries, instant rendering.
   - Twemoji is used for flag rendering so Windows/Linux desktop
     browsers (which lack regional-indicator emoji fonts) still
     see flags and so the generated PNG isn't filled with tofu.
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

  /* ---- Twemoji helper: convert flag emoji to its asset URL ---- */
  const TW_BASE = 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets';
  function flagTwemojiUrl(flag, kind) {
    const cp = [...flag].map(c => c.codePointAt(0).toString(16)).join('-');
    if (kind === 'svg') return `${TW_BASE}/svg/${cp}.svg`;
    return `${TW_BASE}/72x72/${cp}.png`;
  }

  /* ---- Flag grid ---- */
  function renderFlags() {
    flagGrid.innerHTML = '';
    teams.forEach(t => {
      const b = document.createElement('button');
      b.type = 'button';
      b.dataset.code = t.code;
      b.title = t.name;
      b.setAttribute('aria-label', t.name);
      const img = document.createElement('img');
      img.alt = t.name;
      img.loading = 'lazy';
      img.src = flagTwemojiUrl(t.flag, 'svg');
      img.className = 'flag-img';
      b.appendChild(img);
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
    if (nameInput.value.length > 20) nameInput.value = nameInput.value.slice(0, 20);
    state.name = nameInput.value;
    counter.textContent = `${state.name.length}/20`;
  });

  /* ---- Image caches ---- */
  const bgCache = {};
  const flagCache = {};

  function loadImage(src, opts = {}) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      if (opts.crossOrigin) img.crossOrigin = opts.crossOrigin;
      img.onload = () => resolve(img);
      img.onerror = e => reject(e);
      img.src = src;
    });
  }

  function loadBg(i) {
    if (bgCache[i]) return Promise.resolve(bgCache[i]);
    // Same-origin asset: no crossOrigin needed.
    return loadImage(`./assets/posters/bg${i}.webp`).then(img => (bgCache[i] = img));
  }

  function loadFlag(flag) {
    if (flagCache[flag]) return Promise.resolve(flagCache[flag]);
    // Twemoji CDN returns `access-control-allow-origin: *`, so the canvas
    // stays untainted with crossOrigin='anonymous' — required for toDataURL.
    return loadImage(flagTwemojiUrl(flag, 'svg'), { crossOrigin: 'anonymous' })
      .then(img => (flagCache[flag] = img));
  }
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

  function drawPoster(flagImg) {
    const W = 1200, H = 1600;
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, W, H);

    /* 1. Background */
    const bg = bgCache[state.bg];
    if (bg) {
      ctx.drawImage(bg, 0, 0, W, H);
    } else {
      ctx.fillStyle = '#0d0d34';
      ctx.fillRect(0, 0, W, H);
    }

    /* 2. Top chyron bar — broadcast-style */
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,.68)';
    ctx.fillRect(0, 0, W, 210);
    // Bottom gradient accent stripe on the chyron
    const stripe = ctx.createLinearGradient(0, 205, W, 205);
    stripe.addColorStop(0, '#ff2d8a');
    stripe.addColorStop(0.5, '#00a3ff');
    stripe.addColorStop(1, '#1ea64a');
    ctx.fillStyle = stripe;
    ctx.fillRect(0, 205, W, 6);
    ctx.restore();

    /* 3. Logo badge "26" — top-left */
    ctx.save();
    const badgeSize = 140;
    const bx = 60, by = 38;
    const grad = ctx.createLinearGradient(bx, by, bx + badgeSize, by + badgeSize);
    grad.addColorStop(0, '#ff2d8a');
    grad.addColorStop(0.5, '#00a3ff');
    grad.addColorStop(1, '#1ea64a');
    ctx.fillStyle = grad;
    drawRoundedRect(ctx, bx, by, badgeSize, badgeSize, 26);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = '900 90px "Bebas Neue", "Arial Black", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('26', bx + badgeSize / 2, by + badgeSize / 2 + 6);
    ctx.restore();

    /* 4. Tagline next to badge */
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.font = '700 32px "Inter", "Helvetica Neue", sans-serif';
    ctx.fillText('FIFA WORLD CUP', bx + badgeSize + 28, by + 22);
    ctx.font = '900 62px "Bebas Neue", "Arial Black", sans-serif';
    ctx.fillText('USA · CAN · MEX', bx + badgeSize + 28, by + 66);

    /* 5. Bottom chyron band with scoreboard feel */
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,.78)';
    ctx.fillRect(0, 1410, W, 190);
    const bstripe = ctx.createLinearGradient(0, 1408, W, 1408);
    bstripe.addColorStop(0, '#1ea64a');
    bstripe.addColorStop(0.5, '#ffd100');
    bstripe.addColorStop(1, '#ff2d8a');
    ctx.fillStyle = bstripe;
    ctx.fillRect(0, 1404, W, 6);
    ctx.restore();

    /* 6. Flag: big, centered above text */
    if (flagImg) {
      const size = 520;
      const fx = (W - size) / 2;
      const fy = 540;
      // Subtle glow under flag
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,.6)';
      ctx.shadowBlur = 50;
      ctx.shadowOffsetY = 25;
      ctx.drawImage(flagImg, fx, fy, size, size);
      ctx.restore();
    }

    /* 7. Scrim for text readability */
    const scrim = ctx.createLinearGradient(0, 1050, 0, 1410);
    scrim.addColorStop(0, 'rgba(5,5,31,0)');
    scrim.addColorStop(1, 'rgba(5,5,31,.82)');
    ctx.fillStyle = scrim;
    ctx.fillRect(0, 1050, W, 360);

    /* 8. Main name headline */
    const team = state.team;
    const name = (state.name || 'YOUR NAME').toUpperCase();
    const teamName = team ? team.name : 'THE WORLD CUP';

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const nameFont = (s) => `900 ${s}px "Bebas Neue", "Arial Black", sans-serif`;
    let size = 220;
    ctx.font = nameFont(size);
    while (ctx.measureText(name).width > W - 160 && size > 72) {
      size -= 8; ctx.font = nameFont(size);
    }
    // Gold/pink gradient
    const nameGrad = ctx.createLinearGradient(0, 1140 - size/2, 0, 1140 + size/2);
    nameGrad.addColorStop(0, '#ffd100');
    nameGrad.addColorStop(1, '#ff2d8a');
    ctx.fillStyle = nameGrad;
    ctx.shadowColor = 'rgba(0,0,0,.55)';
    ctx.shadowBlur = 20; ctx.shadowOffsetY = 6;
    ctx.fillText(name, W / 2, 1140);
    ctx.restore();

    /* 9. Subtitle */
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(255,255,255,.92)';
    ctx.font = '600 44px "Inter", sans-serif';
    ctx.fillText('is going to support', W / 2, 1250);
    ctx.restore();

    /* 10. Team name */
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    let tSize = 130;
    const tFont = (s) => `900 ${s}px "Bebas Neue", "Arial Black", sans-serif`;
    ctx.font = tFont(tSize);
    while (ctx.measureText(teamName.toUpperCase() + '!').width > W - 160 && tSize > 64) {
      tSize -= 6; ctx.font = tFont(tSize);
    }
    const tGrad = ctx.createLinearGradient(0, 1335 - tSize/2, 0, 1335 + tSize/2);
    tGrad.addColorStop(0, '#ffffff');
    tGrad.addColorStop(1, '#4fd0ff');
    ctx.fillStyle = tGrad;
    ctx.shadowColor = 'rgba(0, 163, 255, .55)';
    ctx.shadowBlur = 22;
    ctx.fillText(teamName.toUpperCase() + '!', W / 2, 1335);
    ctx.restore();

    /* 11. Bottom chyron text */
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff';
    ctx.font = '900 56px "Bebas Neue", "Arial Black", sans-serif';
    ctx.fillText('JUNE 11 – JULY 19 · 2026', W / 2, 1475);
    ctx.font = '600 24px "Inter", sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,.65)';
    ctx.fillText('worldcup2026hub · bracket predictor · host cities · poster', W / 2, 1535);
    ctx.restore();
  }

  async function generate() {
    if (!state.team) {
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
      // Show canvas BEFORE drawing — some browsers return blank
      // buffer from toDataURL when the element was display:none.
      placeholder.classList.add('hidden');
      canvas.classList.remove('hidden');
      btnDl.classList.remove('hidden');

      const [_, flagImg] = await Promise.all([
        loadBg(state.bg),
        loadFlag(state.team.flag).catch(() => null),
      ]);
      drawPoster(flagImg);

      btnDl.onclick = (e) => {
        e.preventDefault();
        try {
          const dataUrl = canvas.toDataURL('image/png');
          const link = document.createElement('a');
          const safe = state.name.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'fan';
          link.download = `wc2026-${safe}.png`;
          link.href = dataUrl;
          document.body.appendChild(link);
          link.click();
          link.remove();
        } catch (err) {
          console.error(err);
          alert('Could not save poster (browser blocked the export). Right-click the poster → Save Image As.');
        }
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
  nameInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); generate(); }
  });
})();
