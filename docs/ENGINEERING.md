> 6 October 2026: Current commissioning instructions are in PRODUCTION_RUNBOOK.md. Legacy generative SIP acceptance and restart recovery are disabled. Older SIP examples below are historical architecture, not an enabled production path. A controlled-media carrier adapter remains to be implemented and tested.

> Current provider update — 6 October 2026: use [Sarvam setup](SARVAM_SETUP.md). Sarvam API speech and restricted hosted-agent tools are implemented. The hosted agent is not created or embedded yet. Browser recognition is per utterance (REST), with streamed answer audio; older WebSocket/SIP descriptions below are historical and not activation instructions. No live quality benchmark has passed yet.


# Campus Desk engineering specification

Current implementation and measured limits: [requirements](PRODUCT_REQUIREMENTS.md), [audit](AUDIT.md), [test report](TEST_REPORT.md). Historical phone contracts below are deferred.

## Current release boundary
This release contains a deployable private college admin console, D1-backed knowledge/calls/tickets/audit, staff approvals, a conservative verified-answer policy, optional semantic answer selection, browser WebRTC voice adapter, a standalone SIP sideband gateway, and HTTP contracts for a college PBX and ERP.

It is an integration foundation, not a validated replacement for the college main number. The source bundle now includes curated official public facts with review dates, including qualified published tuition and contacts. No credentials or actual student records were supplied; protected addresses and missing dates are not invented. A real warm conference, OTP delivery, SMS/email delivery, and phone audio recording depend on the contracted providers and college adapters. Sarvam is a benchmark alternative; it is not the active production voice path in this release.

## Architecture
- **Voice media:** SIP carrier → OpenAI Realtime; persistent Python sideband handles tools. Current admin voice uses the verified ASR → resolver → TTS chain or browser preview. Caller WebRTC playback is paused. SIP remains a deferred contract.
- **Conversation:** One natural speaking assistant; department-scoped deterministic backend permissions. Multiple autonomous LLM agents are intentionally unnecessary for the initial call path: they add latency without establishing authority. Specialist department workflows share a single caller experience.
- **Authority:** Staff approve exact concise answers with source, topic, department, language, validity, access, approver, approval time. Editing removes approval. Expired, future, conflicting and private facts cannot become general answers.
- **Retrieval:** Conservative multilingual keyword matching without a key. With SARVAM_API_KEY, structured Responses selection can match paraphrases. The model selects a record ID; it does not author a fee/date/policy answer. The server rechecks authority and returns the exact staff answer. No LLM confidence score authorizes a fact. Semantic selection ranks active public records by terms and sends at most 100 candidates; it does not disable at 120. A fresh authority check runs after selection. This remains bounded lexical retrieval, not a complete hybrid index.
- **Actions:** Narrow server-validated actions, independent authentication, staff-only approval/settings, caller agreement before handoff, fail-closed student records.
- **Persistence:** D1 records, private R2 recordings, local durable SQLite for the standalone single-worker gateway's session/tool idempotency.
- **Human service:** A PBX adapter must manage ring, whisper/context, acceptance, bridge, busy/no-answer and call recovery. A SIP REFER response is not a confirmed staff connection.

## Voice contract
Use one or two sentences, normally 10–30 words. Maximum approved-answer size: 55 words/500 characters. The Realtime output budget is 220 tokens, including tool calls. Language and scripts make token-to-word limits imperfect: test actual audio and transcripts. Stop on interruption, ask one clarification at a time, confirm uncertain amounts/dates/IDs, no repeated introductions, and no invented facts.

The response budget and prompt are guidance, not a proof that audio is accurate. Both verified tool replies and spoken assistant transcripts are logged separately. Differences flag a staff review. For stricter deterministic spoken output, benchmark the cascaded ASR → resolver → verbatim TTS route before production. The semantic selector also needs independent evaluation and cannot establish a zero-hallucination guarantee.

