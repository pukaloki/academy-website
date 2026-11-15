# Private recorded classes: implementation and launch plan

Prepared 18 October 2026 for The Shortcut Academy.

## Product and honest security promise

Sell this as a private paid-student learning library with access control and sharing deterrents. Do not sell it as download-proof or screen-recording-proof. An authorized browser receives video data; a determined student can extract it or record a screen. HLS segmentation and AES encryption alone are not DRM. Browser `nodownload` hides a control in supporting browsers; it does not prevent saving. A DOM watermark can be removed and may not appear in native mobile fullscreen. Never advertise the prototype watermark as forensic protection.

## What is built locally

- `/recorded-classes`: signed-in library, listing only published lessons for the user's paid batch.
- `/private-recordings/:lessonId`: session and paid-course checks on GET, HEAD and each range request.
- Private filesystem root supplied by `RECORDINGS_ROOT`; files and symlink destinations must remain inside it and outside `public/`.
- Seekable MP4 delivery with correct byte-range responses, no shared caching, no cross-origin sharing, and no public file paths.
- Active streams rechecked every ten seconds for logout or enrollment removal. Already buffered video cannot be recalled.
- A moving student email/ID watermark and native download/remote-playback controls hidden where supported.
- Local FFmpeg preparation command, basic responsive page, security tests.

The lesson catalog is deliberately empty. This is an MVP foundation, not the finished resale product. It has not been deployed. No recordings, customer uploads, paid cloud resources or storage volumes were created. Payment and public marketing pages are unchanged in production.

## Current server and free-tier budget

Read-only inspection: approximately 39 GiB available disk, 951 MiB RAM, two reported logical CPUs. CPU count does not imply two dedicated Oracle OCPUs. Confirm instance shape and account eligibility in OCI before sizing it.

Oracle documentation checked today lists 200 GB combined boot/block storage and 10 TB monthly outbound transfer; those allowances are account-wide, not per website. Object Storage has separate smaller allowances. Micro instance internet bandwidth is listed up to 50 Mbps. Idle free instances may be reclaimed. Capacity and free eligibility must be checked in the client's tenancy. Do not promise a hosting SLA on free infrastructure.

Source: https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier_topic-Always_Free_Resources.htm
Control limitations: https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/controlsList

Use existing disk for the pilot; reserve at least 10 GiB for the OS, website and operational headroom. Set a provisional recording budget of 20 GiB, not all remaining space. No extra block storage should be provisioned before inspecting all existing tenancy volumes and backup allocations.

Sizing estimates (not measured capacity):

- At 1.5 Mbps total average bitrate, one viewing hour transfers about 675 MB.
- Thirty students watching thirty hours each is about 608 GB of transfer; rewatches add proportionally.
- Ten weeks × five days × 1.5 hours = 75 hours. At 1.5 Mbps, one rendition is about 51 GB; it will not fit the conservative current-disk pilot budget.
- Thirty simultaneous viewers at 1.5 Mbps need roughly 45 Mbps before overhead. That is too close to a 50 Mbps ceiling to promise reliable playback on a micro instance.

Start with 5–10 concurrent viewers and measure. A quota-approved A1 move or separate streaming VM may become necessary; no capacity guarantee. Encode locally, upload finished files over SSH, and keep original recordings plus an encrypted database backup offline. Free hosting still requires maintenance, hardware, local bandwidth and backup effort. Alerts alone do not cap cloud bills: use appropriate quotas plus application storage/transfer limits and verify account billing state.

## Architecture and staged build

1. **Pilot (current MVP):** existing Google login → stored verified enrollment → lesson catalog → authenticated MP4 range delivery. Start with one real lesson and invited paid test students. Native player avoids subscription fees and dependency overhead.
2. **Streaming release:** locally encode 480p/720p HLS; evaluate 1080p separately for readable editing UI. Self-host an audited HLS player for non-native browsers. Authorize every manifest and segment, not just the first URL. Use short-lived playback sessions bound to the login, with renewals and expiry. Same-origin routes remain the default. Never expose a public bucket or long-lived sharing URL.
3. **Efficient serving:** move media bytes to Nginx internal locations (`X-Accel-Redirect`) after app authorization. Ensure no alias is publicly routable; verify unauthorized segment requests fail. Bound concurrent connections and request rates. Keep website/payment latency within baseline during load tests.
4. **Learning product:** module ordering, release dates, progress, resume position, captions, lesson notes and useful playback errors. Admin roles, draft/publish workflow, resumable uploads, upload size limits, local encoding queue and audit logs.
5. **Account sharing controls:** short-lived playback leases, two registered devices with a clear reset flow, one active playback per student, and an explicit access-revocation field. Allow reasonable seeking/tab overlap; avoid brittle IP locking on mobile networks. Specify limits transparently to students.
6. **Resale packaging:** one isolated deployment per client, their own domain, credentials, storage, database, payment configuration and branding. Create reproducible install/upgrade/rollback tooling, dependency/license inventory and operational handover. No shared production keys. Multi-tenancy and cross-domain embeds are later work with signed tenant-scoped handoffs and strict origin allowlists, not permissive CORS or exposed API secrets.

## Security boundaries and launch gates

- The catalog grants by batch ID. Existing enrollment records currently share a course batch ID; do not promise cohort-specific restrictions until cohorts and explicit content grants are modeled.
- MVP revocation is removal of the paid enrollment or session; a staff revocation workflow is still needed. Refund/chargeback events must trigger the chosen access policy before general release.
- Watermark is a deterrent. Native mobile fullscreen, Picture-in-Picture and browser tools can bypass a DOM overlay. A future custom fullscreen wrapper improves consistency, not capture prevention.
- Paid DRM is a separate integration with provider/license costs, device compatibility tests and no universal capture guarantee. Do not fake DRM using context-menu blocking, developer-tools detection or disabled keyboard shortcuts.
- Test anonymous, unpaid, wrong-course, expired session, revoked entitlement, unpublished lesson, malformed ranges, traversal, symlink escape, cross-origin and copied-link access.
- Test playback/seek/resume on actual iOS Safari and Android Chrome, plus desktop Chrome/Firefox/Safari. Test throttled connections and interrupted playback.
- Load-test without payment traffic; collect CPU, RAM, disk IO, egress, startup time, stalls and normal website latency. Increase from 5 to 10 concurrent streams first. Do not claim tested student capacity yet.
- Disk warning at 70%, stop uploads at 80%; implement transfer metering and a conservative configurable cutoff before wider launch. Budgets and quotas must be verified in OCI, not inferred from this document.
- Restore-test private media and database backups; no secrets or private files in public assets, release bundles or logs.

## First real lesson workflow

1. Confirm which paid students/batches receive access and for how long; defaults are not a lifetime-access promise.
2. Provide one original lesson, its title and module. Keep lesson videos separate from public showcase clips.
3. Make a private local directory outside `public/`. Run:

   `node scripts/prepare-recording.mjs /absolute/input.mp4 /absolute/private/intro.mp4`

4. Add `{ id: 'intro', title: 'Introduction', batchId: 'live-editing', file: 'intro.mp4', published: true }` to `config/recordings.mjs`.
5. Set `RECORDINGS_ROOT` to that directory for local testing. On a future server deployment use a private directory outside release/public trees, readable by the academy service only.
6. Test a real recording with a local paid fixture, then a limited production pilot. Do not create fake production payments for tests.
7. Add the dashboard navigation entry when the first lesson is ready; retain the existing homepage design.

Next input needed: first recording, intended course/cohort, access duration, estimated library hours and peak simultaneous viewers. These decide storage and capacity, not whether basic access control can be built.
