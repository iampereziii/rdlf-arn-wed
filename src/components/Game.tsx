'use client'

// "Catch the Hearts" — full-screen tap/reaction game for guests waiting
// between the ceremony and reception. Standalone page (no Navbar), same
// pattern as SeatingLookup. Hearts fall via the Tailwind `fall` keyframe with
// per-heart inline left/duration; no canvas, no dependencies. Scores append to
// the Game Scores Sheet (gameSheet.ts); best score per name wins the prize.

import { useCallback, useEffect, useRef, useState } from 'react'
import { GAME, WEDDING } from '@/lib/constants'
import {
  gameWriteEnabled,
  submitScore,
  type ScoreEntry,
} from '@/lib/gameSheet'
import GameLeaderboard from '@/components/GameLeaderboard'

type Phase = 'idle' | 'countdown' | 'playing' | 'finished'
type SubmitStatus = 'idle' | 'submitting' | 'submitted' | 'error'

type Heart = {
  id: number
  /** Horizontal position, % of arena width. */
  leftPct: number
  /** Fall duration in seconds — shorter = harder. */
  duration: number
  kind: 'heart' | 'ring'
  points: number
}

// Chance that a spawn is a ring (worth GAME.ringPoints) instead of a heart.
const RING_CHANCE = 0.1
// Difficulty ramp: spawn interval and fall duration shrink linearly over the
// round, clamped at the "max difficulty" values. Tuned for a fast, reflex-led
// round — see feature-brief--faster-game-challenge.
const SPAWN_MS_START = 700
const SPAWN_MS_END = 240
const FALL_S_START = 2.6
const FALL_S_END = 1.1
const COUNTDOWN_TICKS = 3
// Peak difficulty is reached at this fraction of the round (not the final
// second), so the hardest stretch is felt while there's still time on the clock.
const RAMP_COMPLETE_FRACTION = 0.7

const NAME_STORAGE_KEY = 'game-player-name'
const BEST_STORAGE_KEY = 'game-best-score'

/** Linear interpolation across the round's elapsed fraction (0→1). */
function ramp(start: number, end: number, fraction: number): number {
  return start + (end - start) * Math.min(1, Math.max(0, fraction))
}

