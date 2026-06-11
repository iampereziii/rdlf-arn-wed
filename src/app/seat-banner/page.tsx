import type { Metadata } from 'next'
import SeatBanner from '@/components/SeatBanner'

export const metadata: Metadata = {
  title: 'Find Your Seat — Jun & Ariane',
  // Venue signage — printed or displayed at the reception, not search engines.
  robots: { index: false, follow: false },
}

export default function SeatBannerPage() {
  return <SeatBanner />
}
