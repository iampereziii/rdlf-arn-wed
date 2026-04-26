'use client'

import { useEffect, useState } from 'react'
import { WEDDING } from '@/lib/constants'

const NAV_LINKS = [
  { label: 'Gallery', href: '#gallery' },
  { label: 'Details', href: '#details' },
  { label: 'Dress Code', href: '#dresscode' },
  { label: 'Entourage', href: '#entourage' },
  { label: 'Gifts', href: '#gifts' },
  { label: 'RSVP', href: '#rsvp' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const textColor = scrolled ? 'text-accent' : 'text-white'
  const hoverColor = scrolled ? 'hover:text-mauve' : 'hover:text-blush/80'

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-blush shadow-sm' : 'bg-transparent'
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <a href="#home" className={`font-script text-xl transition-colors ${textColor}`}>
          {WEDDING.groomName} &amp; {WEDDING.brideName}
        </a>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-6">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={`font-body text-xs tracking-widest uppercase transition-colors ${textColor} ${hoverColor}`}
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Mobile hamburger */}
        <button
          className={`md:hidden transition-colors ${textColor}`}
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Toggle navigation menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {menuOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="md:hidden bg-blush border-t border-mauve/30">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="block px-6 py-3 font-body text-xs tracking-widest uppercase text-accent hover:bg-mauve/10"
            >
              {link.label}
            </a>
          ))}
        </div>
      )}
    </nav>
  )
}
