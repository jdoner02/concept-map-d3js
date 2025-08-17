#!/usr/bin/env bash
set -euo pipefail

# Start Spring Boot backend and Vite frontend concurrently, then open browser to frontend
# macOS + zsh compatible
# Optional usage:
#   ./scripts/dev.sh                      # default (backend + frontend)
#   JSON_URL=... ./scripts/dev.sh         # override data source
#   PREVIEW=1 ./scripts/dev.sh            # quick-load preview dataset via ?jsonUrl

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

# Ensure frontend deps installed
if [ ! -d "frontend/node_modules" ]; then
  echo "Installing frontend dependencies..."
  (cd frontend && npm ci)
fi

# Trap to cleanup child processes on exit
pids=()
cleanup() {
  echo "\nShutting down..."
  for pid in "${pids[@]:-}"; do
    if kill -0 "$pid" 2>/dev/null; then
      kill "$pid" 2>/dev/null || true
    fi
  done
}
trap cleanup EXIT INT TERM

BACKEND_URL="http://localhost:8080/api/concept-map"
BACKEND_STARTED_BY_SCRIPT=0

# Check if backend already running and healthy
if curl -sSf "$BACKEND_URL" >/dev/null 2>&1; then
  echo "Detected Spring Boot backend already running on :8080 (reusing)."
else
  # If port 8080 is in use by something else, abort with a clear message
  if lsof -iTCP:8080 -sTCP:LISTEN >/dev/null 2>&1; then
    echo "Port 8080 is already in use, but the expected API $BACKEND_URL is not responding." >&2
    echo "Please stop the process bound to :8080 (e.g., 'lsof -iTCP:8080 -sTCP:LISTEN' to identify) or configure a different port." >&2
    exit 1
  fi

  # Start backend
  echo "Starting Spring Boot backend on :8080..."
  ( ./mvnw -q -DskipTests spring-boot:run ) &
  pids+=("$!")
  BACKEND_STARTED_BY_SCRIPT=1

  # Wait for backend API to respond
  printf "Waiting for backend to be ready"
  for i in {1..90}; do
    if curl -sSf "$BACKEND_URL" >/dev/null 2>&1; then
      echo "\nBackend is up."
      break
    fi
    printf "."
    sleep 1
    if [ "$i" -eq 90 ]; then
      echo "\nBackend failed to start in time." >&2
      exit 1
    fi
  done
fi

# Start frontend
echo "Starting Vite dev server on :5173..."
( cd frontend && npm run dev ) &
pids+=("$!")

# Wait for frontend and detect actual port
printf "Waiting for frontend to be ready"
FRONTEND_URL=""
for i in {1..60}; do
  for port in $(seq 5173 5183); do
    if curl -sSf "http://localhost:${port}" >/dev/null 2>&1; then
      FRONTEND_URL="http://localhost:${port}"
      break
    fi
  done
  if [ -n "$FRONTEND_URL" ]; then
    echo "\nFrontend is up on ${FRONTEND_URL}."
    break
  fi
  printf "."
  sleep 1
  if [ "$i" -eq 60 ]; then
    echo "\nFrontend failed to start in time." >&2
    exit 1
  fi
done

# Open browser to the detected frontend URL
OPEN_URL="${FRONTEND_URL:-http://localhost:5173}"
# Ensure static JSON files are directly served by the dev server
mkdir -p frontend/public
cp -f src/main/resources/concept-map.json frontend/public/concept-map.json
cp -f src/main/resources/concept-map-preview.json frontend/public/concept-map-preview.json 2>/dev/null || true

# If requested, append ?jsonUrl param for preview or env-provided override
if [ "${PREVIEW:-0}" = "1" ]; then
  # Use the detected frontend origin to avoid mixed content and wrong hosts
  FRONT_ORIGIN="${FRONTEND_URL%/}"
  OPEN_URL="$OPEN_URL/?jsonUrl=${FRONT_ORIGIN}/concept-map-preview.json"
elif [ -n "${JSON_URL:-}" ]; then
  OPEN_URL="$OPEN_URL/?jsonUrl=${JSON_URL}"
fi
echo "Opening $OPEN_URL"
if command -v open >/dev/null 2>&1; then
  open "$OPEN_URL" || echo "Please navigate to $OPEN_URL"
else
  echo "Please navigate to $OPEN_URL"
fi

echo "\nServers are running. Press Ctrl+C to stop."
wait
