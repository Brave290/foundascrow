'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Copy, Check, MessageCircle } from 'lucide-react'

export function LinkShareCard({ reference }: { reference: string }) {
  const [copied, setCopied] = useState(false)
  const paymentUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/pay/${reference}`
    : `/pay/${reference}`
  
  async function copy() {
    await navigator.clipboard.writeText(paymentUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  
  function shareWhatsApp() {
    const text = `Pay securely via FoundaScrow: ${paymentUrl}`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }
  
  return (
    <Card>
      <CardContent className="space-y-6 pt-6">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Reference</p>
          <p className="font-mono text-lg font-semibold text-foreground">{reference}</p>
        </div>
        
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Payment Link</p>
          <div className="flex gap-2">
            <Input value={paymentUrl} readOnly className="flex-1 font-mono text-sm" />
            <Button onClick={copy} variant="outline">
              {copied ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy
                </>
              )}
            </Button>
          </div>
        </div>
        
        <Button onClick={shareWhatsApp} className="w-full" variant="outline">
          <MessageCircle className="mr-2 h-4 w-4" />
          Share on WhatsApp
        </Button>
        
        <div className="rounded-lg border border-primary/30 bg-primary/10 p-4">
          <p className="text-sm text-foreground">
            <strong>Next step:</strong> Send this link to your buyer via WhatsApp,
            SMS, or email. When they pay, you'll get an email notification.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
