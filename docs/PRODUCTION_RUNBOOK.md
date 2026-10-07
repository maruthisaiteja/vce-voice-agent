# Vardhaman production commissioning guide

> Current provider update — 6 October 2026: use [Sarvam setup](SARVAM_SETUP.md). Sarvam API speech and restricted hosted-agent tools are implemented. The hosted agent is not created or embedded yet. Browser recognition is per utterance (REST), with streamed answer audio; older WebSocket/SIP descriptions below are historical and not activation instructions. No live quality benchmark has passed yet.


Updated 6 October 2026. Current release state: **local development, not production approved**. No carrier has been selected or purchased. The owner will enter the Sarvam key locally. Do not publish the development server, connect the main college number, or send real emails as part of setup alone.

## 1. Get one real browser call working

Owner:

1. Use a college-controlled Sarvam API project for the pilot, separate from production. Configure billing, model access and a pilot spending limit in the provider console. ChatGPT subscription credits are not proof of API billing/access.
2. Create a project API key through the official API dashboard. Keep it in a local secret manager. Do not send it through chat or screenshots.
3. In `C:\Users\marut\campus-desk-v2-source`, open `.dev.vars` in a local editor. Create it if absent. Add `SARVAM_API_KEY=` followed by your key on that same line. Preserve any other settings. This file is ignored by the project.
4. Stop the existing preview process in its terminal and start `pnpm dev`. Do not start two copies. Open the displayed localhost URL; use `/signin-with-chatgpt` for the loopback development login if necessary.
5. In Settings & connections, enable live voice. In Conversation lab → Realtime, choose English, consent to microphone processing, and start one headset call.
6. Say “Who is the CSE HOD?”, then interrupt the answer with “What time does the library open?” Say “Goodbye.” Verify that the correct answer changes, the old answer stops, and the microphone closes after goodbye.
7. Repeat in Telugu and Hindi. Record the error message if a request fails; do not capture the key. A credential-presence badge proves neither provider permissions nor audio quality.

The live path uses `saaras:v4` and `bulbul:v3` with Ritu. The recorded fallback uses `saaras:v4`. Voice model access, pronunciation and performance have not yet been confirmed for this account. Do not substitute a model automatically when an access error occurs.

Developer/local operator:

```powershell
pnpm db:local
node node_modules/typescript/bin/tsc --noEmit
pnpm build
node tests/worker-http.mjs
node --test tests/voice-turn.mjs tests/live-voice.mjs tests/live-client.mjs
.\.venv\Scripts\python -m pytest tests/test_gateway.py tests/test_crawler.py tests/test_production.py -q
.\.venv\Scripts\python scripts/production_readiness.py
```

The last command deliberately exits 2 while commissioning evidence is missing. It writes `.local/production-readiness.json` and reports credential **presence only**. It does not make provider calls or prove that a credential works.

## 2. Approve what the college agent may say and do

Assign an Admissions reviewer, Examination reviewer, department contact reviewer, Telugu/Hindi language reviewer, and operational owner. They must verify the current 39 seeded answers and the new crawl evidence. Fetching a page is not approving a fee or deadline. Keep admission intake distinct from current vacancies, and published fees distinct from an individual student's bill.

Start with public enquiries. Enable staff requests only once staff can receive and action them. Keep personal fee/attendance/results unavailable until the college provides an authenticated ERP API and approves identity/guardian access. No screen scraping of student portals or voice collection of OTPs/PINs.

Department email remains an unsent-draft workflow until the owner separately authorizes a designated test recipient, verifies its address and configures the HTTPS SMTP adapter. Keep `SMTP_ENABLED=false` meanwhile. Confirm inbox receipt during the eventual authorized test; SMTP acceptance alone is insufficient.

## 3. Measure real speech before choosing a production voice

Use `benchmarks/voice-test-cases.json` as the proposed 80-call script; native speakers should review the wording before testing. Run at least **20 distinct consented calls per group**: English, Telugu, Hindi and Telugu-English. Cover fees, deadlines, proper names, corrections, interruption, unknown questions, private-record requests, provider outages, goodbye and background noise in every group. Include headset and ordinary phone-quality recordings. Use synthetic student details.

Measure the true end of caller speech and first **useful** audible answer on an acoustic recording made for the test with consent. The browser's displayed scheduling estimate is not this measurement. Measure interruption from genuine caller speech onset to the audible stop. Do not save ordinary callers' recordings by default.

Suggested acceptance targets (not observed performance): p95 useful-audio latency ≤1,800 ms and p95 interruption stop ≤250 ms in **each** language group, zero incorrect critical facts, no stale audio after interruption, and independently reviewed pronunciation. A slower target can be consciously agreed by the college after a pilot; do not quietly weaken the evaluator to get a pass.

Create `.local/voice-measurements.jsonl`, one reviewed result per line. Required fields:

```json
{"id":"unique-turn-id","call_id":"unique-test-call","language":"en","scenario":"interruption","source":"acoustic_live","reviewer":"reviewer-name","evidence_ref":"restricted-recording-and-time-range","consented":true,"correct":true,"critical_error":false,"pronunciation_ok":true,"stale_audio":false,"useful_audio_ms":1200,"interrupt_stop_ms":120}
```

