import Link from 'next/link'
import { ShieldCheck, PackageCheck, Undo2 } from 'lucide-react'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-16">
      <div className="flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.svg" alt="FoundaScrow" className="size-12" />
        <p className="font-display text-xl text-foreground">FoundaScrow</p>
      </div>

      <h1 className="mt-10 max-w-2xl text-center font-display text-4xl leading-tight text-foreground sm:text-5xl">
        Buy and sell without fear.
      </h1>
      <p className="mt-4 max-w-xl text-center text-sm leading-relaxed text-muted-foreground">
        The buyer pays into a secure vault. The seller ships. The money moves
        only when the buyer confirms delivery. No stories, no losses.
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/links/new"
          className="rounded-full bg-primary px-6 py-3 text-center text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5"
        >
          I am a seller — create payment link
        </Link>
        <Link
          href="/track"
          className="rounded-full border border-border bg-card px-6 py-3 text-center text-sm font-semibold text-foreground transition-transform hover:-translate-y-0.5"
        >
          I am a buyer — track my payment
        </Link>
      </div>

      <div className="mt-14 grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { icon: ShieldCheck, title: 'Held in vault', text: 'Money is locked until delivery.' },
          { icon: PackageCheck, title: 'Released on confirm', text: 'Seller paid when buyer says "I got it".' },
          { icon: Undo2, title: 'Refund if it goes south', text: 'Disputes return money to the buyer.' },
        ].map((f) => (
          <div key={f.title} className="rounded-xl border border-border bg-card p-4 text-center">
            <f.icon className="mx-auto size-5 text-primary" />
            <p className="mt-2 text-sm font-semibold text-foreground">{f.title}</p>
            <p className="mt-1 text-xs text-muted-foreground">{f.text}</p>
          </div>
        ))}
      </div>
    </main>
  )
}
