# Current Sarvam voice path

See [SARVAM_SETUP.md](SARVAM_SETUP.md) for activation and the hosted-agent setup.

The browser captures mono 16 kHz PCM with an AudioWorklet. It holds a short pre-roll, rejects clicks, collects up to 25 seconds of speech and finishes after an 800 ms pause. Each completed utterance becomes a WAV upload to authenticated /api/listen. The server calls Saaras v4 with codemix transcription. This is per-utterance recognition, not streaming interim recognition. No provider credential is returned to the client.

A new utterance aborts the preceding transcript request and stops scheduled answer audio. Stale responses cannot start a new answer. Sensitive transcripts use spoken confirmation. /api/speech resolves a question from approved current public college sources before calling Bulbul v3 with the exact reply. The browser receives answer metadata followed by 24 kHz PCM chunks. If TTS fails, verified text remains visible. A verified goodbye ends the call after playback.

The recorded Premium audio path uses the same Sarvam models and returns WAV. Semantic retrieval uses sarvam-105b-conversations to select an approved record ID; it cannot author a college answer. Source authority is rechecked after selection. All active application provider requests target api.sarvam.ai. The prior Gemini migration was superseded; OpenAI provider code has been removed. Existing private Site identity/auth headers are hosting configuration and remain intact.

D1 quotas, call-age limits, staff authentication and request-origin checks remain enabled. Hosted tools use a separate SARVAM_TOOL_TOKEN and provider-scoped interaction identities. Hosted generation cannot enforce verbatim speech as strongly as controlled TTS; evaluate the actual spoken transcript against tool output before deployment. No actual phone transfer, ERP access, provider latency or acoustic quality is certified by the local synthetic tests.
