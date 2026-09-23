/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const AppDataContext = createContext(null)
const STORAGE_KEY = 'goalpath-demo-data-v1'

const initialData = {
  salary: 35000,
  expenses: 24300,
  safeSavingCapacity: 4800,
  sourceLabel: 'August_Payslip.pdf',
  expenseBreakdown: { essential: 18500, adjustable: 3300, optional: 2500 },
  transactions: [
    { id: 't1', date: '18 Sep', description: 'Supermarket', amount: -1850, type: 'expense' },
    { id: 't2', date: '19 Sep', description: 'Salary', amount: 35000, type: 'income' },
    { id: 't3', date: '14 Sep', description: 'Transport', amount: -720, type: 'expense' },
    { id: 't4', date: '12 Sep', description: 'Goal contribution', amount: -4500, type: 'expense' },
  ],
  goals: [
    { id: 'goal-laptop', name: 'University laptop', category: 'Education', targetAmount: 40000, currentSavings: 15000, targetDate: '2027-06-30', verdict: 'SAFE', monthsNeeded: 4, progress: 38 },
    { id: 'goal-emergency', name: 'Emergency fund', category: 'Emergency', targetAmount: 30000, currentSavings: 12000, targetDate: '2027-03-31', verdict: 'SAFE', monthsNeeded: 3, progress: 40 },
  ],
}

export function AppDataProvider({ children }) {
  const [data, setData] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || initialData }
    catch { return initialData }
  })
  useEffect(() => localStorage.setItem(STORAGE_KEY, JSON.stringify(data)), [data])

  function addGoal(goal) { setData((current) => ({ ...current, goals: [goal, ...current.goals] })) }
  function updateFinancial(field, value) {
    setData((current) => {
      const next = { ...current, [field]: value }
      next.safeSavingCapacity = Math.max(next.salary - next.expenses - 5900, 0)
      return next
    })
  }
  // Used by the Input Data flow to update all connected screens at once.
  function saveFinancialProfile({ salary, expenses, sourceLabel }) {
    setData((current) => ({
      ...current,
      salary,
      expenses,
      safeSavingCapacity: Math.max(salary - expenses - 5900, 0),
      sourceLabel,
    }))
  }
  function resetDemo() { setData(initialData) }

  const value = useMemo(() => ({ data, addGoal, updateFinancial, saveFinancialProfile, resetDemo }), [data])
  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
}

export function useAppData() { return useContext(AppDataContext) }
