import type { Metadata } from 'next'
import { Prata, Montserrat } from 'next/font/google'
import './globals.css'
import { Navbar } from '@/components/site/navbar'
import { Footer } from '@/components/site/footer'

const prata = Prata({ subsets: ['latin'], weight: '400', variable: '--font-prata' })
const montserrat = Montserrat({ subsets: ['latin'], variable: '--font-montserrat' })

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL || 'http://127.0.0.1:3000'),
  title: {
    default: 'FoundaScrow — Buy and sell without fear',
    template: '%s | FoundaScrow',
  },
  description:
    'FoundaScrow holds the buyer’s money in a secure vault and releases it to the seller only when delivery is confirmed. Payment links for WhatsApp, Instagram and everywhere Nigerians trade.',
  keywords: [
    'escrow Nigeria',
    'secure payment link',
    'buy and sell safely Nigeria',
    'WhatsApp escrow',
    'FoundaScrow',
  ],
  openGraph: {
    type: 'website',
    siteName: 'FoundaScrow',
    title: 'FoundaScrow — Buy and sell without fear',
    description: 'Money waits in a vault until delivery is confirmed.',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'FoundaScrow' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FoundaScrow — Buy and sell without fear',
    description: 'Money waits in a vault until delivery is confirmed.',
    images: ['/opengraph-image'],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${prata.variable} ${montserrat.variable} font-sans antialiased`}>
        <Navbar />
        <div className="pt-16">{children}</div>
        <Footer />
      </body>
    </html>
  )
}
