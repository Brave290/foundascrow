import { NextResponse } from 'next/server'

const PS_KEY = process.env.PAYSTACK_SECRET_KEY || ''

export async function POST(request: Request) {
  try {
    const { bankCode, accountNumber } = await request.json()
    if (!bankCode || !/^\d{10}$/.test(accountNumber || '')) {
      return NextResponse.json({ error: 'Bank code + 10-digit account number required' }, { status: 400 })
    }
    const ps = await fetch(`https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`, {
      headers: { Authorization: `Bearer ${PS_KEY}` },
    })
    const data = await ps.json().catch(() => null)
    if (!ps.ok || !data?.data?.account_name) return NextResponse.json({ error: data?.message || 'Could not resolve account' }, { status: 404 })
    return NextResponse.json({ accountName: data.data.account_name })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Resolve failed' }, { status: 500 })
  }
}
