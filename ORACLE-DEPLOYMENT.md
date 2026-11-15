# Oracle deployment

Live site: https://theshortcutacademy.in

## Infrastructure

- Oracle Ubuntu 26.04 instance `129.225.68.60`, SSH user `ubuntu`.
- Hostinger apex A record points to the instance; `www` remains a CNAME to the apex.
- Nginx serves HTTPS and proxies to Node on `127.0.0.1:3100`.
- HTTP and `www` redirect to the canonical HTTPS apex.
- Let's Encrypt certificate covers both hostnames. Certbot timer handles renewal.
- `shortcut-academy.service` starts at boot and restarts on failure. It runs as the unprivileged `academy` user with a 400 MB memory limit.
- 1 GB swap supplements the instance's 1 GB RAM.
- The existing Oracle security list now allows TCP 80 and 443. Existing rules were preserved. VM firewall changes are saved using netfilter-persistent.

## Private runtime files

- Application: `/opt/shortcut-academy/current`
- Current release: `/opt/shortcut-academy/releases/20261004-refinements`
- Initial release: `/opt/shortcut-academy/releases/20261004`
- Environment: `/etc/shortcut-academy/app.env` (root only, mode 600)
- Database: `/var/lib/shortcut-academy/academy.sqlite` (academy only)
- Nginx: `/etc/nginx/sites-available/theshortcutacademy.in`

Do not copy the environment, database, or SSH private key into `public` or a release artifact. Back up the SQLite database using its backup API, not by copying a live WAL database alone. An independent off-server database backup is not configured yet.

## Release contents

`node scripts/package-oracle.mjs` stages an explicit allowlist in `output/deployment/release`: server, backend/render modules, content, active CSS/JavaScript, fonts, logo, and hero image. Only `google-auth-library` is required at runtime. Reference folders, source experiments, screenshots, tests, Netlify functions, local data, secrets, and unused media are excluded.

Generate the runtime lockfile with:

```sh
npm install --package-lock-only --ignore-scripts --no-audit --no-fund --prefix output/deployment/release
COPYFILE_DISABLE=1 tar --no-xattrs -czf output/deployment/academy-release.tar.gz -C output/deployment/release .
```

For later updates, use a new dated release directory, install with `npm ci --omit=dev --ignore-scripts`, switch the `current` symlink, restart the service, and verify `/health`. Keep the previous release for rollback. Do not rerun `scripts/provision-oracle.sh` on the live site: it is the initial provisioning record and would replace the HTTPS Nginx configuration with the initial HTTP configuration.

## Operations

```sh
sudo systemctl status shortcut-academy nginx
sudo journalctl -u shortcut-academy --since '10 minutes ago'
sudo nginx -t
sudo certbot renew --dry-run
curl --fail https://theshortcutacademy.in/health
```

## Enrollment status

Google domain ownership was verified for `info@theshortcutacademy.in`. The Google Cloud project `white-feat-510617-f6` (The Shortcut Academy) now exists under the client account. OAuth setup is waiting on approval of the Google API Services User Data Policy; the web client has not yet been created. The client ID will be added to the private runtime environment once created. Never put a Google client secret in browser JavaScript; this implementation uses signed ID tokens and needs only the public web client ID.

Razorpay is deliberately disabled pending the merchant integration, confirmed batch start, and approved legal/refund terms. Payments cannot be collected and no seat is reserved by signing in.

The Workspace account was observed in a trial with pending prepayment, and Gmail MX activation is prepared and awaits approval. Domain verification alone does not activate the mailbox. Resolve the Workspace subscription with the account owner before depending on that address for ongoing operations.

SSL renewal dry-run succeeded on 4 October 2026. TLS 1.2/1.3 are enabled; older TLS versions are disabled. Runtime dependency audit reported zero known vulnerabilities. All 18 application tests passed. Private server paths were checked externally and return 404; unauthenticated profile writes return 401.

DNS snapshots and deployment screenshots are in `output/deployment/`.

