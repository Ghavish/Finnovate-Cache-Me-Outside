// Checks that every text used with t('...') or k('...') has a French and a Kreol translation,
// and that {placeholders} match. Run: npm run i18n:check
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import fr from '../src/i18n/fr.js'
import mfe from '../src/i18n/mfe.js'

// --- Collect keys from the source ---
function sourceFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) return sourceFiles(path)
    return /\.(jsx?|mjs)$/.test(name) && !path.includes('i18n/fr.js') && !path.includes('i18n/mfe.js') ? [path] : []
  })
}

const CALL = /(?<![\w.$])[tk]\(\s*(?:'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)")/g
const used = new Map() // key -> first place it was found
for (const file of sourceFiles('src')) {
  const text = readFileSync(file, 'utf8')
  for (const match of text.matchAll(CALL)) {
    const key = (match[1] ?? match[2]).replace(/\\(['"\\])/g, '$1')
    if (!used.has(key)) used.set(key, `${file}:${text.slice(0, match.index).split('\n').length}`)
  }
}

// --- Compare with each table ---
const placeholders = (text) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(',')
let problems = 0
for (const [name, table] of Object.entries({ fr, mfe })) {
  const missing = [...used.keys()].filter((key) => !(key in table))
  const unused = Object.keys(table).filter((key) => !used.has(key))
  const badPlaceholders = [...used.keys()].filter((key) => key in table && placeholders(key) !== placeholders(table[key]))
  const empty = Object.entries(table).filter(([, value]) => !String(value).trim()).map(([key]) => key)
  for (const key of missing) console.log(`[${name}] missing: "${key}"  (${used.get(key)})`)
  for (const key of badPlaceholders) console.log(`[${name}] placeholders differ: "${key}" -> "${table[key]}"`)
  for (const key of empty) console.log(`[${name}] empty translation: "${key}"`)
  for (const key of unused) console.log(`[${name}] unused (can be removed): "${key}"`)
  problems += missing.length + badPlaceholders.length + empty.length
}
console.log(`${used.size} texts checked; ${problems} problem(s).`)
process.exit(problems ? 1 : 0)
