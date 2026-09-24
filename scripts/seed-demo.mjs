// Seeds the demo user's profile, transactions and goals into MongoDB for the demo video.
//
//   npm run seed:demo              -> writes to MongoDB (replaces the demo user's data)
//   npm run seed:demo -- --export  -> writes seed-data/*.json to import by hand (Compass or Atlas)
//
// Settings come from .env.local (or the environment):
//   VITE_FIREBASE_API_KEY  already there for the app
//   DEMO_EMAIL             default test@goalpath.com
//   DEMO_PASSWORD          the demo account's password (never commit it)
//   MONGODB_URI            same connection string as the n8n MongoDB credential (not needed for --export)
//   MONGODB_DB             same database name as the n8n MongoDB credential (not needed for --export)
//
// Dates are relative to today, so re-run it right before recording.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'

// --- Settings ---
function loadEnvFile(path) {
  if (!existsSync(path)) return {}
  return Object.fromEntries(readFileSync(path, 'utf8').split(/\r?\n/)
    .map((line) => line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/))
    .filter(Boolean)
    .map(([, key, value]) => [key, value.replace(/^(['"])(.*)\1$/, '$2')]))
}
const env = { ...loadEnvFile('.env.local'), ...process.env }
const EXPORT_ONLY = process.argv.includes('--export')
const EMAIL = env.DEMO_EMAIL || 'test@goalpath.com'
const required = ['VITE_FIREBASE_API_KEY', 'DEMO_PASSWORD', ...(EXPORT_ONLY ? [] : ['MONGODB_URI', 'MONGODB_DB'])]
const missing = required.filter((key) => !env[key])
if (missing.length) {
  console.error(`Missing ${missing.join(', ')}. Add them to .env.local (see the comments at the top of this file).`)
  process.exit(1)
}

// --- Demo story (amounts in rupees; stored as integer cents) ---
const SALARY = 45000
const STARTING_SAVINGS = 60000 // money in the bank before the first seeded month
const MONTHLY_BILLS = [ // [day of month, name, vendor, category, rupees]
  [1, 'Rent', 'Landlord', 'rent', 12000],
  [2, 'Bus pass', 'NTA', 'transport', 1200],
  [6, 'Groceries', 'Winners', 'groceries', 3200],
  [10, 'Electricity', 'CEB', 'utilities', 1650],
  [10, 'Water', 'CWA', 'utilities', 350],
  [12, 'Fibre internet', 'my.t', 'telecom', 1499],
  [15, 'Dinner out', 'Chez Popo', 'dining', 1100],
  [20, 'Groceries', 'Super U', 'groceries', 2900],
]
const GOALS = [ // [name, type, target rupees, saved rupees]
  ['University laptop', 'product', 40000, 15000],
  ['Emergency fund', 'cash', 150000, 30000],
]

// --- Dates (Mauritius, UTC+4) ---
const now = new Date(Date.now() + 4 * 3600e3)
const today = now.toISOString().slice(0, 10)
const stamp = now.toISOString().slice(0, 19) + '+04:00'
const cents = (rupees) => Math.round(rupees * 100)
function monthStart(offset) {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + offset, 1))
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1 }
}
const isoDate = ({ year, month }, day) => `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`

// --- Firebase: sign in to get the demo user's ID ---
async function signIn() {
  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${env.VITE_FIREBASE_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: env.DEMO_PASSWORD, returnSecureToken: true }),
  })
  const body = await response.json()
  if (!response.ok) throw new Error(`Firebase sign-in failed for ${EMAIL}: ${body.error?.message || response.status}`)
  return body.localId
}

// --- Run a Code node from our own n8n workflows, so the numbers match the app exactly ---
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor
function workflowNode(file, name) {
  const node = JSON.parse(readFileSync(`n8n/${file}`, 'utf8')).nodes.find((n) => n.name === name)
  return async (json) => {
    const $input = { first: () => ({ json }), all: () => [{ json }] }
    return (await new AsyncFunction('$input', '$', node.parameters.jsCode)($input, () => $input))[0].json
  }
}
const affordability = workflowNode('Main.json', 'Affordability Algorithm')
const readApi = workflowNode('MoBudget_Read_API.json', 'Shape Read Response')

