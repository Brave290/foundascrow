'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { BrandSpinner } from '@/components/site/brand-spinner'
import {
  MessageCircle, Send, AtSign, Gamepad2, FileDown, Package,
  ArrowLeft, ArrowRight, Lock,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const ITEM_TYPES = [
  { id: 'whatsapp', label: 'WhatsApp number', desc: 'Sell a registered number safely', icon: MessageCircle, digital: true },
  { id: 'telegram', label: 'Telegram account', desc: 'Channels, groups or accounts', icon: Send, digital: true },
  { id: 'social', label: 'Social handle', desc: 'Instagram, TikTok, X handles', icon: AtSign, digital: true },
  { id: 'gaming', label: 'Game account', desc: 'Free Fire, PUBG, consoles', icon: Gamepad2, digital: true },
  { id: 'digital', label: 'Digital item', desc: 'Files, licenses, codes', icon: FileDown, digital: true },
  { id: 'physical', label: 'Physical item', desc: 'Phones, fashion, gadgets', icon: Package, digital: false },
]

const STEPS = ['Item', 'Details', 'Price', 'Review']
const ngn = (n: number) => n.toLocaleString('en-NG')

export function CreateLinkForm() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [itemType, setItemType] = useState('')
  const [title, setTitle] = useState('')
  const [deliveryDetails, setDeliveryDetails] = useState('')
  const [amount, setAmount] = useState('')
  const [sellerEmail, setSellerEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [banks, setBanks] = useState<{ code: string; name: string }[]>([])
  const [bankCode, setBankCode] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [accountName, setAccountName] = useState('')
  const [resolving, setResolving] = useState(false)

  const selected = ITEM_TYPES.find((t) => t.id === itemType)
  const isDigital = selected?.digital ?? false
  const price = Number(amount) || 0
  const fee = Math.round(price * 0.02)

  async function loadBanks() {
    if (banks.length) return
    const res = await fetch('/api/banks')
    const d = await res.json().catch(() => null)
    if (d?.banks) setBanks(d.banks)
  }

  async function resolveAccount() {
    if (!/^\d{10}$/.test(accountNumber) || !bankCode) return
    setResolving(true)
    setAccountName('')
    setError('')
    const res = await fetch('/api/banks/resolve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bankCode, accountNumber }),
    })
    const d = await res.json().catch(() => null)
    if (res.ok) setAccountName(d.accountName)
    else setError(d?.error || 'Could not resolve account')
    setResolving(false)
  }

  function canNext(): boolean {
    if (step === 0) return !!itemType
    if (step === 1) return title.trim().length > 2 && (!isDigital || deliveryDetails.trim().length > 3)
    if (step === 2) return price > 0
    return /.+@.+\..+/.test(sellerEmail) && !!accountName
  }

  async function submit() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          amount: price,
          currency: 'NGN',
          sellerEmail,
          itemType: isDigital ? 'digital' : 'physical',
          itemKind: itemType,
          deliveryDetails: isDigital ? deliveryDetails : '',
          payout: { bankCode, accountNumber, accountName },
        }),
      })
      const d = await res.json().catch(() => null)
      if (!res.ok) throw new Error(d?.error || 'Could not create link')
      router.push(`/links/${d.reference}`)
    } catch (e: any) {
      setError(e.message)
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-xl">
      <div className="mb-6">
        <div className="flex justify-between font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          {STEPS.map((s, i) => (
            <span key={s} className={i <= step ? 'text-primary' : ''}>{s}</span>
          ))}
        </div>
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted">
          <div className="h-full bg-primary transition-all duration-500" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.25 }}
        >
          {step === 0 && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {ITEM_TYPES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setItemType(t.id)}
                  className={`flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-all ${
                    itemType === t.id ? 'border-primary bg-primary/10' : 'border-border bg-card hover:border-primary/40'
                  }`}
                >
                  <t.icon className={`size-5 ${itemType === t.id ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className="text-sm font-semibold text-foreground">{t.label}</span>
                  <span className="text-[10px] leading-snug text-muted-foreground">{t.desc}</span>
                </button>
              ))}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4 rounded-xl border border-border bg-card p-5">
              <div className="space-y-2">
                <Label>Title buyers will see</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Aged WhatsApp number with 50k contacts" />
              </div>
              {isDigital && (
                <div className="space-y-2">
                  <Label>Delivery details (what the buyer receives)</Label>
                  <textarea
                    rows={3}
                    value={deliveryDetails}
                    onChange={(e) => setDeliveryDetails(e.target.value)}
                    placeholder={'Number: +234...\nLogin: ...\nPassword: ...'}
                    className="resize-none flex w-full rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground shadow-sm transition-all placeholder:text-muted-foreground/60 focus-visible:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
                  />
                  <p className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <Lock className="size-3 text-primary" /> Sealed in the vault until the buyer pays. You can also attach files on the next page.
                  </p>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 rounded-xl border border-border bg-card p-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Amount (₦)</Label>
                  <Input type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
                </div>
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Input defaultValue="NGN" maxLength={3} disabled />
                </div>
              </div>
              <div className="space-y-1 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
                <div className="flex justify-between"><span>Item price</span><span className="font-mono">₦{ngn(price)}</span></div>
                <div className="flex justify-between"><span>Platform fee (2%)</span><span className="font-mono">₦{ngn(fee)}</span></div>
                <div className="flex justify-between border-t border-border pt-1 text-foreground"><span>Buyer pays</span><span className="font-mono text-primary">₦{ngn(price + fee)}</span></div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 rounded-xl border border-border bg-card p-5">
              <div className="space-y-2">
                <Label>Payout bank</Label>
                <select
                  value={bankCode}
                  onFocus={loadBanks}
                  onChange={(e) => { setBankCode(e.target.value); setAccountName('') }}
                  className="flex h-11 w-full rounded-xl border border-input bg-card px-4 text-sm text-foreground focus-visible:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
                >
                  <option value="">Select bank</option>
                  {banks.map((b) => (
                    <option key={b.code} value={b.code}>{b.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Account number</Label>
                <div className="flex gap-2">
                  <Input
                    value={accountNumber}
                    onChange={(e) => { setAccountNumber(e.target.value.replace(/\D/g, '').slice(0, 10)); setAccountName('') }}
                    placeholder="0123456789"
                    inputMode="numeric"
                  />
                  <Button type="button" variant="outline" onClick={resolveAccount} disabled={resolving || !/^\d{10}$/.test(accountNumber) || !bankCode}>
                    {resolving ? 'Checking...' : 'Verify'}
                  </Button>
                </div>
                {accountName && (
                  <p className="rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-xs font-semibold text-primary">✓ {accountName}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Your email (payment alerts)</Label>
                <Input type="email" value={sellerEmail} onChange={(e) => setSellerEmail(e.target.value)} placeholder="seller@example.com" />
              </div>
              <div className="space-y-2 rounded-lg border border-border bg-background p-4 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Item</span><span className="text-foreground">{selected?.label}</span></div>
                <div className="flex justify-between gap-4"><span className="text-muted-foreground">Title</span><span className="text-right text-foreground">{title}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Delivery</span><span className="text-foreground">{isDigital ? 'Sealed in vault' : 'Physical shipping'}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Payout to</span><span className="text-right text-foreground">{accountName || '—'} · {accountNumber}</span></div>
                <div className="flex justify-between border-t border-border pt-2"><span className="text-muted-foreground">Buyer pays</span><span className="font-mono text-primary">₦{ngn(price + fee)}</span></div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {error && (
        <p className="mt-4 rounded-xl border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>
      )}

      <div className="mt-6 flex gap-3">
        {step > 0 && (
          <Button variant="outline" onClick={() => setStep(step - 1)} disabled={loading}>
            <ArrowLeft /> Back
          </Button>
        )}
        {step < STEPS.length - 1 ? (
          <Button className="flex-1" onClick={() => setStep(step + 1)} disabled={!canNext()}>
            Continue <ArrowRight />
          </Button>
        ) : (
          <Button className="flex-1" size="lg" onClick={submit} disabled={loading || !canNext()}>
            {loading ? <BrandSpinner className="size-4" /> : <Lock className="size-4" />}
            {loading ? 'Securing your link...' : 'Create secure link'}
          </Button>
        )}
      </div>
    </div>
  )
}
