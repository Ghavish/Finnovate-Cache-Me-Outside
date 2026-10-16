# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Young Mauritians (students and young workers on a monthly salary). They use MoBudget to see what they earn and spend, and to check whether a purchase or savings goal (a university laptop, an emergency fund) is affordable.

## Product Purpose

MoBudget turns a user's salary, monthly expenses and transactions into a clear answer: how much they can safely save, and whether each goal is affordable now, tight, or not yet. Success means a user can add their data in minutes and trust the verdict.

## Positioning

- Trilingual: English, French and Kreol Morisien, including voice notes.
- AI reads payslips, receipts, photos and voice notes. Nothing is saved until the user reviews and confirms it.
- Goal verdicts (Safe, Tight, Not yet) come from a deterministic affordability algorithm that keeps a buffer for usual spending and Mauritian festivals.

## Operating Context

React + Vite web app. Firebase Authentication for sign-in. All data goes through n8n webhooks (Main, Read API, AI Coach) backed by MongoDB, with Gemini for AI reading. Amounts are in Mauritian rupees (Rs), stored as integer cents.

## Capabilities and Constraints

- Screens: Login, Signup, Dashboard, Financial Input (upload, camera, voice, manual), Analysis Result, My Goals, Financial Overview (Transactions), AI Coach, Page Not Found.
- Every interface string goes through `t()` and must exist in `src/i18n/fr.js` and `src/i18n/mfe.js`.
- Redesign rule from the team: content and features stay the same; only appearance and layout change.

## Brand Commitments

- Name stays **MoBudget**, tagline "Smart money planning". The logo may change.
- Approved palette: Aurora Teal (teal and indigo accents on slate), in light and dark themes.

## Evidence on Hand

Demo files in `demo/` (fictional payslip and receipt) and seeded demo data from `scripts/seed-demo.mjs`. No real testimonials, customers or statistics exist; none may be invented.

## Product Principles

1. Clarity over cleverness: a user should understand their numbers at a glance.
2. The user confirms before anything is saved.
3. Equal quality in all three languages.
4. Verdicts are explained, never just shown.

## Accessibility & Inclusion

Text meets WCAG AA contrast in both light and dark themes. Motion respects `prefers-reduced-motion`.
