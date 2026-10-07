# Campus Desk on Vercel

The Vercel deployment uses native Next.js, remote SQLite on Turso and direct TLS SMTP. The old Sites/Cloudflare build is not the deployment target for this repository anymore.

## Production settings

- Framework: Next.js. Root directory: repository root.
- Build: `pnpm run build:vercel` (tracked in vercel.json).
- Output: `.next`. Node: 22 or newer supported version.
- Production region: Mumbai (`bom1`). Turso database: `vce-campus-desk` in Mumbai.
- Import the private `.env.local` file into Production environment variables as Secrets. Never commit it or paste it in chat.

Required names: `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `SESSION_SECRET`, `STAFF_LOGIN_KEY`, `SARVAM_API_KEY`, `SARVAM_TOOL_TOKEN`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`.

Use a separate database and secrets before enabling Preview builds. Production migrations are applied transactionally per migration and tracked in `campus_migrations`; repeat runs skip applied files. Do not use a local SQLite file on Vercel.

## Staff login

Open `/login` and enter the `STAFF_LOGIN_KEY` from the private local file. An eight-hour signed, HttpOnly, Secure, SameSite=Strict session is issued. Requests do not trust the old `oai-authenticated-user-id` header. A shared database-backed login attempt limit is enforced. This is a single-administrator pilot; individual staff accounts and roles are a subsequent production rollout requirement.

## Sarvam connection

Use `POST https://YOUR_PRODUCTION_DOMAIN/api/sarvam/tools`, with `Content-Type: application/json` and `Authorization: Bearer <SARVAM_TOOL_TOKEN>`. Remove the old `OAI-Sites-Authorization` header for this deployment. Keep platform Interaction ID bindings. Conversation tools use `{{speakExactly}}` as the response template; lifecycle hooks leave it empty. Enable live voice in the authenticated Campus Desk settings after setup.

## Email and launch limits

SMTP credentials are copied from the user-designated OptiForge environment; its database and unrelated credentials are not used. TLS is required on port 465 or 587. An email needs caller consent, confirmation, a currently verified department recipient and staff review before sending. Ambiguous delivery outcomes are not retried automatically. No test email is sent without an authorized recipient.

Recording storage is not configured for the Vercel deployment and recording must remain disabled. Phone provider, ERP and live-transfer adapters still require separate setup. A successful web build does not prove telephone or speech quality.