## 2026-10-05 continuation
- Active release: `/opt/shortcut-academy/releases/20261005-final`.
- Google OAuth web client created in project `white-feat-510617-f6`, production audience, HTTPS apex origin, privacy/terms/home branding links. GOOGLE_CLIENT_ID installed in private server environment. Browser login with business account reached `/profile` successfully.
- Latest design/content deployed: Instagram only, no percentage placement claim, revised beginner/assignment FAQ, unclipped curriculum digits, subtle journey glass, Resolve logo asset, live-class emphasis. Mobile 390px verified no overflow and hero backdrop-filter none.
- Razorpay website approved and live mode confirmed. Generate Key action currently awaits client SMS verification ending8167. Do not log key dialogs or credential prompts. Keys/webhook not installed; payments remain gated closed.
- Still needed: batch start date, private WhatsApp URLs, approved refund/legal details, transactional email configuration, Razorpay API/webhook credentials, test-mode checkout end-to-end.
- `npm run check` and all18 automated tests pass. Google authentication actually tested; Razorpay payment has not been tested or enabled.
- Resolve logo source: https://commons.wikimedia.org/wiki/File:DaVinci_Resolve_17_logo.svg (Asav / Blackmagic Design, marked PD-textlogo).

## 2026-10-05 payment/webhook continuation (evening IST)
- Active release `/opt/shortcut-academy/releases/20261005-webhook`.
- Live Razorpay credentials installed from user CSV into root-only app.env. Authenticated read-only Orders API returned200. User subsequently pasted live secret in chat: rotate before opening checkout; do not reproduce it.
- Approved signed webhook created: `/api/webhooks/razorpay`, payment.captured + order.paid, enabled, alert info@theshortcutacademy.in. Random secret installed privately; temporary file removed.
- Production signed synthetic healthcheck returned200; unsigned400; no charge performed. This is endpoint verification, not a completed Razorpay payment test.
- Payment confirmation no longer depends on new-sales readiness, so pausing sales does not discard captured-payment confirmations. Unknown merchant orders acknowledged without granting enrollment.
- Signup/profile notifications retained in mail queue even before mail sender configured. Profile notification includes name/email/phone. Payment notification includes phone. No real email delivery verified: RESEND_API_KEY missing and domain MX lookup currently empty.
- Netlify project editing-academy-review (065768b1-6d36-48d2-bc8b-dc20a15b2122) disabled via UI; not permanently deleted. It no longer serves traffic/consumes runtime resources per Netlify settings.
- Removed stale Netlify references from syntax check; migrated auth tests to actual Oracle HTTP server. All20 tests pass.
- User says batch date/group links/refund terms will come later. Leave enrollment closed until supplied.
- Resend signup opened, user manually attempted Google sign-in under jayaprakashkj407@gmail.com; last observed password verification error. No sender/account provisioning complete. Browser control subsequently blocked requiring Chrome ChatGPT extension update.

## 2026-10-07 navbar glass deployment

- Active release: `/opt/shortcut-academy/releases/20261007-152915-navbar-glass`.
- Previous release retained for rollback: `/opt/shortcut-academy/releases/20261006-seo`.
- Cloned the active production release rather than uploading the local application. Its renderer differs from the local copy, so production content was preserved.
- Compared all 462 release files: only `public/assets/client-revision.css` and `lib/render.mjs` differ. The renderer change is solely the stylesheet query from `v=seo1` to `v=nav-glass1`.
- Appended navbar-only frost, reflection, border, and shadow styles with dark/light fallbacks. Blur is 28px on larger screens and capped at 20px below 600px. Existing navbar JavaScript, layout, hero, and footer were not changed.
- Activated through an atomic `current` symlink replacement and restarted `shortcut-academy.service`. Local health passed after startup; automatic rollback was prepared but was not needed.
- Public HTTPS verification: all 11 checked public pages return 200 and reference the new stylesheet once; served CSS checksum matches the update and parses without warnings; `/health` returns `{"ok":true}`; unauthenticated `/api/me` returns 401 and `/dashboard` redirects to `/login`.
- Local `npm run check` and all 24 tests passed. Staged production renderer and server also passed `node --check`. Live narrow-screen dark navbar was visually inspected; menu/theme click verification was not completed because the browser action did not dispatch.
- Server/backend files, runtime dependencies, credentials, database, service configuration, Nginx, and TLS configuration were preserved. No provisioning, payment, or sign-in action was performed.
- For rollback, restore `current` to the retained `20261006-seo` release and restart the Node service. Do not rerun the initial provisioning script.

## 2026-10-16 copy corrections

- Active release: `/opt/shortcut-academy/releases/20261016-copy-fixes-075858`.
- Previous release retained: `/opt/shortcut-academy/releases/20261014-mobile-buttons`.
- Cloned production and changed only `lib/render.mjs` and `config/content.mjs`: Resolve colour-grading bullet, practice/practicing spelling, and two requested FAQ sentence removals.
- Staged syntax/render checks, service health, and all five public HTTPS content checks passed.
