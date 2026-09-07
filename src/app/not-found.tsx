'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Copy, Check } from 'lucide-react'

export default function NotFound() {
  const [copied, setCopied] = useState(false)
  async function copy() {
    await navigator.clipboard.writeText(`404 · ${typeof location !== 'undefined' ? location.href : ''} · ${new Date().toISOString()}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <main className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 text-center">
      <svg viewBox="0 0 120 120" className="size-24" aria-hidden="true">
        <circle cx="60" cy="60" r="44" fill="none" stroke="#f59e0b" strokeOpacity="0.35" strokeWidth="2" strokeDasharray="6 6" />
        <circle cx="60" cy="60" r="34" fill="#101823" stroke="#f59e0b" strokeWidth="3" />
        <path d="M60 44 l12 5 v9 c0 8-5 14-12 17 c-7-3-12-9-12-17 v-9 z" fill="none" stroke="#f59e0b" strokeWidth="3" strokeLinejoin="round" />
        <path d="M54 58 l12 10 M66 58 l-12 10" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
      </svg>
      <h1 className="mt-6 font-display text-3xl font-bold text-foreground">Nothing in this vault</h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        The page or escrow you are looking for does not exist, or the reference is wrong.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/" className="rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground">Go home</Link>
        <Link href="/track" className="rounded-xl border border-border bg-card px-5 py-3 text-sm font-semibold text-foreground">Track a payment</Link>
        <button type="button" onClick={copy} className="rounded-xl border border-border bg-card px-5 py-3 text-sm font-semibold text-foreground">
          {copied ? <Check className="mr-1 inline size-4" /> : <Copy className="mr-1 inline size-4" />} Copy page info
        </button>
      </div>
    </main>
  )
}
