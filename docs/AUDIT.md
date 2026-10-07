# Campus Desk audit — 5 October 2026

> Current provider update — 6 October 2026: use [Sarvam setup](SARVAM_SETUP.md). Sarvam API speech and restricted hosted-agent tools are implemented. The hosted agent is not created or embedded yet. Browser recognition is per utterance (REST), with streamed answer audio; older WebSocket/SIP descriptions below are historical and not activation instructions. No live quality benchmark has passed yet.


Inspected the extracted Windows project at its existing root, including package scripts, portable/managed build wrappers, policy, semantic retrieval, conversation context, audio routes, both voice components, email UI/backend, schema/migrations, SMTP gateway and tests. No applicable AGENTS.md was found in the project or its parent chain. This source bundle has no .git directory, so there is no local diff baseline or commit history. Existing Site identity remains appgprj_6ac2ff5ec1e88191938c48c8bdcc0fe5. Nothing was published or sent externally.

## Findings and changes

| Finding | Resolution / evidence |
|---|---|
| README installed through Bash and generated rather than applied local migrations | Portable Node installer; README and LOCAL_SETUP use frozen pnpm install and db:local. Local D1 initialized successfully. |
| Source bundle contains 39 curated public facts; older notes denied having college facts | Documentation reconciled. The imported review dates are inherited source metadata, not a new live website audit in this session. |
| Branch clarification only recognized programmes | CSE intake clarification and subsequent HOD memory fixed; backend and browser checks pass. |
| Voice request could wait indefinitely; canceled work could return late | Abortable bounded requests, generation guard, microphone/recorder/audio cleanup and Stop during checking. Server checks cancellation and ended calls before persistence. |
| Premium recording required a manual stop | Optional energy-based pause detection and automatic next turn; 30-second cap and manual fallback. Not validated with live accents/noise. |
| Listening could accept uncertain critical hearing | Editable confirmation for low-confidence browser recognition and numeric/name/date markers; premium transcription uses markers because calibrated confidence is unavailable. This is a heuristic, not complete proper-name detection. |
| Realtime spoke before transcript review | Caller WebRTC endpoint now fails closed with HTTP 409; UI directs users to Verified voice. The old client and SIP contracts remain for future isolated evaluation, not commissioned use. |
| Verified recipient never expired; send did not require recorded review | New migration 0003 adds 30-day recipient verification expiry and explicit review attribution/snapshot. Existing recipients without expiry need reverification. |
| Concurrent draft creation or SMTP claims could race | Database unique insert/claim and gateway BEGIN IMMEDIATE; race tests pass. |
| Draft review could race with send/edit | Conditional updates bind review to content and current recipient verification. Editing clears review; attempted items cannot be edited or blindly resent. |
| Staff lacked a focused freshness/missing-topic view | Review queue and grouped redacted unresolved questions added to Verified knowledge. Escalations are candidates to inspect, not asserted missing facts. |
| Semantic result could outlive source withdrawal | Fresh authority/answer/conflict check after provider selection; withdrawal-during-lookup regression passes. |

## Environment and remaining risks

Node 24.14.1, Python 3.11 and pnpm 11.19.0 were available. packageManager remains pinned to 11.25.0; the available 11.19 installed the frozen lockfile successfully without changing it. Registry downloads required sandbox approval and a low-concurrency retry. Python packages installed into .venv from public PyPI after the configured index failed. Windows sandbox EPERM required approval for build/Worker subprocesses, not code workarounds.

No voice/SMTP credentials were present in the checked process environment or local environment files. The test suites use synthetic provider replies. No real microphone, browser speech recognition, premium audio, Gmail acceptance, inbox delivery, phone transfer or ERP session was tested. Single-owner auth, manual retention, no automated operational alerts and uncalibrated endpointing remain release limits. See PRODUCT_REQUIREMENTS.md and TEST_REPORT.md.
