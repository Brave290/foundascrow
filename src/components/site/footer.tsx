import Link from 'next/link'

const product = [
  { href: '/links/new', label: 'Create payment link' },
  { href: '/track', label: 'Track a payment' },
]

const company = [
  { href: 'https://foundapay.vercel.app', label: 'FoundaPay API', external: true },
  { href: 'https://foundapay.vercel.app/docs', label: 'Documentation', external: true },
  { href: 'https://foundapay.vercel.app/verify', label: 'Verify an escrow', external: true },
]

const legal = [
  { href: 'https://foundapay.vercel.app/terms', label: 'Terms', external: true },
  { href: 'https://foundapay.vercel.app/privacy', label: 'Privacy', external: true },
]

export function Footer() {
  return (
    <footer className="mt-20 border-t border-border bg-card/40">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="" className="size-9 rounded-full" />
              <span className="font-display text-lg text-foreground">FoundaScrow</span>
            </Link>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
              Buy and sell without fear. Money waits in a vault until delivery is confirmed.
            </p>
          </div>

          {/* Product */}
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Product
            </p>
            <ul className="mt-3 space-y-2">
              {product.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              FoundaPay
            </p>
            <ul className="mt-3 space-y-2">
              {company.map((l) => (
                <li key={l.href}>
                  <a
                    href={l.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Legal
            </p>
            <ul className="mt-3 space-y-2">
              {legal.map((l) => (
                <li key={l.href}>
                  <a
                    href={l.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 flex flex-col items-start justify-between gap-4 border-t border-border pt-6 sm:flex-row sm:items-center">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} FoundaScrow · A product of Founda Technologies
          </p>
          <a
            href="https://foundapay.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            Powered by the FoundaPay escrow infrastructure →
          </a>
        </div>
      </div>
    </footer>
  )
}
