# Sarvam v2 draft integration audit — 7 October 2026

## Completed

- Published current backend to the existing private Campus Desk Site (deployment version 3, commit `74bed00c6e81c732346c10d4c05381d2a168d558`).
- Applied existing SARVAM_API_KEY and SARVAM_TOOL_TOKEN as hosted secrets. No secret values are recorded here.
- Enabled live voice through the authenticated Campus Desk admin UI; UI confirms Voice configured.
- Corrected start/end operations and mapped all tools to the platform Interaction ID.
- Corrected Authorization secret references and the existing hosting-header variable binding.
- Converted conversation parameters to agent-provided values; consent and confirmed are Boolean rather than unconditional true.
- Set tool timeouts to 15 seconds and excluded lifecycle hooks from conversation context.
- Added concise tool-failure instructions and language codes en/te/hi.
- Disabled Include in context for OAI and OAI_Var credential variables. Existing values were preserved for tool authentication.
- Corrected the three conversational response templates from literal @speakExactly to documented {{speakExactly}} syntax. Live lookup verification passed: backend supplied the published B.Tech tuition of INR 140,000/year with a batch/additional-charges confirmation caveat, and the agent conveyed both.

## Test evidence and cautions

Earlier requests failed successively with 401 (authentication), 404 (old deployment), and 503 (voice disabled). After deployment and enabling voice, requests succeed, but response-template configuration required repair.

An empty response template returned only "Request completed successfully" and caused an unsupported fee answer. Empty templates must NOT be used for conversational tools. Start/end hooks can keep their templates empty.

## Still to verify before launch

- Test known/unknown facts, Telugu/Hindi, consent refusal, email drafts, staff requests, and call-end lifecycle.
- Review dedicated secret storage for the hosting header before production (current variables are excluded from LLM context).
- Phone provider, ERP, SMTP delivery and live staff transfer are not connected. Do not claim real transfers, sent emails or guaranteed callbacks.
- Acoustic quality, interruptions and real telephone behavior still require a voice pilot.

Agent remains v2 Draft. This audit is not a production-readiness certification.

## Follow-up deployment

Consent template compatibility fix published successfully as commit `6b1dec5687ba9be70dd6ce4f80309c3a55973109`, deployment `appgdep_6ac60e4205f08191acb461a00da11b2a`. Exact strings "true"/"false" are accepted; missing consent remains false, and other truthy values are rejected. Backend suite: 89/89 passed. Live workflow retest pending.

Fresh Telugu and Hindi address lookups passed. Unknown 2027 closing date correctly withheld; no request created when declined. Long-interrupted session correctly rejected follow-up after the 15-minute expiry. Added and verified saved instructions against generic extra questions, unsupported success messages, and callback promises.
