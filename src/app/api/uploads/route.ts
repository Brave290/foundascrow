import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { uploadToVault } from '@/lib/storage'

export async function POST(req: Request) {
  try {
    const form = await req.formData()
    const file = form.get('file') as File | null
    const reference = String(form.get('reference') || '')
    if (!file || !reference) return NextResponse.json({ error: 'file and reference are required' }, { status: 400 })
    if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: 'Max file size is 10MB' }, { status: 413 })

    const escrow = await prisma.escrow.findFirst({ where: { reference } })
    if (!escrow) return NextResponse.json({ error: 'Escrow not found' }, { status: 404 })
    if (escrow.status !== 'pending') return NextResponse.json({ error: 'Escrow is already funded — files are locked.' }, { status: 409 })

    const buf = Buffer.from(await file.arrayBuffer())
    const path = await uploadToVault(reference, file.name, buf, file.type || 'application/octet-stream')

    const meta: any = escrow.metadata ?? {}
    const files = Array.isArray(meta.files) ? meta.files : []
    files.push({ path, name: file.name, size: file.size, type: file.type || 'application/octet-stream' })
    await prisma.escrow.update({ where: { id: escrow.id }, data: { metadata: { ...meta, files } } })

    return NextResponse.json({ ok: true, file: { name: file.name, size: file.size } })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Upload failed' }, { status: 500 })
  }
}
