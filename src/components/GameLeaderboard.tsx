'use client'

// Top-N leaderboard for "Catch the Hearts", read from the published Game
// Scores CSV (gameSheet.ts). The published CSV lags writes by ~5 minutes, so a
// just-submitted score is merged in optimistically via the `optimistic` prop;
// `refreshKey` bumps trigger a background refetch after each submit. Hidden
// entirely while the read side is unconfigured.

import { useEffect, useState } from 'react'
import { GAME } from '@/lib/constants'
import { gameReadEnabled, loadLeaderboard, type ScoreEntry } from '@/lib/gameSheet'

type Status = 'off' | 'loading' | 'live' | 'empty' | 'error'

/** Best-score-per-name merge of the optimistic entry into the fetched list. */
function mergeOptimistic(entries: ScoreEntry[], optimistic: ScoreEntry | null): ScoreEntry[] {
  if (!optimistic) return entries
  const key = optimistic.name.toLowerCase()
  const existing = entries.find((e) => e.name.toLowerCase() === key)
  if (existing && existing.score >= optimistic.score) return entries
  const merged = entries.filter((e) => e.name.toLowerCase() !== key)
  merged.push(optimistic)
  return merged.sort((a, b) => b.score - a.score)
}

export default function GameLeaderboard({
  optimistic,
  refreshKey,
}: {
  optimistic: ScoreEntry | null
  refreshKey: number
}) {
  const [status, setStatus] = useState<Status>(gameReadEnabled() ? 'loading' : 'off')
  const [entries, setEntries] = useState<ScoreEntry[]>([])

  useEffect(() => {
    if (!gameReadEnabled()) return
    let cancelled = false
    loadLeaderboard().then((list) => {
      if (cancelled) return
      setEntries(list)
      // fetchCsvSafe returns [] for both "empty sheet" and "fetch failed" —
      // either way there is nothing to rank, so render the empty state rather
      // than an alarming error for a fresh sheet.
      setStatus(list.length > 0 ? 'live' : 'empty')
    })
    return () => {
      cancelled = true
    }
  }, [refreshKey])

  if (status === 'off') return null

  const shown = mergeOptimistic(entries, optimistic).slice(0, GAME.topN)

  return (
    <section className="mt-12 text-left" aria-label={GAME.leaderboardTitle}>
      <h2 className="text-center font-script text-4xl text-accent">{GAME.leaderboardTitle}</h2>

      {status === 'loading' ? (
        <p className="mt-4 text-center font-body text-sm text-[#9E5F4E]">Loading…</p>
      ) : shown.length === 0 ? (
        <p className="mt-4 text-center font-body text-sm italic text-[#8A6A5E]">
          {GAME.leaderboardEmpty}
        </p>
      ) : (
        <ol className="mt-5 space-y-2">
          {shown.map((entry, i) => (
            <li
              key={entry.name.toLowerCase()}
              className={`flex items-center gap-3 border px-4 py-3 ${
                i === 0
                  ? 'border-accent bg-mauve/20'
                  : 'border-[#D8B4A6] bg-white/40'
              }`}
            >
              <span className="w-6 shrink-0 text-right font-body text-sm text-[#9E5F4E]">
                {i + 1}.
              </span>
              <span className="min-w-0 flex-1 truncate font-body text-base text-accent">
                {entry.name}
                {i === 0 && (
                  <span className="ml-2 font-body text-xs italic text-[#9E5F4E]">
                    {GAME.winnerNote}
                  </span>
                )}
              </span>
              <span className="shrink-0 font-body text-base text-accent">{entry.score}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
