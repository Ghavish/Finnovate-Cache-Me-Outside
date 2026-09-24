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

- **Python (Native) Code nodes:** the Python task runner must be enabled. Its allow lists need these modules:
  - Standard library: `json`, `urllib`, `re`, `datetime` (`N8N_RUNNERS_STDLIB_ALLOW`).
  - External packages: `holidays`, `dateutil` (`N8N_RUNNERS_EXTERNAL_ALLOW`), installed in the runner's Python.
- **Credentials:** MongoDB, Google Gemini (PaLM) API, and a Header Auth credential for the myt speech-to-text API.
- **Model:** every Gemini node uses `models/gemini-2.5-flash` at temperature 0.
- **CORS:** each webhook allows any origin (`*`). Requests are still protected by the Firebase ID token check.

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
