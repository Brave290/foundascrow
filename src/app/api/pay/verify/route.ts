import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { emails } from '@/lib/email'

const PS_KEY = process.env.PAYSTACK_SECRET_KEY || ''
const ngn = (n: number) => n.toLocaleString('en-NG')

async function verifyWithRetry(reference: string, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const ps = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
        headers: { Authorization: `Bearer ${PS_KEY}` },
      })
      if (ps.status === 429 || ps.status >= 500) {
        // Rate limit or server error — retry
        await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, i)))
        continue
      }
      const data = await ps.json()
      return { ok: true, data }
    } catch (e: any) {
      if (i === retries - 1) return { ok: false, error: e.message }
      await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, i)))
    }
  }
  return { ok: false, error: 'Max retries exceeded' }
}

export async function POST(request: Request) {
  if (!PS_KEY) return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
  try {
    const { reference, buyerEmail, escrowRef } = await request.json()
    if (!reference) return NextResponse.json({ error: 'Reference required' }, { status: 400 })

    const verify = await verifyWithRetry(reference)
    if (!verify.ok) {
      return NextResponse.json({ success: false, error: verify.error, status: 'network_error' })
    }

    const status = verify.data?.data?.status ?? 'unknown'
    
    if (status !== 'success') {
      const lookup0 = escrowRef || (verify.data?.data?.metadata?.escrowReference as string) || ''
      if (lookup0) {
        const e0 = await prisma.escrow.findFirst({ where: { reference: lookup0 } }).catch(() => null)
        if (e0 && e0.status === 'pending') {
          const m0: any = e0.metadata ?? {}
          await prisma.escrow
            .update({ where: { id: e0.id }, data: { metadata: { ...m0, lastAttempt: { status, at: new Date().toISOString(), psRef: reference } } } })
            .catch(() => {})
        }
      }
      return NextResponse.json({ success: false, status })
    }

    const lookup = escrowRef || (verify.data?.data?.metadata?.escrowReference as string) || ''
    const escrow = lookup ? await prisma.escrow.findFirst({ where: { reference: lookup } }) : null
    
    if (escrow && escrow.status === 'pending') {
      const meta: any = escrow.metadata ?? {}
      await prisma.escrow.update({
        where: { id: escrow.id },
        data: { status: 'held', fundedAt: new Date(), metadata: { ...meta, buyerEmail: buyerEmail || meta.buyerEmail, fundedVia: 'paystack-verify', paystackRef: reference } },
      })
      const price = Number(escrow.amount)
      const fee = Number(escrow.fee) > 0 ? Number(escrow.fee) : Math.round(price * 0.02)
      emails.receipt(buyerEmail || meta.buyerEmail, escrow.title, escrow.reference, ngn(price + fee)).catch(() => {})
      emails.funded(meta.sellerEmail, escrow.title, escrow.reference).catch(() => {})
    }
    
    return NextResponse.json({ success: true, funded: true, escrowReference: lookup, amount: verify.data?.data?.amount ?? 0 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Verify failed' }, { status: 500 })
  }
}
