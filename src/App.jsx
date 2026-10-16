import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/auth/ProtectedRoute.jsx'
import AppLayout from './components/layout/AppLayout.jsx'
import PageLoader from './components/ui/PageLoader.jsx'

// Pages: each one downloads only when it is first opened.
const AICoachPage = lazy(() => import('./pages/AICoachPage.jsx'))
const DashboardPage = lazy(() => import('./pages/DashboardPage.jsx'))
const FinancialOverviewPage = lazy(() => import('./pages/FinancialOverviewPage.jsx'))
const GoalsPage = lazy(() => import('./pages/GoalsPage.jsx'))
const InputDataPage = lazy(() => import('./pages/InputDataPage.jsx'))
const LoginPage = lazy(() => import('./pages/LoginPage.jsx'))
const SignupPage = lazy(() => import('./components/auth/Signup.jsx'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage.jsx'))
const AnalysisResultPage = lazy(() => import('./pages/AnalysisResultPage.jsx'))

export default function App() {
  return (
    <Suspense fallback={<PageLoader fullScreen />}>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        {/* Protected Dashboard Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/input-data" element={<InputDataPage />} />
            <Route path="/analysis-result" element={<AnalysisResultPage />} />
            <Route path="/goals" element={<GoalsPage />} />
            <Route path="/goals/new" element={<GoalsPage startCreating />} />
            <Route path="/financial-overview" element={<FinancialOverviewPage />} />
            <Route path="/coach" element={<AICoachPage />} />
          </Route>
        </Route>

        {/* Fallback Route */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  )
}
