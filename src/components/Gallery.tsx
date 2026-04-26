'use client'

import { useState } from 'react'
import Image from 'next/image'
import { PHOTOS } from '@/lib/constants'
import Divider from '@/components/Divider'

export default function Gallery() {
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null)

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
                onClick={() => setLightboxSrc(`/photos/${filename}`)}
                className="relative aspect-square overflow-hidden group focus:outline-none focus:ring-2 focus:ring-accent"
                aria-label={`View photo ${i + 1}`}
              >
                <Image
                  src={`/photos/${filename}`}
                  alt={`Prenup photo ${i + 1}`}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxSrc && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
          onClick={() => setLightboxSrc(null)}
        >
          <div className="relative w-full max-w-4xl" style={{ height: 'min(90vh, 700px)' }}>
            <Image
              src={lightboxSrc}
              alt="Prenup photo"
              fill
              className="object-contain"
            />
          </div>
          <button
            className="absolute top-4 right-4 text-white/80 hover:text-white"
            onClick={() => setLightboxSrc(null)}
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
        </div>
      )}
    </section>
  )
}
