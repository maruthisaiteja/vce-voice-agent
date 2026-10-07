# Campus Desk

> Current provider update — 6 October 2026: use [Sarvam setup](docs/SARVAM_SETUP.md). Sarvam API speech and restricted hosted-agent tools are implemented. The hosted agent is not created or embedded yet. Browser recognition is per utterance (REST), with streamed answer audio; older WebSocket/SIP descriptions below are historical and not activation instructions. No live quality benchmark has passed yet.


A private college front-office workspace built for Vardhaman College of Engineering, with concise verified answers and human escalation. It now includes a curated official-website knowledge collection checked on 5 October 2026, English/Telugu/Hindi answers and explicit source review dates.

The implementation includes a React/Vinext admin console, Cloudflare-compatible backend with D1/R2 persistence, contextual text conversation, deterministic transcription-to-verified-answer-to-speech, browser speech preview, a paused Realtime caller-playback endpoint, a reviewed HOD/office email outbox with configurable Gmail SMTP, and a standalone Python SIP sideband gateway. It is an integration foundation, not a live commissioned college phone service.

- [Continue locally on desktop](DESKTOP-HANDOFF.md)
- [Voice, website sources and department email](docs/VOICE-AND-EMAIL.md)
- [Connect a real call](docs/SETUP.md)
- [Architecture, contracts and launch gates](docs/ENGINEERING.md)
- [Cost model](docs/COSTS.md)
- [Policy verification results](tests/policy-result.json)

See [local setup](docs/LOCAL_SETUP.md), [current requirements](docs/PRODUCT_REQUIREMENTS.md), [audit](docs/AUDIT.md), and [test evidence](docs/TEST_REPORT.md).

## Development
```sh
npm run install:ci
npm run db:local
npm run dev
```
Use the project-selected package manager/lockfile. The managed preview and published runtime are supplied by Sites. D1/R2 binding declarations are in .openai/hosting.json. Generate migrations with Drizzle before deployment; never edit applied migration history. No runtime credentials are committed.

Voice and semantic APIs require a server project API key; the console and conservative text policy work without one. The call policy enforces authority server-side; prompt instructions alone do not guarantee accurate speech. See the documented limitations and independent test requirements.

## Live voice continuation

Conversation lab → Realtime now provides transcription-only live listening with streamed exact-answer speech, spoken confirmation and interruption handling. Website evidence adds searchable public crawl provenance without automatic answer approval. See [LIVE_VOICE.md](docs/LIVE_VOICE.md) for API setup, limitations and crawl refresh. Credentials and real acoustic tests are still required; no college phone number has been connected.

Production commissioning: [PRODUCTION_RUNBOOK.md](docs/PRODUCTION_RUNBOOK.md) provides the owner steps, proposed Indian-number pilot, 80-call evaluation plan and explicit release gates. `scripts/production_readiness.py` inventories missing evidence without exposing credentials. Migration 0004 adds atomic local voice request budgets. The legacy generative SIP gateway is disabled, including startup recovery.