## Database
See db/schema.ts and generated drizzle migrations. Tables: knowledge, departments, settings, calls, turns, tickets, audit, evaluations, events, verifications, messages, email_directory, email_outbox. Schema migrations are generated and applied at deployment; no schema creation during requests. All application queries use parameter bindings. Gateway SQLite is a separate operational store.

## Workflow coverage
| Area | Current behavior | Required integration |
|---|---|---|
| Admissions, academic calendar, exams, fees, hostel, transport, placements, faculty information | Approved Q/A retrieval and department routing | College notices, translations, department ownership |
| Payment/attendance/application/hostel status | General voice answers are blocked; verified secure-page challenge, status and student-scoped lookup tools provided | College ERP adapter and secure verification page |
| Refunds, complaints, exceptions | Staff handoff/callback request | Designated officers, SLA and office contacts |
| Warm transfer | Office-hours and enabled-destination gate; context + ticket to bridge | PBX conference adapter |
| Call history | Verified replies, tool decisions, source IDs, actual speech transcripts | Enable provider input transcription for full caller speech |
| Audio recording | Opt-in field, protected upload/playback, retention purge | Consent capture and provider recording webhook |
| SMS/email | Consent/recipient gate; exact approved answer through delivery adapter | MESSAGE_ADAPTER_URL/TOKEN and delivery provider |
| Document ingestion | Authenticated PDF/TXT extraction endpoint; staff-curated Q/A approval | OCR for scanned notices, review ownership |
| Callback scheduling | Requested contact/time and staff queue | Staff calendar/availability; no guaranteed slot |
| Staff quality review | Accurate / needs review / incorrect, comments, audit | Dedicated review team |
| Evals | 21 synthetic source/privacy/response policy checks | Independent 1,000 conversation audio benchmark |

## Integration contracts
### ERP adapter
Gateway → official trusted HTTPS ERP service. Fixed endpoints:
- POST `/identity/challenges` `{studentId,callId}` → `{challengeId}`; sends OTP to the registered contact, never a caller-supplied replacement number.
- POST `/identity/verify-receipt` `{challengeId,receipt}` → `{verified:true,accessToken}`. Receipt comes from the secure college verification page. The model never receives an OTP.
- GET `/identity/challenges/{challengeId}/status` → `{verified:true,accessToken}` after successful secure-page verification; verified token is never returned to the model or stored in D1.
- GET `/student/me/fee-status`, `/attendance`, `/application-status`, `/hostel-status` with a short-lived student-scoped token; return `{status,spokenAnswer,asOf}` with a concise staff-approved interpretation and ISO timestamp. No caller-selected student ID is allowed after verification.

Gateway verification endpoints are administrator/service protected. The voice tool set exposes verification and student lookup, but these fail closed until the college secure-page integration and student relationship authorization are configured. A parent's caller ID or knowledge of a roll number does not establish permission. Log lookup metadata without logging OTPs or tokens. The college must define guardian access rules.

### PBX warm transfer adapter
Hosted desk → `TRANSFER_ADAPTER_URL` with Bearer `TRANSFER_ADAPTER_TOKEN` and `{callId,department,target,ticketId,summary,mode:"warm"}`. Configure the gateway `/transfer/warm` endpoint with the gateway admin token, or implement the same contract on the college PBX bridge.

Gateway → `PBX_ADAPTER_URL/warm-transfer` with context and `Idempotency-Key: ticketId`. Responses are `initiated`, `connected`, or `callback_requested`. `connected` is valid only after the staff member accepts and the caller is bridged. Implement a signed status callback if connecting asynchronously. The present synchronous path does not reconcile later asynchronous connection events; retain the ticket for staff follow-up.

The adapter must refuse destinations outside its server-side college allowlist. Do not expose arbitrary dial tools to the model. Test staff voicemail, rejected invitations, no answer, busy, office closed and caller disconnection. Caller must return to the AI or receive the backup line on failed bridging.

