import { NextResponse } from 'next/server'

const FOUNDA_API_URL = process.env.FOUNDA_API_URL!
const FOUNDA_API_KEY = process.env.FOUNDA_API_KEY!

export async function GET(
  request: Request,
  { params }: { params: Promise<{ reference: string }> }
) {
  try {
    const { reference } = await params
    
    const res = await fetch(`${FOUNDA_API_URL}/escrows/${reference}`, {
      headers: {
        'Authorization': `Bearer ${FOUNDA_API_KEY}`,
      },
    })
    
    if (!res.ok) {
      return NextResponse.json({ error: 'Escrow not found' }, { status: 404 })
    }
    
    return NextResponse.json(await res.json())
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
