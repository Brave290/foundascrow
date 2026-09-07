'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ShieldCheck, Loader2, CheckCircle2 } from 'lucide-react'
import { motion } from 'framer-motion'

type Escrow = {
  reference: string
  title: string
  amount: string
  status: string
}

export function PaymentFlow({ reference }: { reference: string }) {
  const router = useRouter()
  const [escrow, setEscrow] = useState<Escrow | null>(null)
  const [buyerEmail, setBuyerEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState('')
  
  useEffect(() => {
    // Fetch escrow details
    fetch(`/api/escrows/${reference}`)
      .then((res) => res.json())
      .then((data) => {
        setEscrow(data)
        setLoading(false)
      })
      .catch(() => {
        setError('Escrow not found')
        setLoading(false)
      })
  }, [reference])
  
  async function handlePayment() {
    if (!buyerEmail) {
      setError('Please enter your email')
      return
    }
    
    setPaying(true)
    setError('')
    
    try {
      const res = await fetch('/api/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reference,
          buyerEmail,
        }),
      })
      
      if (!res.ok) throw new Error((await res.json()).error)
      
      router.push(`/track/${reference}`)
    } catch (err: any) {
      setError(err.message)
      setPaying(false)
    }
  }
  
  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    )
  }
  
  if (!escrow) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-destructive">Escrow not found</p>
      </div>
    )
  }
  
  const amount = parseFloat(escrow.amount)
  const fee = amount * 0.02 // 2% fee
  const total = amount + fee
  
  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="text-center">
        <ShieldCheck className="mx-auto h-12 w-12 text-primary" />
        <h1 className="mt-4 font-display text-3xl font-bold text-foreground">
          Secure Payment
        </h1>
        <p className="mt-2 text-muted-foreground">
          Your payment is protected by FoundaScrow escrow
        </p>
      </div>
      
      <Card className="card-hover">
        <CardContent className="space-y-4 pt-6">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">You're paying for</p>
            <p className="text-lg font-semibold text-foreground">{escrow.title}</p>
          </div>
          
          <div className="space-y-1 border-t border-border pt-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Amount</span>
              <span className="font-mono text-foreground">₦{amount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Platform fee (2%)</span>
              <span className="font-mono text-foreground">₦{fee.toLocaleString()}</span>
            </div>
            <div className="flex justify-between border-t border-border pt-2 text-base font-semibold">
              <span className="text-foreground">Total</span>
              <span className="font-mono text-primary">₦{total.toLocaleString()}</span>
            </div>
          </div>
          
          <div className="space-y-2 pt-4">
            <Label htmlFor="buyerEmail">Your Email</Label>
            <Input
              id="buyerEmail"
              type="email"
              value={buyerEmail}
              onChange={(e) => setBuyerEmail(e.target.value)}
              placeholder="buyer@example.com"
              required
              disabled={paying}
            />
            <p className="text-xs text-muted-foreground">
              We'll send you a receipt and tracking updates
            </p>
          </div>
          
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive"
            >
              {error}
            </motion.div>
          )}
          
          <Button onClick={handlePayment} className="w-full hover-lift" disabled={paying}>
            {paying ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing payment...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Pay ₦{total.toLocaleString()} Securely
              </>
            )}
          </Button>
        </CardContent>
      </Card>
      
      <motion.div
        className="rounded-lg border border-primary/30 bg-primary/5 p-4 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <p className="text-sm text-muted-foreground">
          <strong>How it works:</strong> Your payment goes into a secure vault.
          The seller only gets paid when you confirm you received the item.
        </p>
      </motion.div>
    </motion.div>
  )
}
