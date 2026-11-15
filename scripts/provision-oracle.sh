#!/usr/bin/env bash
set -euo pipefail
if [ -e /etc/nginx/sites-available/theshortcutacademy.in ]; then
  echo 'Initial provisioning only: an existing academy Nginx configuration must be preserved.' >&2
  exit 1
fi
id academy >/dev/null 2>&1 || useradd --system --home-dir /var/lib/shortcut-academy --shell /usr/sbin/nologin academy
install -d -m 755 /opt/shortcut-academy/releases/20261004 /etc/shortcut-academy
install -d -m 750 -o academy -g academy /var/lib/shortcut-academy
tar -xzf /home/ubuntu/academy-release.tar.gz -C /opt/shortcut-academy/releases/20261004
cd /opt/shortcut-academy/releases/20261004
npm ci --omit=dev --ignore-scripts --no-audit --no-fund
chown -R root:root /opt/shortcut-academy
ln -sfn /opt/shortcut-academy/releases/20261004 /opt/shortcut-academy/current
if [ ! -f /etc/shortcut-academy/app.env ]; then
  umask 077
  cat > /etc/shortcut-academy/app.env <<'ENV'
NODE_ENV=production
HOST=127.0.0.1
PORT=3100
APP_ORIGIN=https://theshortcutacademy.in
PUBLIC_ORIGIN=https://theshortcutacademy.in
DATABASE_PATH=/var/lib/shortcut-academy/academy.sqlite
GOOGLE_CLIENT_ID=
LEGAL_APPROVED=false
TRUST_PROXY=true
ENV
  printf 'AUTH_SECRET=%s\n' "$(openssl rand -hex 48)" >> /etc/shortcut-academy/app.env
fi
cat > /etc/systemd/system/shortcut-academy.service <<'SERVICE'
[Unit]
Description=The Shortcut Academy website
After=network-online.target
Wants=network-online.target
[Service]
Type=simple
User=academy
Group=academy
WorkingDirectory=/opt/shortcut-academy/current
EnvironmentFile=/etc/shortcut-academy/app.env
ExecStart=/usr/bin/node --max-old-space-size=256 server.mjs
Restart=on-failure
RestartSec=5
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/var/lib/shortcut-academy
UMask=0077
MemoryMax=400M
TasksMax=64
[Install]
WantedBy=multi-user.target
SERVICE
cat > /etc/nginx/sites-available/theshortcutacademy.in <<'NGINX'
server {
    listen 80;
    server_name theshortcutacademy.in www.theshortcutacademy.in;
    server_tokens off;
    client_max_body_size 64k;
    access_log /var/log/nginx/shortcut-academy.access.log;
    error_log /var/log/nginx/shortcut-academy.error.log;
    location / {
        proxy_pass http://127.0.0.1:3100;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 35s;
    }
    gzip on;
    gzip_types text/css text/javascript application/javascript application/json image/svg+xml;
}
NGINX
ln -sfn /etc/nginx/sites-available/theshortcutacademy.in /etc/nginx/sites-enabled/theshortcutacademy.in
nginx -t
systemctl daemon-reload
systemctl enable --now shortcut-academy
systemctl reload nginx
sleep 2
curl --fail --silent http://127.0.0.1:3100/health
systemctl --no-pager --full status shortcut-academy | head -16
