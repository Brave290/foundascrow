import { NextResponse } from 'next/server'

const FOUNDA_API_URL = process.env.FOUNDA_API_URL!
const FOUNDA_API_KEY = process.env.FOUNDA_API_KEY!

export async function POST(request: Request) {
  try {
    const { title, amount, currency, sellerEmail } = await request.json()
    
    if (!title || !amount || !sellerEmail) {
      return NextResponse.json(
        { error: 'Title, amount, and seller email are required' },
        { status: 400 }
      )
    }
    
    // Call FoundaPay API to create escrow
    const res = await fetch(`${FOUNDA_API_URL}/escrows`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FOUNDA_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
        amount,
        currency: currency || 'NGN',
        metadata: {
          sellerEmail,
          source: 'foundascrow',
        },
      }),
    })
    
    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: 'API error' }))
      return NextResponse.json(
        { error: error.error || 'Failed to create escrow' },
        { status: res.status }
      )
    }
    
    const escrow = await res.json()
    
    return NextResponse.json({
      reference: escrow.reference,
      id: escrow.id,
    })
  } catch (error: any) {
    console.error('Create link error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create link' },
      { status: 500 }
    )
  }
}
