'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { BrandSpinner } from '@/components/site/brand-spinner'
import {
  MessageCircle, Send, AtSign, Gamepad2, FileDown, Package,
  ArrowLeft, ArrowRight, Lock, Paperclip, FileText, X,
  ChevronDown, Check, Search,
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
const kb = (n: number) => `${(n / 1024).toFixed(0)} KB`

export function CreateLinkForm() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const bankBoxRef = useRef<HTMLDivElement>(null)
  const [step, setStep] = useState(0)
  const [itemType, setItemType] = useState('')
  const [title, setTitle] = useState('')
  const [deliveryDetails, setDeliveryDetails] = useState('')
  const [queuedFiles, setQueuedFiles] = useState<File[]>([])
  const [amount, setAmount] = useState('')
  const [sellerEmail, setSellerEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingMsg, setLoadingMsg] = useState('')
  const [error, setError] = useState('')
  const [banks, setBanks] = useState<{ code: string; name: string }[]>([])
  const [bankOpen, setBankOpen] = useState(false)
  const [bankQuery, setBankQuery] = useState('')
  const [bankCode, setBankCode] = useState('')
  const [bankName, setBankName] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [accountName, setAccountName] = useState('')
  const [resolving, setResolving] = useState(false)

  const selected = ITEM_TYPES.find((t) => t.id === itemType)
  const isDigital = selected?.digital ?? false
  const price = Number(amount) || 0
  const fee = Math.round(price * 0.02)
  const filteredBanks = banks.filter((b) => b.name.toLowerCase().includes(bankQuery.toLowerCase()))

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (bankBoxRef.current && !bankBoxRef.current.contains(e.target as Node)) setBankOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  function pickFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files || [])
    const valid = picked.filter((f) => f.size <= 10 * 1024 * 1024)
    setQueuedFiles((q) => [...q, ...valid].slice(0, 5))
    if (fileRef.current) fileRef.current.value = ''
  }

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
      setLoadingMsg('Creating your secure link...')
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
          payout: { bankCode, accountNumber, accountName: accountName.replace(/[^A-Za-z\s.-]/g, '').trim().toUpperCase() },
        }),
      })
      const d = await res.json().catch(() => null)
      if (!res.ok) throw new Error(d?.error || 'Could not create link')

      for (let i = 0; i < queuedFiles.length; i++) {
        setLoadingMsg(`Uploading file ${i + 1} of ${queuedFiles.length}...`)
        const form = new FormData()
        form.append('file', queuedFiles[i])
        form.append('reference', d.reference)
        await fetch('/api/uploads', { method: 'POST', body: form })
      }

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
                <>
                  <div className="space-y-2">
                    <Label>Delivery details (what the buyer receives)</Label>
                    <textarea
                      rows={3}
                      value={deliveryDetails}
                      onChange={(e) => setDeliveryDetails(e.target.value)}
                      placeholder={'Number: +234...\nLogin: ...\nPassword: ...'}
                      className="resize-none flex w-full rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground shadow-sm transition-all placeholder:text-muted-foreground/60 focus-visible:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Attach files (optional)</Label>
                    <input ref={fileRef} type="file" multiple className="hidden" onChange={pickFiles} />
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-background px-4 py-4 text-sm text-muted-foreground transition-all hover:border-primary/40 hover:text-foreground"
                    >
                      <Paperclip className="size-4" /> Add images, docs, ZIPs (max 10MB each)
                    </button>
                    {queuedFiles.length > 0 && (
                      <div className="space-y-2">
                        {queuedFiles.map((f, i) => (
                          <div key={i} className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2 text-xs">
                            <span className="flex items-center gap-2 truncate text-foreground">
                              <FileText className="size-3.5 shrink-0 text-primary" /> {f.name}
                            </span>
                            <span className="ml-2 flex shrink-0 items-center gap-2">
                              <span className="font-mono text-muted-foreground">{kb(f.size)}</span>
                              <button type="button" onClick={() => setQueuedFiles((q) => q.filter((_, j) => j !== i))} aria-label="Remove file">
                                <X className="size-3.5 text-muted-foreground hover:text-destructive" />
                              </button>
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                    <p className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                      <Lock className="size-3 text-primary" /> Sealed in the vault until the buyer pays.
                    </p>
                  </div>
                </>
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
              {/* CUSTOM BANK COMBOBOX */}
              <div className="space-y-2">
                <Label>Payout bank</Label>
                <div className="relative" ref={bankBoxRef}>
                  <button
                    type="button"
                    onClick={() => { setBankOpen((v) => !v); loadBanks() }}
                    className="flex h-11 w-full items-center justify-between rounded-xl border border-input bg-card px-4 text-sm text-foreground transition-all focus-visible:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
                  >
                    <span className={bankName ? '' : 'text-muted-foreground/60'}>{bankName || 'Select bank'}</span>
                    <ChevronDown className={`size-4 text-muted-foreground transition-transform ${bankOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {bankOpen && (
                    <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
                      <div className="border-b border-border p-2">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                          <input
                            autoFocus
                            value={bankQuery}
                            onChange={(e) => setBankQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Escape' && setBankOpen(false)}
                            placeholder="Search bank..."
                            className="h-9 w-full rounded-lg bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
                          />
                        </div>
                      </div>
                      <ul className="max-h-56 overflow-y-auto">
                        {filteredBanks.map((b) => (
                          <li key={b.code}>
                            <button
                              type="button"
                              onClick={() => { setBankCode(b.code); setBankName(b.name); setBankOpen(false); setAccountName('') }}
                              className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm text-foreground transition-colors hover:bg-accent"
                            >
                              {b.name}
                              {bankCode === b.code && <Check className="size-4 text-primary" />}
                            </button>
                          </li>
                        ))}
                        {filteredBanks.length === 0 && (
                          <li className="px-4 py-3 text-xs text-muted-foreground">No bank matches "{bankQuery}"</li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
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
                {queuedFiles.length > 0 && (
                  <div className="flex justify-between"><span className="text-muted-foreground">Files</span><span className="text-foreground">{queuedFiles.length} attached</span></div>
                )}
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
          <Button className="flex-1" onClick={() => setStep(step + 1)} disabled={!canNext() || loading}>
            Continue <ArrowRight />
          </Button>
        ) : (
          <Button className="flex-1" size="lg" onClick={submit} disabled={loading || !canNext()}>
            {loading ? <BrandSpinner className="size-4" /> : <Lock className="size-4" />}
            {loading ? loadingMsg : 'Create secure link'}
          </Button>
        )}
      </div>
    </div>
  )
}
