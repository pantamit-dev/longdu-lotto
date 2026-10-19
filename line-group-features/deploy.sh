#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

SERVICE_NAME="${SERVICE_NAME:-group-features}"
GCP_PROJECT_ID="${GCP_PROJECT_ID:-data-beat-labs}"
GCP_REGION="${GCP_REGION:-asia-southeast1}"
GCP_ACCOUNT="${GCP_ACCOUNT:-punsiri.boo@gmail.com}"
MEMORY="${MEMORY:-512Mi}"
TIMEOUT="${TIMEOUT:-300}"

if [[ ! -f .env ]]; then
  echo ".env not found. Copy .env.example and fill in the keys." >&2
  exit 1
fi

ENV_FILE="$(mktemp)"
trap 'rm -f "$ENV_FILE"' EXIT

python3 - "$ENV_FILE" << 'PY'
import sys
from pathlib import Path

destination = Path(sys.argv[1])
lines = []
for raw in Path(".env").read_text().splitlines():
    line = raw.strip()
    if not line or line.startswith("#") or "=" not in line:
        continue
    key, value = line.split("=", 1)
    value = value.strip().strip('"').strip("'")
    escaped = value.replace("\\", "\\\\").replace('"', '\\"')
    lines.append(f'{key.strip()}: "{escaped}"')
destination.write_text("\n".join(lines) + "\n")
PY

gcloud run deploy "$SERVICE_NAME" \
  --account="$GCP_ACCOUNT" \
  --project="$GCP_PROJECT_ID" \
  --region="$GCP_REGION" \
  --source=. \
  --function=callback \
  --clear-base-image \
  --allow-unauthenticated \
  --memory="$MEMORY" \
  --timeout="$TIMEOUT" \
  --max-instances=1 \
  --cpu-boost \
  --env-vars-file="$ENV_FILE" \
  --quiet

URL="$(gcloud run services describe "$SERVICE_NAME" \
  --account="$GCP_ACCOUNT" \
  --project="$GCP_PROJECT_ID" \
  --region="$GCP_REGION" \
  --format='value(status.url)')"

echo ""
echo "Set this Webhook URL in LINE Developers Console:"
echo "  ${URL}"
