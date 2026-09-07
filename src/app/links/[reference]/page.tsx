import { LinkShareCard } from '@/components/seller/link-share-card'

export default async function LinkPage({
  params,
}: {
  params: Promise<{ reference: string }>
}) {
  const { reference } = await params
  
  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <div className="mb-8 text-center">
        <h1 className="font-display text-3xl font-bold text-foreground">
          Your Payment Link is Ready!
        </h1>
        <p className="mt-2 text-muted-foreground">
          Share this link with your buyer
        </p>
      </div>
      <LinkShareCard reference={reference} />
    </main>
  )
}
