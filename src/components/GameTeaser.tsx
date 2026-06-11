// Homepage teaser for the "Catch the Hearts" game — a second discovery
// surface besides the nav link. The game itself lives at /game (standalone
// full-screen page; a tap arena can't share the scrolling single-page layout).

import { GAME } from '@/lib/constants'
import Divider from '@/components/Divider'

export default function GameTeaser() {
  return (
    <section id="game-teaser" className="bg-blush py-24">
      <div className="mx-auto max-w-2xl px-4 text-center">
        <h2 className="mb-3 font-script text-5xl text-accent">{GAME.teaser.heading}</h2>
        <Divider />
        <p className="mb-3 font-body text-lg leading-relaxed text-accent/80">
          {GAME.teaser.copy}
        </p>
        <p className="mb-8 font-body text-sm italic text-[#9E5F4E]">{GAME.prizeNote}</p>
        <a
          href="/game"
          className="inline-block border-2 border-accent px-12 py-4 font-body text-sm uppercase tracking-[0.3em] text-accent transition-colors hover:bg-accent hover:text-white"
        >
          {GAME.teaser.cta}
        </a>
      </div>
    </section>
  )
}
