import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { emails } from '@/lib/email'

const PS_KEY = process.env.PAYSTACK_SECRET_KEY || ''
const ngn = (n: number) => n.toLocaleString('en-NG')

export async function POST(request: Request) {
  if (!PS_KEY) return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
  try {
    const { reference, buyerEmail, escrowRef } = await request.json()
    if (!reference) return NextResponse.json({ error: 'Reference required' }, { status: 400 })

    const ps = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${PS_KEY}` },
    })
    const data = await ps.json().catch(() => null)
    const status = data?.data?.status ?? 'unknown'
    if (status !== 'success') {
      const lookup0 = escrowRef || ((data?.data?.metadata as any)?.escrowReference as string) || ''
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

    const lookup = escrowRef || (data?.data?.metadata?.escrowReference as string) || ''
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
    return NextResponse.json({ success: true, funded: true, escrowReference: lookup, amount: data?.data?.amount ?? 0 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Verify failed' }, { status: 500 })
  }
}