### Recording
Disabled by default. The trusted recording service collects explicit consent and calls `call.consent`; then POST audio to `/api/recording?callId=...` with application service authorization and private platform authorization. Accept WAV/MP3/OGG ≤25 MiB. Recording must begin only after opt-in; setting the field after capturing audio is insufficient. Raw OpenAI SIP media is provider-owned, so use the carrier/PBX's recording facility. Retention purge is manual in this release. Schedule it on the final host after college retention policy approval.

## Security / reliability implementation and limits
The hosted console is owner-private behind Sites authentication. Staff approvals require the authenticated identity header; service actions require DESK_SERVICE_TOKEN and platform service authorization. This is a single-owner release, not department RBAC. Before sharing with college staff, implement roles and approver allowlists. Never publish student operations publicly without that boundary.

Gateway webhook signatures use the official SDK. Sessions have an atomic acceptance claim. Tool results are durably cached by tool-call ID. An interrupted side effect is marked uncertain rather than blindly repeated. Single process only; use a transactional shared store and leases for multiple replicas. Gateway recovery reattaches accepted calls but cannot guarantee carrier survival after host failure. Configure carrier failover to real staff/voicemail independently.

Private transcripts may still contain personal information. The current redactor masks long numbers, email addresses and obvious credentials; it is not comprehensive anonymization. Before real student data, add encrypted secrets/storage on the host, granular staff access, signed provider events, automated deletion, audit retention, reviewed privacy/recording notices, vulnerability testing, capacity tests and operational alerts. Do not place real student data into test fixtures.

## Acceptance gates before the college main number
1. College approves every fee/date/policy and translated response with an expiry and owner.
2. Test English, Telugu and Hindi with actual parent/student accents and phone audio; compare OpenAI-native versus a Sarvam cascaded path with the same source backend.
3. Independently label 1,000 test conversations, split for development and a locked holdout. Include 250 English, 250 Telugu/code-mixed, 150 Hindi, 150 noisy/interrupted, 100 stale/conflicting/private/injection, and 100 transfer/tool-failure scenarios; stratify overlapping conditions when measuring each slice.
4. Proposed gates, subject to college sign-off: zero unauthorized disclosures or invented critical amounts/dates in holdout; ≥98% supported factual answer precision; ≥98% correct routing; ≥95% eligible warm transfers; p95 end-of-turn to first useful audio under 1.5 seconds; all failed transfers have a working staff-request path. These are targets, not measured results.
5. Real carrier test across mobile networks and noisy settings; demonstrate barge-in and callback fallback. Test provider timeouts and gateway restart.
6. Pilot on a new test number with staff supervision and limited concurrency. Start with public inquiries. Enable individual records only after the ERP identity and guardian access workflow is reviewed.
7. Monitor staff-reviewed accuracy by department/language, real resolution, transfer completion, latency, caller feedback and missing sources. The current console reports observed counts without invented success percentages.

## Implementation phases
- Current: functional private console, core authority backend, text lab, adapters, policy test set.
- Next with access: provider secrets, official college sources/contacts, carrier number, staff transfer bridge, secure ERP verification, real microphone/phone calls.
- Following pilot: multilingual voice winner, larger retrieval index, OCR review queue, advanced messaging receipts, verified calendar callbacks, department RBAC, automatic retention, production observability.
- Launch: independent holdout and safety gates pass, college sign-off, gradual traffic rollout, documented human fallback and staffed on-call ownership.

## Public information delivery adapter
Configure MESSAGE_ADAPTER_URL/TOKEN. POST `/messages` with `{channel,recipient,text,source}` and Idempotency-Key; reply `{status:"accepted"}` or `{status:"delivered"}` only on provider confirmation. The model supplies no arbitrary message body: text comes from an active approved public source. Recipient must be confirmed and consent supplied. Limit is three delivery requests per call. An uncertain timeout is not reported as sent and is not automatically retried. Delivery receipts and rate limiting must also be enforced by the contracted provider.