export default function Game() {
  const [phase, setPhase] = useState<Phase>('idle')
  const [countdown, setCountdown] = useState(COUNTDOWN_TICKS)
  const [score, setScore] = useState(0)
  const [remainingS, setRemainingS] = useState(GAME.durationSeconds)
  const [hearts, setHearts] = useState<Heart[]>([])

  const [name, setName] = useState('')
  const [honeypot, setHoneypot] = useState('')
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>('idle')
  const [personalBest, setPersonalBest] = useState(0)
  // Last successfully submitted score, merged into the leaderboard immediately
  // because the published CSV lags writes by ~5 minutes.
  const [optimistic, setOptimistic] = useState<ScoreEntry | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const nextId = useRef(0)
  const startedAt = useRef(0)
  const endsAt = useRef(0)

  useEffect(() => {
    setName(localStorage.getItem(NAME_STORAGE_KEY) ?? '')
    setPersonalBest(Number(localStorage.getItem(BEST_STORAGE_KEY)) || 0)
  }, [])

  // Lock page scroll while the arena is up (countdown + play) so taps never
  // rubber-band the page on mobile.
  useEffect(() => {
    const active = phase === 'countdown' || phase === 'playing'
    document.body.style.overflow = active ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [phase])

  // Countdown: 3 · 2 · 1 → playing.
  useEffect(() => {
    if (phase !== 'countdown') return
    if (countdown === 0) {
      startedAt.current = Date.now()
      endsAt.current = startedAt.current + GAME.durationSeconds * 1000
      setPhase('playing')
      return
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [phase, countdown])

  // Round timer — derived from endsAt so ticks can't drift the round length.
  useEffect(() => {
    if (phase !== 'playing') return
    const t = setInterval(() => {
      const left = Math.max(0, Math.ceil((endsAt.current - Date.now()) / 1000))
      setRemainingS(left)
      if (left === 0) setPhase('finished')
    }, 200)
    return () => clearInterval(t)
  }, [phase])

  // Spawner: chained timeout whose delay shrinks as the round progresses.
  useEffect(() => {
    if (phase !== 'playing') return
    let timer: ReturnType<typeof setTimeout>
    const spawn = () => {
      const elapsed = Date.now() - startedAt.current
      const fraction =
        elapsed / (GAME.durationSeconds * 1000) / RAMP_COMPLETE_FRACTION
      const isRing = Math.random() < RING_CHANCE
      setHearts((prev) => [
        ...prev,
        {
          id: nextId.current++,
          leftPct: 5 + Math.random() * 85,
          duration: ramp(FALL_S_START, FALL_S_END, fraction),
          kind: isRing ? 'ring' : 'heart',
          points: isRing ? GAME.ringPoints : GAME.heartPoints,
        },
      ])
      timer = setTimeout(spawn, ramp(SPAWN_MS_START, SPAWN_MS_END, fraction))
    }
    spawn()
    return () => clearTimeout(timer)
  }, [phase])

  // Clear leftover hearts once the round ends.
  useEffect(() => {
    if (phase === 'finished') setHearts([])
  }, [phase])

  const startRound = useCallback(() => {
    setScore(0)
    setHearts([])
    setRemainingS(GAME.durationSeconds)
    setCountdown(COUNTDOWN_TICKS)
    setSubmitStatus('idle')
    setHoneypot('')
    setPhase('countdown')
  }, [])

  const catchHeart = useCallback((heart: Heart) => {
    setHearts((prev) => prev.filter((h) => h.id !== heart.id))
    setScore((s) => s + heart.points)
  }, [])

  const missHeart = useCallback((id: number) => {
    setHearts((prev) => prev.filter((h) => h.id !== id))
  }, [])

  const canSubmit = name.trim() !== '' && score > 0

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit || submitStatus === 'submitting') return
    setSubmitStatus('submitting')
    const ok = await submitScore({ name, score, honeypot })
    if (ok) {
      const trimmed = name.trim().replace(/\s+/g, ' ')
      localStorage.setItem(NAME_STORAGE_KEY, trimmed)
      if (score > personalBest) {
        setPersonalBest(score)
        localStorage.setItem(BEST_STORAGE_KEY, String(score))
      }
      setOptimistic((prev) =>
        prev && prev.score > score ? prev : { name: trimmed, score },
      )
      setRefreshKey((k) => k + 1)
      setSubmitStatus('submitted')
    } else {
      setSubmitStatus('error')
    }
  }

  const inArena = phase === 'countdown' || phase === 'playing'

  return (
    <main className="min-h-screen bg-blush px-5 py-16 sm:py-20">
      <div className="mx-auto max-w-md text-center">
        <p className="font-body text-xs uppercase tracking-[0.35em] text-[#9E5F4E]">
          {WEDDING.groomName} &amp; {WEDDING.brideName}
        </p>
        <h1 className="mt-2 font-script text-5xl text-accent sm:text-6xl">{GAME.title}</h1>
        <p className="mt-3 font-body text-base leading-relaxed text-[#8A6A5E]">
          {GAME.tagline}
        </p>

        {phase === 'idle' && (
          <>
            <p className="mt-6 font-body text-base leading-relaxed text-accent/80">
              {GAME.instructions}
            </p>
            <p className="mt-3 font-body text-sm italic text-[#9E5F4E]">{GAME.prizeNote}</p>
            <button
              onClick={startRound}
              className="mt-8 inline-block border-2 border-accent bg-accent px-12 py-4 font-body text-sm uppercase tracking-[0.3em] text-white transition-opacity hover:opacity-90"
            >
              {GAME.playLabel}
            </button>
            {personalBest > 0 && (
              <p className="mt-4 font-body text-sm text-[#8A6A5E]">
                {GAME.yourBestLabel}: <span className="text-accent">{personalBest}</span>
              </p>
            )}
          </>
        )}

        {phase === 'finished' && (
          <div className="mt-8">
            <p className="font-body text-xs uppercase tracking-[0.3em] text-[#9E5F4E]">
              Your score
            </p>
            <p className="font-script text-7xl text-accent">{score}</p>

            {!gameWriteEnabled() ? (
              <p className="mt-4 font-body text-base italic text-[#8A6A5E]">
                {GAME.playOnlyNote}
              </p>
            ) : submitStatus === 'submitted' ? (
              <p className="mt-4 font-body text-base italic text-accent" role="status">
                {GAME.submittedMessage}
              </p>
            ) : (
              <form onSubmit={handleSubmit} className="mt-6 space-y-4 text-left">
                <div>
                  <label htmlFor="game-name" className="sr-only">
                    Your full name
                  </label>
                  <input
                    id="game-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={GAME.namePlaceholder}
                    maxLength={40}
                    required
                    className="w-full border border-[#D8B4A6] bg-white/60 px-4 py-3 font-body text-accent placeholder-[#B29A8F] focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                  <p className="mt-1 font-body text-xs text-[#9E5F4E]">{GAME.nameHint}</p>
                </div>

                {/* Honeypot — hidden from humans; bots that fill it are dropped. */}
                <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
                  <label htmlFor="game-company">Company</label>
                  <input
                    id="game-company"
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    value={honeypot}
                    onChange={(e) => setHoneypot(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  disabled={!canSubmit || submitStatus === 'submitting'}
                  className="w-full border-2 border-accent bg-accent px-12 py-4 font-body text-sm uppercase tracking-[0.3em] text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {submitStatus === 'submitting' ? GAME.submittingLabel : GAME.submitLabel}
                </button>

                {submitStatus === 'error' && (
                  <p className="font-body text-sm text-accent" role="alert">
                    {GAME.submitError}
                  </p>
                )}
              </form>
            )}

            <button
              onClick={startRound}
              className="mt-6 inline-block border-2 border-accent px-10 py-3 font-body text-sm uppercase tracking-[0.3em] text-accent transition-colors hover:bg-accent hover:text-white"
            >
              {GAME.replayLabel}
            </button>
          </div>
        )}

        <GameLeaderboard optimistic={optimistic} refreshKey={refreshKey} />

        <p className="mt-12">
          <a
            href="/"
            className="font-body text-xs uppercase tracking-[0.3em] text-[#9E5F4E] underline-offset-4 hover:underline"
          >
            Back to the invitation
          </a>
        </p>
      </div>

      {/* Arena overlay — full viewport while counting down / playing. */}
      {inArena && (
        <div
          className="fixed inset-0 z-50 select-none overflow-hidden bg-blush"
          style={{ touchAction: 'none' }}
        >
          {/* HUD */}
          <div className="pointer-events-none absolute left-0 right-0 top-0 z-10 flex items-center justify-between px-6 py-4">
            <span className="font-body text-sm uppercase tracking-[0.3em] text-accent">
              {remainingS}s
            </span>
            <span className="font-script text-4xl text-accent">{score}</span>
          </div>

          {phase === 'countdown' && (
            <div className="flex h-full items-center justify-center">
              <span key={countdown} className="animate-tick font-script text-9xl text-accent">
                {countdown > 0 ? countdown : ''}
              </span>
            </div>
          )}

          {phase === 'playing' &&
            hearts.map((heart) => (
              <button
                key={heart.id}
                type="button"
                onPointerDown={() => catchHeart(heart)}
                onAnimationEnd={() => missHeart(heart.id)}
                className="animate-fall absolute -top-0 p-3 text-4xl leading-none"
                style={{
                  left: `${heart.leftPct}%`,
                  animationDuration: `${heart.duration}s`,
                }}
                aria-label={heart.kind === 'ring' ? 'Catch the ring' : 'Catch the heart'}
              >
                {heart.kind === 'ring' ? '💍' : '❤️'}
              </button>
            ))}
        </div>
      )}
    </main>
  )
}
