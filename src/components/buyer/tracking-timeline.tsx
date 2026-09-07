'use client'

import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ShieldCheck, PackageCheck, CheckCircle2, Lock, Eye, EyeOff, Copy, Check, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'

type Escrow = {
  reference: string
  title: string
  amount: string
  fee: string
  status: string
  metadata?: { itemType?: string; deliveryDetails?: string; sellerEmail?: string } | null
}

export function TrackingTimeline({ reference }: { reference: string }) {
  const [escrow, setEscrow] = useState<Escrow | null>(null)
  const [error, setError] = useState('')
  const [revealed, setRevealed] = useState(false)
  const [copied, setCopied] = useState(false)
  const [busy, setBusy] = useState(false)

  const load = useCallback(() => {
    fetch(`/api/escrows/${reference}`)
      .then(async (r) => {
        const d = await r.json().catch(() => null)
        if (!r.ok) throw new Error(d?.error || 'Not found')
        setEscrow(d)
      })
      .catch((e) => setError(e.message))
  }, [reference])

  useEffect(() => {
    load()
    const t = setInterval(load, 15000)
    return () => clearInterval(t)
  }, [load])

  async function confirmReceipt() {
    setBusy(true)
    const res = await fetch(`/api/release/${reference}`, { method: 'POST' })
    const d = await res.json().catch(() => null)
    if (!res.ok) setError(d?.error || 'Release failed')
    load()
    setBusy(false)
  }

  async function copyDetails() {
    const details = escrow?.metadata?.deliveryDetails ?? ''
    await navigator.clipboard.writeText(details)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (error && !escrow) {
    return <p className="py-24 text-center text-sm text-destructive">{error}</p>
  }
  if (!escrow) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    )
  }

  const funded = escrow.status === 'held' || escrow.status === 'released'
  const delivered = escrow.status === 'released'
  const isDigital = escrow.metadata?.itemType === 'digital'
  const details = escrow.metadata?.deliveryDetails ?? ''

  const steps = [
    { label: 'Payment received', done: funded, icon: CheckCircle2 },
    { label: 'Held in vault', done: funded, icon: ShieldCheck },
    { label: delivered ? 'Released to seller' : 'Delivery confirmed', done: delivered, icon: PackageCheck },
  ]

  return (
    <motion.div className="space-y-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="text-center">
        <p className="font-mono text-xs text-muted-foreground">{escrow.reference}</p>
        <h1 className="mt-1 font-display text-2xl font-bold text-foreground">{escrow.title}</h1>
        <p className="mt-1 font-mono text-lg text-primary">₦{Number(escrow.amount).toLocaleString()}</p>
      </div>

      <Card>
        <CardContent className="space-y-4 pt-6">
          {steps.map((s) => (
            <div key={s.label} className="flex items-center gap-4">
              <div
                className={`flex size-10 shrink-0 items-center justify-center rounded-full transition-colors ${
                  s.done ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}
              >
                <s.icon className="size-5" />
              </div>
              <p className={`text-sm font-semibold ${s.done ? 'text-foreground' : 'text-muted-foreground'}`}>
                {s.label}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Delivery details vault */}
      {isDigital && details && (
        <Card className="card-hover">
          <CardContent className="space-y-3 pt-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground">Delivery details</p>
              {funded && (
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => setRevealed((v) => !v)}>
                    {revealed ? <EyeOff /> : <Eye />} {revealed ? 'Hide' : 'Reveal'}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={copyDetails} disabled={!revealed}>
                    {copied ? <Check /> : <Copy />}
                  </Button>
                </div>
              )}
            </div>
            {funded ? (
              <pre className="whitespace-pre-wrap rounded-xl border border-border bg-background p-4 font-mono text-sm text-foreground">
                {revealed ? details : '••••••••••••••••••••••••••••'}
              </pre>
            ) : (
              <div className="flex items-center gap-3 rounded-xl border border-border bg-background p-4">
                <Lock className="size-4 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">
                  Unlocks the moment your payment lands in the vault.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {funded && !delivered && (
        <Button size="lg" className="w-full" onClick={confirmReceipt} disabled={busy}>
          {busy ? <Loader2 className="animate-spin" /> : <PackageCheck />}
          I received it — release payment
        </Button>
      )}

      {delivered && (
        <div className="rounded-xl border border-primary/30 bg-primary/10 p-4 text-center">
          <CheckCircle2 className="mx-auto size-8 text-primary" />
          <p className="mt-2 font-semibold text-foreground">Deal complete!</p>
          <p className="mt-1 text-xs text-muted-foreground">The seller has been paid. Thank you for using FoundaScrow.</p>
        </div>
      )}
    </motion.div>
  )
}
