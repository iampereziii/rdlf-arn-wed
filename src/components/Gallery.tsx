'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { PHOTOS, WEDDING } from '@/lib/constants'
import Divider from '@/components/Divider'

export default function Gallery() {
  // null = closed; otherwise the index into PHOTOS currently shown.
  const [index, setIndex] = useState<number | null>(null)
  const touchStartX = useRef<number | null>(null)

  const open = index !== null

  const close = useCallback(() => setIndex(null), [])
  const next = useCallback(
    () => setIndex((i) => (i === null ? i : (i + 1) % PHOTOS.length)),
    []
  )
  const prev = useCallback(
    () => setIndex((i) => (i === null ? i : (i - 1 + PHOTOS.length) % PHOTOS.length)),
    []
  )

  // Keyboard control + body scroll lock while the lightbox is open.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      else if (e.key === 'ArrowRight') next()
      else if (e.key === 'ArrowLeft') prev()
    }
    window.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [open, close, next, prev])

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    if (dx > 50) prev()
    else if (dx < -50) next()
    touchStartX.current = null
  }

  return (
    <section id="gallery" className="py-24 bg-blush">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="font-script text-5xl text-accent text-center mb-3">Our Story</h2>
        <Divider />
        <p className="font-body text-xs tracking-[0.3em] uppercase text-accent/60 text-center mb-12">
          A Glimpse Before Forever
        </p>

        {PHOTOS.length === 0 ? (
          <p className="font-body text-center text-accent/50 italic py-12">
            Photos coming soon.
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3">
            {PHOTOS.map((filename, i) => (
              <button
                key={filename}
                onClick={() => setIndex(i)}
                className="relative overflow-hidden group aspect-square focus:outline-none focus:ring-2 focus:ring-accent"
                aria-label={`View photo ${i + 1}`}
              >
                <Image
                  src={`/photos/${filename}`}
                  alt={`Prenup photo ${i + 1}`}
                  fill
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                />
                {/* Subtle darken on hover for depth */}
                <div className="absolute inset-0 bg-accent/0 group-hover:bg-accent/10 transition-colors duration-500" />
              </button>
            ))}
          </div>
        )}

        <div className="flex justify-center mt-10">
          <a
            href={WEDDING.pixiesetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 border border-accent text-accent font-body text-sm tracking-widest uppercase px-8 py-3 transition-all duration-300 hover:bg-accent hover:text-blush hover:gap-3 hover:scale-[1.02] active:scale-95 focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <span>View Full Gallery</span>
            <span aria-hidden="true">&rarr;</span>
          </a>
        </div>
      </div>

      {/* Lightbox */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={close}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          role="dialog"
          aria-modal="true"
          aria-label="Photo viewer"
        >
          <div
            className="relative w-full max-w-4xl"
            style={{ height: 'min(90vh, 700px)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              key={index}
              src={`/photos/${PHOTOS[index!]}`}
              alt={`Prenup photo ${index! + 1}`}
              fill
              className="object-contain animate-fade-in"
            />
          </div>

          {/* Counter */}
          <p className="absolute top-5 left-1/2 -translate-x-1/2 text-white/70 font-body text-sm tracking-[0.3em]">
            {index! + 1} / {PHOTOS.length}
          </p>

          {/* Close */}
          <button
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
            onClick={(e) => {
              e.stopPropagation()
              close()
            }}
            aria-label="Close photo"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          {/* Prev / Next — hidden when there's only one photo */}
          {PHOTOS.length > 1 && (
            <>
              <button
                className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white hover:-translate-x-0.5 transition-all"
                onClick={(e) => {
                  e.stopPropagation()
                  prev()
                }}
                aria-label="Previous photo"
              >
                <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white hover:translate-x-0.5 transition-all"
                onClick={(e) => {
                  e.stopPropagation()
                  next()
                }}
                aria-label="Next photo"
              >
                <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}
        </div>
      )}
    </section>
  )
}
