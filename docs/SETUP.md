# Connect the first real call

> Current provider update — 6 October 2026: use [Sarvam setup](SARVAM_SETUP.md). Sarvam API speech and restricted hosted-agent tools are implemented. The hosted agent is not created or embedded yet. Browser recognition is per utterance (REST), with streamed answer audio; older WebSocket/SIP descriptions below are historical and not activation instructions. No live quality benchmark has passed yet.


The private admin console is published separately from the persistent SIP gateway.

The new voice-first build and Gmail department-email workflow are documented in [VOICE-AND-EMAIL.md](VOICE-AND-EMAIL.md). Phone/ERP steps below remain later phases.

## 1. College information
Use Verified knowledge → Add source. Enter common questions, the exact short answer, official reference, department, validity and optional Telugu/Hindi answer. Save as draft; a designated staff member reviews the original notice, then approves it. Keep separate topics for regular/supplementary exam deadlines, programs and academic years. Conflicting active answers for the same department/topic are blocked.

Configure staff SIP destinations or official E.164 phone numbers in Department routing. Specify working days and IST office hours. No department destinations have been invented.

## 2. Hosted backend secrets
Set these server secrets through the hosting environment, never in browser code:
- SARVAM_API_KEY: a project API key with billing enabled. A ChatGPT subscription does not supply it.
- SARVAM_TRANSCRIBE_MODEL: model ID to benchmark; default `saaras:v4` is configurable.
- SARVAM_REASONING_MODEL: optional semantic selector; default `sarvam-105b-conversations`.
- DESK_SERVICE_TOKEN: randomly generated service token.
- TRANSFER_ADAPTER_URL and TRANSFER_ADAPTER_TOKEN: approved HTTPS warm bridge.
- ERP_ADAPTER_URL and ERP_ADAPTER_TOKEN: official college verification/record adapter.
- MESSAGE_ADAPTER_URL and MESSAGE_ADAPTER_TOKEN: optional consent-based SMS/email provider.

Enable live voice in Settings after configuring the key. Conversation lab → Verified voice requests microphone access only when started. Realtime caller playback is paused. No live microphone/provider test has been performed in this continuation.

Add an API project key securely to the hosted server environment, or to an ignored local `.dev.vars` file for desktop work. Do not paste keys into chat or knowledge sources.

## 3. Gateway host
Use an HTTPS-capable persistent container/VM host that permits long-lived outbound WebSockets. Build from the repository root:

```sh
docker build -f gateway/Dockerfile -t campus-desk-gateway .
docker run --env-file gateway/.env -v campus-gateway-state:/data -p 8080:8080 campus-desk-gateway
```

Copy gateway/.env.example to a private gateway/.env. Supply the exact private desk URL, the private Site's platform service credential, matching desk service token, and a random gateway admin token. Never commit the real file. One worker/replica only until distributed leases are implemented. TLS termination, secret injection and host backups belong to the selected host.

Python-local setup (Windows PowerShell):
```powershell
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r gateway/requirements.txt
# Set environment variables through your shell or secret manager.
uvicorn gateway.main:app --host 127.0.0.1 --port 8080 --workers 1
```
The gateway does not load .env automatically in local Python execution; use your environment or uvicorn's env-file support after installing python-dotenv. Docker's --env-file injects it.

## 4. Telephony
Procure/configure an India-compatible carrier SIP number with the college's authorization. Carrier KYC, number availability, concurrency, local routing and recording behavior must be confirmed with the provider.

The legacy provider SIP route is disabled. Follow SARVAM_SETUP.md to prepare the hosted agent. Carrier connection and live transfers remain deferred.

Configure staff fallback at the carrier if the AI or gateway is unavailable. Verify public HTTPS webhook reachability and validate signatures. SIP media travels carrier-to-provider, not through the admin console.

## 5. Human handoff
Implement the PBX warm-transfer contract in ENGINEERING.md. A simple SIP REFER is a redirect and does not deliver a staff whisper/accepted conference. Set the hosted transfer URL to the gateway `/transfer/warm`, with its admin token, and configure PBX_ADAPTER_URL/TOKEN on the gateway. First test with two consenting staff members and a test number.

## 6. ERP and recording
Implement the official ERP adapter and secure verification page. No OTP is spoken to the agent. Keep the ERP adapter unconfigured until relationship/guardian authorization is defined; private record tools fail closed meanwhile. Use carrier recording only after explicit consent and upload through the protected recording endpoint. Retention purge must be operated or scheduled on the final host.

## 7. First pilot
Start on a test number with approved public information only. Run policy checks, use microphone tests, inspect actual speech versus tool replies, then collect independent real-call results. Do not route the main college number until the gates in ENGINEERING.md pass.
