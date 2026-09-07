import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { LinkShareCard } from '@/components/seller/link-share-card'

export const dynamic = 'force-dynamic'

export default async function LinkPage({ params }: { params: Promise<{ reference: string }> }) {
  const { reference } = await params
  const escrow = await prisma.escrow.findFirst({ where: { reference } })
  if (!escrow) notFound()
  const meta: any = escrow.metadata ?? {}
  return (
    <main className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl">
        <div className="mb-8 text-center">
          <h1 className="font-display text-3xl font-bold text-foreground">Your payment link is ready</h1>
          <p className="mt-2 text-sm text-muted-foreground">Share it with your buyer. Attach delivery files below.</p>
        </div>
        <LinkShareCard reference={reference} title={escrow.title} amount={String(escrow.amount)} files={meta.files ?? []} />
      </div>
    </main>
  )
}
