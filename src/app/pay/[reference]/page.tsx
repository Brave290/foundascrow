import { PaymentFlow } from '@/components/buyer/payment-flow'

export default async function PayPage({
  params,
}: {
  params: Promise<{ reference: string }>
}) {
  const { reference } = await params
  
  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <PaymentFlow reference={reference} />
    </main>
  )
}
