# Demo video data

Files and data for the demo video (see the team's Demo Video Guide).

| File | Use |
| --- | --- |
| `payslip_clear.pdf` | Scene 4. Clean payslip, Lagon Bleu Ltd, September 2026, net pay Rs 45,000. It has real text, so n8n's PDF reader can read it. |
| `receipt_blurry.jpg` | Scene 5. Blurred Winners receipt photo with the total cut off, to trigger the low-confidence warning. |
| `../scripts/seed-demo.mjs` | Loads the demo user's profile, transactions and goals into MongoDB. |

The company, employee and receipt are fictional.

## The demo user's data

Seeding gives the demo account (default `test@goalpath.com`):

- **Salary:** Rs 45,000 a month, paid on the 25th, for the last three months.
- **Bills every month:** rent Rs 12,000; bus pass Rs 1,200; groceries at Winners (Rs 3,200) and Super U (Rs 2,900); electricity Rs 1,650; water Rs 350; my.t fibre Rs 1,499; one dinner out Rs 1,100.
- **Savings:** Rs 60,000 in the bank before the first month.
- **Goals:** University laptop, Rs 40,000 with Rs 15,000 saved; Emergency fund, Rs 150,000 with Rs 30,000 saved. The verdicts are worked out by the same Affordability Algorithm as n8n.

Only past dates are seeded, never today. That way the entries you add on camera raise **Monthly expenses** in scene 8. With the guide's entries (payslip, receipt, Rs 850 groceries, Rs 500 bus top-up), it goes from about Rs 17,000 to about Rs 17,700. The exact figures depend on the recording date.

## Loading the data into MongoDB

Re-run this right before recording: the dates are relative to today, and running it again resets the demo user.

**Option 1: the seed script (recommended).** Add these to `.env.local` in the project folder, which is never committed:

```
DEMO_EMAIL=test@goalpath.com
DEMO_PASSWORD=<the demo account's password>
MONGODB_URI=<the same connection string as your n8n MongoDB credential>
MONGODB_DB=<the same database name as your n8n MongoDB credential>
```

Then run:

```
npm install
npm run seed:demo
```

It signs in to Firebase to get the demo user's ID, deletes that user's old profile, transactions and goals, inserts the demo data, and prints the dashboard numbers you should see.

**Option 2: import by hand (MongoDB Compass or Atlas).** Run `npm run seed:demo -- --export`. It needs only `DEMO_EMAIL`, `DEMO_PASSWORD` and the Firebase key, and writes `seed-data/users.json`, `transactions.json` and `goals.json`. Import each file into the collection with the same name:

1. **MongoDB Compass:** open the database n8n uses, open the collection, then **Add data → Import JSON or CSV file**.
2. **Atlas website:** open the cluster, then **Browse Collections**, open the collection, **Insert Document**, and paste the file's contents.

If you import by hand more than once, delete the demo user's old documents first, or you'll get duplicates.

## Where the video guide differs from the app

| Guide says | The app does |
| --- | --- |
| Log in as `aisha@goalpath.mu` | Use the seeded account (default `test@goalpath.com`). The greeting uses the account's name, or the part of the email before `@`. |
| Three input cards | There are four: Upload document, **Scan with camera**, Voice input, Manual entry. |
| Type shows "Payroll" | The type chip says **Payslip** (Fiche de paie in French, Fich lapey in Kreol). |
| Add everything, then one "Analyse my finances" | Each entry is saved by its own **Analyse my finances** click, which opens the result page. Click **Add more data** to go back. Scene 8 is just the last Analyse, then the Dashboard. |
| Monthly expenses goes up in scene 8 | It does, because the seeded account has no expense list yet and the figure comes from repeat spending. **Don't** add an expense list on the Financial Overview before recording: its total would replace that figure, and scene 8 wouldn't change. |
| Voice capped at 30 s | The app stops recording at 2 minutes; keep the Kreol line short anyway. |
| AI Coach (scene 10) | The AI Coach page still shows demo text and isn't connected to n8n yet. Skip scene 10 for now. |
| "Deterministic Python algorithm" | The algorithm now runs as JavaScript inside n8n. The caption "Our algorithm decides" still fits. |
| Activate the workflows | In n8n 2.x, click **Publish** on Main, Read API and AI Coach. |
