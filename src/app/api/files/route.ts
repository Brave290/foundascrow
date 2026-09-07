import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { signedUrl } from '@/lib/storage'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const reference = url.searchParams.get('reference') || ''
    const path = url.searchParams.get('path') || ''
    if (!reference || !path) return NextResponse.json({ error: 'reference and path are required' }, { status: 400 })
    if (!path.startsWith(reference + '/')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const escrow = await prisma.escrow.findFirst({ where: { reference } })
    if (!escrow) return NextResponse.json({ error: 'Escrow not found' }, { status: 404 })
    if (escrow.status !== 'held' && escrow.status !== 'released') {
      return NextResponse.json({ error: 'Files unlock after payment hits the vault.' }, { status: 403 })
    }
    return NextResponse.json({ url: await signedUrl(path) })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Download failed' }, { status: 500 })
  }
}
