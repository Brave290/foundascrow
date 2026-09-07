import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { reconcileEscrow } from '@/lib/reconcile'

export const maxDuration = 60

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET
  const auth = req.headers.get('authorization') || ''
  const urlKey = new URL(req.url).searchParams.get('key')
  if (secret && auth !== `Bearer ${secret}` && urlKey !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const since = new Date(Date.now() - 7 * 86400000)
  const pendings = await prisma.escrow.findMany({
    where: { status: 'pending', createdAt: { gte: since } },
    take: 50,
  })

  const results: any[] = []
  for (const e of pendings) {
    const out = await reconcileEscrow(e.reference).catch(() => null)
    if (out?.funded) results.push({ reference: e.reference, via: out.via })
  }
  return NextResponse.json({ checked: pendings.length, funded: results.length, results })
}
