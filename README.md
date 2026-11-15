# The Shortcut Academy

An original, responsive academy website built from the supplied brief. The downloaded reference site is preserved in `tharunspeaks.in/`, `framerusercontent.com/`, and `hts-cache/`; none of its code, imagery, testimonials, or client claims are used by the new application.

## Run

Use Node.js 22.13 or later (Node 24 LTS recommended). The active design uses locally served CSS, SVG, and Canvas effects. Run `npm install` before building.

```sh
npm run dev
```

Open http://127.0.0.1:3000. `npm start` runs without file watching. `npm run check` checks source syntax. `npm test` exercises authentication and payment safeguards. `npm run build` exports the public design preview to `dist/`.

Deploy `dist/` together with `netlify/functions` and the root `netlify.toml` for the review site. Google sign-in and private saved profiles are implemented but need `GOOGLE_CLIENT_ID`. Static files alone have no authentication. Razorpay remains disabled pending integration. See `GOOGLE-SIGNIN-SETUP.md`. The separate Node server retains the earlier tested payment backend.

## Pages

- `/`: One-page academy, new logo, live editing study, three software tools, career paths, one ₹2,999 course, FAQ, and dusk scene.
- `/batches`: The same single course offer.
- `/about`: Teaching approach and live experience.
- `/login`, `/signup`: Google sign-in, enabled by the configured Google client ID.
- `/profile`: Verified name/email and phone collection; explicitly labeled sample preview available during client review.
- `/enroll`: Student details and payment summary; checkout disabled until Razorpay is ready.
- `/contact`: Course FAQs; the old inquiry draft form is removed.
- `/privacy`, `/terms`, `/refunds`: Business policy drafts awaiting final operator details.

## Implementation

- `config/content.mjs`: Business configuration, batch catalog, curriculum, FAQ.
- `lib/render.mjs`: Server-rendered semantic pages and original SVG illustrations.
- `public/styles.css`: Responsive design, focus states, reduced-motion handling.
- `public/app.js`: Navigation, filters, dialogs, forms, and checkout.
- `public/assets/final-design.css`, `public/assets/supplied-effects.css`: Supplied dark glass layouts, card effects, and responsive adaptation.
- `public/motion.js`: Rain and terrain canvases, restored editing study, section tracking, pointer highlights, and motion lifecycle controls.
- `lib/backend.mjs`: SQLite persistence, rate-limited OTP authentication, sessions, gateway verification, capacity reservations, durable email outbox.
- `server.mjs`: HTTP server, route handling, static asset allowlist, security headers, origin checks.
- `tests/backend.test.mjs`: Mocked authentication/payment integration coverage.
- `placeholders.md`: Full replacement manifest and launch requirements.

## Design direction

The final design follows the four user-supplied folders. The original hero image is used unchanged, with its rain and mist treatment and no hero glass overlay. Dark glass curriculum, animated career paths, and one wider prism course card carry the supplied visual language into the one-page site. The supplied dusk landscape fills the section above the footer. Main content and navigation are centered; the previous photographic imagery is no longer displayed. The editing timeline is restored beneath the hero.

React/Tailwind components were adapted into the existing server-rendered application. Animation canvases are capped at 30fps and pause offscreen, in hidden tabs, and with the global motion control. Reduced-motion preferences suppress automatic effects. Original reference folders remain unchanged. See `DESIGN-SOURCES.md`.

## Configure services

Copy `.env.example` to `.env` and enter real credentials privately. Never commit `.env` or `data/`.

- Email: Resend with a verified sender domain. OTP codes are hashed with `AUTH_SECRET`, expire in ten minutes, permit at most five failed attempts, and are single use. Session cookies are HTTP-only and become Secure in production.
- Gateway: Razorpay adapter is provisional until the client selects a provider. Prices are loaded from server configuration. A signed browser callback is checked against the provider API, including captured status, amount, currency, and matching order. Signed `payment.captured` or `order.paid` webhooks can also confirm enrollment. Return URLs alone grant nothing.
- Enrollment: SQLite records payment and student enrollment transactionally. Unique constraints prevent replay duplicates. The database belongs on a persistent private disk, with backups and monitored access.
- Email notifications: The transaction writes durable student/admin outbox jobs. A worker attempts delivery every fifteen seconds, retries failures with exponential backoff, and uses provider idempotency keys. Monitor jobs with `sent_at IS NULL`; after twenty-four failed attempts they require operator intervention.
- Capacity: Checkout reserves a seat for thirty minutes. An old payment captured after capacity is filled is flagged for manual review; it does not silently over-enroll the class. The administrator is notified. Refunds are performed through the provider by an authorized operator; automatic refunds are not implemented.
- Private links: WhatsApp/community invitations are only included in verified paid dashboards and enrollment emails. They are excluded from the public batch catalog.

## Deployment

Run behind a trusted HTTPS reverse proxy with `NODE_ENV=production`, an HTTPS `APP_ORIGIN`, and a random `AUTH_SECRET` of at least 32 characters. Set `HOST=0.0.0.0` only inside the intended private container/network. Expose only this application, never the repository root or database files. Forward webhooks to `/api/webhooks/razorpay` and subscribe to `payment.captured` and `order.paid`.

The default rate limiter uses the socket address. Behind one trusted proxy, set `TRUST_PROXY=true` only when the proxy overwrites `X-Forwarded-For` and direct client access is blocked; the last hop in that header is then used. Otherwise leave it unset. Do not run multiple replicas against separate SQLite files. For horizontal scaling, move persistence and rate limiting to a shared database before launch.

Self-hosted fonts require no external runtime request. The payment script is loaded only when an authenticated student starts checkout. The app includes restrictive resource headers; complete a real provider sandbox checkout to confirm all payment-method flows and CSP requirements before production.

## Before launch

The client has not supplied the business name, schedules, prices, credentials, instructors, or real media. This is a complete implementation with closed enrollment, not a live business accepting money. See `placeholders.md`. Legal pages are drafts requiring professional/client review. Confirm retention/deletion processes, backup recovery, provider contracts, support ownership, and actual mail delivery. End-to-end external payment/email tests remain pending merchant credentials.

## Reference research

The brief's conversion structure was reviewed against https://tharunspeaks.in. Visual references included https://threeui.com/three-js/structure-flow/structure-flow, https://threeui.com/motion-design/perspective-ui/dreamcut, and https://dribbble.com/shots/22957370-Quantum. These are references only, not asset or code sources. Gateway verification follows https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/integration-steps/ and email delivery follows https://resend.com/docs/api-reference/emails/send-email.

The homepage now shares its full-height Three.js atmosphere with the glass navigation. A separate footer renderer draws a rotating aperture of elliptical light paths; it scales to narrow screens. Both scenes honor the motion toggle and reduced-motion preferences, stop outside the viewport, and retain a dark CSS/Canvas fallback. Source: `src/hero-three.js`; browser bundle: `public/assets/hero-three.js`.
