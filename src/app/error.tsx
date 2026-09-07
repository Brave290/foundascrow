'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Copy, Check, RefreshCw } from 'lucide-react'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const [copied, setCopied] = useState(false)
  useEffect(() => {
    console.error(error)
  }, [error])

  const details = `FoundaScrow error\nTime: ${new Date().toISOString()}\nURL: ${typeof location !== 'undefined' ? location.href : ''}\nMessage: ${error.message}\nDigest: ${error.digest ?? 'n/a'}`

  async function copy() {
    await navigator.clipboard.writeText(details)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <main className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 text-center">
      <svg viewBox="0 0 120 120" className="size-24" aria-hidden="true">
        <circle cx="60" cy="60" r="44" fill="none" stroke="#ef4444" strokeOpacity="0.35" strokeWidth="2" strokeDasharray="6 6" />
        <circle cx="60" cy="60" r="34" fill="#101823" stroke="#ef4444" strokeWidth="3" />
        <path d="M60 42 l-6 20 h12 l-6 20" fill="none" stroke="#ef4444" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <h1 className="mt-6 font-display text-3xl font-bold text-foreground">Something cracked in the vault</h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        An unexpected error occurred. Your money and data are safe — this is only a display fault.
      </p>
      <pre className="mt-4 max-w-md whitespace-pre-wrap rounded-xl border border-border bg-card p-3 text-left font-mono text-[10px] text-muted-foreground">{details}</pre>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={reset} className="rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground">
          <RefreshCw className="mr-1 inline size-4" /> Try again
        </button>
        <button type="button" onClick={copy} className="rounded-xl border border-border bg-card px-5 py-3 text-sm font-semibold text-foreground">
          {copied ? <Check className="mr-1 inline size-4" /> : <Copy className="mr-1 inline size-4" />} Copy error details
        </button>
        <Link href="/" className="rounded-xl border border-border bg-card px-5 py-3 text-sm font-semibold text-foreground">Go home</Link>
      </div>
    </main>
  )
}
