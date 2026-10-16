import { LogoMark } from '../layout/Logo.jsx'

// Shown while a page's code downloads. Inside the app shell it fills the content area only.
export default function PageLoader({ fullScreen = false }) {
  return (
    <div className={fullScreen ? 'app-splash' : 'page-loader'} role="status" aria-label="MoBudget">
      <LogoMark size={fullScreen ? 56 : 40} />
    </div>
  )
}
