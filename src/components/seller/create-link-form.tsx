'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, CheckCircle2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export function CreateLinkForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  async function onSubmit(formData: FormData) {
    setLoading(true)
    setError('')
    
    try {
      const title = formData.get('title') as string
      const amount = formData.get('amount') as string
      const currency = formData.get('currency') as string
      const sellerEmail = formData.get('sellerEmail') as string
      
      const res = await fetch('/api/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          amount: parseFloat(amount),
          currency: currency || 'NGN',
          sellerEmail,
        }),
      })
      
      if (!res.ok) throw new Error((await res.json()).error)
      
      const { reference } = await res.json()
      router.push(`/links/${reference}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create payment link')
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
        <CardContent className="space-y-4 pt-6">
          <div className="space-y-2">
            <Label htmlFor="sellerEmail">Your Email</Label>
            <Input
              id="sellerEmail"
              name="sellerEmail"
              type="email"
              placeholder="seller@example.com"
              required
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              We&apos;ll send you updates when the payment arrives
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="title">What are you selling?</Label>
            <Input
              id="title"
              name="title"
              placeholder="iPhone 15 Pro Max - Brand New"
              required
              disabled={loading}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Input
                id="currency"
                name="currency"
                defaultValue="NGN"
                maxLength={3}
                required
                disabled={loading}
              />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>
      
      <Button type="submit" className="w-full hover-lift" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating your secure link...
          </>
        ) : (
          <>
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Create Payment Link
          </>
        )}
      </Button>
    </motion.form>
  )
}
