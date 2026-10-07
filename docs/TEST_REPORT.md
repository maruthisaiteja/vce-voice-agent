# Sarvam integration verification — 6 October 2026

Current provider: Sarvam. The interrupted Gemini migration was superseded. No provider secrets were printed or used in these tests.

| Check | Result |
|---|---|
| TypeScript noEmit | Passed |
| Production build | Passed; local build only |
| Backend with real SQLite | 87/87 |
| Compiled Worker HTTP, synthetic Sarvam responses | 25/25 |
| Voice detection, cancellation and playback regressions | 17/17 |
| Python gateway/crawler/readiness | 27/27; one dependency deprecation warning |

Total: 156 automated checks. Tests cover exact answer text sent to Sarvam TTS, transcription configuration, provider outage fallback, source withdrawal during selection, call expiry, quotas, immediate scheduled playback cancellation, stale transcription suppression, consent, duplicate hosted hooks/drafts/staff requests, credential separation, and rejected administrative actions. They do not establish acoustic accuracy, pronunciation, real provider latency or phone delivery.

SARVAM_API_KEY and SARVAM_TOOL_TOKEN were absent in the local presence-only check. No live API call, actual hosted agent, deployed webhook, phone connection or email delivery was tested. The 80 acoustic cases remain not_run. The browser uses utterance REST transcription with streamed answer audio; hosted SDK embedding and streaming STT remain outstanding. See SARVAM_SETUP.md for activation and explicit pilot limits.

---

Earlier evidence follows for historical reference; it is not evidence for Sarvam live performance.

# Test report — 5 October 2026

## Completed evidence

| Check | Result | What it establishes |
|---|---|---|
| Frozen pnpm install | Passed with pnpm 11.19.0, Node 24.14.1 | Existing lockfile installs on this Windows host; pin 11.25.0 was not the available executable |
| Local D1 migration | Passed, migrations 0000–0003 | Local schema initialized; no remote database changed |
| TypeScript | Passed | Static types, not runtime/media behavior |
| Local production build | Passed | Vinext client/server/Worker bundles compile; not a deployment |
| Backend integration | 80/80 passed | Real SQLite, D1-shaped adapter, synthetic vendor responses |
| Gateway | 18/18 passed | Local SQLite + fake SMTP, concurrent claim and no ambiguous resend |
| Voice lifecycle | 18/18 passed | Endpoint/cancellation, transcript ordering, PCM boundaries and simulated capture/playback; not real microphone quality |
| Compiled Worker HTTP | 23/23 passed | Built route handling with Miniflare D1/R2 and synthetic ASR/TTS |
| Local browser | Passed text/context and voice configuration UI checks | Real rendered UI and local backend; no microphone capture |

Backend additions cover branch clarification and memory, cancellation before persistence, simultaneous draft creation, recipient expiry, editing/consent/review revocation, concurrent send, send ambiguity, diagnostic queues and source withdrawal during semantic selection. The test adapter's batch now executes SQLite statements atomically before yielding, matching D1 transaction behavior for concurrency tests.

HTTP additions verify Realtime playback fails closed, critical transcript confirmation precedes answer/TTS, confirmed text still uses server retrieval, and an ended call rejects audio work. Existing checks cover source links, malformed audio, authentication/origin and speech failure retaining verified text.

Browser sequence: localhost development sign-in; dashboard loads 39 seeded sources; “What is the intake?” asks the branch; “CSE” gives source-linked listed intake; “Who is its HOD?” stays in CSE; End test saves the conversation; Verified voice controls render; Premium Speak is disabled without credentials. This creates one local test conversation, not a live phone record. The email screen also saved and edited one clearly labeled synthetic unsent draft: send stayed disabled, and changing its body required renewed confirmation before Save. No recipient was verified and no message was submitted.

## Not measured / blocked

No real microphone capture or browser speech session; no premium or Realtime live provider session; no pronunciation/noise/acoustic interruption measurements; no actual end-of-speech-to-useful-audio distribution; no vendor cost comparison; no Gmail submission or inbox delivery; no carrier/PBX/ERP test. A provider winner cannot be declared. Credentials are absent and SMTP delivery authorization has not been given.

Build emits Vinext route-classification and plugin-timing notices. Gateway tests emit a Starlette httpx deprecation warning; tests still pass. Windows sandbox EPERM required approved subprocess execution. Network resets required a cached low-concurrency pnpm retry; the configured pip index was unusable and public PyPI succeeded. These are recorded environment limitations, not suppressed failures.

## Reproduce

See LOCAL_SETUP.md. Result details are tests/integration-result.json and tests/worker-result.json. Old tests/policy-result.json is a prior report; it does not independently prove live audio quality. The evaluator is also invoked by the current backend suite.

## Live streaming continuation

The Realtime tab now renders consent and a disabled start button when credentials are absent. Website evidence search was checked in the local browser: searching library returned matching pages/PDFs, with provenance, extraction status and a draft-writing action. No live microphone was started.

Seven additional compiled endpoint checks cover transcription-only ephemeral credentials, exact approved PCM speech, a fixed spoken AI opening, stream failures, cross-origin/invalid requests, staff-only paginated crawl evidence and ended sessions. Twelve additional voice tests cover stale/out-of-order completions, PCM boundaries, yes/no confirmations, simulated acoustic interruption disposal of trailing audio and closing after a spoken goodbye. Four crawler tests cover scope exclusions, robots specificity, table extraction and honest incomplete coverage.

The complete new flow is documented in LIVE_VOICE.md. Provider access, accent quality, real acoustic barge-in, latency and phone calls remain untested. Historical comments about the Realtime tab being only a notice are superseded; the old generative endpoint remains blocked.

Crawl completion: 693 checked URLs; 355 HTML and 197 PDF extractions, 33 sitemaps, 51 HTTP errors, 11 empty/dynamic pages, 24 OCR-needed PDFs, 14 size-limit errors, two robots-blocked targets, one partial PDF and five unsupported content types. No pending discovery queue. WEBSITE_COVERAGE.md lists gaps.

## Production hardening — 6 October 2026

Migration 0004 was generated and applied locally; earlier migrations remain unchanged. TypeScript, production build, 80 backend integration checks, 23 compiled Worker checks and 27 Python checks passed (18 gateway, four crawler, five production-inventory/benchmark checks). New HTTP cases verify concurrent listening-token limits and rejection of expired voice calls before provider access. Gateway tests verify that adding credentials cannot enable the legacy generative SIP route or resume prior sessions.

The offline readiness report correctly remains blocked: no voice key was present, no real acoustic evidence exists, and carrier/hosting/college commissioning evidence is still required. The benchmark evaluator tests use clearly synthetic fixtures only; none is written as live evidence. See PRODUCTION_RUNBOOK.md and benchmarks/voice-test-cases.json. No provider call, deployment, carrier purchase or real message was performed.
