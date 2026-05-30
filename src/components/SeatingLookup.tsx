'use client'

// Guest-facing "find my table" lookup. Public, read-only, no admin gate.
// Reads the published seating Sheet and lets a guest type their name to see
// their table number + tablemates. Search-only — it never renders the full
// chart, and a query must be at least MIN_QUERY chars (so it can't be used to
// enumerate the guest list). On-brand with the wedding's light palette, not the
// admin dark theme.

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  findSeats,
  loadSeatingFromSheet,
  type Assignments,
} from '@/lib/seating'

const MIN_QUERY = 3
// Cap shown matches so a broad query (e.g. a common surname) can't list the
// whole chart; prompt the guest to keep typing instead.
const MAX_RESULTS = 8

type Status = 'loading' | 'live' | 'empty' | 'error'

export default function SeatingLookup() {
  const [status, setStatus] = useState<Status>('loading')
  const [assignments, setAssignments] = useState<Assignments>({})
  const [query, setQuery] = useState('')

  const load = useCallback(async () => {
    setStatus('loading')
    try {
      const { assignments } = await loadSeatingFromSheet()
      setAssignments(assignments)
      setStatus(Object.keys(assignments).length > 0 ? 'live' : 'empty')
    } catch {
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const trimmed = query.trim()
  const results = useMemo(
    () => findSeats(trimmed, assignments, MIN_QUERY),
    [trimmed, assignments],
  )
  const shown = results.slice(0, MAX_RESULTS)
  const tooShort = trimmed.length > 0 && trimmed.length < MIN_QUERY
  const searched = trimmed.length >= MIN_QUERY && status === 'live'

  return (
    <main className="min-h-screen bg-[#FEF0EC] px-5 py-16 sm:py-20">
      <div className="mx-auto max-w-md text-center">
        <p className="font-body text-xs uppercase tracking-[0.35em] text-[#9E5F4E]">
          Jun &amp; Ariane
        </p>
        <h1 className="mt-2 font-script text-5xl text-[#8B4A3A] sm:text-6xl">
          Find Your Table
        </h1>
        <p className="mt-3 font-body text-base leading-relaxed text-[#8A6A5E]">
          Type your name to find your seat for the reception.
        </p>

        {/* Search */}
        <div className="mt-8 flex items-center gap-2 border border-[#D8B4A6] bg-[#FBE4DB] px-4">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="shrink-0 text-[#B29A8F]"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.5-4.5" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Your full name"
            aria-label="Search for your name"
            autoComplete="off"
            disabled={status !== 'live'}
            className="w-full bg-transparent py-3.5 font-body text-lg text-[#42241B] outline-none placeholder:text-[#B29A8F] disabled:opacity-50"
          />
        </div>

        {/* States */}
        <div className="mt-8">
          {status === 'loading' && (
            <p className="font-body text-base text-[#8A6A5E]">Loading the seating chart…</p>
          )}

          {status === 'error' && (
            <div className="border border-[#D8B4A6] bg-[#FBE4DB] px-5 py-6">
              <p className="font-body text-base text-[#8B4A3A]">
                We couldn’t load the seating right now.
              </p>
              <p className="mt-1 font-body text-sm text-[#8A6A5E]">
                Please try again in a moment, or reach out to the receptionist and
                they’ll help you find your seat.
              </p>
              <button
                type="button"
                onClick={load}
                className="mt-4 border border-[#8B4A3A] px-5 py-2 font-body text-[11px] uppercase tracking-[0.15em] text-[#8B4A3A] transition-colors hover:bg-[#8B4A3A]/5"
              >
                Try again
              </button>
            </div>
          )}

          {status === 'empty' && (
            <p className="font-body text-base leading-relaxed text-[#8A6A5E]">
              The seating chart hasn’t been posted yet. Please check back a little
              later, or ask the receptionist.
            </p>
          )}

          {tooShort && (
            <p className="font-body text-sm text-[#9B7B6E]">
              Keep typing — at least {MIN_QUERY} letters of your name.
            </p>
          )}

          {searched && results.length === 0 && (
            <div className="border border-[#D8B4A6] bg-[#FBE4DB] px-5 py-6">
              <p className="font-body text-base text-[#8B4A3A]">
                Hmm, we couldn’t find “{trimmed}”.
              </p>
              <p className="mt-1 font-body text-sm leading-relaxed text-[#8A6A5E]">
                Try your full name as it appears on your invitation. Still no luck?
                Please reach out to the receptionist and they’ll happily seat you. 💛
              </p>
            </div>
          )}

          {searched && results.length > 0 && (
            <div className="space-y-4">
              {shown.map((r) => (
                <div
                  key={r.name}
                  className="border border-[#E2C0B2] bg-[#FBE4DB] px-5 py-6"
                >
                  <p className="font-body text-sm uppercase tracking-[0.2em] text-[#9E5F4E]">
                    {r.name}
                  </p>
                  <p className="mt-1 font-body text-base text-[#8A6A5E]">
                    You’re seated at
                  </p>
                  <p className="font-script text-5xl leading-tight text-[#8B4A3A]">
                    Table {r.table}
                  </p>
                  {r.tablemates.length > 0 && (
                    <div className="mt-3 border-t border-[#E2C0B2] pt-3">
                      <p className="font-body text-[11px] uppercase tracking-[0.2em] text-[#A98F83]">
                        With
                      </p>
                      <p className="mt-1 font-body text-sm leading-relaxed text-[#7A4030]">
                        {r.tablemates.join(' · ')}
                      </p>
                    </div>
                  )}
                </div>
              ))}

              {results.length > shown.length && (
                <p className="font-body text-sm text-[#9B7B6E]">
                  Showing {shown.length} of {results.length} matches — keep typing your
                  full name to narrow it down.
                </p>
              )}
            </div>
          )}
        </div>

        <p className="mt-12 font-body text-xs leading-relaxed text-[#A98F83]">
          With love, Jun &amp; Ariane · June 13, 2026
        </p>
      </div>
    </main>
  )
}
