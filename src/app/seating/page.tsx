import type { Metadata } from 'next'
import SeatingChart from '@/components/SeatingChart'

export const metadata: Metadata = {
  title: 'Seating Chart — Jun & Ariane',
  // Internal admin page — keep it out of search engines.
  robots: { index: false, follow: false },
}

export default function SeatingPage() {
  return <SeatingChart />
}
