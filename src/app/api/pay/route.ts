import { NextResponse } from 'next/server'

const FOUNDA_API_URL = process.env.FOUNDA_API_URL!
const FOUNDA_API_KEY = process.env.FOUNDA_API_KEY!

export async function POST(request: Request) {
  try {
    const { reference, buyerEmail } = await request.json()
    
    if (!reference || !buyerEmail) {
      return NextResponse.json(
        { error: 'Reference and buyer email are required' },
        { status: 400 }
      )
    }
    
    // In production: integrate Paystack checkout here
    // For now: mark escrow as funded
    const res = await fetch(`${FOUNDA_API_URL}/escrows/${reference}/fund`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FOUNDA_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ buyerEmail }),
    })
    
    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: 'Payment failed' }))
      return NextResponse.json({ error: error.error }, { status: res.status })
    }
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
