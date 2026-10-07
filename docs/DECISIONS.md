# Engineering decisions — 5 October 2026

> Current provider update — 6 October 2026: use [Sarvam setup](SARVAM_SETUP.md). Sarvam API speech and restricted hosted-agent tools are implemented. The hosted agent is not created or embedded yet. Browser recognition is per utterance (REST), with streamed answer audio; older WebSocket/SIP descriptions below are historical and not activation instructions. No live quality benchmark has passed yet.


- Preserve React/Vinext, D1/R2, the current Site identity and curated exact-answer architecture. There is no evidence requiring a framework/provider replacement.
- Use a Node installer dispatcher for portable pnpm setup; retain the managed Linux installer. Keep pnpm-lock.yaml and the 11.25.0 pin. Record that this machine supplied 11.19.0 rather than pretending the pin was exercised.
- Add migration 0003 instead of modifying applied history. Existing recipient verifications without expiry fail closed; staff reverify before use.
- Treat 30 days as an operational recipient-review interval, not a college policy. Verification snapshots and staff review are independent of caller consent.
- Serialize gateway SMTP claims with BEGIN IMMEDIATE before network I/O. A known failed attempt also needs a new deliberately reviewed draft; uncertain attempts must be reconciled first. Do not infer inbox delivery from SMTP success.
- Use an energy endpoint detector with a 1.1-second pause, minimum detected voice, 10-second empty-input guard and 30-second cap. Keep manual completion; noisy environments and automatic playback barge-in remain unvalidated/incomplete.
- Cancellation has two layers: abort transport/provider calls where supported and reject stale client generations. Server cancellation is best effort if a proxy does not propagate disconnects; ended calls and fresh source authority are rechecked before saving an answer.
- Do not play generative Realtime speech to callers merely because its later transcript can be audited. Pause that endpoint and preserve contracts until an isolated benchmark and pre-playback authority boundary exist. This is an explicit capability reduction for factual safety, not evidence that another provider wins.
- Do not count backend lookup time or a filler response as voice latency. UI timing is labeled an estimate; acoustic onset and billed usage need real tests.
- Imported website facts retain the prior review attribution/date. This development session did not re-fetch or independently endorse those college facts. College reviewers own ongoing accuracy and expiry.
- SMTP, recording, phone/ERP integrations and publishing remain uncommissioned. No credentials were printed, no real recipients were contacted, and no live provider quality claims are made.

## Streaming continuation

- Add a transcription-only live path instead of re-enabling generative caller audio. Use saaras:v4 with client commits, then exact server-approved text streamed through bulbul:v3.
- Use an 800 ms pause and 160 ms onset heuristic for the new path; retain the recorded-turn fallback. Acoustic interruption is now implemented and synthetically tested, but real device/noise performance remains unvalidated.
- Crawl public pages and PDFs with provenance and explicit gaps. Keep extracted text unreviewed and preserve the 39 existing curated records. Staff approval remains distinct from successful extraction. This continuation did fetch public official sources; it does not silently reapprove or replace earlier facts.
