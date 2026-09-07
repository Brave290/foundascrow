import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { emails } from '@/lib/email'
import crypto from 'crypto'

const PS_SECRET = process.env.PAYSTACK_WEBHOOK_SECRET || process.env.PAYSTACK_SECRET_KEY || ''
const ngn = (n: number) => n.toLocaleString('en-NG')

export async function POST(request: Request) {
  try {
    const body = await request.text()
    
    // Verify webhook signature (security)
    if (PS_SECRET) {
      const hash = crypto.createHmac('sha512', PS_SECRET).update(body).digest('hex')
      const sig = request.headers.get('x-paystack-signature')
      if (sig !== hash) {
        console.error('Webhook signature mismatch')
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }
    }

    const event = JSON.parse(body)
    
    if (event.event !== 'charge.success') {
      return NextResponse.json({ ok: true, ignored: true })
    }

    const { reference, status, metadata } = event.data
    if (status !== 'success') {
      return NextResponse.json({ ok: true, notSuccess: true })
    }

    const escrowRef = metadata?.escrowReference || reference
    const escrow = await prisma.escrow.findFirst({ where: { reference: escrowRef } })
    
    if (!escrow) {
      console.error('Webhook: escrow not found', escrowRef)
      return NextResponse.json({ ok: true, notFound: true })
    }

    if (escrow.status === 'pending') {
      const meta: any = escrow.metadata ?? {}
      await prisma.escrow.update({
        where: { id: escrow.id },
        data: {
          status: 'held',
          fundedAt: new Date(),
          metadata: { ...meta, fundedVia: 'paystack-webhook', paystackRef: reference, webhookAt: new Date().toISOString() },
        },
      })
      
      const price = Number(escrow.amount)
      const fee = Number(escrow.fee) > 0 ? Number(escrow.fee) : Math.round(price * 0.02)
      
      // Send lifecycle emails
      const buyerEmail = meta.buyerEmail || metadata?.buyerEmail
      emails.receipt(buyerEmail, escrow.title, escrow.reference, ngn(price + fee)).catch(() => {})
      emails.funded(meta.sellerEmail, escrow.title, escrow.reference).catch(() => {})
      
      console.log('Webhook: funded escrow', escrow.reference)
    }

    return NextResponse.json({ ok: true, funded: escrow.status === 'pending' })
  } catch (e: any) {
    console.error('Webhook error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
