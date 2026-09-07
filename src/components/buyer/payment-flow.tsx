'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ShieldCheck, Lock, ExternalLink } from 'lucide-react'
import { BrandSpinner } from '@/components/site/brand-spinner'
import { motion } from 'framer-motion'

type Escrow = { reference: string; title: string; amount: string; fee: string; status: string }
const ngn = (n: number) => n.toLocaleString('en-NG')

export function PaymentFlow({ reference }: { reference: string }) {
  const [escrow, setEscrow] = useState<Escrow | null>(null)
  const [buyerEmail, setBuyerEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    const res = await fetch(`/api/escrows/${reference}`)
    const d = await res.json().catch(() => null)
    if (!res.ok) throw new Error(d?.error || 'Not found')
    setEscrow(d)
  }, [reference])

  useEffect(() => {
    load().catch((e) => setError(e.message)).finally(() => setLoading(false))
  }, [load])

  async function handlePayment() {
    if (!/.+@.+\..+/.test(buyerEmail)) {
      setError('Enter a valid email so we can send your receipt.')
      return
    }
    setPaying(true)
    setError('')
    try {
      sessionStorage.setItem('fsc_buyer_email', buyerEmail)
      const res = await fetch('/api/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference, buyerEmail }),
      })
      const d = await res.json().catch(() => null)
      if (!res.ok) throw new Error(d?.error || 'Could not start payment')
      // THE ONLY redirect: straight to Paystack's secure domain
      window.location.href = d.authorizationUrl
    } catch (e: any) {
      setError(e.message)
      setPaying(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <BrandSpinner className="size-10 text-primary" />
      </div>
    )
  }

  if (error && !escrow) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
        <p className="text-sm text-destructive">{error}</p>
        <Link href="/track" className="mt-4 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground">
          Track a payment
        </Link>
      </div>
    )
  }

  if (!escrow) return null

  const price = Number(escrow.amount)
  const fee = Number(escrow.fee) > 0 ? Number(escrow.fee) : Math.round(price * 0.02)
  const total = price + fee
  const alreadyPaid = escrow.status !== 'pending'

  return (
    <motion.div className="mx-auto w-full max-w-xl space-y-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="text-center">
        <ShieldCheck className="mx-auto size-12 text-primary" />
        <h1 className="mt-4 font-display text-3xl font-bold text-foreground">Secure payment</h1>
        <p className="mt-2 text-sm text-muted-foreground">Protected by FoundaScrow escrow</p>
      </div>

      <Card className="card-hover">
        <CardContent className="space-y-4 pt-6">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">You are paying for</p>
            <p className="text-lg font-semibold text-foreground">{escrow.title}</p>
            <p className="font-mono text-[10px] text-muted-foreground">{escrow.reference}</p>
          </div>

          <div className="space-y-1 border-t border-border pt-4 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Amount</span><span className="font-mono text-foreground">₦{ngn(price)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Platform fee (2%)</span><span className="font-mono text-foreground">₦{ngn(fee)}</span></div>
            <div className="flex justify-between border-t border-border pt-2 text-base font-semibold"><span className="text-foreground">Total</span><span className="font-mono text-primary">₦{ngn(total)}</span></div>
          </div>

          {!alreadyPaid ? (
            <>
              <div className="space-y-2 pt-2">
                <Label htmlFor="buyerEmail">Your email (receipt + updates)</Label>
                <Input id="buyerEmail" type="email" value={buyerEmail} onChange={(e) => setBuyerEmail(e.target.value)} placeholder="buyer@example.com" disabled={paying} />
              </div>
              {error && <p className="rounded-xl border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
              <Button className="w-full" size="lg" onClick={handlePayment} disabled={paying}>
                {paying ? <BrandSpinner className="size-4" /> : <Lock className="size-4" />}
                {paying ? 'Opening Paystack...' : `Pay ₦${ngn(total)} securely`}
              </Button>
              <p className="flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground">
                <ExternalLink className="size-3" /> You will finish on Paystack's secure page, then return here automatically.
              </p>
            </>
          ) : (
            <div className="space-y-3 pt-2 text-center">
              <p className="text-sm text-muted-foreground">
                This escrow is already <span className="font-semibold text-primary">{escrow.status}</span>. No further payment needed.
              </p>
              <Link href={`/track/${escrow.reference}`} className="inline-block rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground">
                Open tracking page
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 text-center">
        <p className="text-xs leading-relaxed text-muted-foreground">
          <strong className="text-foreground">How it works:</strong> your money waits in a sealed vault. The seller only gets paid when you confirm delivery.
        </p>
      </div>
    </motion.div>
  )
}
