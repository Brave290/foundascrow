import { TrackingTimeline } from '@/components/buyer/tracking-timeline'

export default async function TrackPage({ params }: { params: Promise<{ reference: string }> }) {
  const { reference } = await params
  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <TrackingTimeline reference={reference} />
    </main>
  )
}
