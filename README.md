# GoalPath AI — Frontend

React + Vite frontend for GoalPath. Sign-in uses Firebase Authentication, and backend requests go to an n8n webhook.

## Setup

1. Copy `.env.local.example` to `.env.local` and fill in your values (see below). `.env.local` is git-ignored, so never commit it.
2. Run `npm install`.
3. Run `npm run dev`.
4. Open the local URL printed in the terminal.

## Environment variables

| Variable | What it is |
| --- | --- |
| `VITE_FIREBASE_API_KEY` | Firebase web API key (Project settings → General → Your apps). |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase auth domain, e.g. `your-project.firebaseapp.com`. |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID. |
| `VITE_FIREBASE_APP_ID` | Firebase web app ID. |
| `VITE_N8N_WEBHOOK_URL` | Main n8n webhook (`.../webhook/api/v1/process`): AI reading of uploads and voice notes, and all saves. |
| `VITE_N8N_READ_URL` | Optional. Read API webhook (`.../webhook/api/v1/read`). If left out, the app uses the Main URL with `/process` swapped for `/read`. |

Email/Password sign-in must be enabled in the Firebase console (Authentication → Sign-in method).

Anything starting with `VITE_` is bundled into the browser code, so it is public. Keep private AI/provider keys on the backend (n8n), never in `VITE_` variables.

## Accounts

- Create an account at `/signup` (email, password, optional monthly salary). After sign-up the app asks n8n to create the user's profile, then opens the dashboard.
- Log in at `/login`. There is no built-in demo account.

## Browser routes

- `/login` — log in with Firebase
- `/signup` — create a Firebase account
- `/dashboard` — financial and goal summary
- `/input-data` — upload, voice or manual financial input
- `/analysis-result` — review the financial summary after input
- `/goals` — saved goals
- `/goals/new` — goal creation and risk review
- `/financial-overview` — editable salary and expenses plus transactions
- `/coach` — small assistant using the same data

Unknown URLs show a Page Not Found screen. Protected routes redirect signed-out users to `/login`.

## Data and the n8n backend

These screens read and write through n8n (MongoDB behind it), per signed-in user:

- **Dashboard** cards: `getDashboard` on the Read API (salary, usual monthly spending, active goals).
- **Financial Input**: uploads (images or PDF), camera scans and voice notes go to Main for an AI preview (document type, summary, confidence score). Nothing is saved until **Analyse my finances**, which sends `confirmTransaction`. A confirmed payslip also updates the profile salary.
- **My Goals**: `listGoals` on the Read API; new goals are checked with `afford` and saved with `goal`; edits use `updateGoal`.

Financial Overview and AI Coach still use demo data from browser `localStorage`.

### Camera scanning

**Scan with camera** shows a live view from the back camera. The photo is shrunk to at most 1600 px (JPEG) and sent through the same image route as an upload. Browsers only allow the live view on `https` pages or `localhost`. On a plain `http` address, such as testing from your phone at `http://<laptop-ip>:5173`, the page offers your phone's camera app instead, which works anywhere.

## Quality checks

```sh
npm run lint
npm run build
```
