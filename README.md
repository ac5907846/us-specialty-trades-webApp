# US Specialty Trade Contracting Industries (specialty.electriai.com)

A static, dependency-light web app (light mode only) that visualizes the structure, dynamism,
and pay of the US electrical (NAICS 238210) and plumbing/HVAC (238220)
contracting industries, and turns two of the findings into interactive tools:

- **Industry pulse**: headline indicators and the four core trends
  (consolidation, tail exponent, entry/exit, pay).
- **Market outlook**: harmonised county Markov transition matrices as an
  interactive "where does a market like yours go next" tool.
- **Consolidation lab**: three implications tools built from the paper's
  estimates: the location-scale pay-dispersion simulator, a 500+-share
  extrapolation, and a BDS-based succession clock.
- **About**: what the site is, sources, definitions, JSON downloads, paper and code links.
- **Wage benchmark**: place any hourly wage in the official OEWS percentile
  distribution for electricians, plumbers, or HVAC mechanics, by state and
  year (2003-2024).
- **Survival outlook**: turn observed BDS firm dissolution rates into
  survival odds over a chosen horizon, by firm size class.
- **State explorer**: one state's establishments, pay, wage premium, and
  large-establishment share against the national line (CBP, 1998-2023).

Everything is computed from public federal data. No tracking, no backend,
no build step.

## Structure

```
06_Web App/
├── index.html            app shell (single page, four views)
├── css/
│   ├── base.css          design tokens (light + dark), layout
│   └── components.css    tabs, tiles, cards, controls
├── js/
│   ├── app.js            boot, tab routing, theme toggle
│   ├── config.js         labels, palette resolution from CSS vars
│   ├── data.js           fetch layer for /data JSONs
│   ├── format.js         number formatting
│   ├── charts.js         Chart.js factory helpers
│   └── views/
│       ├── overview.js
│       ├── wage.js
│       ├── survival.js
│       ├── states.js
│       ├── outlook.js
│       ├── lab.js
│       └── methods.js
├── data/                 generated JSON series (the app's only data source)
├── assets/favicon.svg
└── scripts/build_data.py regenerates /data from the research pipeline
```

Charts are rendered with Chart.js 4 loaded from cdnjs; everything else is
vanilla ES modules.

## Run locally

Browsers block `fetch()` on `file://` pages, so serve the folder:

```
cd "06_Web App"
python -m http.server 8000
```

then open http://localhost:8000. Production domain: https://specialty.electriai.com

## Refresh the data

The JSON files in `data/` are derived from the processed outputs of the
research pipeline (`01_data/03_processed` and `02_analysis/_output/tables`).
After re-running the pipeline:

```
cd "06_Web App"
py -3.12 scripts/build_data.py
```

## Deploy: GitHub Pages + Cloudflare

1. Create a GitHub repository and push the contents of this folder (the
   folder itself is the site root; `index.html` at the top level).
2. Repository Settings -> Pages -> Source: `Deploy from a branch`, branch
   `main`, folder `/ (root)`. The site appears at
   `https://<user>.github.io/<repo>/`.
3. Custom domain via Cloudflare: add your domain to Cloudflare, then in
   GitHub Pages set the custom domain (creates a CNAME file). In Cloudflare
   DNS add a `CNAME` record pointing the (sub)domain at
   `<user>.github.io`, proxy on or off both work; enable `Full` SSL.
4. Nothing else to configure: the app is static files only.

## Data sources

US Census Bureau: Statistics of US Businesses, County Business Patterns
(harmonised across the 2017 disclosure redesign), Business Dynamics
Statistics. US Bureau of Labor Statistics: Occupational Employment and Wage
Statistics. See the companion research manuscript for methods and caveats.
