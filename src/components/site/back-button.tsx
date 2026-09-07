'use client'

import { usePathname, useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

export function BackButton() {
  const router = useRouter()
  const pathname = usePathname()
  if (pathname === '/') return null
  function goBack() {
    if (typeof window !== 'undefined' && window.history.length > 1) router.back()
    else router.push('/')
  }
  return (
    <button type="button" onClick={goBack} aria-label="Go back"
      className="fixed left-4 top-20 z-40 flex size-10 items-center justify-center rounded-full border border-border bg-card text-foreground transition-all hover:-translate-x-0.5 hover:border-primary/40 sm:left-6">
      <ArrowLeft className="size-4" />
    </button>
  )
}
