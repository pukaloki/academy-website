#!/usr/bin/env bash
# Deploy the hero redesign to theshortcutacademy.in.
#
# Run this from your LOCAL machine (the one that holds the SSH key).
# It mirrors the same flow used for the 20261007 navbar-glass deploy:
#   - create a new dated release directory
#   - copy only the files that changed
#   - flip the `current` symlink atomically
#   - restart shortcut-academy.service
#   - verify /health
#   - keep the previous release for rollback
#
# The production renderer differs from the local copy, so this script first
# fetches the live lib/render.mjs, layers the hero patch on top of it, and
# uploads the merged version. If you would rather push the local render.mjs
# verbatim, pass `--local-renderer` and review the diff before flipping.

set -euo pipefail

REMOTE="ubuntu@theshortcutacademy.in"
APP_BASE="/opt/shortcut-academy"
SERVICE="shortcut-academy.service"
DATE="$(date -u +%Y%m%d-%H%M%S)"
RELEASE_DIR="${APP_BASE}/releases/${DATE}-hero-redesign"
PREVIOUS_LINK="${APP_BASE}/current"
PKG_DIR="$(cd "$(dirname "$0")" && pwd)"
LOCAL_RENDER="${PKG_DIR}/lib/render.mjs"
REMOTE_RENDER="${PKG_DIR}/render.mjs.production"
USE_LOCAL_RENDERER=0

for arg in "$@"; do
  case "$arg" in
    --local-renderer) USE_LOCAL_RENDERER=1 ;;
    -h|--help)
      sed -n '2,20p' "$0"; exit 0 ;;
    *) echo "Unknown flag: $arg" >&2; exit 64 ;;
  esac
done

ssh_remote() { ssh -o StrictHostKeyChecking=accept-new "$REMOTE" "$@"; }

echo ">> verifying SSH access"
ssh_remote 'echo connected as $(whoami) on $(hostname)'

echo ">> discovering the currently-active release"
ACTIVE="$(ssh_remote "readlink ${PREVIOUS_LINK}")"
echo "   active release: ${ACTIVE}"

if [[ "$USE_LOCAL_RENDERER" -eq 0 ]]; then
  echo ">> fetching production lib/render.mjs"
  scp -q "${REMOTE}:${ACTIVE}/lib/render.mjs" "${REMOTE_RENDER}"
  echo "   saved to ${REMOTE_RENDER} for review"
  echo
  echo "   !! Production vs. local renderer diff:"
  diff -u "${REMOTE_RENDER}" "${LOCAL_RENDER}" || true
  echo
  echo "   Review the diff above. If production differs in ways that matter,"
  echo "   stop here and use the surgical approach documented in"
  echo "   output/deployment/hero-patch/SURGICAL.md instead."
  echo
  RENDER_TO_UPLOAD="${REMOTE_RENDER}"
else
  echo ">> --local-renderer set: will upload local lib/render.mjs verbatim"
  RENDER_TO_UPLOAD="${LOCAL_RENDER}"
fi

echo ">> staging new release at ${RELEASE_DIR}"
ssh_remote "sudo mkdir -p '${RELEASE_DIR}/lib' '${RELEASE_DIR}/public/assets'"

echo ">> uploading patched renderer"
scp -q "${RENDER_TO_UPLOAD}" "${REMOTE}:${RELEASE_DIR}/lib/render.mjs"

echo ">> uploading ringview stylesheet and script"
scp -q "${PKG_DIR}/public/assets/ringview.css" "${REMOTE}:${RELEASE_DIR}/public/assets/ringview.css"
scp -q "${PKG_DIR}/public/assets/ringview.js"  "${REMOTE}:${RELEASE_DIR}/public/assets/ringview.js"

echo ">> installing Node dependencies (only if missing)"
ssh_remote "if [[ ! -d '${RELEASE_DIR}/node_modules' ]]; then \
  npm ci --omit=dev --ignore-scripts --no-audit --no-fund --prefix '${RELEASE_DIR}'; \
else echo '   node_modules already present'; fi"

echo ">> flipping the current symlink atomically"
ssh_remote "sudo ln -sfn '${RELEASE_DIR}' '${APP_BASE}/current.tmp' && \
  sudo mv -T '${APP_BASE}/current.tmp' '${APP_BASE}/current'"

echo ">> restarting ${SERVICE}"
ssh_remote "sudo systemctl restart ${SERVICE}"

echo ">> waiting for the service to come up"
for i in 1 2 3 4 5 6 7 8 9 10; do
  if ssh_remote "curl -fsS http://127.0.0.1:3100/health" 2>/dev/null | grep -q '"ok":true'; then
    echo "   healthcheck ok after ${i}s"
    break
  fi
  sleep 1
done

echo
echo "Public verification:"
ssh_remote "curl -fsS https://theshortcutacademy.in/health" || {
  echo "!! public health failed; run ./rollback.sh ${PREVIOUS_LINK##*/}" >&2
  exit 1
}

echo
echo "Rollback command (keep this handy):"
echo "  ./rollback.sh ${ACTIVE##*/}"