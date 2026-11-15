#!/usr/bin/env bash
# Roll the hero deploy back to the release named in $1 (or the previous active).
# Usage: ./rollback.sh [release-dir-name]
set -euo pipefail

REMOTE="ubuntu@theshortcutacademy.in"
APP_BASE="/opt/shortcut-academy"
SERVICE="shortcut-academy.service"
TARGET="${1:-}"

if [[ -z "$TARGET" ]]; then
  echo "Reading the most recent release before the active one..."
  TARGET="$(ssh -o StrictHostKeyChecking=accept-new "$REMOTE" \
    "ls -1 ${APP_BASE}/releases | sort | sed -n '/^current\$/d;p' | tail -1")"
fi

echo "Rolling back to release: ${TARGET}"
ssh -o StrictHostKeyChecking=accept-new "$REMOTE" \
  "sudo ln -sfn '${APP_BASE}/releases/${TARGET}' '${APP_BASE}/current.tmp' && \
   sudo mv -T '${APP_BASE}/current.tmp' '${APP_BASE}/current' && \
   sudo systemctl restart ${SERVICE} && \
   sleep 2 && \
   curl -fsS https://theshortcutacademy.in/health"