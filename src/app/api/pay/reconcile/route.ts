import { NextResponse } from 'next/server'
import { reconcileEscrow } from '@/lib/reconcile'

export async function POST(request: Request) {
  try {
    const { reference } = await request.json()
    if (!reference) return NextResponse.json({ error: 'Reference required' }, { status: 400 })
    const out = await reconcileEscrow(reference)
    return NextResponse.json(out)
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Reconcile failed' }, { status: 500 })
  }
}
