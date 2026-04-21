# World Cup 2026 Hub

A fan-made, traffic-oriented static site for the 2026 FIFA World Cup (USA · Canada · Mexico).
Everything is pure HTML/CSS/vanilla JavaScript — **no build step**, so it drops straight onto GitHub Pages.

## Pages

| File | Purpose |
| --- | --- |
| `index.html`   | Landing: live countdown, host cities map, all 12 groups, fan quiz |
| `predict.html` | Interactive bracket predictor with share link & autosave |

## Traffic strategy

- **SEO** — rich `<title>`/`<meta description>` per page, Open Graph + Twitter cards, `schema.org/SportsEvent` JSON-LD, `sitemap.xml` and `robots.txt` at the repo root.
- **Dwell time** — the bracket predictor keeps users on the site for 10+ minutes and saves progress to `localStorage`, bringing them back.
- **Virality** — every interactive widget (quiz, bracket) has a "share" button producing a link/text ready to drop on X/WhatsApp/Telegram.
- **Urgency** — the live countdown (updated every second) is a reason to revisit.

## Deploy to GitHub Pages

1. Push this repo to GitHub.
2. Go to **Settings → Pages**.
3. Set **Source** to the branch you want (e.g. `main`) and folder to `/ (root)`.
4. GitHub will publish the site at `https://<user>.github.io/<repo>/` within ~1 minute.

No build, no toolchain, no bundler — just static files.

## Local preview

```bash
python3 -m http.server 8080
# then open http://localhost:8080/
```

## File layout

```
.
├── index.html
├── predict.html
├── 404.html
├── robots.txt
├── sitemap.xml
├── css/styles.css
├── data/tournament.js      # all groups, teams and host cities
└── js/
    ├── main.js             # homepage
    └── predict.js          # bracket predictor
```

## Data source

Group stage (A–L) reflects the final draw confirmed on 1 Apr 2026.
Host city and stadium data reflect the 16 officially announced venues.
