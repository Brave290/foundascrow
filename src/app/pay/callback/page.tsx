'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { BrandSpinner } from '@/components/site/brand-spinner'

function CallbackInner() {
  const router = useRouter()
  const params = useSearchParams()
  const [msg, setMsg] = useState('Confirming your payment...')

  useEffect(() => {
    const ref = params.get('reference') || params.get('trxref') || ''
    if (!ref) {
      router.replace('/track')
      return
    }
    let alive = true
    async function verify() {
      for (let i = 0; i < 3; i++) {
        const res = await fetch('/api/pay/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reference: ref, buyerEmail: sessionStorage.getItem('fsc_buyer_email') || '' }),
        })
        const d = await res.json().catch(() => null)
        if (!alive) return
        if (d?.success) {
          setMsg('Payment confirmed! Opening your tracking page...')
          setTimeout(() => router.replace(`/track/${ref}`), 900)
          return
        }
        await new Promise((r) => setTimeout(r, 2500))
      }
      setMsg('Still waiting on confirmation. Opening tracking anyway...')
      setTimeout(() => router.replace(`/track/${ref}`), 1200)
    }
    verify()
    return () => {
      alive = false
    }
  }, [params, router])

  return (
    <main className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 text-center">
      <BrandSpinner className="size-14 text-primary" />
      <p className="mt-6 text-sm text-muted-foreground">{msg}</p>
      <p className="mt-2 text-[10px] text-muted-foreground/60">Do not close this page.</p>
    </main>
  )
}

export default function CallbackPage() {
  return (
    <Suspense fallback={null}>
      <CallbackInner />
    </Suspense>
  )
}
