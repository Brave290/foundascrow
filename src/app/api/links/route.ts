import { NextResponse } from 'next/server'

const API_URL = process.env.FOUNDA_API_URL!
const API_KEY = process.env.FOUNDA_PLATFORM_KEY || process.env.FOUNDA_API_KEY || ''

function genRef(): string {
  return 'ORD-' + Math.random().toString(36).slice(2, 8).toUpperCase()
}

export async function POST(request: Request) {
  if (!API_KEY) return NextResponse.json({ error: 'Server misconfigured: missing platform key' }, { status: 500 })
  try {
    const { title, amount, currency, sellerEmail, itemType, itemKind, deliveryDetails, payout } = await request.json()
    if (!title || !amount || !sellerEmail) return NextResponse.json({ error: 'Title, amount and seller email are required' }, { status: 400 })

    let data: any = null
    let status = 500
    for (let attempt = 0; attempt < 3; attempt++) {
      const res = await fetch(`${API_URL}/escrows`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reference: genRef(),
          title,
          description: `${title} — sold via FoundaScrow`,
          amount,
          currency: currency || 'NGN',
          buyerEmail: `pending-${Date.now()}@buyers.foundascrow.app`,
          autoReleaseDays: 30,
          metadata: {
            sellerEmail,
            source: 'foundascrow',
            itemType: itemType || 'physical',
            itemKind: itemKind || itemType || 'physical',
            deliveryDetails: deliveryDetails || '',
            payout: payout || null,
          },
        }),
      })
      status = res.status
      data = await res.json().catch(() => null)
      if (res.ok) return NextResponse.json({ reference: data.reference, id: data.id })
      if (res.status !== 409) break
    }
    return NextResponse.json({ error: data?.error || 'Failed to create escrow' }, { status })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to create link' }, { status: 500 })
  }
}
