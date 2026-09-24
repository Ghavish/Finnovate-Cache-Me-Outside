# n8n workflows

Exports of the MoBudget backend workflows. Import each file into n8n (Workflows → Import from File), replacing the old version, then activate it.

| File | Webhook path | Used for |
| --- | --- | --- |
| `Main.json` | `POST /webhook/api/v1/process` | AI reading of uploads and voice notes, and all saves (transactions, payslip salary, profile, goals) |
| `MoBudget_Read_API.json` | `POST /webhook/api/v1/read` | Dashboard numbers, goals and transactions |
| `MoBudget_AI_Coach.json` | `POST /webhook/api/v1/coach` | AI Coach answers |

After importing, open any node with a credential (MongoDB, Gemini, myt ASR) and re-select it if n8n shows a warning. The files only reference credentials by ID; no passwords or API secrets are stored here.

MongoDB collections used: `users` (profile, salary and the `monthlyExpenses` list), `transactions`, `goals`.

## n8n setup these workflows need

- **No Python needed.** Every Code node is JavaScript, which n8n runs out of the box (tested on n8n 2.40.6 started with `npx n8n`). Earlier versions used Python Code nodes, which need n8n's separate Python runner.
- **Login check:** each workflow starts with "Verify Firebase Token", an HTTP Request to Google that checks the user's Firebase ID token. "Auth Bouncer" then adds the verified `userId` and `email` to the request. A missing or fake token gets a 401.
- **Credentials:** MongoDB, Google Gemini (PaLM) API, and a Header Auth credential for the myt speech-to-text API. After importing, open any node with a warning and pick the credential again.
- **Model:** every Gemini node uses `models/gemini-2.5-flash` at temperature 0.
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
