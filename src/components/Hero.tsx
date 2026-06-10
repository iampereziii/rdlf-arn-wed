import Image from 'next/image'
import { WEDDING } from '@/lib/constants'

export default function Hero() {
  return (
    <section
      id="home"
      className="relative h-screen min-h-[600px] flex items-center justify-center overflow-hidden"
    >
      {/* Base layer: photo always renders first — no black flash while video loads.
          Slow Ken Burns scale gives the still a cinematic, living feel. */}
      {WEDDING.heroPhoto ? (
        <Image
          src={`/photos/${WEDDING.heroPhoto}`}
          alt={`${WEDDING.brideName} and ${WEDDING.groomName}`}
          fill
          className="object-cover animate-ken-burns"
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
          className="absolute inset-0 w-full h-full object-cover animate-ken-burns"
        >
          <source src={`/video/${WEDDING.heroVideo}`} type="video/mp4" />
        </video>
      )}

      {/* Overlay — gradient deepens toward the edges for a soft cinematic vignette */}
      <div className="absolute inset-0 bg-black/35" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20" />

      {/* Content — staggered entrance reveal on load */}
      <div className="relative z-10 text-center text-white px-4">
        <p
          className="font-body text-xs tracking-[0.4em] uppercase mb-6 opacity-90 animate-fade-rise"
          style={{ animationDelay: '0.2s' }}
        >
          The Wedding of
        </p>
        <h1 className="font-script leading-none">
          <span
            className="block text-6xl sm:text-7xl md:text-8xl animate-fade-rise"
            style={{ animationDelay: '0.45s' }}
          >
            {WEDDING.groomName}
          </span>
          <span
            className="block text-3xl sm:text-4xl my-3 opacity-80 animate-fade-rise"
            style={{ animationDelay: '0.7s' }}
          >
            &amp;
          </span>
          <span
            className="block text-6xl sm:text-7xl md:text-8xl animate-fade-rise"
            style={{ animationDelay: '0.95s' }}
          >
            {WEDDING.brideName}
          </span>
        </h1>
        <p
          className="font-body text-sm sm:text-base tracking-[0.3em] uppercase mt-8 opacity-90 animate-fade-rise"
          style={{ animationDelay: '1.25s' }}
        >
          {WEDDING.date}
        </p>
      </div>

      {/* Scroll cue — fades in after the name reveal settles */}
      <div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/70 opacity-0 [animation:fade-in_1s_ease-out_1.8s_forwards,bounce_1s_infinite_1.8s]"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </section>
  )
}
