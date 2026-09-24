// Loads the four test users (demo/test-users/*.json) into MongoDB.
//
//   npm run seed:test-users              -> writes to MongoDB (replaces these users' data)
//   npm run seed:test-users -- --export  -> writes seed-data/test-users/*.json to import by hand
//
// Needs:
//   seed-data/LOGINS.md    the team's logins table (git-ignored, never commit it)
//   .env.local             VITE_FIREBASE_API_KEY, MONGODB_URI, MONGODB_DB (the last two not needed for --export)
//
// The data files use TEST_UID_1..4 in place of real IDs. The script signs in to each
// account to get its Firebase UID, marks routine spending with the app's rule and
// works out each goal's verdict with n8n's own Affordability Algorithm.
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
const LOGINS_FILE = 'seed-data/LOGINS.md'
const required = ['VITE_FIREBASE_API_KEY', ...(EXPORT_ONLY ? [] : ['MONGODB_URI', 'MONGODB_DB'])]
const missing = required.filter((key) => !env[key])
if (missing.length) {
  console.error(`Missing ${missing.join(', ')}. Add them to .env.local.`)
  process.exit(1)
}
if (!existsSync(LOGINS_FILE)) {
  console.error(`Missing ${LOGINS_FILE}. Copy the team's LOGINS.md there (the folder is git-ignored).`)
  process.exit(1)
}

// --- Logins: read the markdown table (Email, Password, Placeholder columns) ---
function readLogins(path) {
  const rows = readFileSync(path, 'utf8').split(/\r?\n/)
    .filter((line) => line.trim().startsWith('|'))
    .map((line) => line.trim().replace(/^\||\|$/g, '').split('|').map((cell) => cell.trim()))
  const header = rows[0].map((cell) => cell.toLowerCase())
  const col = (word) => header.findIndex((cell) => cell.includes(word))
  const [emailCol, passwordCol, placeholderCol] = [col('email'), col('password'), col('placeholder')]
  return rows.slice(1)
    .filter((cells) => /^TEST_UID_\d+$/.test(cells[placeholderCol] || ''))
    .map((cells) => ({ placeholder: cells[placeholderCol], email: cells[emailCol], password: cells[passwordCol] }))
}

// --- Firebase: sign in to get each user's ID ---
async function signIn(email, password) {
  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${env.VITE_FIREBASE_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  })
  const body = await response.json()
  if (!response.ok) throw new Error(`Firebase sign-in failed for ${email}: ${body.error?.message || response.status}`)
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

// --- Dates (Mauritius, UTC+4) ---
const now = new Date(Date.now() + 4 * 3600e3)
const today = now.toISOString().slice(0, 10)
const stamp = now.toISOString().slice(0, 19) + '+04:00'

// --- Build one user's data ---
const readData = (file) => JSON.parse(readFileSync(`demo/test-users/${file}`, 'utf8'))
const allUsers = readData('users.json')
const allTransactions = readData('transactions.json')
const allGoals = readData('goals.json')

// Same routine rule as the Transaction Prep node: a category is routine once
// it already appears in at least two earlier months.
function markRoutine(transactions) {
  const monthsByCategory = {}
  return [...transactions].sort((a, b) => a.txnDate.localeCompare(b.txnDate)).map((row) => {
    const seen = monthsByCategory[row.category] || new Set()
    const doc = { ...row, isRoutine: seen.size >= 2 }
    seen.add(row.txnDate.slice(0, 7))
    monthsByCategory[row.category] = seen
    return doc
  })
}

const goalStatus = (verdict, reachable) => (verdict === 'TIGHT' ? 'tight' : verdict === 'NOT_SAFE' && !reachable ? 'stalled' : 'on-track')

async function buildUser(placeholder, userId) {
  const profile = { ...allUsers.find((u) => u.userId === placeholder), userId, updatedAt: stamp }
  const transactions = markRoutine(allTransactions.filter((t) => t.userId === placeholder).map((t) => ({ ...t, userId })))
  const goals = []
  for (const goal of allGoals.filter((g) => g.userId === placeholder)) {
    const goalKey = `${userId}:${goal.itemName.toLowerCase()}`
    const result = await affordability({
      userId, user: profile, transactions, targetAmountCents: goal.targetAmount, intent: 'goal', itemName: goal.itemName,
      link: goal.link, goalType: goal.goalType, goalKey, savedAmountCents: goal.savedAmount, profileComplete: true, today,
    })
    goals.push({
      ...goal, goalKey, userId, verdict: result.verdict, timelineMonths: result.monthsNeeded,
      status: goalStatus(result.verdict, result.reachable), updatedAt: stamp,
    })
  }
  return { profile, transactions, goals }
}

// --- Save ---
async function writeToMongo(users) {
  const { MongoClient } = await import('mongodb')
  const client = new MongoClient(env.MONGODB_URI)
  try {
    await client.connect()
    const db = client.db(env.MONGODB_DB)
    const filter = { userId: { $in: users.map((u) => u.profile.userId) } }
    await Promise.all(['users', 'transactions', 'goals'].map((name) => db.collection(name).deleteMany(filter)))
    await db.collection('users').insertMany(users.map((u) => u.profile))
    await db.collection('transactions').insertMany(users.flatMap((u) => u.transactions))
    await db.collection('goals').insertMany(users.flatMap((u) => u.goals))
    console.log(`Replaced the test users' data in "${env.MONGODB_DB}".`)
  } finally {
    await client.close()
  }
}

function exportJson(users) {
  mkdirSync('seed-data/test-users', { recursive: true })
  writeFileSync('seed-data/test-users/users.json', JSON.stringify(users.map((u) => u.profile), null, 2))
  writeFileSync('seed-data/test-users/transactions.json', JSON.stringify(users.flatMap((u) => u.transactions), null, 2))
  writeFileSync('seed-data/test-users/goals.json', JSON.stringify(users.flatMap((u) => u.goals), null, 2))
  console.log('Wrote seed-data/test-users/users.json, transactions.json and goals.json. Import each into the collection with the same name.')
}

// --- Main ---
const logins = readLogins(LOGINS_FILE)
if (!logins.length) {
  console.error(`No TEST_UID_ rows found in ${LOGINS_FILE}.`)
  process.exit(1)
}
const users = []
for (const { placeholder, email, password } of logins) {
  users.push({ email, ...(await buildUser(placeholder, await signIn(email, password))) })
}
if (EXPORT_ONLY) exportJson(users)
else await writeToMongo(users)

const rs = (c) => `Rs ${Math.round(c / 100).toLocaleString('en-US')}`
console.log(`\nAs of ${today}:`)
for (const { email, profile, transactions, goals } of users) {
  const bundle = { userId: profile.userId, profile: [profile], transactions, goals }
  const dashboard = (await readApi({ ...bundle, request: { inputType: 'getDashboard' } })).data
  console.log(`\n${email}: salary ${rs(dashboard.salaryCents)}, monthly expenses ${rs(dashboard.monthlyRoutineCents)}, ${transactions.length} transactions`)
  for (const g of goals) console.log(`  Goal: ${g.itemName}, ${rs(g.targetAmount)}, ${rs(g.savedAmount)} saved -> ${g.verdict}${g.timelineMonths ? `, about ${g.timelineMonths} month(s)` : ''}`)
}
