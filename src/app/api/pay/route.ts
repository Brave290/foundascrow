import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

const PS_KEY = process.env.PAYSTACK_SECRET_KEY || ''
const SITE = process.env.SITE_URL || 'http://127.0.0.1:3000'

export async function POST(request: Request) {
  if (!PS_KEY) return NextResponse.json({ error: 'Server misconfigured: missing Paystack key' }, { status: 500 })
  try {
    const { reference, buyerEmail } = await request.json()
    if (!reference || !buyerEmail) return NextResponse.json({ error: 'Reference and buyer email are required' }, { status: 400 })

    const escrow = await prisma.escrow.findFirst({ where: { reference } })
    if (!escrow) return NextResponse.json({ error: 'Escrow not found' }, { status: 404 })
    if (escrow.status !== 'pending') return NextResponse.json({ error: `This escrow is already ${escrow.status}.`, already: true }, { status: 409 })

    const kobo = Math.round((Number(escrow.amount) + Number(escrow.fee)) * 100)
    const ps = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: { Authorization: `Bearer ${PS_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: buyerEmail,
        amount: kobo,
        currency: 'NGN',
        reference: escrow.reference,
        callback_url: `${SITE}/pay/callback`,
        metadata: { escrowReference: escrow.reference, escrowId: escrow.id, buyerEmail, source: 'foundascrow' },
      }),
    })
    const data = await ps.json().catch(() => null)
    if (!ps.ok || !data?.data?.authorization_url) return NextResponse.json({ error: data?.message || 'Paystack refused the charge' }, { status: 502 })
    return NextResponse.json({ authorizationUrl: data.data.authorization_url })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Payment init failed' }, { status: 500 })
  }
}
