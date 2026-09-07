import { NextResponse } from 'next/server'

const PS_KEY = process.env.PAYSTACK_SECRET_KEY || ''
let cache: { at: number; banks: any[] } | null = null

export async function GET() {
  if (cache && Date.now() - cache.at < 86_400_000) return NextResponse.json({ banks: cache.banks })
  const ps = await fetch('https://api.paystack.co/bank', { headers: { Authorization: `Bearer ${PS_KEY}` } })
  const data = await ps.json().catch(() => null)
  const banks = (data?.data ?? [])
    .filter((b: any) => b.currency === 'NGN')
    .map((b: any) => ({ code: b.code, name: b.name }))
    .sort((a: any, b: any) => a.name.localeCompare(b.name))
  cache = { at: Date.now(), banks }
  return NextResponse.json({ banks })
}
