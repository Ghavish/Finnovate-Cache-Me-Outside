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
| `VITE_N8N_WEBHOOK_URL` | n8n webhook that receives authenticated requests. |

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

## Shared data

Goals and financial data are currently stored in browser `localStorage` and are not yet tied to the signed-in user. Adding a goal or editing salary/expenses updates the other screens. Use **Reset demo data** on Dashboard to restore the starting values.

## Quality checks

```sh
npm run lint
npm run build
```
