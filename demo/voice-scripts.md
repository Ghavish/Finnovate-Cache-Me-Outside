# Voice input test lines

Record each line in the app (**Financial Input → Voice input**) and check the AI summary against the expected result. The app converts the recording to WAV and n8n sends it to Gemini, which transcribes and translates it to English before the amount is read.

Speak at a normal pace. Each line takes under 10 seconds.

## English

| # | Say | Expected type | Expected amount | Expected category |
| --- | --- | --- | --- | --- |
| E1 | "I got my salary of forty-five thousand rupees from Lagon Bleu." | Payslip, income | Rs 45,000 | Salary |
| E2 | "I spent one thousand eight hundred and fifty rupees at Winners for groceries." | Receipt, expense | Rs 1,850 | Groceries |
| E3 | "Bus top-up, five hundred rupees." | Purchase, expense | Rs 500 | Transport |

## French

| # | Say | Expected type | Expected amount | Expected category |
| --- | --- | --- | --- | --- |
| F1 | « J'ai reçu mon salaire de quarante-cinq mille roupies. » | Payslip, income | Rs 45,000 | Salary |
| F2 | « J'ai dépensé huit cent cinquante roupies au supermarché. » | Receipt, expense | Rs 850 | Groceries |
| F3 | « J'ai payé mille six cent cinquante roupies d'électricité au CEB. » | Purchase, expense | Rs 1,650 | Utilities |

## Kreol Morisien

| # | Say | Expected type | Expected amount | Expected category |
| --- | --- | --- | --- | --- |
| K1 | "Mo finn gagn mo saler karant-sink mil roupi." | Payslip, income | Rs 45,000 | Salary |
| K2 | "Mo finn depans wit san sinkant roupi dan Winners." | Receipt, expense | Rs 850 | Groceries |
| K3 | "Mo finn pey de mil roupi pou lalimier ek dilo." | Purchase, expense | Rs 2,000 | Utilities |

## Mixed language

| # | Say | Expected type | Expected amount | Expected category |
| --- | --- | --- | --- | --- |
| M1 | "Today mo finn aste enn shoes pour deux mille quatre cents roupies at Bata." | Purchase, expense | Rs 2,400 | Clothing |

## Edge cases

| # | What to do | Expected result |
| --- | --- | --- |
| X1 | Record two seconds of silence. | Error: "The AI could not read this…" (EXTRACTION_FAILED). |
| X2 | Say a purchase with no amount: "I bought some bread." | Low confidence warning, so you can edit before saving. |

The French and Kreol lines were written by an AI assistant. Have a fluent speaker check them before recording.
