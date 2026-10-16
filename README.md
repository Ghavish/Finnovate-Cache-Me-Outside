# MoBudget — Frontend

React + Vite frontend for MoBudget. Sign-in uses Firebase Authentication, and backend requests go to an n8n webhook.

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
| `VITE_N8N_COACH_URL` | Optional. AI Coach webhook (`.../webhook/api/v1/coach`). If left out, the app uses the Main URL with `/process` swapped for `/coach`. |

Email/Password sign-in must be enabled in the Firebase console (Authentication → Sign-in method).

Anything starting with `VITE_` is bundled into the browser code, so it is public. Keep private AI/provider keys on the backend (n8n), never in `VITE_` variables.

## Accounts

- Create an account at `/signup` (name, email, password, optional monthly salary). The name is saved as the Firebase display name and used in the greeting. After sign-up the app asks n8n to create the user's profile, then opens the dashboard.
- Users can set or change their name from the profile button in the header. Accounts without a name see an "Add your name" button on the dashboard.
- Log in at `/login`. There is no built-in demo account.

## Browser routes

- `/login` — log in with Firebase
- `/signup` — create a Firebase account
- `/dashboard` — financial and goal summary
- `/input-data` — upload, voice or manual financial input
- `/analysis-result` — review the financial summary after input
- `/goals` — saved goals
- `/goals/new` — goal creation and risk review
- `/financial-overview` — salary, monthly expense summary and past transactions
- `/coach` — small assistant using the same data

Unknown URLs show a Page Not Found screen. Protected routes redirect signed-out users to `/login`.

## Data and the n8n backend

These screens read and write through n8n (MongoDB behind it), per signed-in user:

- **Dashboard** cards: `getDashboard` on the Read API (salary, usual monthly spending, active goals).
- **Financial Input**: uploads (images or PDF), camera scans and voice notes go to Main for an AI preview (document type, summary, confidence score). Nothing is saved until **Analyse my finances**, which sends `confirmTransaction`. A confirmed payslip also updates the profile salary.
- **My Goals**: `listGoals` on the Read API; new goals are checked with `afford` and saved with `goal`; edits use `updateGoal`.
- **Financial Overview**: salary and the monthly expense list come from `getDashboard`, past transactions from `listTransactions`. Salary edits use `updateSalary`; the expense summary is saved with `saveExpenses`.

Monthly expenses are the total of the expense summary (Essential, Adjustable, Optional). That total is the "usual monthly spending" used on the Dashboard, for safe saving capacity, goal checks and the AI Coach. Until a user adds expenses, it is estimated from repeat transactions.

The AI Coach asks the `MoBudget_AI_Coach` workflow, which answers from the user's own salary, expenses and goals.

### Camera scanning

**Scan with camera** shows a live view from the back camera. The photo is shrunk to at most 1600 px (JPEG) and sent through the same image route as an upload. Browsers only allow the live view on `https` pages or `localhost`. On a plain `http` address, such as testing from your phone at `http://<laptop-ip>:5173`, the page offers your phone's camera app instead, which works anywhere.

## Demo data

`demo/` has the payslip and receipt files for the demo video, and `npm run seed:demo` loads the demo user's data into MongoDB. See `demo/README.md`.

### Voice notes

The recording is converted in the browser to 16 kHz mono WAV and sent to n8n, where Gemini transcribes and translates it to English before the amount is read. See `n8n/README.md`.

## Look and feel

- Light and dark themes. The app follows the device setting until the user picks one with the sun/moon button in the header (or on the login and signup pages); the choice is remembered in the browser.
- Colours, spacing and type are CSS custom properties at the top of `src/index.css`. Use them instead of raw colours so both themes stay in step. `DESIGN.md` describes the system.
- Animations use the `motion` package (loaded after the first paint) and CSS keyframes. Both respect the device's reduced-motion setting.

## Speed

- Each page's code downloads only when the page is first opened.
- Answers from the Read API are cached per user and shown straight away while a fresh copy loads. Any save clears the cache.
- n8n skips the Google token check for a token it verified in the last hour (see `n8n/README.md`).
- Host n8n on an always-on service. A sleeping free tier adds 30 to 60 seconds to the first request.

## Deploying (Vercel)

1. Host n8n publicly first (see "Hosting n8n for the public app" in `n8n/README.md`).
2. In Vercel, **Add New → Project**, import this GitHub repository. `vercel.json` already sets the Vite build, the `dist` output folder, and a rewrite so routes like `/goals` work on refresh.
3. Under **Settings → Environment Variables**, add every `VITE_` variable from the table above, using the public n8n URL. Redeploy after changing them, because they are baked in at build time.
4. In the Firebase console, **Authentication → Settings → Authorized domains**, add the Vercel domain (for example `mobudget.vercel.app`) and any custom domain. Sign-in fails on domains not on this list.
5. Every push to the main branch then deploys automatically; other branches get preview URLs.

## Languages

MoBudget is available in English, French and Kreol Morisien. Users pick a language from the menu in the header (or on the login and signup pages). The choice is remembered in the browser.

- Every piece of interface text goes through `t()` from `useLanguage()`: `t('Monthly salary')`, or `t('{count} expenses', { count })` for text with values.
- The English text is the key. French is in `src/i18n/fr.js` and Kreol in `src/i18n/mfe.js`.
- Text chosen at runtime (menu labels, error messages) is marked with `k('...')` from `src/i18n/strings.js`, so the checker can find it. Category, document type and expense group names live in `src/i18n/labels.js`.
- The AI summary of an upload, photo or voice note is written in the chosen language (the app sends `language` to n8n).
- `npm run i18n:check` fails if any text is missing a French or Kreol translation, or if `{placeholders}` don't match.

When you add or change interface text, add it to both `fr.js` and `mfe.js`, then run `npm run i18n:check`.

## Quality checks

```sh
npm run lint
npm run i18n:check
npm run build
```
