// --- Money helpers: the backend stores integer cents, the UI shows rupees ---

export const centsToRupees = (cents) => Math.round(Number(cents) || 0) / 100

export const rupeesToCents = (rupees) => Math.round((Number(rupees) || 0) * 100)

export const money = (rupees) => `Rs ${Math.round(Number(rupees) || 0).toLocaleString('en-MU')}`

export const moneyFromCents = (cents) => money(centsToRupees(cents))
