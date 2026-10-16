# n8n workflows

Exports of the MoBudget backend workflows. Import each file into n8n (Workflows → Import from File), replacing the old version, then activate it.

| File | Webhook path | Used for |
| --- | --- | --- |
| `Main.json` | `POST /webhook/api/v1/process` | AI reading of uploads and voice notes, and all saves (transactions, payslip salary, profile, goals) |
| `MoBudget_Read_API.json` | `POST /webhook/api/v1/read` | Dashboard numbers, goals and transactions |
| `MoBudget_AI_Coach.json` | `POST /webhook/api/v1/coach` | AI Coach answers |

After importing, open any node with a credential (MongoDB, Gemini) and re-select it if n8n shows a warning. The files only reference credentials by ID; no passwords or API secrets are stored here.

MongoDB collections used: `users` (profile, salary and the `monthlyExpenses` list), `transactions`, `goals`.

## n8n setup these workflows need

- **No Python needed.** Every Code node is JavaScript, which n8n runs out of the box (tested on n8n 2.40.6 started with `npx n8n`). Earlier versions used Python Code nodes, which need n8n's separate Python runner.
- **Login check:** each workflow starts with "Token Cache" and "Token Cached?". A token Google has not seen in the last hour goes to "Verify Firebase Token", an HTTP Request to Google that checks the user's Firebase ID token. "Auth Bouncer" then adds the verified `userId` and `email` to the request and remembers the token. A missing or fake token gets a 401.
- **Token cache (speed):** repeat requests with the same token skip the call to Google, which saves one round trip per request. Tokens are stored only as SHA-256 hashes in the workflow's static data, kept until the token expires and never longer than an hour. Static data is only saved for production (published) runs, so test runs from the editor always call Google. One trade-off: a user deleted or disabled in Firebase keeps access until their current token expires (at most an hour).
- **Credentials:** MongoDB and Google Gemini (PaLM) API. After importing, open any node with a warning and pick the credential again. The old myt speech-to-text Header Auth credential is no longer used and can be deleted.
- **Voice notes:** the app converts each recording to 16 kHz mono WAV. "Gemini Transcribe & Translate" (an HTTP Request using the Gemini credential) sends the audio to `gemini-2.5-flash` and gets back an English transcript, with amounts kept in digits. "Transcript Text" passes it to "Gemini Voice Parse", which works as before. Silence or noise returns `EXTRACTION_FAILED`.
- **Model:** every Gemini node uses `models/gemini-2.5-flash` at temperature 0. The voice transcription call also turns thinking off (`thinkingBudget: 0`) to answer faster.
- **CORS:** each webhook allows any origin (`*`). Requests are still protected by the Firebase ID token check.
- **Turn them on:** in n8n 2.x, click **Publish** on each workflow (older versions call it **Active**). Production webhook URLs (`/webhook/...`) only answer while a workflow is published.
- **Festival dates:** the Affordability Algorithm (and its copy in the AI Coach) has Mauritius festival dates for 2024 to 2040 built in, generated from the Python `holidays` library. Refresh them before 2029 so goal timelines keep 10 years of festivals.

## Replies the app relies on

| Route (`inputType`) | Reply |
| --- | --- |
| `receipt`, `document`, `voiceNote` (+ optional `language`: `en`, `fr` or `mfe`, for the summary) | Preview only, nothing saved: `record: "preview"`, `docType`, `summary`, `confidenceScore`, `lowConfidence`, `flags`, `lineItems` (cents) |
| `confirmTransaction` | Saves transactions (and the salary for a payslip): `record: "transaction"`, `count`, `totalCents` |
| `afford` | Nothing saved: `record: "afford"`, `verdict`, `monthsNeeded`, `safeToSpendCents`, `reachable` |
| `goal`, `updateGoal` | Saves the goal: `record: "goal"`, `goalKey`, `savedAmountCents`, `verdict` |
| `profile` | Saves the profile at signup: `record: "profile"` |
| `updateSalary` | Saves the salary from Financial Overview: `record: "salary"`, `salaryCents` |
| `saveExpenses` | Saves the whole monthly expense list (`name`, `amountCents`, `group`: essential, adjustable or optional): `record: "expenses"`, `count`, `totalCents` |
| Bad input | `400` with `INVALID_REQUEST` or `UNKNOWN_INPUT_TYPE`; AI failure `422` `EXTRACTION_FAILED`; bad token `401` |

## Hosting n8n for the public app

The deployed app can only reach n8n on a public HTTPS address. The team setup is free: n8n runs on a **Render free web service**, keeps its own data (workflows, credentials, the owner login, the token cache) in a **free Neon Postgres** database, and reads and writes the app's data in **MongoDB Atlas** as before.

n8n cannot use MongoDB for its own storage; it supports only SQLite and Postgres. Render's free tier wipes the disk whenever the service restarts or sleeps, so SQLite would lose everything. That is why n8n's own data lives in Neon.

### Steps

1. **Neon:** create a free project. From **Connect**, copy the host (the direct one, without `-pooler`), database, user and password.
2. **Render:** **New → Web Service → Existing image**, image `n8nio/n8n:2.40.6`, instance type **Free**.
3. Set these environment variables on the Render service:

| Variable | Value |
| --- | --- |
| `DB_TYPE` | `postgresdb` |
| `DB_POSTGRESDB_HOST` / `_PORT` / `_DATABASE` / `_USER` / `_PASSWORD` | From Neon (port `5432`) |
| `DB_POSTGRESDB_SSL_ENABLED` | `true` (Neon requires SSL) |
| `N8N_ENCRYPTION_KEY` | A long random string. Keep a copy: credentials can't be decrypted without it. |
| `N8N_HOST` | `<your-service>.onrender.com` |
| `N8N_PROTOCOL` | `https` |
| `N8N_PORT` and `PORT` | `5678` |
| `WEBHOOK_URL` | `https://<your-service>.onrender.com/` |
| `N8N_PROXY_HOPS` | `1` (Render sits in front of n8n) |
| `GENERIC_TIMEZONE` | `Indian/Mauritius` |

4. Deploy, open the Render URL, create the owner account, then paste in `Main.json`, `MoBudget_Read_API.json` and `MoBudget_AI_Coach.json` (open each file, copy all, paste on an empty canvas, save).
5. Create the MongoDB and Google Gemini (PaLM) API credentials, re-select them on every node that shows a warning, then **Publish** all three workflows.
6. In MongoDB Atlas **Network Access**, allow `0.0.0.0/0` (Render's free IPs change) and keep a strong database password.
7. **Keep it awake:** Render's free services sleep after 15 minutes without traffic, and the next request waits 30 to 60 seconds. Add a free job on cron-job.org that opens `https://<your-service>.onrender.com/healthz` every 10 minutes. One always-on service fits in Render's 750 free hours a month.
8. Set the frontend's `VITE_N8N_WEBHOOK_URL` to `https://<your-service>.onrender.com/webhook/api/v1/process` and redeploy it.
