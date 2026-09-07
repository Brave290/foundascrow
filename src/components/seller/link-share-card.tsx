'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Copy, Check, MessageCircle } from 'lucide-react'
import { DeliveryUploader } from './delivery-uploader'

type VaultFile = { path: string; name: string; size: number; type: string }
const ngn = (n: number) => n.toLocaleString('en-NG')

export function LinkShareCard({ reference, title, amount, files }: { reference: string; title: string; amount: string; files: VaultFile[] }) {
  const [copied, setCopied] = useState(false)
  const paymentUrl = `${window.location.origin}/pay/${reference}`

  async function copy() {
    await navigator.clipboard.writeText(paymentUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  function shareWhatsApp() {
    window.open(`https://wa.me/?text=${encodeURIComponent(`Pay securely via FoundaScrow: ${paymentUrl}`)}`, '_blank')
  }

  return (
    <Card className="card-hover">
      <CardContent className="space-y-6 pt-6">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Item</span>
          <span className="text-right font-semibold text-foreground">{title}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Amount</span>
          <span className="font-mono text-primary">₦{ngn(Number(amount))}</span>
        </div>
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Payment link</p>
          <div className="flex gap-2">
            <Input value={paymentUrl} readOnly className="font-mono text-xs" />
            <Button onClick={copy} variant="outline">{copied ? <Check /> : <Copy />} {copied ? 'Copied' : 'Copy'}</Button>
          </div>
        </div>
        <Button onClick={shareWhatsApp} variant="outline" className="w-full"><MessageCircle /> Share on WhatsApp</Button>
        <div className="border-t border-border pt-5">
          <DeliveryUploader reference={reference} initialFiles={files} />
        </div>
        <div className="rounded-xl border border-primary/30 bg-primary/10 p-4">
          <p className="text-xs leading-relaxed text-foreground">
            <strong>Next step:</strong> send the link to your buyer. When they pay, the vault unlocks your files for them and emails you.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
