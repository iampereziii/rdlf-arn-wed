'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  GUEST_SECTIONS,
  getGuestStats,
  type GroupKind,
  type GuestSection,
} from '@/lib/guestData'
import { loadGuestSections } from '@/lib/guestSheets'

const BADGE_LABEL: Record<GroupKind, string> = {
  couple: 'Couple',
  family: 'Family',
  individual: 'Individual',
  review: 'Needs review',
}

const BADGE_CLASS: Record<GroupKind, string> = {
  couple: 'bg-accent/10 text-accent',
  family: 'bg-mauve/30 text-accent',
  individual: 'bg-accent/5 text-accent/70',
  review: 'bg-accent text-blush',
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

export default function GuestList() {
  const [query, setQuery] = useState('')
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  // Start from the static snapshot so there's content before the fetch lands.
  const [data, setData] = useState<GuestSection[]>(GUEST_SECTIONS)
  const [status, setStatus] = useState<SyncStatus>('loading')
  const [syncedAt, setSyncedAt] = useState('')

  const load = useCallback(async () => {
    setStatus('loading')
    try {
      const sections = await loadGuestSections()
      setData(sections)
      setStatus('live')
      setSyncedAt(new Date().toLocaleTimeString())
    } catch {
      // Sheet unreachable / unpublished — keep showing the snapshot.
      setData(GUEST_SECTIONS)
      setStatus('fallback')
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const q = query.trim().toLowerCase()
  const stats = getGuestStats(data)

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
        : 'Offline — showing the saved snapshot'

  return (
    <main className="min-h-screen px-4 py-12 sm:py-16">
      <div className="mx-auto max-w-2xl">
        <header className="mb-8 text-center">
          <h1 className="font-script text-5xl text-accent sm:text-6xl">Guest List</h1>
          <p className="mt-2 font-body text-xs uppercase tracking-[0.35em] text-accent/60">
            Jun &amp; Ariane · RSVP Responses
          </p>
          <div className="mt-3 flex items-center justify-center gap-3">
            <span className="font-body text-xs text-accent/55">{statusText}</span>
            <button
              type="button"
              onClick={load}
              disabled={status === 'loading'}
              className="border border-accent/25 px-3 py-1 font-body text-[11px] uppercase tracking-[0.15em] text-accent/70 transition-colors hover:bg-accent/5 disabled:opacity-40"
            >
              Refresh
            </button>
          </div>
        </header>

        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {statCards.map((stat) => (
            <div
              key={stat.label}
              className="border border-accent/15 bg-white/50 px-4 py-3 text-center"
            >
              <div className="font-body text-3xl font-semibold leading-none text-accent">
                {stat.value}
              </div>
              <div className="mt-1.5 font-body text-[10px] uppercase tracking-[0.2em] text-accent/55">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        <div className="mb-8 flex items-center gap-2 border border-accent/20 bg-white/60 px-3">
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="shrink-0 text-accent/40"
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
            className="w-full bg-transparent py-2.5 font-body text-base text-accent outline-none placeholder:text-accent/40"
          />
        </div>

        {sections.length > 0 ? (
          sections.map((section) => (
            <section key={section.title} className="mb-6">
              <h2 className="mb-2 font-body text-[11px] uppercase tracking-[0.25em] text-accent/50">
                {section.title}
              </h2>

              {section.groups.map((group) => {
                const open = q ? true : !collapsed[group.label]
                return (
                  <div
                    key={group.label}
                    className="mb-2 border border-accent/15 bg-white/50"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        !q &&
                        setCollapsed((c) => ({
                          ...c,
                          [group.label]: !c[group.label],
                        }))
                      }
                      className="flex w-full items-center gap-2 px-4 py-3 text-left"
                    >
                      <span
                        className={`font-body text-[10px] uppercase tracking-[0.15em] px-2 py-0.5 ${BADGE_CLASS[group.kind]}`}
                      >
                        {BADGE_LABEL[group.kind]}
                      </span>
                      <span className="flex-1 font-body text-base font-semibold text-accent">
                        {group.label}
                      </span>
                      <span className="font-body text-xs text-accent/55">
                        {group.guests.length}
                      </span>
                      {!q && (
                        <span className="text-accent/50">
                          <Chevron open={open} />
                        </span>
                      )}
                    </button>

                    {open && (
                      <div className="px-4 pb-1">
                        {group.guests.map((guest, i) => (
                          <div
                            key={`${group.label}-${i}`}
                            className="flex items-center gap-3 border-t border-accent/10 py-2.5"
                          >
                            <span
                              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-body text-xs font-semibold ${
                                guest.flag
                                  ? 'bg-accent text-blush'
                                  : 'bg-mauve/30 text-accent'
                              }`}
                            >
                              {guest.initials}
                            </span>
                            <div className="flex-1">
                              <div className="font-body text-base leading-tight text-accent">
                                {guest.name}
                              </div>
                              <div className="font-body text-xs text-accent/50">
                                {guest.source === 'plus-one'
                                  ? '+1 guest'
                                  : 'RSVP submission'}
                              </div>
                              {guest.flag && (
                                <div className="mt-1 border-l-2 border-accent pl-2 font-body text-[11px] text-accent">
                                  {guest.flag}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </section>
          ))
        ) : (
          <div className="py-16 text-center font-body text-accent/55">
            No guests match &ldquo;{query}&rdquo;
          </div>
        )}

        <p className="mt-10 text-center font-body text-xs leading-relaxed text-accent/45">
          Source: Jun &amp; Ariane Wedding RSVP form responses · Google Sheets.
          <br />
          Entries combining two names (e.g. &ldquo;A / B&rdquo;) represent two
          guests on one submission.
        </p>
      </div>
    </main>
  )
}
