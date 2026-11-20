# The Shortcut Academy — Migration Guide

Complete guide to deploy this website on a new server.

## Prerequisites

- **Ubuntu 22.04+** server (1 CPU, 1 GB RAM minimum)
- A **domain name** pointed to your server's IP address
- SSH access to the server

## Architecture

```
Internet → Nginx (port 443, SSL) → Node.js (port 3100) → SQLite database
```

- **Backend:** Node.js 22+ (single-file server, no framework)
- **Database:** SQLite with WAL mode (zero config, file-based)
- **Payments:** Razorpay (Indian payment gateway)
- **Auth:** Google OAuth 2.0
- **Email:** Resend transactional email
- **SSL:** Let's Encrypt via Certbot

## Quick Deploy (Automated)

```bash
# 1. Clone the repo on your server
git clone https://github.com/pukaloki/academy-website.git
cd academy-website

# 2. Run the provisioning script
sudo bash deploy/provision.sh yourdomain.com

# 3. Edit the env file with your credentials
sudo nano /etc/shortcut-academy/app.env

# 4. Install SSL certificate
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# 5. Copy video files
sudo cp -r /path/to/your/videos/* /opt/shortcut-academy/current/public/videos/
sudo chown -R academy:academy /opt/shortcut-academy/current/public/videos/

# 6. Start the service
sudo systemctl start shortcut-academy.service
```

## Manual Deploy (Step by Step)

### Step 1: Server Setup

```bash
sudo apt update && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo bash -
sudo apt install -y nodejs nginx certbot python3-certbot-nginx
```

### Step 2: Create App User

```bash
sudo useradd --system --shell /usr/sbin/nologin --home-dir /opt/shortcut-academy academy
sudo mkdir -p /opt/shortcut-academy/current
sudo mkdir -p /var/lib/shortcut-academy
sudo mkdir -p /etc/shortcut-academy
```

### Step 3: Deploy Code

```bash
# Clone and copy files
git clone https://github.com/pukaloki/academy-website.git /tmp/academy
sudo cp -r /tmp/academy/* /opt/shortcut-academy/current/
cd /opt/shortcut-academy/current
sudo npm install --omit=dev

# Symlink database directory
sudo ln -sf /var/lib/shortcut-academy /opt/shortcut-academy/current/data

# Set ownership
sudo chown -R academy:academy /opt/shortcut-academy
sudo chown -R academy:academy /var/lib/shortcut-academy
```

### Step 4: Configure Environment

```bash
sudo nano /etc/shortcut-academy/app.env
```

Fill in ALL values (see `.env.example` in the project root for descriptions):

```env
PORT=3100
HOST=127.0.0.1
APP_ORIGIN=http://127.0.0.1:3100
NODE_ENV=production
DATABASE_PATH=/var/lib/shortcut-academy/academy.sqlite

RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret

RESEND_API_KEY=your_resend_api_key
EMAIL_FROM=noreply@yourdomain.com
ADMIN_EMAIL=admin@yourdomain.com

AUTH_SECRET=generate_with_node_crypto_random_bytes_32_hex

GOOGLE_CLIENT_ID=your_google_oauth_client_id.apps.googleusercontent.com

LEGAL_APPROVED=true
TRUST_PROXY=true
PUBLIC_ORIGIN=https://yourdomain.com
```

Generate `AUTH_SECRET`:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Secure the file:
```bash
sudo chmod 600 /etc/shortcut-academy/app.env
sudo chown root:academy /etc/shortcut-academy/app.env
```

### Step 5: Install Systemd Service

```bash
sudo cp deploy/shortcut-academy.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable shortcut-academy.service
```

### Step 6: Configure Nginx

```bash
# Copy and edit the config (replace YOUR_DOMAIN)
sudo cp deploy/nginx-site.conf /etc/nginx/sites-available/yourdomain.com
sudo sed -i 's/YOUR_DOMAIN/yourdomain.com/g' /etc/nginx/sites-available/yourdomain.com
sudo ln -sf /etc/nginx/sites-available/yourdomain.com /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

### Step 7: SSL Certificate

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### Step 8: Add Video Files

The video files are not in the repository (too large for GitHub). Copy them to:
```
/opt/shortcut-academy/current/public/videos/
├── short-form/
│   ├── 01-shortform-name.mp4
│   ├── 02-shortform-name.mp4
│   └── ... (11 files)
└── long-form/
    ├── 01-longform-name.mp4
    ├── 02-longform-name.mp4
    └── ... (5 files)
```

```bash
sudo chown -R academy:academy /opt/shortcut-academy/current/public/videos/
```

### Step 9: Start

```bash
sudo systemctl start shortcut-academy.service
sudo systemctl status shortcut-academy.service
```

## Third-Party Accounts Required

The client needs to create their own accounts for:

| Service | URL | What to get |
|---------|-----|-------------|
| **Razorpay** | https://dashboard.razorpay.com | Key ID, Key Secret, Webhook Secret |
| **Google Cloud** | https://console.cloud.google.com | OAuth 2.0 Client ID |
| **Resend** | https://resend.com | API Key, verified sender domain |

### Razorpay Setup
1. Create account → Dashboard → Settings → API Keys → Generate
2. Settings → Webhooks → Create:
   - URL: `https://yourdomain.com/api/webhooks/razorpay`
   - Events: `payment.captured`, `order.paid`
   - Copy the webhook secret

### Google OAuth Setup
1. Google Cloud Console → New Project → APIs & Services → OAuth consent screen
2. Create OAuth 2.0 Client ID (Web application type)
3. Add authorized origin: `https://yourdomain.com`
4. Copy the Client ID

### Resend Setup
1. Create account → verify your domain
2. Create API key
3. Use verified sender email as `EMAIL_FROM`

## Managing the Server

```bash
# Start / Stop / Restart
sudo systemctl start shortcut-academy.service
sudo systemctl stop shortcut-academy.service
sudo systemctl restart shortcut-academy.service

# View logs
sudo journalctl -u shortcut-academy.service -f

# Check status
sudo systemctl status shortcut-academy.service

# Health check
curl https://yourdomain.com/health
```

## Database

SQLite database at `/var/lib/shortcut-academy/academy.sqlite`

```bash
# Backup
sudo cp /var/lib/shortcut-academy/academy.sqlite /backups/academy-$(date +%Y%m%d).sqlite

# View tables
sudo -u academy sqlite3 /var/lib/shortcut-academy/academy.sqlite ".tables"
```

## Updating Code

```bash
cd /tmp && git clone https://github.com/pukaloki/academy-website.git
sudo rsync -av --exclude='data/' --exclude='.env' --exclude='node_modules/' \
  /tmp/academy-website/ /opt/shortcut-academy/current/
cd /opt/shortcut-academy/current && sudo npm install --omit=dev
sudo chown -R academy:academy /opt/shortcut-academy
sudo systemctl restart shortcut-academy.service
```
