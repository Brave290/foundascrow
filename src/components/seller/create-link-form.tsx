'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, Link2, Smartphone, Package } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export function CreateLinkForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [itemType, setItemType] = useState<'physical' | 'digital'>('digital')

  async function onSubmit(formData: FormData) {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.get('title'),
          amount: parseFloat(formData.get('amount') as string),
          currency: formData.get('currency') || 'NGN',
          sellerEmail: formData.get('sellerEmail'),
          itemType,
          deliveryDetails: formData.get('deliveryDetails') || '',
        }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || 'Something went wrong')
      router.push(`/links/${data.reference}`)
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <motion.form
      action={onSubmit}
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="card-hover">
        <CardContent className="space-y-5 pt-6">
          <div className="space-y-2">
            <Label>Your email</Label>
            <Input name="sellerEmail" type="email" placeholder="seller@example.com" required disabled={loading} />
            <p className="text-xs text-muted-foreground">Payment alerts land here.</p>
          </div>

          <div className="space-y-2">
            <Label>What are you selling?</Label>
            <Input name="title" placeholder="WhatsApp number · Telegram account · iPhone 15..." required disabled={loading} />
          </div>

          {/* Item type pills */}
          <div className="space-y-2">
            <Label>Item type</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setItemType('digital')}
                className={`flex h-11 items-center justify-center gap-2 rounded-xl border text-sm font-semibold transition-all ${
                  itemType === 'digital'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-card text-muted-foreground hover:text-foreground'
                }`}
              >
                <Smartphone className="size-4" /> Digital
              </button>
              <button
                type="button"
                onClick={() => setItemType('physical')}
                className={`flex h-11 items-center justify-center gap-2 rounded-xl border text-sm font-semibold transition-all ${
                  itemType === 'physical'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-card text-muted-foreground hover:text-foreground'
                }`}
              >
                <Package className="size-4" /> Physical
              </button>
            </div>
          </div>

          <AnimatePresence>
            {itemType === 'digital' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2 overflow-hidden"
              >
                <Label>Delivery details (what the buyer receives)</Label>
                <textarea
                  name="deliveryDetails"
                  rows={4}
                  placeholder={'WhatsApp number: +234...\nTelegram: @...\nLogin: ...\nPassword: ...'}
                  disabled={loading}
                  className="flex w-full rounded-xl border border-input bg-card px-4 py-3 text-sm text-foreground shadow-sm transition-all placeholder:text-muted-foreground/60 focus-visible:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
                />
                <p className="text-xs text-muted-foreground">
                  🔒 Locked until the buyer's payment hits the vault. Then it unlocks for them only.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Amount (₦)</Label>
              <Input name="amount" type="number" min="0" step="0.01" placeholder="0.00" required disabled={loading} />
            </div>
            <div className="space-y-2">
              <Label>Currency</Label>
              <Input name="currency" defaultValue="NGN" maxLength={3} required disabled={loading} />
            </div>
          </div>
        </CardContent>
      </Card>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-xl border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <Button type="submit" className="w-full" size="lg" disabled={loading}>
        {loading ? <Loader2 className="animate-spin" /> : <Link2 />}
        {loading ? 'Creating your secure link...' : 'Create Payment Link'}
      </Button>
    </motion.form>
  )
}
