# Implementation plan

> Current provider update — 6 October 2026: use [Sarvam setup](SARVAM_SETUP.md). Sarvam API speech and restricted hosted-agent tools are implemented. The hosted agent is not created or embedded yet. Browser recognition is per utterance (REST), with streamed answer audio; older WebSocket/SIP descriptions below are historical and not activation instructions. No live quality benchmark has passed yet.


Updated 5 October 2026. Work was performed in the extracted project; no new Site or deployment was created.

## Completed locally

1. Inspect source and earlier notes; preserve architecture and existing Site identity.
2. Replace Bash-only portable install entry point; install frozen dependencies and initialize local D1.
3. Add voice turn cancellation, timeouts, cleanup, silence endpointing/manual fallback, confirmation UI and estimated playback latency.
4. Fix branch clarification/follow-ups; recheck source authority after semantic matching.
5. Block unverified Realtime caller audio pending a safe benchmark design.
6. Append migration 0003 for recipient expiry/review, add editable reconfirmed drafts, conditional send/review claims, durable duplicate handling and SQLite SMTP serialization.
7. Add source review/unresolved-question diagnostics and regression tests; verify local pages/build/HTTP behavior.

## Next unblocked engineering

- Add an isolated Realtime evaluation harness with no actions and no caller-facing playback; decide how to enforce exact factual output before re-enabling the product endpoint.
- Persist structured voice timing and provider usage records; aggregate benchmark results by mode/language/device.
- Extend the new simulated media tests to real browsers and devices, especially mobile permission delays, tab suspension, speaker echo and network loss.
- Completed in the continuation: spoken once-only opening, spoken confirmation, transcription-only streaming, exact-answer PCM playback and synthetic interruption tests. See LIVE_VOICE.md.
- Strengthen semantic matching evaluations and retrieval coverage; add reviewer assignment, alerting and audited source refresh workflows.

## Work blocked on owner inputs

- Premium voice quality/pronunciation/latency/cost: local secure API configuration, test authorization and consenting speakers/devices.
- SMTP acceptance/inbox result: designated mailbox, reviewed recipient, secured gateway configuration and explicit send-test authorization. Keep disabled.
- Production operations: source/contact approvers, access roles, retention decisions, incident owner and pilot acceptance.

## Deferred

Mobile/SIP connection, actual human bridging and ERP remain later contracts. No purchases, publishing, main-number routing, real HOD messages or student-record access in this task.
