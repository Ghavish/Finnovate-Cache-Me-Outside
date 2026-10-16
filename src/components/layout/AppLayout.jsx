import { Suspense } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import PageLoader from '../ui/PageLoader.jsx'
import Header from './Header.jsx'
import MobileNav from './MobileNav.jsx'
import Sidebar from './Sidebar.jsx'

export default function AppLayout() {
  const { pathname } = useLocation()
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="page-column">
        <Header />
        {/* The key restarts the page entrance animation on every route change. */}
        <div className="page-enter" key={pathname}>
          <Suspense fallback={<PageLoader />}>
            <Outlet />
          </Suspense>
        </div>
      </div>
      <MobileNav />
    </div>
  )
}
