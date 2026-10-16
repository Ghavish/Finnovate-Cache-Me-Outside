import { useId } from 'react'

// MoBudget mark: a rising path on a teal-to-indigo tile. Same drawing as public/favicon.svg.
export function LogoMark({ size = 34 }) {
  const gradientId = useId()
  return (
    <svg className="logo-mark" width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id={gradientId} x1="2" y1="2" x2="30" y2="30" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2DD4BF" />
          <stop offset="1" stopColor="#6366F1" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill={`url(#${gradientId})`} />
      <path d="M7 22.5 12.5 14l5 5L24 9.5" stroke="#04201C" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="24" cy="9.5" r="2.6" fill="#ffffff" />
    </svg>
  )
}

// Mark plus the word "MoBudget" and an optional tagline.
export default function Logo({ tagline, size }) {
  return (
    <span className="brand">
      <LogoMark size={size} />
      <span className="brand-text">
        <strong>Mo<em>Budget</em></strong>
        {tagline && <small>{tagline}</small>}
      </span>
    </span>
  )
}
