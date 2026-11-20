# Server Deployment Configuration Files

This directory contains all configuration files needed to deploy
The Shortcut Academy on a new Ubuntu server.

## Files

| File | Purpose |
|------|---------|
| `shortcut-academy.service` | Systemd service unit (auto-restart, security hardening) |
| `nginx-site.conf` | Nginx reverse proxy + SSL config (edit domain name) |
| `provision.sh` | Automated server setup script |

## Quick Start

1. Copy these files to your server
2. Run `provision.sh` as root
3. Set up SSL with Certbot
4. Create `/etc/shortcut-academy/app.env` from `.env.example` in project root
5. Start: `sudo systemctl start shortcut-academy.service`
