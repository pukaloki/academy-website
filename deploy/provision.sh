#!/bin/bash
# ============================================================
# The Shortcut Academy — Server Provisioning Script
# Run as root on a fresh Ubuntu 22.04+ server
# ============================================================

set -euo pipefail

DOMAIN="${1:-}"
if [ -z "$DOMAIN" ]; then
  echo "Usage: sudo bash provision.sh YOUR_DOMAIN"
  echo "Example: sudo bash provision.sh theshortcutacademy.in"
  exit 1
fi

echo "=== Provisioning The Shortcut Academy for $DOMAIN ==="

# 1. System updates
echo "[1/8] Updating system..."
apt-get update -y && apt-get upgrade -y

# 2. Install Node.js 22.x
echo "[2/8] Installing Node.js..."
if ! command -v node &>/dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi
echo "Node.js $(node --version)"

# 3. Install Nginx
echo "[3/8] Installing Nginx..."
apt-get install -y nginx
systemctl enable nginx

# 4. Create academy user
echo "[4/8] Creating academy user..."
if ! id academy &>/dev/null; then
  useradd --system --shell /usr/sbin/nologin --home-dir /opt/shortcut-academy academy
fi

# 5. Create directory structure
echo "[5/8] Setting up directories..."
mkdir -p /opt/shortcut-academy/current
mkdir -p /var/lib/shortcut-academy
mkdir -p /etc/shortcut-academy

# 6. Copy app files (assumes this script is in the project's deploy/ directory)
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "[6/8] Copying application files..."
# Copy all project files except deploy/, node_modules/, data/, .env, .git/
rsync -av --exclude='deploy/' --exclude='node_modules/' --exclude='data/' \
  --exclude='.env' --exclude='.git/' --exclude='.DS_Store' \
  --exclude='Acdamey longform/' --exclude='Acdmey short form/' \
  --exclude='dark-glass-ui-redesign*/' --exclude='hero-background-animation*/' \
  --exclude='ring-view-carousel*/' --exclude='.opencode/' \
  --exclude='.playwright-cli/' --exclude='.superdesign/' \
  --exclude='dist/' --exclude='*.pdf' \
  "$PROJECT_DIR/" /opt/shortcut-academy/current/

# Install npm dependencies
cd /opt/shortcut-academy/current
npm ci --omit=dev 2>/dev/null || npm install --omit=dev

# Symlink database to persistent location
ln -sf /var/lib/shortcut-academy /opt/shortcut-academy/current/data

# Set ownership
chown -R academy:academy /opt/shortcut-academy
chown -R academy:academy /var/lib/shortcut-academy

# 7. Configure env file (if not already present)
echo "[7/8] Setting up configuration..."
if [ ! -f /etc/shortcut-academy/app.env ]; then
  cat > /etc/shortcut-academy/app.env << 'ENVEOF'
PORT=3100
HOST=127.0.0.1
APP_ORIGIN=http://127.0.0.1:3100
NODE_ENV=production
DATABASE_PATH=/var/lib/shortcut-academy/academy.sqlite

# === FILL IN YOUR OWN CREDENTIALS BELOW ===

# Razorpay payment gateway (get from https://dashboard.razorpay.com)
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=

# Email via Resend (get from https://resend.com)
RESEND_API_KEY=
EMAIL_FROM=
ADMIN_EMAIL=

# Session signing secret — generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
AUTH_SECRET=

# Google OAuth client ID (get from https://console.cloud.google.com)
GOOGLE_CLIENT_ID=

# Enable payments (set to true after legal review)
LEGAL_APPROVED=false
TRUST_PROXY=true

# Your HTTPS domain without trailing slash
PUBLIC_ORIGIN=https://YOUR_DOMAIN
ENVEOF
  sed -i "s/YOUR_DOMAIN/$DOMAIN/g" /etc/shortcut-academy/app.env
  chmod 600 /etc/shortcut-academy/app.env
  chown root:academy /etc/shortcut-academy/app.env
  echo "  → Created /etc/shortcut-academy/app.env — EDIT THIS FILE WITH YOUR CREDENTIALS"
else
  echo "  → /etc/shortcut-academy/app.env already exists, skipping"
fi

# 8. Install systemd service and nginx config
echo "[8/8] Installing service files..."
cp "$SCRIPT_DIR/shortcut-academy.service" /etc/systemd/system/
systemctl daemon-reload
systemctl enable shortcut-academy.service

# Nginx config
sed "s/YOUR_DOMAIN/$DOMAIN/g" "$SCRIPT_DIR/nginx-site.conf" > "/etc/nginx/sites-available/$DOMAIN"
ln -sf "/etc/nginx/sites-available/$DOMAIN" "/etc/nginx/sites-enabled/$DOMAIN"
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

echo ""
echo "============================================"
echo "  Provisioning complete!"
echo "============================================"
echo ""
echo "Next steps:"
echo "  1. Edit credentials:  sudo nano /etc/shortcut-academy/app.env"
echo "  2. Install SSL:       sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN"
echo "  3. Copy video files to: /opt/shortcut-academy/current/public/videos/"
echo "  4. Start the service: sudo systemctl start shortcut-academy.service"
echo "  5. Check status:      sudo systemctl status shortcut-academy.service"
echo "  6. View logs:         sudo journalctl -u shortcut-academy.service -f"
echo ""
