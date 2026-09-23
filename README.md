# GoalPath AI — Integrated Frontend

This ZIP combines the latest Finnovate project with the Goals and Financial Overview screens.

## Run locally

1. Extract the ZIP and open the extracted folder in VS Code.
2. Open **Terminal → New Terminal**.
3. Run `npm install`.
4. Run `npm run dev`.
5. Open the local URL printed in the terminal.

## Demo login

- Email: `aisha@goalpath.mu`
- Password: `demo1234`

Any valid email plus a password containing at least four characters also works. Authentication is intentionally local for this standalone demo, so **no API keys are required**.

## Browser routes

- `/login` — functional demo login
- `/dashboard` — connected financial and goal summary
- `/input-data` — upload, voice or manual financial input
- `/analysis-result` — review the financial summary after input
- `/goals` — saved goals
- `/goals/new` — goal creation and risk review
- `/financial-overview` — editable salary and expenses plus transactions
- `/coach` — small demo assistant using the same data

Unknown URLs show a Page Not Found screen. Protected routes redirect signed-out users to `/login`.

## Shared data

The demo data is stored in browser `localStorage`. Adding a goal or editing salary/expenses updates the other screens. Use **Reset demo data** on Dashboard to restore the starting values.

## Later Firebase/n8n connection

Firebase and n8n variables in `.env.local.example` are optional placeholders. Keep private AI/provider keys on the backend, never in `VITE_...` variables. Replace `AuthContext.jsx` with Firebase Auth and replace local calculations with authenticated backend requests when those services are ready.

## Quality checks

```powershell
npm run lint
npm run build
```

Both commands pass in this delivered version.
