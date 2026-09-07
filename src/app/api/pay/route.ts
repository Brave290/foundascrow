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

    const price = Number(escrow.amount)
    const fee = Number(escrow.fee) > 0 ? Number(escrow.fee) : Math.round(price * 0.02)
    const kobo = Math.round((price + fee) * 100)
    // Unique per attempt → abandoned/failed attempts NEVER burn the link
    const psRef = `${escrow.reference}-${Date.now().toString(36).toUpperCase()}`

    const ps = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: { Authorization: `Bearer ${PS_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: buyerEmail,
        amount: kobo,
        currency: 'NGN',
        reference: psRef,
        callback_url: `${SITE}/pay/callback?ref=${escrow.reference}`,
        metadata: { escrowReference: escrow.reference, escrowId: escrow.id, buyerEmail, source: 'foundascrow' },
      }),
    })
    const data = await ps.json().catch(() => null)
    if (!ps.ok || !data?.data?.authorization_url) return NextResponse.json({ error: data?.message || 'Paystack refused the charge' }, { status: 502 })
    const metaNow: any = escrow.metadata ?? {}
    const attempts = Array.isArray(metaNow.paymentAttempts) ? metaNow.paymentAttempts : []
    attempts.push({ psRef, at: new Date().toISOString() })
    await prisma.escrow
      .update({ where: { id: escrow.id }, data: { metadata: { ...metaNow, paymentAttempts: attempts.slice(-10), lastAttempt: { status: 'initialized', psRef, at: new Date().toISOString() } } } })
      .catch(() => {})
    return NextResponse.json({ authorizationUrl: data.data.authorization_url })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Payment init failed' }, { status: 500 })
  }
}
