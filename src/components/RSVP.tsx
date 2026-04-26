'use client'

import { useEffect, useState } from 'react'
import { WEDDING } from '@/lib/constants'
import Divider from '@/components/Divider'

export default function RSVP() {
  const [isOpen, setIsOpen] = useState<boolean | null>(null)

  useEffect(() => {
    setIsOpen(new Date() <= WEDDING.rsvpDeadline)
  }, [])

  const rsvpUrl = process.env.NEXT_PUBLIC_RSVP_FORM_URL ?? WEDDING.rsvpUrl

  return (
    <section id="rsvp" className="py-24 bg-accent">
      <div className="max-w-2xl mx-auto px-4 text-center">
        <h2 className="font-script text-5xl text-white mb-3">RSVP</h2>
        <Divider inverted />
        <p className="font-body text-xs tracking-[0.4em] uppercase text-white/60 mb-10">
          Kindly Respond by May 10, 2026
        </p>

        {isOpen === null ? null : isOpen ? (
          <a
            href={rsvpUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block font-body text-sm tracking-[0.3em] uppercase border-2 border-white text-white px-12 py-4 hover:bg-white hover:text-accent transition-colors"
          >
            RSVP Now
          </a>
        ) : (
          <p className="font-body text-white/80 text-xl italic">
            Thank you — RSVP is now closed.
          </p>
        )}

        <p className="font-body text-white/40 text-sm mt-8 tracking-wide">
          {WEDDING.date} · Santa Maria, Bulacan
        </p>
      </div>
    </section>
  )
}
