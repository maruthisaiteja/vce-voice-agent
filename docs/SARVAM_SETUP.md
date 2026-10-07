# Sarvam setup for Vardhaman

Updated 6 October 2026. Sarvam replaces the interrupted Gemini migration. OpenAI and Gemini keys are not needed by the application. No Sarvam account agent, deployment, phone number or paid service was created during implementation.

## Test Sarvam inside Campus Desk

In the ignored project-root `.dev.vars`, add your key locally. Preserve other settings. Do not paste the value into chat or source files.

```dotenv
SARVAM_API_KEY=your_private_key
SARVAM_TRANSCRIBE_MODEL=saaras:v4
SARVAM_TTS_MODEL=bulbul:v3
SARVAM_VOICE=ritu
SARVAM_REASONING_MODEL=sarvam-105b-conversations
# Optional: a pronunciation dictionary you have created and reviewed
# SARVAM_DICTIONARY_ID=
```

Restart `pnpm dev`, enable **Settings → Enable live voice**, then open **Conversation lab → Realtime**. Use a headset and consent to microphone processing. English, Telugu and Hindi are selectable. Speech is captured as 16 kHz PCM; questions end after an 800 ms pause or the Finish question button. Audio recognition uses Sarvam REST per utterance, limited to 25 seconds. Approved answer speech streams at 24 kHz through Bulbul. This mode does not provide interim streaming transcription. The recorded Premium audio fallback also uses Sarvam; browser preview uses browser speech services.

Ritu, pace 1.05 and temperature 0.3 are starting settings, not an acoustic benchmark winner. Compare voices with native Telugu/Hindi speakers. Verify amounts, branch abbreviations, Kacharam and Vardhaman pronunciation before selecting a dictionary. Don't change source facts to improve pronunciation.

## Create the hosted Voice Agent shown in your screenshot

1. In [Sarvam Voice Agents](https://indus.sarvam.ai/samvaad), choose **Create from scratch**. Name it **Vardhaman Campus Desk — staff pilot**. Enable English, Telugu and Hindi; test Telugu-English mixing explicitly.
2. Paste [SARVAM_AGENT_INSTRUCTIONS.md](SARVAM_AGENT_INSTRUCTIONS.md). Configure one opening AI disclosure, interruption/barge-in, a maximum 15-minute call, and end-call behavior. Leave recording and phone deployment off. Use a voice available in that agent builder; do not assume its voice selector is identical to the speech API's.
3. Add the API tools below. All use `POST https://YOUR-APP/api/sarvam/tools`. For `interactionId`, select the platform's **Interaction ID** from its `@` variable picker. Never let the model invent this value. The bodies below are our endpoint contract, not a Sarvam import format.
4. Create a separate random `SARVAM_TOOL_TOKEN` in your secret manager. Configure it on the application server and as the tool's masked Bearer credential in Sarvam. Do not reuse the provider API key. If hosted on the existing private Site, also configure its platform service authorization in a secret header; the tool token alone does not bypass the private Site ingress.
5. Localhost is not reachable from Sarvam. The hosted tools require an authorized HTTPS deployment/private ingress connection. Do not expose the local development server publicly. Tool preparation and local tests are complete without publishing; hosted execution awaits that connection.
6. Commit an agent version after tool tests succeed. Save the non-secret organization ID, workspace ID, app ID and version. These identify the agent for the later SDK embedding. No hosted agent widget is embedded yet because the agent does not exist.

| Tool name | When | Body fields | Response handling |
|---|---|---|---|
| campus_call_start | on_start | `operation:"start", interactionId, language` | Require `status:"active"`; stop on failure. |
| resolve_college_question | During conversation | `operation:"resolve", interactionId, language, question` | Speak `speakExactly`; retain source links in logs. |
| prepare_department_email | During conversation | `operation:"prepare_email", interactionId, language, requestId, department, summary, replyTo, consent, confirmed` | Speak `speakExactly`; `sent` is false. |
| request_college_staff | During conversation | `operation:"request_staff", interactionId, language, requestId, department, summary, consent, confirmed` | Speak `speakExactly`; `connected` is false. |
| campus_call_end | on_end | `operation:"end", interactionId, language` | No spoken response. Duplicate hooks are safe. |

`language` is `en`, `te` or `hi`. For Telugu-English mixing use `te`. Department identifiers must match Campus Desk's Department routing IDs. `requestId` is 1–90 characters and stays unchanged for a retry. All booleans must be real JSON booleans. Unknown fields/actions are rejected. Tokens never go into knowledge documents or agent instructions. Start hooks create a provider-scoped call; an arbitrary Campus Desk call ID is not accepted. End hooks do not reopen completed calls.

Set tool response templates to use `speakExactly` without added factual text. Set a short truthful error message. The start/end hooks do not use response templates. A caller can consent to sharing a request but cannot approve its email recipient or send it; those remain staff actions in Campus Desk.

Do not upload the unreviewed crawl as approved knowledge. The app holds 39 curated seed facts and an unreviewed website review catalog. Review current notices, validity and language variants in Campus Desk; the tool reads current approved records each turn. No tool in this pilot returns private student records.

## Acceptance before a phone pilot

Use the existing 80 scenarios in `benchmarks/voice-test-cases.json`: fees, deadlines, HOD names, corrections, interruption, unknown information, private records, outages, goodbye and noise, across English/Telugu/Hindi/Telugu-English and two device conditions. Those cases are proposed tests, not measured results. Add email consent, duplicate draft calls, unavailable recipient, staff request retries and hostile caller instructions.

Run the browser API path and hosted agent separately. Save provider/model/agent version, device, language, consent and independent reviewer outcomes. Measure end-of-speech to first useful answer audio and interruption stop time. Target p95 ≤1.8 seconds and interruption ≤250 ms; zero unsupported critical facts or false action-success claims. These targets are not yet demonstrated. Use `scripts/voice_benchmark.py` and the production runbook for the evidence format. Fix any failed critical scenario before routing a number.

Phone numbers, actual warm transfers, ERP identity integration, automatic recording, scheduled operations and live email delivery are separate commissioning steps. The old OpenAI SIP webhook intentionally returns 503; configuring a Sarvam key does not enable it. The current hosted bridge records reviewed requests only.

References: [Sarvam API tools](https://docs.sarvam.ai/conversations/build/tools/https-tool), [browser SDK](https://docs.sarvam.ai/conversations/deploy/sdks/web), [speech recognition](https://docs.sarvam.ai/api-reference/speech-to-text/transcribe), [streamed speech](https://docs.sarvam.ai/api-reference/text-to-speech/convert-stream).
