import { Outlet } from 'react-router-dom'
import Header from './Header.jsx'
import MobileNav from './MobileNav.jsx'
import Sidebar from './Sidebar.jsx'

export default function AppLayout() {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="page-column">
        <Header />
        <Outlet />
      </div>
      <MobileNav />
    </div>
  )
}
