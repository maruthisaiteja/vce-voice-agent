# Campus Desk product requirements

> Current provider update — 6 October 2026: use [Sarvam setup](SARVAM_SETUP.md). Sarvam API speech and restricted hosted-agent tools are implemented. The hosted agent is not created or embedded yet. Browser recognition is per utterance (REST), with streamed answer audio; older WebSocket/SIP descriptions below are historical and not activation instructions. No live quality benchmark has passed yet.


Updated 5 October 2026. This is a private local development foundation for Vardhaman College of Engineering, not a commissioned phone service. TEST_REPORT.md distinguishes measured checks from targets.

## Product behavior

Use concise source-backed replies, normally 10–30 words and one or two sentences, with one question at a time. The current hard source cap is 55 words/500 characters. English, Telugu, Hindi and mixed script questions are supported; language variants must themselves be approved. Introduce the AI once per session (currently displayed once in Verified voice; a separately spoken opening still needs validation). Never infer a college fact, price, date, recipient or completed action. Unknown/conflicting/expired/private information must be withheld or routed to staff.

| Priority / capability | Current behavior | Remaining work and acceptance |
|---|---|---|
| P0 local reliability | Frozen dependencies installed, D1 initialized, local sign-in and build work on Windows | Repeat documented setup on a clean machine with pinned pnpm 11.25; no cloud-only paths required |
| P0 factual authority | Approved exact multilingual answers; expiry/conflict/private gates; recheck after semantic lookup | College owners reapprove source text/translations; zero unsupported critical facts in independent holdout |
| P0 voice lifecycle | Pause-based completion, manual finish, cancel/restart while checking, playback stop, cleanup and bounded requests | Real microphones/accents/noise, browser permissions and acoustic tests; no claim that energy detection is calibrated |
| P0 interruption | Manual Interrupt & speak and Stop cancel playback and stale results | Automatic acoustic barge-in during playback is incomplete; prove stop latency on real devices |
| P0 hearing | Low-confidence browser and critical marker confirmation with editable text | Premium calibrated ASR confidence/name ambiguity, spoken confirmation, broader dates/number words and code mixing need live evaluation |
| P0 Realtime | Caller playback blocked; existing client/SIP contracts retained | Isolated comparison harness and pre-playback verification are required before re-enabling; no provider winner claimed |
| P0 department email | Verification expires after 30 days; editable consented draft, explicit staff review, durable outbox, allowlist and atomic SMTP claim | Secure configuration and explicit designated-recipient test authorization; SMTP disabled until then |
| P1 diagnostics | Source review queue, grouped unresolved questions, audit/call history, estimated speech-end-to-playback measure | Persist end-to-end voice/provider usage metrics, operational alerts and source owner assignments |
| P1 operations/security | Private single-owner console, loopback dev auth, service token gates, default-off recording, manual retention | Department RBAC, automated retention, encrypted gateway operations/backups, production access review and signed event validation |
| Later phone/ERP | Interfaces documented in ENGINEERING.md; private record gate fails closed | Carrier/test number, verified staff bridge, ERP identity/guardian authorization and college sign-off |

## Acceptance and measurement

Backend and synthetic HTTP tests must pass source/privacy/action/cancellation/duplicate-send regressions. Actual audio acceptance needs English, Telugu, Hindi and Telugu-English samples, proper names, amounts, dates, branch changes, pauses, noisy/interrupted speech and provider outages. A failed TTS call must leave verified text readable. A late response must not restart playback after Stop/end/unmount. A duplicate email action must create one draft/submission; an uncertain outcome must remain blocked pending reconciliation.

Measure from the caller's true final speech to the first useful answer audio, excluding filler acknowledgements. Current UI uses the last energy observation (premium auto mode) or recognition-result/manual-stop time as a proxy, ending at media playing/speech onstart; device buffering and precise acoustic onset are not captured. Report this as an estimate, separately from backend lookup latency. Use instrumented microphone/playback recordings in an explicitly consented benchmark for the real metric. Proposed p95 <1.5 seconds is a target, not a measured result. Track accuracy, pronunciation errors, interruption delay, successful resolutions, actual provider usage and invoice cost per correctly resolved call. Separate synthetic, browser-preview and live rows. There is no live cost/latency comparison yet.

## Owners, dependencies and inputs

The college must designate a public-source/translation reviewer per department, verified recipient owner, privacy/retention owner, email operator and incident/on-call owner. They own source expiry, unresolved-question triage, recipient changes, failed/uncertain email reconciliation and periodic access review. A developer owns migrations, regression checks, telemetry and deployment rollback. These roles are requirements; no real staff names or SLAs have been invented.

Owner inputs now needed: an API credential configured locally if premium testing is desired; approved source and translated-answer reviewers; officially verified department contacts; a designated test mailbox and separate explicit send authorization; secured SMTP/HTTPS adapter configuration; consenting multilingual speakers and representative microphones. Do not ask for secrets in chat. Until these arrive, use local text and synthetic tests.

## Security and operational boundaries

No automatic email release on adding credentials. No blind retry after send ambiguity. Outbox statuses distinguish recipient needed, draft, submitted/sending, SMTP accepted/sent, failed and uncertain; no delivered status is fabricated. Editing requires reconfirmed caller consent and removes staff approval. Default recording is off. Transcripts and callback addresses still contain sensitive data even with redaction; local test data must be synthetic. Retention is manual and preserves pending/uncertain sends for reconciliation. Do not expose the development server or treat an API key as commissioning approval.

Keep the existing private Site and migration history. Publish, external messages, purchases, college phone attachment and ERP connections require separate owner instruction. Later telephony needs signed webhooks, carrier failover, staff acceptance/bridge evidence (SIP REFER is insufficient), identity authorization and a supervised test-number pilot before the main number.
