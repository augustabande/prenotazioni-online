#!/usr/bin/env bash
set -euo pipefail

API_URL="${1:?Usage: smoke-test.sh <API_BASE_URL>}"
FAIL=0

check() {
  local endpoint="$1"
  local url="${API_URL}${endpoint}"
  local status
  status=$(curl -s -o /dev/null -w "%{http_code}" "$url")
  if [ "$status" -eq 200 ]; then
    echo "✅ $endpoint → $status"
  else
    echo "❌ $endpoint → $status"
    FAIL=1
  fi
}

echo "🔍 Smoke test: $API_URL"
echo "─────────────────────────"

check "/api/health"
check "/api/lesson-types"
check "/api/slots"

echo "─────────────────────────"
if [ "$FAIL" -eq 0 ]; then
  echo "✅ All checks passed"
else
  echo "❌ Some checks failed"
  exit 1
fi
