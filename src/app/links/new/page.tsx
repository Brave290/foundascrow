import { CreateLinkForm } from '@/components/seller/create-link-form'

export default function NewLinkPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <div className="mb-8 text-center">
        <h1 className="font-display text-4xl font-bold text-foreground">
          Create a Payment Link
        </h1>
        <p className="mt-2 text-muted-foreground">
          Generate a secure escrow link in 30 seconds
        </p>
      </div>
      <CreateLinkForm />
    </main>
  )
}
