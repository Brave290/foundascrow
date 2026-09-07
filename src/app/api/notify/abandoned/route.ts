import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { emails } from '@/lib/email'

export async function POST(request: Request) {
  try {
    const { reference, buyerEmail } = await request.json()
    if (!reference || !buyerEmail) return NextResponse.json({ ok: false })
    const escrow = await prisma.escrow.findFirst({ where: { reference } })
    if (!escrow || escrow.status !== 'pending') return NextResponse.json({ ok: false })
    await emails.abandoned(buyerEmail, escrow.title, escrow.reference)
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false })
  }
}
