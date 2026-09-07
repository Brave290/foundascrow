import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { emails } from '@/lib/email'

const PS_KEY = process.env.PAYSTACK_SECRET_KEY || ''

export async function POST(_req: Request, { params }: { params: Promise<{ reference: string }> }) {
  if (!PS_KEY) return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
  try {
    const { reference } = await params
    const escrow = await prisma.escrow.findFirst({ where: { reference } })
    if (!escrow) return NextResponse.json({ error: 'Escrow not found' }, { status: 404 })
    if (escrow.status === 'released') return NextResponse.json({ success: true, already: true })
    if (escrow.status !== 'held') return NextResponse.json({ error: 'Escrow is not funded yet.' }, { status: 409 })

    const meta: any = escrow.metadata ?? {}
    const payout = meta.payout
    if (!payout?.bankCode || !payout?.accountNumber) return NextResponse.json({ error: 'Seller payout details missing.' }, { status: 422 })

    const priceKobo = Math.round(Number(escrow.amount) * 100)

    const rec = await fetch('https://api.paystack.co/transfer/recipient', {
      method: 'POST',
      headers: { Authorization: `Bearer ${PS_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'nuban', name: payout.accountName, account_number: payout.accountNumber, bank_code: payout.bankCode, currency: 'NGN' }),
    })
    const recData = await rec.json().catch(() => null)
    if (!rec.ok || !recData?.data?.recipient_code) {
      console.error('RECIPIENT FAIL:', JSON.stringify(recData))
      return NextResponse.json({ error: 'Payout setup failed: ' + (recData?.message || 'unknown') }, { status: 502 })
    }

    const tr = await fetch('https://api.paystack.co/transfer', {
      method: 'POST',
      headers: { Authorization: `Bearer ${PS_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipient: recData.data.recipient_code, amount: priceKobo, reason: `FoundaScrow ${reference}` }),
    })
    const trData = await tr.json().catch(() => null)
    if (!tr.ok || !trData?.data) {
      console.error('TRANSFER FAIL:', JSON.stringify(trData))
      return NextResponse.json({ error: 'Payout failed: ' + (trData?.message || 'unknown') + '. Money remains in vault.' }, { status: 502 })
    }

    await prisma.escrow.update({
      where: { id: escrow.id },
      data: { status: 'released', releasedAt: new Date(), metadata: { ...meta, payout: { ...payout, transferRef: trData.data.transfer_code || trData.data.id, paidAt: new Date().toISOString() } } },
    })
    emails.payout(meta.sellerEmail, escrow.title, reference, Number(escrow.amount).toLocaleString('en-NG'), trData.data.transfer_code || trData.data.id).catch(() => {})
    return NextResponse.json({ success: true, transfer: trData.data.transfer_code || trData.data.id })
  } catch (e: any) {
    console.error('RELEASE ERROR:', e)
    return NextResponse.json({ error: e.message || 'Release failed' }, { status: 500 })
  }
}
