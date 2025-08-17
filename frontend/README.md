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

## Deploy to GitHub Pages

- This repository includes a GitHub Actions workflow that builds and deploys the frontend to Pages from `frontend/dist`.
- Configure a raw JSON source via repository Variable `VITE_JSON_URL` (or set in the workflow env, or use query param).
- For project pages, the site will be served at `https://<user>.github.io/<repo>/` and the Vite base path is set automatically by `vite.config.js`.
- Live example with raw JSON override:
	`https://jdoner02.github.io/concept-map-d3js/?jsonUrl=https://raw.githubusercontent.com/jdoner02/concept-map-d3js/refs/heads/main/src/main/resources/concept-map.json`
