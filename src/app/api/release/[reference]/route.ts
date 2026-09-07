import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

const API_URL = process.env.FOUNDA_API_URL!
const API_KEY = process.env.FOUNDA_PLATFORM_KEY || process.env.FOUNDA_API_KEY || ''

export async function POST(_req: Request, { params }: { params: Promise<{ reference: string }> }) {
  if (!API_KEY) return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
  try {
    const { reference } = await params
    const escrow = await prisma.escrow.findFirst({ where: { reference } })
    if (!escrow) return NextResponse.json({ error: 'Escrow not found' }, { status: 404 })

    const res = await fetch(`${API_URL}/escrows/${escrow.id}/release`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
    })
    const data = await res.json().catch(() => null)
    if (!res.ok) return NextResponse.json({ error: data?.error || 'Release failed' }, { status: res.status })
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Release failed' }, { status: 500 })
  }
}
