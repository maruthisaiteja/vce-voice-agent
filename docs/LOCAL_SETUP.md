# Windows local setup

> Current provider update — 6 October 2026: use [Sarvam setup](SARVAM_SETUP.md). Sarvam API speech and restricted hosted-agent tools are implemented. The hosted agent is not created or embedded yet. Browser recognition is per utterance (REST), with streamed answer audio; older WebSocket/SIP descriptions below are historical and not activation instructions. No live quality benchmark has passed yet.


Use PowerShell in the project root. Node 24+ and Python 3.11+ are recommended. Use the existing pnpm-lock.yaml; do not substitute npm install or regenerate the lockfile for routine setup.

```powershell
npm install -g pnpm@11.25.0
pnpm install --frozen-lockfile
pnpm db:local
pnpm dev
```

If pnpm is already installed, check `pnpm --version` first. This workspace was successfully installed with available pnpm 11.19.0 using the frozen lockfile; the project pin remains 11.25.0. For flaky downloads retry `pnpm install --frozen-lockfile --network-concurrency=4 --fetch-retries=1`. `npm run install:ci` now selects the portable pnpm path without Bash; managed Linux retains its existing installer.

Open http://127.0.0.1:5173/signin-with-chatgpt once, then the home page. This is a development-only loopback login. Do not expose this dev server to a network. If Vinext reports another server, use its displayed URL rather than launching duplicates. Stop your terminal's server with Ctrl+C.

Local D1 data persists under .wrangler/state. `db:local` applies existing migrations, including 0004, only to the local database. Run it again after pulling new migrations; never edit an applied migration. `db:generate` is for a schema change, not ordinary startup. Do not copy cloud .sites-runtime state onto another machine. .openai/hosting.json must retain the existing Site identity.

## Checks

```powershell
node node_modules/typescript/bin/tsc --noEmit
node tests/integration.mjs
node --test tests/voice-turn.mjs tests/live-voice.mjs tests/live-client.mjs
pnpm build
node tests/worker-http.mjs
py -3.11 -m venv .venv
.\.venv\Scripts\python -m pip install --index-url https://pypi.org/simple -r gateway/requirements.txt
.\.venv\Scripts\python -m pytest tests/test_gateway.py -q
```

Worker tests require a fresh build. In a restricted desktop sandbox, spawn EPERM from Vite/Drizzle/Wrangler/Node tests requires granting the specific local subprocess command; it does not imply broken dependencies. The build does not deploy.

## Voice activation — owner action

Create ignored `.dev.vars` with SARVAM_API_KEY using a local editor/secret manager, never chat. The selected provider account needs API billing/model access. Restart the dev server and enable live voice in Settings. Use Conversation lab → Realtime for live streaming, or Verified voice → Premium audio for the recorded-turn fallback. Browser preview does not need this key but browser recognition can send microphone audio to its vendor. Check disclosure, language voice availability and microphone permission before a real test.

The older generative /api/voice endpoint still returns 409. The new Realtime tab uses /api/listen for transcription-only streaming and /api/speech for exact verified TTS. See LIVE_VOICE.md for the pipeline, tests and remaining real-device checks. Recording remains off by default.

## SMTP preparation — sending stays disabled

Use gateway/.env.example as the variable inventory. Keep SMTP_ENABLED=false until the owner authorizes one designated test recipient. Fill secrets locally; never paste them in chat. Configure a sender account, TLS mode, administrator token, App Password and explicit recipient allowlist. Verify each recipient in the desk, reconfirm draft content and sharing consent with the caller, then approve the message and current recipient.

The gateway defaults to project-local .local/gateway.sqlite. For local execution, remove the example Docker-specific GATEWAY_STATE_PATH=/data/gateway.sqlite override or set a writable absolute Windows path. Docker continues to use a persistent /data mount.

```powershell
.\.venv\Scripts\python -m uvicorn gateway.main:app --env-file gateway/.env --host 127.0.0.1 --port 8080 --workers 1
```

The tested uvicorn[standard] installation includes python-dotenv for --env-file. No file is loaded unless that option is used. Keep one worker. The desk's SMTP adapter contract requires HTTPS; a local HTTP gateway alone does not enable desk sending. For the later authorized integration test, provide a trusted HTTPS adapter endpoint and matching SMTP_ADAPTER_TOKEN in .dev.vars. Do not publish or set up a tunnel without authorization. SMTP acceptance is not inbox delivery; reconcile uncertain outcomes instead of retrying.
