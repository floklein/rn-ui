#!/usr/bin/env bash
set -uo pipefail
cd "$(dirname "$0")/.."

if [ -n "${BOOT_START:-}" ]; then
  echo "boot=$(($(date +%s) - BOOT_START))" >> "$TIMINGS"
fi

start=$(date +%s)
"$APPIUM_BIN" --port 4723 --log "$RUNNER_TEMP/appium.log" > /dev/null 2>&1 &
appium=$!
until curl -sf http://127.0.0.1:4723/status > /dev/null; do
  if ! kill -0 "$appium" 2> /dev/null; then
    cat "$RUNNER_TEMP/appium.log"
    exit 1
  fi
  sleep 1
done
echo "appium_start=$(($(date +%s) - start))" >> "$TIMINGS"

failed=0
for spec in switch dialog; do
  start=$(date +%s)
  node --test "specs/$spec.spec.ts"
  code=$?
  echo "spec_$spec=$(($(date +%s) - start))" >> "$TIMINGS"
  echo "spec_${spec}_exit=$code" >> "$TIMINGS"
  [ "$code" -eq 0 ] || failed=1
done

kill "$appium"
exit "$failed"
