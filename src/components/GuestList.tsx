'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  GUEST_SECTIONS,
  getGuestStats,
  getSideCounts,
  groupBySide,
  type GroupKind,
  type GuestSection,
} from '@/lib/guestData'
import { loadGuestSections } from '@/lib/guestSheets'

// The static fallback snapshot is association-grouped; regroup it by wedding
// side once so the page shows the same shape before the live fetch lands —
// and if the fetch fails.
const FALLBACK_SECTIONS = groupBySide(GUEST_SECTIONS)

// This is an internal admin page, so it uses a darker, higher-contrast
// treatment than the guest-facing site — easier on the eyes for a
// data-dense screen. Warm browns keep it in the wedding's color family.
const BADGE_LABEL: Record<GroupKind, string> = {
  couple: 'Couple',
  family: 'Family',
  individual: 'Individual',
  review: 'Needs review',
}

const BADGE_CLASS: Record<GroupKind, string> = {
  couple: 'bg-[#c49a8a]/20 text-[#e7c6b8]',
  family: 'bg-[#8b4a3a]/55 text-[#e7c6b8]',
  individual: 'bg-white/5 text-[#c9a99b]',
  review: 'bg-[#d9a48f] text-[#2a1a15]',
}

type SyncStatus = 'loading' | 'live' | 'fallback'

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={`transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
      aria-hidden="true"
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  )
}

function Spinner() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      className="mx-auto animate-spin text-[#d9a48f]"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" opacity="0.25" />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

function WarnIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="mx-auto text-[#d9a48f]"
      aria-hidden="true"
    >
      <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  )
}

// --- Sync gate -------------------------------------------------------------
// Until the live Google Sheets sync confirms (`status === 'live'`), the real
// guest data is never rendered — only this placeholder scaffold is. That keeps
// the offline snapshot out of the DOM and the page source, so the admin can't
// mistake stale data for current RSVP counts.

function SkeletonBar({ className = '' }: { className?: string }) {
  return <div className={`bg-[#4a352d] ${className}`} />
}

function GuestListSkeleton() {
  return (
    <div aria-hidden="true" className="select-none">
      <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="border border-[#4a352d] bg-[#3a2620] px-4 py-3">
            <SkeletonBar className="mx-auto h-7 w-10" />
            <SkeletonBar className="mx-auto mt-2 h-2 w-14" />
          </div>
        ))}
      </div>

      <div className="mb-8 flex flex-wrap justify-center gap-2">
        {[0, 1].map((i) => (
          <span
            key={i}
            className="flex items-center gap-2 border border-[#4a352d] bg-[#3a2620] px-3 py-1.5"
          >
            <SkeletonBar className="h-2.5 w-16" />
            <SkeletonBar className="h-2.5 w-5" />
          </span>
        ))}
      </div>

      <div className="mb-8 border border-[#4a352d] bg-[#3a2620] px-3 py-4">
        <SkeletonBar className="h-3 w-32" />
      </div>

      {[0, 1, 2].map((section) => (
        <div key={section} className="mb-6">
          <SkeletonBar className="mb-2 h-2.5 w-40" />
          {[0, 1].map((group) => (
            <div
              key={group}
              className="mb-2 border border-[#4a352d] bg-[#3a2620] px-4 py-3"
            >
              <div className="flex items-center gap-2">
                <SkeletonBar className="h-4 w-16" />
                <SkeletonBar className="h-4 flex-1" />
              </div>
              <div className="mt-3 flex items-center gap-3">
                <div className="h-9 w-9 shrink-0 rounded-full bg-[#4a352d]" />
                <SkeletonBar className="h-3 w-32" />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

function SyncGate({
  status,
  onRetry,
}: {
  status: 'loading' | 'fallback'
  onRetry: () => void
}) {
  const loading = status === 'loading'
  return (
    <div className="relative">
      <div className={`blur-md ${loading ? 'animate-pulse' : ''}`}>
        <GuestListSkeleton />
      </div>

      <div className="absolute inset-0 flex items-start justify-center bg-[#2a1a15]/75 px-4 pt-20">
        <div
          role="status"
          aria-live="polite"
          className="max-w-sm border border-[#4a352d] bg-[#3a2620] px-6 py-7 text-center"
        >
          {loading ? <Spinner /> : <WarnIcon />}
          <p className="mt-4 font-body text-base text-[#f2e6df]">
            {loading
              ? 'Syncing with Google Sheets…'
              : 'Couldn’t sync with Google Sheets'}
          </p>
          <p className="mt-1.5 font-body text-xs leading-relaxed text-[#b59a8e]">
            {loading
              ? 'The guest list stays hidden until it’s confirmed up to date.'
              : 'The guest list is hidden to avoid showing outdated information. Check your connection and try again.'}
          </p>
          {!loading && (
            <button
              type="button"
              onClick={onRetry}
              className="mt-5 border border-[#5a4038] px-5 py-2 font-body text-[11px] uppercase tracking-[0.15em] text-[#e7c6b8] transition-colors hover:bg-white/5"
            >
              Retry sync
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function GuestList() {
  const [query, setQuery] = useState('')
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  // Seeded with the static snapshot so stats/search have a shape to work with,
  // but it is never rendered — the sync gate withholds all data until 'live'.
  const [data, setData] = useState<GuestSection[]>(FALLBACK_SECTIONS)
  const [status, setStatus] = useState<SyncStatus>('loading')
  const [syncedAt, setSyncedAt] = useState('')
  // Flips true one paint after the first successful sync, so the list fades
  // in rather than popping when the gate opens.
  const [revealed, setRevealed] = useState(false)

  const load = useCallback(async () => {
    setStatus('loading')
    try {
      const sections = await loadGuestSections()
      setData(sections)
      setStatus('live')
      setSyncedAt(new Date().toLocaleTimeString())
    } catch {
      // Sheet unreachable / unpublished — gate the page rather than show the
      // snapshot, which could be days stale and read as current.
      setData(FALLBACK_SECTIONS)
      setStatus('fallback')
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (status !== 'live') return
    const id = requestAnimationFrame(() => setRevealed(true))
    return () => cancelAnimationFrame(id)
  }, [status])

  const q = query.trim().toLowerCase()
  const stats = getGuestStats(data)
  const sideCounts = getSideCounts(data)

  const sections = useMemo<GuestSection[]>(() => {
    if (!q) return data
    return data
      .map((section) => ({
        ...section,
        groups: section.groups
          .map((group) => ({
            ...group,
            guests: group.guests.filter((g) => g.name.toLowerCase().includes(q)),
          }))
          .filter((group) => group.guests.length > 0),
      }))
      .filter((section) => section.groups.length > 0)
  }, [q, data])

  const statCards = [
    { value: stats.totalGuests, label: 'Total guests' },
    { value: stats.submissions, label: 'RSVP submissions' },
    { value: stats.plusOnes, label: '+1 guests' },
    { value: stats.needsReview, label: 'Needs review' },
  ]

  const statusText =
    status === 'loading'
      ? 'Syncing with Google Sheets…'
      : status === 'live'
        ? `Live from Google Sheets · synced ${syncedAt}`
        : 'Offline — sync failed'

  return (
    <main className="min-h-screen bg-[#2a1a15] px-4 py-12 sm:py-16">
      <div className="mx-auto max-w-2xl">
        <header className="mb-8 text-center">
          <h1 className="font-script text-5xl text-[#e7c6b8] sm:text-6xl">
            Guest List
          </h1>
          <p className="mt-2 font-body text-xs uppercase tracking-[0.35em] text-[#c9a99b]">
            Jun &amp; Ariane · RSVP Responses
          </p>
          <div className="mt-3 flex items-center justify-center gap-3">
            <span className="font-body text-xs text-[#b59a8e]">{statusText}</span>
            <button
              type="button"
              onClick={load}
              disabled={status === 'loading'}
              className="border border-[#5a4038] px-3 py-1 font-body text-[11px] uppercase tracking-[0.15em] text-[#c9a99b] transition-colors hover:bg-white/5 disabled:opacity-40"
            >
              Refresh
            </button>
          </div>
        </header>

        {status === 'live' ? (
          <div
            className={`transition-opacity duration-500 ${
              revealed ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {statCards.map((stat) => (
                <div
                  key={stat.label}
                  className="border border-[#4a352d] bg-[#3a2620] px-4 py-3 text-center"
                >
                  <div className="font-body text-3xl font-semibold leading-none text-[#f2e6df]">
                    {stat.value}
                  </div>
                  <div className="mt-1.5 font-body text-[10px] uppercase tracking-[0.2em] text-[#b59a8e]">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>

            <div className="mb-8 flex flex-wrap justify-center gap-2">
              {sideCounts.map(({ side, count }) => (
                <span
                  key={side}
                  className="flex items-center gap-2 border border-[#4a352d] bg-[#3a2620] px-3 py-1.5"
                >
                  <span className="font-body text-[10px] font-semibold uppercase tracking-[0.15em] text-[#e7c6b8]">
                    {side}
                  </span>
                  <span className="font-body text-xs text-[#b59a8e]">{count}</span>
                </span>
              ))}
            </div>

            <div className="mb-8 flex items-center gap-2 border border-[#4a352d] bg-[#3a2620] px-3">
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="shrink-0 text-[#9c8077]"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="M21 21l-4.5-4.5" />
              </svg>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name"
                aria-label="Search guests by name"
                className="w-full bg-transparent py-2.5 font-body text-base text-[#f2e6df] outline-none placeholder:text-[#9c8077]"
              />
            </div>

            {sections.length > 0 ? (
              sections.map((section) => (
                <section key={section.title} className="mb-6">
                  <h2 className="mb-2 flex items-baseline justify-between font-body text-[11px] uppercase tracking-[0.25em] text-[#b59a8e]">
                    <span>{section.title}</span>
                    <span className="text-[#9c8077]">
                      {section.groups.reduce((n, g) => n + g.guests.length, 0)}
                    </span>
                  </h2>

                  {section.groups.map((group) => {
                    // Key includes the section title: after side-grouping, the
                    // same group label (e.g. "Individuals") recurs across sides,
                    // so a label-only key would collapse them together.
                    const groupKey = `${section.title}::${group.label}`
                    const open = q ? true : !collapsed[groupKey]
                    return (
                      <div
                        key={groupKey}
                        className="mb-2 border border-[#4a352d] bg-[#3a2620]"
                      >
                        <button
                          type="button"
                          onClick={() =>
                            !q &&
                            setCollapsed((c) => ({
                              ...c,
                              [groupKey]: !c[groupKey],
                            }))
                          }
                          className="flex w-full items-center gap-2 px-4 py-3 text-left"
                        >
                          <span
                            className={`font-body text-[10px] uppercase tracking-[0.15em] px-2 py-0.5 ${BADGE_CLASS[group.kind]}`}
                          >
                            {BADGE_LABEL[group.kind]}
                          </span>
                          <span className="flex-1 font-body text-base font-semibold text-[#f2e6df]">
                            {group.label}
                          </span>
                          <span className="font-body text-xs text-[#b59a8e]">
                            {group.guests.length}
                          </span>
                          {!q && (
                            <span className="text-[#b59a8e]">
                              <Chevron open={open} />
                            </span>
                          )}
                        </button>

                        {open && (
                          <div className="px-4 pb-1">
                            {group.guests.map((guest, i) => {
                              const sharedWith = guest.submissionId
                                ? group.guests
                                    .filter(
                                      (g) =>
                                        g.submissionId === guest.submissionId &&
                                        g.name !== guest.name,
                                    )
                                    .map((g) => g.name)
                                : []
                              return (
                                <div
                                  key={`${group.label}-${i}`}
                                  className="flex items-center gap-3 border-t border-[#4a352d] py-2.5"
                                >
                                  <span
                                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-body text-xs font-semibold ${
                                      guest.flag
                                        ? 'bg-[#d9a48f] text-[#2a1a15]'
                                        : 'bg-[#4e3a32] text-[#e7c6b8]'
                                    }`}
                                  >
                                    {guest.initials}
                                  </span>
                                  <div className="flex-1">
                                    <div className="font-body text-base leading-tight text-[#f2e6df]">
                                      {guest.name}
                                    </div>
                                    <div className="font-body text-xs text-[#a98d80]">
                                      {guest.source === 'plus-one'
                                        ? '+1 guest'
                                        : 'RSVP submission'}
                                    </div>
                                    {sharedWith.length > 0 && (
                                      <div className="mt-1 font-body text-[11px] italic text-[#a98d80]">
                                        Shares one RSVP submission with{' '}
                                        {sharedWith.join(', ')}
                                      </div>
                                    )}
                                    {guest.flag && (
                                      <div className="mt-1 border-l-2 border-[#d9a48f] pl-2 font-body text-[11px] text-[#e7c6b8]">
                                        {guest.flag}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </section>
              ))
            ) : (
              <div className="py-16 text-center font-body text-[#b59a8e]">
                No guests match &ldquo;{query}&rdquo;
              </div>
            )}
          </div>
        ) : (
          <SyncGate status={status} onRetry={load} />
        )}

        <p className="mt-10 text-center font-body text-xs leading-relaxed text-[#9c8077]">
          Source: Jun &amp; Ariane Wedding RSVP form responses · Google Sheets.
        </p>
      </div>
    </main>
  )
}
