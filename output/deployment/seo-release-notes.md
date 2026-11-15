# SEO and mobile polish — 6 October 2026

Production release: /opt/shortcut-academy/releases/20261006-seo
Previous release (rollback): /opt/shortcut-academy/releases/20261005-webhook

- Brand-first homepage title, HTTPS canonical, indexable robots metadata.
- WebSite (brand spelling alternatives), EducationalOrganization, and Course JSON-LD, with only published facts.
- Reference software artwork encoded locally as small WebP assets.
- Enrollment arrow/check symbols replaced by consistent SVG icons.
- Hero artwork unchanged; optimized from 1,736,461 bytes to 143,414 desktop / 47,216 mobile.
- Card fan animates transform instead of left; timeline playhead uses transform with width cached via ResizeObserver; unchanged chapter text/ARIA no longer rewritten every frame; rain uses a 60 Hz timing target.
- Preserved production backend, payment configuration, content manifest, and enrollment script version.

Validation: 21 tests passed; Node syntax checks passed; production health passed; 390px and 1440px checks found no horizontal overflow or browser errors; software card touch expansion verified.
Google Search Console: client account owns HTTPS URL-prefix property. Sitemap submitted. Homepage indexing request accepted into priority crawl queue. HTTPS homepage was previously unknown to Google. HTTP and www permanently redirect to HTTPS. Googlebot fetched robots.txt and sitemap.xml with HTTP 200; Search Console initially retained a sitemap fetch warning.

Search ranking, indexing time, and snippet refresh are controlled by Google. Do not promise #1 placement.
