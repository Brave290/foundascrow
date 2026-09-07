'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { BrandSpinner } from '@/components/site/brand-spinner'
import { Copy, Check, XCircle, Clock, RefreshCw } from 'lucide-react'

function Inner() {
  const router = useRouter()
  const params = useSearchParams()
  const [state, setState] = useState<'verifying' | 'failed' | 'aborted' | 'unknown'>('verifying')
  const [checking, setChecking] = useState(false)
  const [checkMsg, setCheckMsg] = useState('')
  const [copied, setCopied] = useState(false)
  const escrowRef = params.get('ref') || ''
  const psRef = params.get('reference') || params.get('trxref') || ''

  async function reconcile(): Promise<boolean> {
    if (!escrowRef) return false
    const res = await fetch('/api/pay/reconcile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reference: escrowRef }),
    })
    const d = await res.json().catch(() => null)
    if (d?.funded) {
      router.replace(`/track/${escrowRef}`)
      return true
    }
    return false
  }

  useEffect(() => {
    if (!psRef) {
      setState('unknown')
      return
    }
    let alive = true
    async function run() {
      for (let i = 0; i < 3; i++) {
        const res = await fetch('/api/pay/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reference: psRef, escrowRef, buyerEmail: sessionStorage.getItem('fsc_buyer_email') || '' }),
        })
        const d = await res.json().catch(() => null)
        if (!alive) return
        if (d?.success) {
          router.replace(`/track/${escrowRef || d.escrowReference}`)
          return
        }
        if (['failed', 'abandoned', 'cancelled'].includes(d?.status)) {
          setState(d.status === 'failed' ? 'failed' : 'aborted')
          fetch('/api/notify/abandoned', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reference: escrowRef, buyerEmail: sessionStorage.getItem('fsc_buyer_email') || '' }),
          }).catch(() => {})
          return
        }
        await new Promise((r) => setTimeout(r, 2500))
      }
      // Verify inconclusive → sweep Paystack's ledger before giving up
      const funded = await reconcile()
      if (!alive || funded) return
      setState('unknown')
    }
    run()
    return () => {
      alive = false
    }
  }, [psRef, escrowRef, router])

  async function manualCheck() {
    setChecking(true)
    setCheckMsg('')
    const funded = await reconcile().catch(() => false)
    if (!funded) setCheckMsg('No successful payment found for this order yet. If money left your account, check again in a minute — our sweep will catch it.')
    setChecking(false)
  }

  async function copy() {
    await navigator.clipboard.writeText(`Escrow: ${escrowRef} · Paystack: ${psRef}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (state === 'verifying') {
    return (
      <main className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 text-center">
        <BrandSpinner className="size-14 text-primary" />
        <p className="mt-6 text-sm text-muted-foreground">Confirming your payment...</p>
        <p className="mt-2 text-[10px] text-muted-foreground/60">Do not close this page.</p>
      </main>
    )
  }

  return (
    <main className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 text-center">
      {state === 'failed' ? <XCircle className="size-16 text-destructive" /> : <Clock className="size-16 text-primary" />}
      <h1 className="mt-6 font-display text-2xl font-bold text-foreground">
        {state === 'failed' ? 'Payment failed' : state === 'aborted' ? 'Transaction aborted' : 'Still confirming...'}
      </h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        {state === 'failed'
          ? 'Paystack reported this attempt as failed. No money left your account, and your order link is still active.'
          : state === 'aborted'
            ? 'You closed the checkout before completing payment. No money left your account — your order link is still active.'
            : 'We could not confirm this transaction yet. If money left your account, press "Check my payment" — we sweep Paystack directly, so no payment is ever lost.'}
      </p>
      {escrowRef && <p className="mt-4 font-mono text-xs text-muted-foreground">{escrowRef}</p>}
      {checkMsg && <p className="mt-3 max-w-sm rounded-xl border border-primary/40 bg-primary/10 p-3 text-xs text-primary">{checkMsg}</p>}
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={manualCheck} disabled={checking} className="rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground">
          {checking ? <BrandSpinner className="mr-1 inline size-4" /> : <RefreshCw className="mr-1 inline size-4" />} Check my payment
        </button>
        {escrowRef && (
          <Link href={`/pay/${escrowRef}`} className="rounded-xl border border-border bg-card px-5 py-3 text-sm font-semibold text-foreground">
            Try again
          </Link>
        )}
        <button type="button" onClick={copy} className="rounded-xl border border-border bg-card px-5 py-3 text-sm font-semibold text-foreground">
          {copied ? <Check className="mr-1 inline size-4" /> : <Copy className="mr-1 inline size-4" />} Copy details
        </button>
        {escrowRef && (
          <Link href={`/track/${escrowRef}`} className="rounded-xl border border-border bg-card px-5 py-3 text-sm font-semibold text-foreground">
            View order
          </Link>
        )}
      </div>
      {state !== 'unknown' && (
        <p className="mt-6 text-[10px] text-muted-foreground/60">A follow-up email with your resume link is on its way.</p>
      )}
    </main>
  )
}

export default function CallbackPage() {
  return (
    <Suspense fallback={null}>
      <Inner />
    </Suspense>
  )
}