// --- Build the data ---
function buildTransactions(userId) {
  const rows = []
  for (const offset of [-3, -2, -1, 0]) {
    const month = monthStart(offset)
    for (const [day, name, vendor, category, rupees] of MONTHLY_BILLS) {
      rows.push({ txnDate: isoDate(month, day), name, vendor, category, amount: cents(rupees), direction: 'expense', source: 'manual', docType: 'purchase' })
    }
    if (offset < 0) rows.push({ txnDate: isoDate(month, 25), name: 'Net salary', vendor: 'Lagon Bleu Ltd', category: 'salary', amount: cents(SALARY), direction: 'income', source: 'document', docType: 'payslip' })
  }
  // Only the past: the demo adds today's entries on camera.
  const past = rows.filter((row) => row.txnDate < today).sort((a, b) => a.txnDate.localeCompare(b.txnDate))

  // Same routine rule as the Transaction Prep node: a category is routine once
  // it already appears in at least two earlier months.
  const monthsByCategory = {}
  return past.map((row) => {
    const seen = monthsByCategory[row.category] || new Set()
    const doc = { userId, ...row, isRoutine: seen.size >= 2, status: 'VERIFIED', createdAt: stamp }
    seen.add(row.txnDate.slice(0, 7))
    monthsByCategory[row.category] = seen
    return doc
  })
}

const goalStatus = (verdict, reachable) => (verdict === 'TIGHT' ? 'tight' : verdict === 'NOT_SAFE' && !reachable ? 'stalled' : 'on-track')

async function buildData(userId) {
  const transactions = buildTransactions(userId)
  const profile = {
    userId, email: EMAIL, salary: cents(SALARY),
    manualBalance: cents(STARTING_SAVINGS), manualBalanceDate: isoDate(monthStart(-4), 28),
    bufferWeeks: 4, updatedAt: stamp,
  }
  const goals = []
  for (const [itemName, goalType, target, saved] of GOALS) {
    const goalKey = `${userId}:${itemName.toLowerCase()}`
    const result = await affordability({
      userId, user: profile, transactions, targetAmountCents: cents(target), intent: 'goal', itemName,
      link: null, goalType, goalKey, savedAmountCents: cents(saved), profileComplete: true, today,
    })
    goals.push({
      goalKey, userId, goalType, itemName, targetAmount: cents(target), savedAmount: cents(saved),
      verdict: result.verdict, link: null, timelineMonths: result.monthsNeeded,
      status: goalStatus(result.verdict, result.reachable), updatedAt: stamp,
    })
  }
  return { profile, transactions, goals }
}

// --- Save ---
async function writeToMongo({ profile, transactions, goals }) {
  const { MongoClient } = await import('mongodb')
  const client = new MongoClient(env.MONGODB_URI)
  try {
    await client.connect()
    const db = client.db(env.MONGODB_DB)
    const filter = { userId: profile.userId }
    const removed = await Promise.all(['users', 'transactions', 'goals'].map((name) => db.collection(name).deleteMany(filter)))
    await db.collection('users').insertOne(profile)
    if (transactions.length) await db.collection('transactions').insertMany(transactions)
    await db.collection('goals').insertMany(goals)
    console.log(`Replaced the demo user's data in "${env.MONGODB_DB}" (removed ${removed.map((r) => r.deletedCount).join(' / ')} old users / transactions / goals).`)
  } finally {
    await client.close()
  }
}

function exportJson({ profile, transactions, goals }) {
  mkdirSync('seed-data', { recursive: true })
  writeFileSync('seed-data/users.json', JSON.stringify([profile], null, 2))
  writeFileSync('seed-data/transactions.json', JSON.stringify(transactions, null, 2))
  writeFileSync('seed-data/goals.json', JSON.stringify(goals, null, 2))
  console.log('Wrote seed-data/users.json, transactions.json and goals.json. Import each into the collection with the same name.')
}

// --- Main ---
const userId = await signIn()
const data = await buildData(userId)
if (EXPORT_ONLY) exportJson(data)
else await writeToMongo(data)

const bundle = { userId, profile: [data.profile], transactions: data.transactions, goals: data.goals }
const dashboard = (await readApi({ ...bundle, request: { inputType: 'getDashboard' } })).data
const rs = (c) => `Rs ${Math.round(c / 100).toLocaleString('en-US')}`
console.log(`\nDemo user ${EMAIL} (Firebase ID ${userId}), as of ${today}:`)
console.log(`  Monthly salary:   ${rs(dashboard.salaryCents)}`)
console.log(`  Monthly expenses: ${rs(dashboard.monthlyRoutineCents)} (estimated from repeat spending)`)
console.log(`  Active goals:     ${dashboard.activeGoals}`)
console.log(`  Transactions:     ${data.transactions.length}, from ${data.transactions[0]?.txnDate} to ${data.transactions.at(-1)?.txnDate}`)
for (const g of data.goals) console.log(`  Goal: ${g.itemName}, ${rs(g.targetAmount)}, ${rs(g.savedAmount)} saved -> ${g.verdict}${g.timelineMonths ? `, about ${g.timelineMonths} month(s)` : ''}`)
