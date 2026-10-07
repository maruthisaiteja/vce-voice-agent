## Production-hardening checkpoint — 6 October 2026

> Current provider update — 6 October 2026: use [Sarvam setup](docs/SARVAM_SETUP.md). Sarvam API speech and restricted hosted-agent tools are implemented. The hosted agent is not created or embedded yet. Browser recognition is per utterance (REST), with streamed answer audio; older WebSocket/SIP descriptions below are historical and not activation instructions. No live quality benchmark has passed yet.


Phone provider is not chosen. User selected Sarvam and has not yet created a hosted agent. Prepared docs/SARVAM_AGENT_INSTRUCTIONS.md and docs/SARVAM_SETUP.md, implemented Sarvam API voice and /api/sarvam/tools. Current checks: 87 backend, 25 HTTP, 17 voice, 27 Python, types and build. No live tests; both Sarvam secrets absent. Owner can add SARVAM_API_KEY to .dev.vars locally. Key presence remained false at last check. Added D1 voice budgets (migration 0004 applied locally), blocked legacy SIP acceptance/recovery, created offline readiness and acoustic benchmark evaluators, 80 proposed test calls, and docs/PRODUCTION_RUNBOOK.md. Build/types and 80 backend + 23 HTTP + 27 Python tests pass. No live audio, deployment, carrier purchase or external messages. Next: owner configures key, supervise real headset tests; select/confirm carrier account before implementing and commissioning its signed media adapter. Plivo is the documented first candidate, Exotel alternative. Do not present the current gateway as a functioning phone adapter.

## Latest continuation: live listening and website crawl

See docs/LIVE_VOICE.md and docs/TEST_REPORT.md. Conversation lab → Realtime now uses saaras:v4 and streamed exact-answer TTS, with spoken confirmation, interruption and goodbye cleanup. The older /api/voice generation endpoint remains blocked. A public crawl and staff-only review catalog are in scripts/crawl_website.py and data/website-crawl.json; raw text and resumable state are in .local/website. No key was present, so no real voice or phone call was tested. SMTP stays disabled.

# Continue this project on your computer

Extract the source ZIP into a folder such as `C:\Projects\campus-desk`. In ChatGPT desktop's local coding workspace, Codex CLI, or the Codex IDE extension, open that folder and ask:

> Read DESKTOP-HANDOFF.md, README.md and docs/VOICE-AND-EMAIL.md. Continue this Vardhaman voice-agent project. Keep spoken replies short and source-backed. First connect and test premium audio. Phone numbers, human transfers and ERP are later phases. SMTP credentials will be provided securely later. Preserve the existing private Site and migration history.

Opening the conversation on desktop does not automatically download the project or connect this cloud workspace to your filesystem. The ZIP transfers the source; this handoff transfers the project decisions. The native Windows app can work in the selected local folder: https://learn.chatgpt.com/docs/windows/windows-sandbox.

## Local development (Windows PowerShell)

Install Node.js 24 or newer and Python 3.11 or newer. Run in the extracted project folder:

```powershell
npm install -g pnpm@11.25.0
pnpm install --frozen-lockfile
node scripts/local-db.mjs
pnpm dev
```

Open http://localhost:5173/signin-with-chatgpt to enter the development-only local sign-in flow, then open the home page. This local sign-in is confined to loopback development; published access remains private. Fresh source folders default to the portable execution profile. Do not copy a managed cloud `.sites-runtime` folder onto Windows.

The local database command initializes a separate local SQLite database. It does not copy hosted conversations or deploy migrations to the hosted database. If the local dev server reports missing tables, stop it, run the migration command again from this folder, then restart.

To test premium voice locally, create an ignored `.dev.vars` file with `SARVAM_API_KEY` set through your secret manager or local editor, then restart the dev server. Enable live voice in Settings. Never paste credentials into chat or commit them. The API account needs billing and access to the selected speech models.

```powershell
node node_modules/typescript/bin/tsc --noEmit
node tests/integration.mjs
py -3.11 -m venv .venv
.\.venv\Scripts\python -m pip install -r gateway/requirements.txt
.\.venv\Scripts\python -m pytest tests/test_gateway.py -q
```

To run the optional SMTP gateway, supply the private environment values from `gateway/.env.example`, then run `.\.venv\Scripts\python -m uvicorn gateway.main:app --host 127.0.0.1 --port 8080 --workers 1`. The Python gateway does not load `.env` automatically. For hosted email access, deploy this gateway behind HTTPS and configure `SMTP_ADAPTER_URL` and its secret token on the desk. Local browser previews do not need this gateway.

## Existing hosted project

- Private Site ID: `appgprj_6ac2ff5ec1e88191938c48c8bdcc0fe5`
- URL: https://college-front-office-teja.maruthisaiteja9.chatgpt.site
- Do not register a replacement Site. Use its existing source repository and append migrations.
- This ZIP contains the new voice and department-email implementation. Premium speech remains gated until its server API key is configured and live voice is enabled.
- No API keys, SMTP credentials, hosted database records or service tokens are in this bundle.

Read `docs/VOICE-AND-EMAIL.md` for modes, source coverage, activation and test limits. The source includes reproducible backend tests and SMTP fakes; live accent, latency, pronunciation and Gmail acceptance still require configured accounts and real sessions.

## Current continuation status

Read docs/LOCAL_SETUP.md and docs/TEST_REPORT.md for this Windows continuation. Recipient verification now expires and requires staff draft review. Realtime caller playback is paused until speech can be checked before playback. Voice/speech and Gmail live results remain unmeasured.
