import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/auth/ProtectedRoute.jsx'
import AppLayout from './components/layout/AppLayout.jsx'
import AICoachPage from './pages/AICoachPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import FinancialOverviewPage from './pages/FinancialOverviewPage.jsx'
import GoalsPage from './pages/GoalsPage.jsx'
import InputDataPage from './pages/InputDataPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'
import AnalysisResultPage from './pages/AnalysisResultPage.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
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
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
