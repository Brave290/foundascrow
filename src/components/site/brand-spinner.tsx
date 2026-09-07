export function BrandSpinner({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 50 50" className={`animate-spin ${className ?? ''}`} aria-hidden="true">
      <circle cx="25" cy="25" r="20" fill="none" stroke="currentColor" strokeOpacity="0.25" strokeWidth="6" />
      <path d="M25 5 a20 20 0 0 1 20 20" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
    </svg>
  )
}
