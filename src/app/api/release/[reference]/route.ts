import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { emails } from '@/lib/email'

const PS_KEY = process.env.PAYSTACK_SECRET_KEY || ''

function psError(data: any, fallback: string): string {
  // Paystack errors come back as {status:false, message:"..."}
  return data?.message || data?.error || fallback
}

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

    // Strip special characters from name (Paystack rejects apostrophes etc.)
    const cleanName = (payout.accountName || '').replace(/[^A-Za-z\s.-]/g, '').trim().toUpperCase()
    if (!cleanName) return NextResponse.json({ error: 'Account name contains only special characters.' }, { status: 422 })

    const priceKobo = Math.round(Number(escrow.amount) * 100)

    // 1. Recipient
    const rec = await fetch('https://api.paystack.co/transfer/recipient', {
      method: 'POST',
      headers: { Authorization: `Bearer ${PS_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'nuban',
        name: cleanName,
        account_number: payout.accountNumber,
        bank_code: payout.bankCode,
        currency: 'NGN',
      }),
    })
    const recData = await rec.json().catch(() => null)
    console.log('RECIPIENT RESPONSE:', JSON.stringify(recData))
    if (!rec.ok || !recData?.data?.recipient_code) {
      const errMsg = psError(recData, 'unknown error creating recipient')
      return NextResponse.json({ error: `Payout setup failed: ${errMsg}. Money remains safely in the vault — check bank details and retry.` }, { status: 502 })
    }

    // 2. Transfer
    const tr = await fetch('https://api.paystack.co/transfer', {
      method: 'POST',
      headers: { Authorization: `Bearer ${PS_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipient: recData.data.recipient_code,
        amount: priceKobo,
        reason: `FoundaScrow ${reference}`,
      }),
    })
    const trData = await tr.json().catch(() => null)
    console.log('TRANSFER RESPONSE:', JSON.stringify(trData))
    if (!tr.ok || !trData?.data) {
      const errMsg = psError(trData, 'unknown error')
      return NextResponse.json({ error: `Payout failed: ${errMsg}. Money remains in vault — retry in a moment.` }, { status: 502 })
    }

    // 3. Mark released + record transfer proof
    await prisma.escrow.update({
      where: { id: escrow.id },
      data: {
        status: 'released',
        releasedAt: new Date(),
        metadata: { ...meta, payout: { ...payout, cleanName, transferRef: trData.data.transfer_code || trData.data.id, paidAt: new Date().toISOString() } },
      },
    })
    emails.payout(meta.sellerEmail, escrow.title, reference, Number(escrow.amount).toLocaleString('en-NG'), trData.data.transfer_code || trData.data.id).catch(() => {})
    return NextResponse.json({ success: true, transfer: trData.data.transfer_code || trData.data.id })
  } catch (e: any) {
    console.error('RELEASE ERROR:', e)
    return NextResponse.json({ error: e.message || 'Release failed' }, { status: 500 })
  }
}
