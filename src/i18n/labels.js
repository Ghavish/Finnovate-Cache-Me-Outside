// --- Display names for values that come from the backend ---
// The backend stores English codes (e.g. "groceries"); screens show t(LABEL).
import { k } from './strings.js'

export const CATEGORY_LABELS = {
  groceries: k('Groceries'),
  dining: k('Dining'),
  transport: k('Transport'),
  fuel: k('Fuel'),
  utilities: k('Utilities'),
  rent: k('Rent'),
  telecom: k('Phone and internet'),
  health: k('Health'),
  education: k('Education'),
  clothing: k('Clothing'),
  household: k('Household'),
  entertainment: k('Entertainment'),
  subscriptions: k('Subscriptions'),
  gifts: k('Gifts'),
  festival: k('Festival'),
  salary: k('Salary'),
  other: k('Other'),
}

export const DOC_TYPE_LABELS = {
  payslip: k('Payslip'),
  receipt: k('Receipt'),
  purchase: k('Purchase'),
}

export const EXPENSE_GROUP_LABELS = {
  essential: k('Essential'),
  adjustable: k('Adjustable'),
  optional: k('Optional'),
}

// Warnings the n8n Guardrail can return, and its fallback summary.
export const AI_MESSAGES = [
  k('No line items were read.'),
  k('No amount was read.'),
  k('Line items do not sum to the stated total.'),
  k('AI confidence below 0.7.'),
  k('The AI could not describe this input.'),
]

export const categoryLabel = (category) => CATEGORY_LABELS[category] || CATEGORY_LABELS.other
