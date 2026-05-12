#!/usr/bin/env bash
# Easy Essay — student launcher (macOS / Linux).
# Starts a local web server on port 8000 and opens the app.
set -e

cd "$(dirname "$0")"

PORT=8000
URL="http://localhost:$PORT"

# Pick a free port if 8000 is taken.
while lsof -i ":$PORT" -P -n 2>/dev/null | grep -q LISTEN; do
  PORT=$((PORT + 1))
done
URL="http://localhost:$PORT"

echo "──────────────────────────────────────────"
echo " Easy Essay — serving on $URL"
echo " (Press Ctrl+C in this terminal to stop.)"
echo "──────────────────────────────────────────"

# Open the browser after a brief delay so the server has time to bind.
(
  sleep 1
  if command -v open >/dev/null 2>&1; then open "$URL"           # macOS
  elif command -v xdg-open >/dev/null 2>&1; then xdg-open "$URL"  # Linux
  fi
) &

# Prefer python3, fall back to python.
if command -v python3 >/dev/null 2>&1; then
  exec python3 -m http.server "$PORT"
elif command -v python >/dev/null 2>&1; then
  exec python -m http.server "$PORT"
else
  echo
  echo "ERROR: Python is not installed. Install Python 3 from https://www.python.org/downloads/"
  exit 1
fi
