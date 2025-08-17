# Concept Map Frontend (React + Vite)

Interactive D3.js concept map UI that fetches data from the Spring Boot backend, with an option to load directly from a raw JSON URL.

## Scripts

- npm run dev: Start Vite dev server on 127.0.0.1:5173
- npm run build: Production build to dist/
- npm run preview: Preview the production build
- npm run lint: Lint with ESLint
- npm run test:e2e: Run Playwright end-to-end tests (launches backend and frontend via config)

## Development

```bash
npm ci
npm run dev
```

## Data source configuration (ports/adapters)

The app can read concept-map data from either:

1) Spring Boot API (default): `${VITE_API_URL}/api/concept-map`
2) Direct raw JSON URL (override): `VITE_JSON_URL` or `?jsonUrl=` query param

Backend base defaults to `http://127.0.0.1:8080` if not provided.

Examples:

```bash
# Local dev (default)
VITE_API_URL=http://127.0.0.1:8080 npm run dev

# E2E/CI (Playwright sets this automatically)
VITE_API_URL=http://127.0.0.1:8080 npm run test:e2e

# Direct raw JSON (env)
VITE_JSON_URL=https://raw.githubusercontent.com/jdoner02/concept-map-d3js/refs/heads/main/src/main/resources/concept-map.json npm run dev

# Direct raw JSON (ad-hoc via query param)
npm run dev
# then open in browser:
# http://localhost:5173/?jsonUrl=https://raw.githubusercontent.com/jdoner02/concept-map-d3js/refs/heads/main/src/main/resources/concept-map.json
```

Notes:
- When `VITE_JSON_URL` or `?jsonUrl=` is set, the UI will fetch directly from that URL first, then fall back to the backend endpoints if it fails (CORS permitting).
- GitHub Pages serves static files only. Either use the direct JSON override or host the backend separately when using Pages.

## Visual encodings and forces

- **Node size**: derived from `node.size` (sqrt scaling) with a small level-based downscale; roots are larger than deeper levels. A per-level cap enforces parent > child visually.
- **Node color**: derived from `node.level` using a sequential scale (fallback ordinal for unknown). Legends and filters refer to "Levels."
- **Tree straightening**: level-aware forceX positions nodes horizontally by depth; forceY provides subtle vertical clustering. Link distances scale with level differences to encourage spreading.
- **Forces**: link (with level-aware distance), charge, collision (uses size), center, positional (x/y by level), diffusion force that gently pushes non-neighbors apart, and light jitter to keep motion "floaty," including at far zoom.

## Testing

- **E2E tests**: Playwright tests cover interaction patterns including:
  - Basic loading and rendering
  - Zoom-out dragging and persistent floaty motion
  - Diffusion spreading of unconnected nodes
  - Tree straightening (horizontal ordering by level)
  - Raw JSON data source override
  - Sims-like meta ring interactions
- Run tests: `npm run test:e2e`
- Tests are designed to be robust against timing variations and include retries for motion sampling.

## Deploy to GitHub Pages

- This repository includes a GitHub Actions workflow that builds and deploys the frontend to Pages from `frontend/dist`.
- **Fast deployment**: Pages deploy runs first, with post-deploy testing that can trigger automatic rollback on critical failures.
- Configure a raw JSON source via repository Variable `VITE_JSON_URL` (or set in the workflow env, or use query param).
- For project pages, the site will be served at `https://jdoner02.github.io/concept-map-d3js/` (your fork will use your username and repo name). The Vite base path is set automatically by `vite.config.js`.
- Live examples:
  - Default (with static fallback): `https://jdoner02.github.io/concept-map-d3js/`
  - With raw JSON override: `https://jdoner02.github.io/concept-map-d3js/?jsonUrl=https://raw.githubusercontent.com/jdoner02/concept-map-d3js/refs/heads/main/src/main/resources/concept-map.json`
  - Preview dataset: `https://jdoner02.github.io/concept-map-d3js/?jsonUrl=https://jdoner02.github.io/concept-map-d3js/concept-map-preview.json`
