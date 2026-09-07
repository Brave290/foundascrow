'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { BrandSpinner } from '@/components/site/brand-spinner'
import { Copy, Check, XCircle, Clock } from 'lucide-react'

function Inner() {
  const router = useRouter()
  const params = useSearchParams()
  const [state, setState] = useState<'verifying' | 'failed' | 'abandoned'>('verifying')
  const [copied, setCopied] = useState(false)
  const escrowRef = params.get('ref') || ''
  const psRef = params.get('reference') || params.get('trxref') || ''

  useEffect(() => {
    if (!psRef) {
      router.replace(escrowRef ? `/track/${escrowRef}` : '/track')
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
          setState(d.status === 'failed' ? 'failed' : 'abandoned')
          fetch('/api/notify/abandoned', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reference: escrowRef, buyerEmail: sessionStorage.getItem('fsc_buyer_email') || '' }),
          }).catch(() => {})
          return
        }
        await new Promise((r) => setTimeout(r, 2500))
      }
      router.replace(`/track/${escrowRef || psRef}`)
    }
    run()
    return () => {
      alive = false
    }
  }, [params, router, escrowRef, psRef])

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

  const failed = state === 'failed'
  return (
    <main className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 text-center">
      {failed ? <XCircle className="size-16 text-destructive" /> : <Clock className="size-16 text-primary" />}
      <h1 className="mt-6 font-display text-2xl font-bold text-foreground">
        {failed ? 'Payment failed' : 'Payment not completed'}
      </h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        {failed
          ? 'Paystack reported this attempt as failed. No money left your account, and your order link is still active.'
          : 'You closed the checkout before finishing. No money left your account — the item is still reserved for you.'}
      </p>
      <p className="mt-4 font-mono text-xs text-muted-foreground">{escrowRef}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        {escrowRef && (
          <Link href={`/pay/${escrowRef}`} className="rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground">
            Try again
          </Link>
        )}
        <button type="button" onClick={copy} className="rounded-xl border border-border bg-card px-5 py-3 text-sm font-semibold text-foreground">
          {copied ? <Check className="mr-1 inline size-4" /> : <Copy className="mr-1 inline size-4" />} Copy details
        </button>
        <Link href={`/track/${escrowRef}`} className="rounded-xl border border-border bg-card px-5 py-3 text-sm font-semibold text-foreground">
          View order
        </Link>
      </div>
      <p className="mt-6 text-[10px] text-muted-foreground/60">A follow-up email with your resume link is on its way.</p>
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
