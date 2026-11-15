# The Shortcut Academy: sign-in activation

The review website is https://editing-academy-review.netlify.app. Enrollment follows Google sign-in → name/email/phone → payment review. Razorpay collection is deliberately disabled until the payment integration is completed.

## Google setup

Create or select an OAuth client of type **Web application** in the academy's Google Cloud project. Configure the application branding as The Shortcut Academy and supply the academy's support email. Use only the basic name, email, and profile identity scopes.

Add `https://editing-academy-review.netlify.app` as an authorized JavaScript origin. For local development use `http://localhost` and `http://localhost:3100`, and open the site using localhost. Add the final domain when it is available. This implementation uses a JavaScript callback, so it does not require a redirect URI or a client secret.

Set `GOOGLE_CLIENT_ID` in the Netlify project's environment variables with Functions scope, then redeploy. The ID normally ends in `.apps.googleusercontent.com`; it is a public application identifier. Do not send a Google password or client secret. Complete Google's required consent-screen/domain checks and use approved business privacy and terms pages before public student sign-up.

For the local Node server, also set `GOOGLE_CLIENT_ID` and a random `AUTH_SECRET` of at least 32 characters in `.env`. Use `APP_ORIGIN=http://localhost:3100` and `PORT=3100`. Restart the server after changes.

See [Google's official setup guide](https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid).

## Data and sessions

- Google credentials are verified on the server for signature, audience, expiry, verified email, and the browser's sign-in nonce.
- The Netlify implementation stores profiles and hashed session tokens in the private `shortcut-students` Blobs store. Authorized project operators can inspect profiles there. Profiles contain name, email, phone, and timestamps; Google account identifiers are hashed for profile keys.
- The local server stores profiles in SQLite instead. These two environments do not share data.
- Students can only read and update their own profile. Email is taken from verified Google identity, not from the editable form. Phone formatting is validated, but phone ownership is not SMS-verified.
- Session cookies are HTTP-only, secure in production, and expire after seven days. A Sign out control is available on authenticated details/payment screens.
- The client-review path uses a sample identity. It does not authenticate anyone, submit details, reserve seats, or collect money.

## Payment handoff

The confirmed offer is ₹2,999, 10 weeks, Monday–Friday, 8:30–10:00 PM IST, and 30 students per batch. PM/IST was assumed from the briefing and should be confirmed with the academy. A batch start date has not been supplied.

Do not activate a payment button alone. The Netlify release still needs Razorpay order creation, signature/webhook verification, transactional seat capacity storage, idempotent enrollment confirmation, and delivery of class/community access. The existing Node backend contains tested payment safeguards, but is not deployed as the Netlify payment service. Keep checkout closed until the full flow and final business/refund details are configured and tested.
