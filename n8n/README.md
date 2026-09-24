# n8n workflows

Exports of the GoalPath backend workflows. Import each file into n8n (Workflows → Import from File), replacing the old version, then activate it.

| File | Webhook path | Used for |
| --- | --- | --- |
| `Main.json` | `POST /webhook/api/v1/process` | AI reading of uploads and voice notes, and all saves (transactions, payslip salary, profile, goals) |
| `GoalPath_Read_API.json` | `POST /webhook/api/v1/read` | Dashboard numbers, goals and transactions |
| `GoalPath_AI_Coach.json` | `POST /webhook/api/v1/coach` | AI Coach answers |

After importing, open any node with a credential (MongoDB, Gemini, myt ASR) and re-select it if n8n shows a warning. The files only reference credentials by ID; no passwords or API secrets are stored here.

MongoDB collections used: `users`, `transactions`, `goals`.
