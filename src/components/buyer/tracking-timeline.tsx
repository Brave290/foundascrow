'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  ShieldCheck, PackageCheck, CheckCircle2, Lock, Eye, EyeOff,
  Copy, Check, RefreshCw, Download, CreditCard, Loader2,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { BrandSpinner } from '@/components/site/brand-spinner'

type VaultFile = { path: string; name: string; size: number; type: string }
type Escrow = {
  reference: string
  title: string
  amount: string
  fee: string
  status: string
  metadata?: any
}

const ngn = (n: number) => n.toLocaleString('en-NG')

const STATUS_META: Record<string, { label: string; cls: string }> = {
  pending: { label: 'Awaiting payment', cls: 'border-border bg-card text-muted-foreground' },
  held: { label: 'In vault — protected', cls: 'border-primary/40 bg-primary/10 text-primary' },
  released: { label: 'Complete', cls: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400' },
  disputed: { label: 'Under review', cls: 'border-destructive/40 bg-destructive/10 text-destructive' },
}

export function TrackingTimeline({ reference }: { reference: string }) {
  const [escrow, setEscrow] = useState<Escrow | null>(null)
  const [error, setError] = useState('')
  const [revealed, setRevealed] = useState(false)
  const [copied, setCopied] = useState(false)
  const [busy, setBusy] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null)
  const [downloading, setDownloading] = useState('')
  const [checking, setChecking] = useState(false)

  const load = useCallback(async () => {
    const res = await fetch(`/api/escrows/${reference}`)
    const d = await res.json().catch(() => null)
    if (!res.ok) throw new Error(d?.error || 'Not found')
    setEscrow(d)
    setUpdatedAt(new Date())
  }, [reference])

  useEffect(() => {
    load().catch((e) => setError(e.message))
    const t = setInterval(() => load().catch(() => {}), 15000)
    return () => clearInterval(t)
  }, [load])

  async function reconcileNow(): Promise<boolean> {
    const res = await fetch('/api/pay/reconcile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reference }),
    })
    const d = await res.json().catch(() => null)
    return !!d?.funded
  }

  async function checkPayment() {
    setChecking(true)
    const funded = await reconcileNow().catch(() => false)
    await load().catch(() => {})
    setChecking(false)
    if (!funded) setError('')
  }

  async function refresh() {
    setRefreshing(true)
    await load().catch((e) => setError(e.message))
    setRefreshing(false)
  }

  // While pending: sweep Paystack every 20s so a paid-but-unconfirmed order self-heals
  useEffect(() => {
    if (!escrow || escrow.status !== 'pending') return
    const t = setInterval(() => {
      reconcileNow()
        .then((funded) => { if (funded) load().catch(() => {}) })
        .catch(() => {})
    }, 20000)
    return () => clearInterval(t)
  }, [escrow?.status, reference, load])

  async function confirmReceipt() {
    setBusy(true)
    const res = await fetch(`/api/release/${reference}`, { method: 'POST' })
    const d = await res.json().catch(() => null)
    if (!res.ok) setError(d?.error || 'Release failed')
    await load().catch(() => {})
    setBusy(false)
  }

  async function copyDetails() {
    await navigator.clipboard.writeText(escrow?.metadata?.deliveryDetails ?? '')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function download(f: VaultFile) {
    setDownloading(f.path)
    const res = await fetch(`/api/files?reference=${reference}&path=${encodeURIComponent(f.path)}`)
    const d = await res.json().catch(() => null)
    if (d?.url) window.open(d.url, '_blank')
    else setError(d?.error || 'Download failed')
    setDownloading('')
  }

  if (error && !escrow) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 text-center">
        <svg viewBox="0 0 120 120" className="size-24" aria-hidden="true">
          <circle cx="60" cy="60" r="44" fill="none" stroke="#f59e0b" strokeOpacity="0.35" strokeWidth="2" strokeDasharray="6 6" />
          <circle cx="60" cy="60" r="34" fill="#101823" stroke="#f59e0b" strokeWidth="3" />
          <path d="M60 44 l12 5 v9 c0 8-5 14-12 17 c-7-3-12-9-12-17 v-9 z" fill="none" stroke="#f59e0b" strokeWidth="3" strokeLinejoin="round" />
          <path d="M54 58 l12 10 M66 58 l-12 10" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
        </svg>
        <h1 className="mt-6 font-display text-2xl font-bold text-foreground">Escrow not found</h1>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          We searched the vault for <span className="font-mono text-foreground">{reference}</span> but found nothing.
        </p>
        <Link href="/track" className="mt-8 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground">
          Check another reference
        </Link>
      </div>
    )
  }

  if (!escrow) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    )
  }

  const funded = escrow.status === 'held' || escrow.status === 'released'
  const delivered = escrow.status === 'released'
  const metadata: any = escrow.metadata ?? {}
  const isDigital = metadata.itemType === 'digital'
  const details = metadata.deliveryDetails ?? ''
  const files = metadata.files ?? []
  const total = Number(escrow.amount) + Number(escrow.fee)
  const meta = STATUS_META[escrow.status] ?? STATUS_META.pending
  const lastAttempt = metadata.lastAttempt as { status?: string } | undefined

  const steps = [
    { label: 'Payment received', sub: 'Buyer paid via Paystack', done: funded, icon: CheckCircle2 },
    { label: 'Held in vault', sub: 'Money sealed & protected', done: funded, icon: ShieldCheck },
    { label: delivered ? 'Released to seller' : 'Delivery confirmed', sub: delivered ? 'Seller paid out' : 'Waiting for buyer confirmation', done: delivered, icon: PackageCheck },
  ]
  const activeIndex = steps.findIndex((s) => !s.done)

  return (
    <motion.div className="mx-auto w-full max-w-xl space-y-5" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      {/* Header + status chip + refresh */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2">
          <p className="font-mono text-xs text-muted-foreground">{escrow.reference}</p>
          <button type="button" onClick={refresh} aria-label="Refresh status" className="text-muted-foreground transition-colors hover:text-foreground">
            <RefreshCw className={`size-3 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <h1 className="mt-1 font-display text-2xl font-bold text-foreground">{escrow.title}</h1>
        <p className="mt-1 font-mono text-lg text-primary">₦{ngn(Number(escrow.amount))}</p>
        <motion.span
          key={escrow.status}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`mt-3 inline-block rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-widest ${meta.cls}`}
        >
          {meta.label}
        </motion.span>
        {updatedAt && <p className="mt-2 text-[10px] text-muted-foreground/60">Updated {updatedAt.toLocaleTimeString()}</p>}
      </div>

      {/* PAY CTA when pending */}
      {escrow.status === 'pending' && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
          <Link
            href={`/pay/${escrow.reference}`}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground shadow-[0_4px_14px_rgba(245,158,11,0.25)] transition-all hover:-translate-y-0.5"
          >
            <CreditCard className="size-4" /> Pay ₦{ngn(total)} now — held in vault till delivery
          </Link>
          {lastAttempt && lastAttempt.status && lastAttempt.status !== 'success' && (
            <button
              type="button"
              onClick={checkPayment}
              disabled={checking}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-border bg-card text-sm font-semibold text-foreground transition-all hover:border-primary/40"
            >
              {checking ? <BrandSpinner className="size-4" /> : <RefreshCw className="size-4" />}
              Check if I already paid
            </button>
          )}
          <p className="text-center text-[10px] text-muted-foreground">Card, bank transfer & USSD via Paystack</p>
        </motion.div>
      )}

      {/* Animated timeline */}
      <Card>
        <CardContent className="space-y-0 pt-6">
          {steps.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * i }}
              className="relative flex gap-4 pb-6 last:pb-0"
            >
              {i < steps.length - 1 && (
                <span className={`absolute left-5 top-10 h-[calc(100%-2.5rem)] w-0.5 ${s.done ? 'bg-primary' : 'bg-border'}`} />
              )}
              <div
                className={`relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full transition-colors ${
                  s.done
                    ? 'bg-primary text-primary-foreground'
                    : i === activeIndex
                      ? 'bg-card text-primary animate-pulse-ring border border-primary/40'
                      : 'bg-muted text-muted-foreground'
                }`}
              >
                {s.done ? (
                  <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 12 }}>
                    <Check className="size-5" />
                  </motion.span>
                ) : (
                  <s.icon className="size-5" />
                )}
              </div>
              <div className="pt-1.5">
                <p className={`text-sm font-semibold ${s.done ? 'text-foreground' : i === activeIndex ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {s.label}
                </p>
                <p className="text-[10px] text-muted-foreground">{s.sub}</p>
              </div>
            </motion.div>
          ))}
        </CardContent>
      </Card>

      {/* Delivery vault */}
      {isDigital && (details || files.length > 0) && (
        <Card className="card-hover">
          <CardContent className="space-y-3 pt-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground">Delivery details</p>
              {funded && details && (
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
              <motion.div initial={{ rotateX: 80, opacity: 0 }} animate={{ rotateX: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 120, damping: 14 }}>
                {details && (
                  <pre className="whitespace-pre-wrap rounded-xl border border-border bg-background p-4 font-mono text-sm text-foreground">
                    {revealed ? details : '••••••••••••••••••••••••••••'}
                  </pre>
                )}
                {files.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {files.map((f: VaultFile) => (
                      <button
                        key={f.path}
                        type="button"
                        onClick={() => download(f)}
                        className="flex w-full items-center justify-between rounded-lg border border-border bg-background px-3 py-2.5 text-xs transition-all hover:border-primary/40"
                      >
                        <span className="truncate text-foreground">{f.name}</span>
                        {downloading === f.path ? <Loader2 className="size-3.5 animate-spin text-primary" /> : <Download className="size-3.5 text-primary" />}
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>
            ) : (
              <div className="flex items-center gap-3 rounded-xl border border-border bg-background p-4">
                <Lock className="size-4 animate-pulse text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Unlocks the moment your payment lands in the vault.</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Confirm receipt */}
      <AnimatePresence>
        {funded && !delivered && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}>
            <Button size="lg" className="w-full" onClick={confirmReceipt} disabled={busy}>
              {busy ? <Loader2 className="animate-spin" /> : <PackageCheck />}
              I received it — release payment
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {delivered && (
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 150, damping: 14 }} className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-center">
          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.15, type: 'spring', stiffness: 200, damping: 10 }} className="inline-block">
            <CheckCircle2 className="mx-auto size-8 text-emerald-400" />
          </motion.span>
          <p className="mt-2 font-semibold text-foreground">Deal complete!</p>
          <p className="mt-1 text-xs text-muted-foreground">The seller has been paid. Thank you for using FoundaScrow.</p>
        </motion.div>
      )}
    </motion.div>
  )
}
