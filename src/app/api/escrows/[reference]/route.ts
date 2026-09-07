import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(_req: Request, { params }: { params: Promise<{ reference: string }> }) {
  try {
    const { reference } = await params
    const escrow = await prisma.escrow.findFirst({ where: { reference } })
    if (!escrow) return NextResponse.json({ error: 'Escrow not found' }, { status: 404 })

    return NextResponse.json({
      reference: escrow.reference,
      title: escrow.title,
      amount: String(escrow.amount),
      fee: String(escrow.fee),
      status: escrow.status,
      createdAt: String(escrow.createdAt),
      metadata: escrow.metadata ?? null,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Lookup failed' }, { status: 500 })
  }
}
