import type { Metadata } from 'next'
import { Pinyon_Script, Cormorant_Garamond } from 'next/font/google'
import './globals.css'

const pinyonScript = Pinyon_Script({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-pinyon-script',
  display: 'swap',
})

const cormorantGaramond = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant-garamond',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: 'Rodolfo & Ariane — June 13, 2026',
  description:
    'Join us in celebrating the wedding of Rodolfo Perez III and Ariane Domingo on June 13, 2026 in Santa Maria, Bulacan.',
  openGraph: {
    title: 'Rodolfo III & Ariane — June 13, 2026',
    description:
      'Join us in celebrating our wedding on June 13, 2026 in Santa Maria, Bulacan.',
    images: [
      {
        url: '/photos/DSC04050.jpg',
        width: 7008,
        height: 4672,
        alt: 'Rodolfo III and Ariane',
      },
    ],
    type: 'website',
    locale: 'en_US',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${pinyonScript.variable} ${cormorantGaramond.variable}`}>
      <body className="font-body bg-blush">{children}</body>
    </html>
  )
}
