# Voice and department email build

> Current provider update — 6 October 2026: use [Sarvam setup](SARVAM_SETUP.md). Sarvam API speech and restricted hosted-agent tools are implemented. The hosted agent is not created or embedded yet. Browser recognition is per utterance (REST), with streamed answer audio; older WebSocket/SIP descriptions below are historical and not activation instructions. No live quality benchmark has passed yet.


## What works without external credentials

The private admin console, source-backed text conversation, English/Telugu/Hindi answer variants, programme and branch clarification, scope-preserving follow-ups, safe unknown responses, source withdrawal, call history, review and staff requests run against D1. The official website collection is inserted once, with stable IDs; reopening the app never reapproves a withdrawn or edited entry.

The public collection was checked on 5 October 2026. `lib/college-data.ts` includes exact source URLs, review expiry and a coverage manifest. It covers campus contacts, counselling code, courses, listed intake, annual tuition, published eligibility requirements, hostel facilities, transport directory, student/payment portals, examination/calendar indexes, library services, health facilities, CDC and verified CSE/IT/MBA HOD names. This is a curated public collection, not a complete copy of every page or PDF. Some branch sites could not be fully retrieved; protected email addresses were not guessed. Academic calendars are indexed, not parsed into unverified event dates. No current seat vacancies, hostel prices, exam deadlines, admission cutoff ranks or individual placement guarantees are asserted.

Annual tuition figures are explicitly described as website listings because the fee table does not identify the applicable batch. Mutable figures/contact facts expire for review after 30 days; stable facts after 90 days. These dates are review limits, not college policy dates. Staff must check the official source, update the concise answer and reapprove it. There is no automatic live website crawler.

## Voice modes

1. **Verified voice — Premium audio:** microphone recording, at most 30 seconds per turn; configurable Sarvam transcription -> the server's approved answer resolver -> TTS of that exact short text. No speech model writes college answers. Hands-free mode detects a pause and listens again after playback, with a manual Finish question fallback. Stop and Interrupt & speak cancel current work. Energy detection is uncalibrated; acoustic barge-in during playback remains incomplete. Audio remains transient and is not stored by Campus Desk. Text answers remain available if TTS fails. Defaults are `saaras:v4`, `bulbul:v3`, and `marin`; server overrides are supported.
2. **Verified voice — Browser preview:** browser speech recognition -> the same resolver -> installed browser voice. This requires no Sarvam key. Browser/OS support varies; recognition may use the browser vendor's server and may not work offline. Telugu/Hindi playback needs a matching installed voice. This is a preview, not a premium voice-quality benchmark.
3. **Realtime:** caller playback is paused (HTTP 409) because transcript review happens after audio reaches the caller. The existing client and SIP contracts are retained for future evaluation; an isolated benchmark and pre-playback authority gate are required before re-enabling.

The API key stays server-side. Add it securely to the server environment or your ignored local `.dev.vars` file, then enable live voice in Settings. Raw audio reaches the selected provider for processing; no claim of on-device/private/offline ASR is made. Live audio quality, background noise, mixed languages, proper names and number pronunciation need real microphone tests before commissioning. No such provider test has been run without credentials.

References: https://developers.openai.com/api/docs/guides/speech-to-text, https://developers.openai.com/api/docs/guides/text-to-speech, https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition.

## HOD and office email

Department emails contains separate recipients for the administrative offices and engineering/MBA branches. The publicly verified HOD names and their sources are seeded. Email addresses remain blank until staff verify them from official college information. A verified address needs a name, address, HTTPS source and staff attribution, expires after 30 days, and is rechecked at review/send. Earlier verifications without expiry must be renewed.

Caller-confirmed department, summary, callback email and sharing consent are required to prepare a message. The outbox persists a short plain-text draft, including only the submitted request and optional callback email. Drafts are not deliveries. Staff explicitly approve the body and current verified recipient before sending. Editing requires renewed caller confirmation and sharing consent, and revokes staff approval. Voice tools may prepare drafts after consent; they cannot send department emails. The app's send button is a separately explicit staff action.

The Python gateway supports Gmail SMTP SSL on port 465 or STARTTLS on 587, with certificate verification. Configure `SMTP_ENABLED=true`, sender account, Gmail App Password and an explicit verified recipient allowlist. Do not use a normal Gmail password. On the hosted desk, configure the HTTPS gateway URL as `SMTP_ADAPTER_URL` and matching gateway admin token as `SMTP_ADAPTER_TOKEN`. Public SMTP credentials never enter the frontend or knowledge base.

Every email uses a durable idempotency key at both the desk and gateway. A concurrent send cannot send twice. A timeout during submission is uncertain, never blindly retried. SMTP acceptance is labelled sent, with an explicit note that inbox delivery is not confirmed. Failed/uncertain outcomes need staff reconciliation; a fresh reviewed draft is required for a deliberate new attempt. There is no background sender silently releasing saved drafts when credentials are added. The manual retention action removes older draft/sent emails along with expired calls; uncertain/sending outcomes remain for staff reconciliation.

Gmail reference: https://support.google.com/a/answer/176600?hl=en.

## Deferred as requested

College mobile/SIP number, actual human transfer bridge, private ERP and student verification are integration contracts from the earlier build. They remain disabled/uncommissioned. SMTP sending remains disabled until credentials, recipient verification and a real delivery test. API-dependent speech remains disabled until key setup and a real microphone test. Backend tests establish bounded workflow behavior, not a claim of perfect real-world voice accuracy.
