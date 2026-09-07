import type { Metadata } from 'next'
import { Sora, Manrope } from 'next/font/google'
import './globals.css'
import { Navbar } from '@/components/site/navbar'
import { Footer } from '@/components/site/footer'
import { Preloader } from '@/components/site/preloader'
import { BackButton } from '@/components/site/back-button'

const sora = Sora({ subsets: ['latin'], weight: ['600', '700', '800'], variable: '--font-sora' })
const manrope = Manrope({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-manrope' })

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL || 'http://127.0.0.1:3000'),
  title: {
    default: 'FoundaScrow — Buy and sell without fear',
    template: '%s | FoundaScrow',
  },
  description:
    'FoundaScrow holds the buyer’s money in a secure vault and releases it to the seller only when delivery is confirmed. Payment links for WhatsApp, Instagram and everywhere Nigerians trade.',
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
      <body className={`${sora.variable} ${manrope.variable} font-sans antialiased`}>
        <Preloader />
        <Navbar />
        <BackButton />
        <div className="pt-16">{children}</div>
        <Footer />
      </body>
    </html>
  )
}
