import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

const PS_KEY = process.env.PAYSTACK_SECRET_KEY || ''

export async function POST(request: Request) {
  if (!PS_KEY) return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
  try {
    const { reference, buyerEmail } = await request.json()
    if (!reference) return NextResponse.json({ error: 'Reference required' }, { status: 400 })

    const ps = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${PS_KEY}` },
    })
    const data = await ps.json().catch(() => null)
    if (data?.data?.status !== 'success') return NextResponse.json({ success: false, status: data?.data?.status ?? 'unknown' })

    const escrow = await prisma.escrow.findFirst({ where: { reference } })
    if (escrow && escrow.status === 'pending') {
      const meta: any = escrow.metadata ?? {}
      await prisma.escrow.update({
        where: { id: escrow.id },
        data: { status: 'held', fundedAt: new Date(), metadata: { ...meta, buyerEmail: buyerEmail || meta.buyerEmail, fundedVia: 'paystack-verify' } },
      })
    }
    return NextResponse.json({ success: true, funded: true, amount: data?.data?.amount ?? 0 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Verify failed' }, { status: 500 })
  }
}
