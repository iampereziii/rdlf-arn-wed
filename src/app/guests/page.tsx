import type { Metadata } from 'next'
import GuestList from '@/components/GuestList'

export const metadata: Metadata = {
  title: 'Guest List — Jun & Ariane',
  // Internal page — keep it out of search engines.
  robots: { index: false, follow: false },
}

export default function GuestsPage() {
  return <GuestList />
}
