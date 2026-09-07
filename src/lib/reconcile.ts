import { prisma } from '@/lib/db'
import { emails } from '@/lib/email'

const PS_KEY = process.env.PAYSTACK_SECRET_KEY || ''
const ngn = (n: number) => n.toLocaleString('en-NG')

async function verifyTxn(ref: string): Promise<any | null> {
  try {
    const ps = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(ref)}`, {
      headers: { Authorization: `Bearer ${PS_KEY}` },
    })
    const d = await ps.json().catch(() => null)
    return d?.data ?? null
  } catch {
    return null
  }
}

function metaOf(txn: any): any {
  let m = txn?.metadata
  if (typeof m === 'string') {
    try { m = JSON.parse(m) } catch { m = null }
  }
  return m ?? {}
}

export async function reconcileEscrow(reference: string): Promise<{ status: string; funded: boolean; via?: string }> {
  const escrow = await prisma.escrow.findFirst({ where: { reference } })
  if (!escrow) return { status: 'not_found', funded: false }
  if (escrow.status !== 'pending') return { status: escrow.status, funded: false }

  const meta: any = escrow.metadata ?? {}

  // Candidate Paystack refs from every recorded attempt
  const candidates: string[] = []
  if (meta.paystackRef) candidates.push(meta.paystackRef)
  if (meta.lastAttempt?.psRef) candidates.push(meta.lastAttempt.psRef)
  for (const a of meta.paymentAttempts ?? []) if (a?.psRef) candidates.push(a.psRef)

  let successTxn: any = null
  for (const c of [...new Set(candidates)]) {
    const txn = await verifyTxn(c)
    if (txn?.status === 'success') { successTxn = txn; break }
  }

  // Fallback: scan Paystack's recent successful charges for this escrow
  if (!successTxn) {
    try {
      const ps = await fetch('https://api.paystack.co/transaction?perPage=100&page=1&status=success', {
        headers: { Authorization: `Bearer ${PS_KEY}` },
      })
      const d = await ps.json().catch(() => null)
      const cutoff = Date.now() - 72 * 3600 * 1000
      for (const txn of d?.data ?? []) {
        if (new Date(txn.paid_at || txn.createdAt).getTime() < cutoff) continue
        const m = metaOf(txn)
        if (m.source === 'foundascrow' && (m.escrowReference === reference || String(txn.reference).startsWith(reference + '-'))) {
          if (txn.status === 'success') { successTxn = txn; break }
        }
      }
    } catch {}
  }

  if (!successTxn) return { status: 'pending', funded: false }

  // Fund EXACTLY once (updateMany guards the race)
  const buyerEmail = meta.buyerEmail || successTxn.customer?.email
  const upd = await prisma.escrow.updateMany({
    where: { id: escrow.id, status: 'pending' },
    data: {
      status: 'held',
      fundedAt: new Date(),
      metadata: { ...meta, buyerEmail, fundedVia: 'reconcile', paystackRef: successTxn.reference },
    },
  })
  if (upd.count === 1) {
    const price = Number(escrow.amount)
    const fee = Number(escrow.fee) > 0 ? Number(escrow.fee) : Math.round(price * 0.02)
    emails.receipt(buyerEmail, escrow.title, escrow.reference, ngn(price + fee)).catch(() => {})
    emails.funded(meta.sellerEmail, escrow.title, escrow.reference).catch(() => {})
  }
  return { status: 'held', funded: true, via: successTxn.reference }
}
