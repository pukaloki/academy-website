# Client content and launch manifest

All bracketed copy is intentional. The client has confirmed that business details, instructor identities, schedules, prices, and the payment provider have not yet been supplied. None have been invented. Batch examples are clearly bracketed and cannot accept payment.

## Main content source

Edit `config/content.mjs` for the business identity, batches, curriculum, and FAQs. Shared layouts and static copy are in `lib/render.mjs`. Search for `PLACEHOLDER` and bracketed text to find replacement points.

| Placeholder | Location | Required replacement |
| --- | --- | --- |
| Business name | `site.name` | Approved trading name; legal entity may differ |
| Brand mark | `public/assets/favicon.svg`, shared nav/footer | Approved logo; current mark is an original provisional symbol |
| Business contact | `site.email`, contact page | Working contact email, support hours, address |
| Client logo boxes | Home `clientLogos()` | Client-authorized SVG/WebP logos and confirmed credits |
| Lesson clips | `breakdowns()`, dialog in `render.mjs` | Licensed videos, captions/transcripts, editing-decision descriptions, hosting URLs |
| Instructor photos | `instructors()` | Approved real portraits and descriptive alt text |
| Instructor profiles | `instructors()` | Real names, verified bios, teaching specialties, cleared client credits, portfolio URLs |
| Batch examples | `batches` | Confirmed name, dates, days, times, timezone, duration, tax-inclusive total price, numeric capacity |
| Batch payment data | `amountPaise`, `capacity`, `startsAt` | Integer paise, positive capacity, future ISO date |
| Batch access | `whatsappUrl` per batch | Real HTTPS batch group invite, private to paid students |
| Community | `site.communityUrl` | Real HTTPS community invite, private to paid students |
| Student Results | `results()` | Real approved testimonials and work samples; no quotes or results have been fabricated |
| Social profiles | `site.social`, footer | Real Instagram/YouTube/LinkedIn URLs; replace pending label with links |
| FAQs | `faqs` | Skill prerequisites, recording/absence policy, equipment/software requirements, support duration, refund/payment details |
| Email delivery | `.env` | Confirmed Resend account, verified sender domain, `RESEND_API_KEY`, `EMAIL_FROM`, `ADMIN_EMAIL`, private `AUTH_SECRET` |
| Payments | `.env`, gateway adapter | Client's confirmed provider; Razorpay is implemented provisionally, not assumed to be their account |
| Legal drafts | `legalPage()` | Legal entity, effective date, age policy, retention period, processing locations, contact, jurisdiction, cancellation/refund terms |
| Public domain and social preview | `.env`, document `<head>` | HTTPS `APP_ORIGIN`, absolute canonical/OG URL, raster social card for social networks |

## Deliberate stand-ins

- The contact form prepares a local draft and copies it when requested. It never claims to send a message. Connect a verified contact address or reviewed form endpoint later.
- Login is disabled until transactional email and the authentication secret are configured. No fake login, demo password, or browser-only paid state exists.
- Unpublished batches show the complete review flow but cannot open checkout.
- The original editor illustration is not claimed as student work or a lesson video. Real clips have explicitly labeled empty states.
- The original landscape, timeline, and icon designs are SVG/CSS artwork, not AI-generated photography.

## Opening enrollment

1. Confirm which gateway the business uses. Keep the Razorpay adapter only if approved; otherwise replace it while retaining server-side payment verification.
2. Replace every bracketed field and set real batch numeric fields and private access links.
3. Review and publish all legal policies, then set `LEGAL_APPROVED=true`.
4. Configure verified email, payment test keys, the webhook signing secret, admin email, and HTTPS origin.
5. Run a real gateway sandbox enrollment and email-delivery test. The automated tests use mocks and do not validate a merchant account.
6. Replace test keys with live keys only after the merchant's launch checklist is complete; set `published: true` only for confirmed batches.

Do not publish placeholder schedules, prices, credentials, or legal terms as final business facts.

Editorial redesign: the homepage shows a compact student-proof note instead of large empty testimonial cards. Instructor names, photos, and bios remain on /about. The course illustrations and procedural background scenes are original decorative UI, not photographs, client work, or student results.
