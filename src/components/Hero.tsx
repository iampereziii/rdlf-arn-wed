import Image from 'next/image'
import { WEDDING } from '@/lib/constants'

export default function Hero() {
  return (
    <section
      id="home"
      className="relative h-screen min-h-[600px] flex items-center justify-center overflow-hidden"
    >
      {/* Base layer: photo always renders first — no black flash while video loads */}
      {WEDDING.heroPhoto ? (
        <Image
          src={`/photos/${WEDDING.heroPhoto}`}
          alt={`${WEDDING.brideName} and ${WEDDING.groomName}`}
          fill
          className="object-cover"
          priority
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-b from-accent/60 to-mauve/60" />
      )}
      {/* Video layer — sits on top of photo, covers it once buffered */}
      {WEDDING.heroVideo && (
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src={`/video/${WEDDING.heroVideo}`} type="video/mp4" />
        </video>
      )}

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/35" />

      {/* Content */}
      <div className="relative z-10 text-center text-white px-4">
        <p className="font-body text-xs tracking-[0.4em] uppercase mb-6 opacity-90">
          The Wedding of
        </p>
        <h1 className="font-script leading-none">
          <span className="block text-6xl sm:text-7xl md:text-8xl">{WEDDING.groomName}</span>
          <span className="block text-3xl sm:text-4xl my-3 opacity-80">&amp;</span>
          <span className="block text-6xl sm:text-7xl md:text-8xl">{WEDDING.brideName}</span>
        </h1>
        <p className="font-body text-sm sm:text-base tracking-[0.3em] uppercase mt-8 opacity-90">
          {WEDDING.date}
        </p>
      </div>

      {/* Scroll cue */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/70 animate-bounce">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </section>
  )
}
