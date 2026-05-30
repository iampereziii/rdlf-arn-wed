import type { Metadata } from 'next'
import SeatingLookup from '@/components/SeatingLookup'

export const metadata: Metadata = {
  title: 'Find Your Table — Jun & Ariane',
  // Reached via the QR code / shared link, not search engines.
  robots: { index: false, follow: false },
}

export default function FindMyTablePage() {
  return <SeatingLookup />
}
