import { NextResponse } from 'next/server'

const API_URL = process.env.FOUNDA_API_URL!
const API_KEY = process.env.FOUNDA_PLATFORM_KEY || process.env.FOUNDA_API_KEY || ''

export async function POST(request: Request) {
  if (!API_KEY) {
    return NextResponse.json({ error: 'Server misconfigured: missing platform key' }, { status: 500 })
  }
  try {
    const { title, amount, currency, sellerEmail, itemType, deliveryDetails } = await request.json()
    if (!title || !amount || !sellerEmail) {
      return NextResponse.json({ error: 'Title, amount and seller email are required' }, { status: 400 })
    }

    const res = await fetch(`${API_URL}/escrows`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        amount,
        currency: currency || 'NGN',
        metadata: { sellerEmail, source: 'foundascrow', itemType: itemType || 'physical', deliveryDetails: deliveryDetails || '' },
      }),
    })
    const data = await res.json().catch(() => null)
    if (!res.ok) return NextResponse.json({ error: data?.error || 'Failed to create escrow' }, { status: res.status })
    return NextResponse.json({ reference: data.reference, id: data.id })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to create link' }, { status: 500 })
  }
}
