'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

const links = [
  { href: '/links/new', label: 'Sell' },
  { href: '/track', label: 'Track' },
  { href: 'https://foundapay.vercel.app/docs', label: 'Docs', external: true },
]

export function Navbar() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-40 transition-colors ${
          scrolled ? 'bg-background/80 backdrop-blur-md' : 'bg-transparent'
        }`}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2.5" aria-label="FoundaScrow home">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="" className="size-9 rounded-full" />
              <span className="font-display text-lg text-foreground">FoundaScrow</span>
            </Link>
            
            {/* Founda Technologies badge - slides in */}
            <div
              className={`hidden items-center rounded-full border border-border bg-card px-3 py-1 sm:flex ${
                mounted ? 'animate-slide-in' : 'opacity-0'
              }`}
            >
              <span className="text-[10px] font-medium tracking-wide text-muted-foreground">
                Founda Technologies
              </span>
            </div>
          </div>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
            {links.map((l) =>
              l.external ? (
                <a
                  key={l.href}
                  href={l.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {l.label}
                </a>
              ) : (
                <Link
                  key={l.href}
                  href={l.href}
                  className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {l.label}
                </Link>
              )
            )}
            <Link
              href="/links/new"
              className="ml-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5"
            >
              Create link
            </Link>
          </nav>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            className="relative z-50 inline-flex h-10 w-10 items-center justify-center rounded-md text-foreground md:hidden"
          >
            <span className="relative block h-4 w-5">
              <span
                className={`absolute left-0 h-0.5 w-full bg-current transition-transform ${
                  open ? 'top-1.5 rotate-45' : 'top-0'
                }`}
              />
              <span
                className={`absolute left-0 top-1.5 h-0.5 w-full bg-current transition-opacity ${
                  open ? 'opacity-0' : 'opacity-100'
                }`}
              />
              <span
                className={`absolute left-0 h-0.5 w-full bg-current transition-transform ${
                  open ? 'top-1.5 -rotate-45' : 'top-3'
                }`}
              />
            </span>
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      <div
        className={`fixed inset-0 z-30 bg-background/95 backdrop-blur-md transition-transform md:hidden ${
          open ? 'translate-y-0' : '-translate-y-full'
        }`}
        aria-hidden={!open}
      >
        <nav className="flex h-full flex-col items-center justify-center gap-6 px-6">
          <div className="mb-4 rounded-full border border-border bg-card px-4 py-2">
            <span className="text-xs font-medium tracking-wide text-muted-foreground">
              Founda Technologies
            </span>
          </div>
          {links.map((l) =>
            l.external ? (
              <a
                key={l.href}
                href={l.href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className="font-display text-2xl text-foreground"
              >
                {l.label}
              </a>
            ) : (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="font-display text-2xl text-foreground"
              >
                {l.label}
              </Link>
            )
          )}
          <Link
            href="/links/new"
            onClick={() => setOpen(false)}
            className="mt-4 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
          >
            Create payment link
          </Link>
        </nav>
      </div>
    </>
  )
}
