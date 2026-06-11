import type { Metadata } from 'next'
import Game from '@/components/Game'
import { GAME } from '@/lib/constants'

export const metadata: Metadata = {
  title: `${GAME.title} — Jun & Ariane`,
  // Reached via the site nav / shared link, not search engines.
  robots: { index: false, follow: false },
}

export default function GamePage() {
  return <Game />
}