Those numbers illustrate the format; they are **not test evidence**. Use actual measurements, mark errors honestly, and keep evidence references in restricted local storage. Then run:

```powershell
.\.venv\Scripts\python scripts/voice_benchmark.py .local/voice-measurements.jsonl
```

This writes `.local/voice-benchmark-report.json`. Missing groups/scenarios, simulated/UI-only timings, duplicates, critical errors and failed thresholds cannot pass. Human-entered evidence still needs independent review. A passing voice benchmark is not authorization to launch telephony.

## 4. Commission a separate Indian phone pilot

**Suggested first provider to evaluate: Plivo.** Its current documentation describes Indian-number onboarding and bidirectional audio streaming, playback clearing and signed callbacks. Exotel is a reasonable alternative; its Voicebot/AgentStream feature may need account enablement. This is a shortlist based on documented capabilities, not a measured quality or price winner.

Before purchasing, have the provider confirm the college's eligibility, required organizational documents, available test number, inbound forwarding support, bidirectional streaming, codec, concurrent calls, call transfer/conference support, per-minute charges, streaming charges, taxes, monthly rental and support escalation. Complete onboarding in the college-owned account. Do not submit organizational documents in this chat.

For Plivo, request an India/INR account suitable for the college and a separate voice-enabled test number. Follow the provider's current onboarding requirements. Do not forward Vardhaman's existing public number yet.

Developer work after provider selection/account confirmation:

- Implement and test the provider's **signed Answer URL and WSS media adapter**. The current project does not yet contain this carrier adapter. Verify signatures against the configured public URL, reject spoofed/replayed events, and associate stream IDs with the authenticated call.
- Relay provider audio to transcription and send only the desk's verified replies through TTS. Translate the carrier codec correctly; browser 24 kHz PCM is not directly interchangeable with 8 kHz phone audio. Prove frame sizes, playback clearing, disconnect and backpressure behavior with carrier fixtures and real calls.
- Keep provider credentials on the gateway. Enforce active-call concurrency, hard session duration, per-account usage caps and shutdown on the server. Browser-only timers are insufficient for a public phone service.
- Route every carrier/media failure to an approved staff backup destination. Test a server outage, failed ASR/TTS and restart. A transfer is connected only after evidence of staff acceptance and caller bridge; a request or SIP REFER is not a warm-transfer success.
- Pilot with approved testers, then a limited supervised inbound window. Obtain explicit owner sign-off before forwarding the main number.

The older `/webhooks/openai` generative SIP acceptance route is now fixed at 503; startup cannot resume its accepted sessions. This prevents adding credentials from enabling unverified speech. Configure a carrier-side fallback before any live traffic; do not point a real number at this disabled route.

## 5. Stage and operate the service

Preserve the existing private Site identity in `.openai/hosting.json`. Prepare a reviewed deployment against that Site and a persistent HTTPS/WSS gateway host. Do not deploy the loopback development authentication shim. Provision verified staff authentication, department roles and administrative separation before widening access.

Before release, supply and test:

| Area | Required evidence | Owner |
|---|---|---|
| Hosting | HTTPS/WSS, stable DNS, certificate renewal, persistent gateway storage and restart health | Technical operator |
| Credentials | Separate staging/production projects, scoped keys, secure deployment injection and rotation procedure | Account owner |
| Access | Unauthenticated, spoofed-header and wrong-role requests denied at the real ingress | Security/technical owner |
| Capacity | Expected peak concurrent calls plus load-test results; reject overflow to staff | College + technical operator |
| Cost | Provider spend controls and measured cost per successful call; notification destinations | Account owner |
| Data | Approved transcript/recording retention, deletion schedule and restricted export access | College data owner |
| Recovery | Encrypted backup, successful restore rehearsal, migration rollback and carrier failover | Technical operator |
| Monitoring | Alerts for provider failures, latency, disconnects, stale sources and exhausted budgets | On-call operator |
| Human service | Office hours, verified destinations, callback ownership and closed-office behavior | College front office |
| Release | Signed pilot results, known limitations and main-number rollout decision | College release owner |

Local voice request limits now use shared atomic D1 counters: six listening-token attempts/minute/staff actor, four/call; 30 speech or recorded-audio requests/minute/actor and 80/call; pilot-wide daily ceilings of 250 listening-token attempts and 2,000 requests **per audio operation**. Attempts consume a slot even if cancelled or failed. These are conservative development defaults, not a billing guarantee. Local request endpoints reject calls older than 15 minutes. A previously issued direct provider socket is not forcibly terminated by these counters; the carrier/server relay must enforce that separately.

## References

- [OpenAI production guidance](https://developers.openai.com/api/docs/guides/production-best-practices)
- [OpenAI live transcription](https://developers.openai.com/api/docs/guides/realtime-transcription)
- [Plivo streaming and India prerequisites](https://docs.plivo.com/docs/voice-agents/audio-streaming/concepts/audio-streaming-guide)
- [Exotel streaming enablement](https://support.exotel.com/support/solutions/articles/3000132268-quick-guide-to-get-started-with-exotel-streaming-services)
- [Exotel AgentStream protocol](https://developer.exotel.com/docs/agentstream/websocket-protocol)

Current actionable owner step: add the voice key locally, restart the preview, and test the first headset call. Report success or the redacted error. Carrier purchase, deployment and college access require the corresponding owner/account steps above.
