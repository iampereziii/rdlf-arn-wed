'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  getGuestStats,
  getSideCounts,
  type GroupKind,
  type GuestSection,
} from '@/lib/guestData'
import { loadGuestSections } from '@/lib/guestSheets'

// No static fallback — the guest list is live-only. Until the Google Sheets
// sync confirms, the page holds no data and the sync gate withholds render.
const EMPTY_SECTIONS: GuestSection[] = []

// This internal admin page supports a light/dark toggle. Dark is the default
// data-dense admin treatment; light uses the wedding's invitation palette
// (#FEF0EC / #8B4A3A / #C49A8A) so the page stays on-brand. Every color the
// page renders comes from the active Theme — no hardcoded hex in the markup.

type ColorScheme = 'dark' | 'light'

type Theme = {
  page: string // page background
  panel: string // card / panel: border + background
  panelBorder: string // bare border color (row separators)
  overlay: string // sync-gate dimming overlay background
  skeleton: string // skeleton placeholder fill
  bright: string // strongest text (values, names)
  primary: string // headings / accent text
  secondary: string // subtitle text
  muted: string // labels / status text
  faint: string // small guest sub-labels
  dimmed: string // footer / faintest text + icons
  accent: string // spinner / warning / flag accent
  refreshBtn: string // header buttons: border + text + hover
  input: string // search input text
  placeholder: string // search input placeholder
  avatar: string // normal avatar background + text
  avatarFlag: string // flagged avatar background + text
  flagNote: string // flag note border + text
  badge: Record<GroupKind, string>
}

const THEMES: Record<ColorScheme, Theme> = {
  dark: {
    page: 'bg-[#2a1a15]',
    panel: 'border border-[#4a352d] bg-[#3a2620]',
    panelBorder: 'border-[#4a352d]',
    overlay: 'bg-[#2a1a15]/75',
    skeleton: 'bg-[#4a352d]',
    bright: 'text-[#f2e6df]',
    primary: 'text-[#e7c6b8]',
    secondary: 'text-[#c9a99b]',
    muted: 'text-[#b59a8e]',
    faint: 'text-[#a98d80]',
    dimmed: 'text-[#9c8077]',
    accent: 'text-[#d9a48f]',
    refreshBtn: 'border-[#5a4038] text-[#c9a99b] hover:bg-white/5',
    input: 'text-[#f2e6df]',
    placeholder: 'placeholder:text-[#9c8077]',
    avatar: 'bg-[#4e3a32] text-[#e7c6b8]',
    avatarFlag: 'bg-[#d9a48f] text-[#2a1a15]',
    flagNote: 'border-[#d9a48f] text-[#e7c6b8]',
    badge: {
      couple: 'bg-[#c49a8a]/20 text-[#e7c6b8]',
      family: 'bg-[#8b4a3a]/55 text-[#e7c6b8]',
      individual: 'bg-white/5 text-[#c9a99b]',
      review: 'bg-[#d9a48f] text-[#2a1a15]',
    },
  },
  light: {
    page: 'bg-[#FEF0EC]',
    panel: 'border border-[#E2C0B2] bg-[#FBE4DB]',
    panelBorder: 'border-[#E2C0B2]',
    overlay: 'bg-[#FEF0EC]/75',
    skeleton: 'bg-[#E7C9BC]',
    bright: 'text-[#42241B]',
    primary: 'text-[#8B4A3A]',
    secondary: 'text-[#9E5F4E]',
    muted: 'text-[#8A6A5E]',
    faint: 'text-[#9B7B6E]',
    dimmed: 'text-[#A98F83]',
    accent: 'text-[#B5654A]',
    refreshBtn: 'border-[#D8B4A6] text-[#8B4A3A] hover:bg-[#8B4A3A]/5',
    input: 'text-[#42241B]',
    placeholder: 'placeholder:text-[#B29A8F]',
    avatar: 'bg-[#C49A8A] text-[#FEF0EC]',
    avatarFlag: 'bg-[#B5654A] text-[#FEF0EC]',
    flagNote: 'border-[#B5654A] text-[#8B4A3A]',
    badge: {
      couple: 'bg-[#C49A8A]/35 text-[#7A4030]',
      family: 'bg-[#8B4A3A]/20 text-[#7A4030]',
      individual: 'bg-[#8B4A3A]/[0.08] text-[#9E5F4E]',
      review: 'bg-[#B5654A] text-[#FEF0EC]',
    },
  },
}

const BADGE_LABEL: Record<GroupKind, string> = {
  couple: 'Couple',
  family: 'Family',
  individual: 'Individual',
  review: 'Needs review',
}

// localStorage key for the persisted light/dark choice.
const STORAGE_KEY = 'guests-color-scheme'

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

function SunIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
    </svg>
  )
}

function Spinner({ t }: { t: Theme }) {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      className={`mx-auto animate-spin ${t.accent}`}
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

function WarnIcon({ t }: { t: Theme }) {
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
      className={`mx-auto ${t.accent}`}
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
// stale or unconfirmed data out of the DOM and the page source, so the admin
// can't mistake it for current RSVP counts.

function SkeletonBar({ t, className = '' }: { t: Theme; className?: string }) {
  return <div className={`${t.skeleton} ${className}`} />
}

function GuestListSkeleton({ t }: { t: Theme }) {
  return (
    <div aria-hidden="true" className="select-none">
      <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={`${t.panel} px-4 py-3`}>
            <SkeletonBar t={t} className="mx-auto h-7 w-10" />
            <SkeletonBar t={t} className="mx-auto mt-2 h-2 w-14" />
          </div>
        ))}
      </div>

      <div className="mb-8 flex flex-wrap justify-center gap-2">
        {[0, 1].map((i) => (
          <span key={i} className={`flex items-center gap-2 ${t.panel} px-3 py-1.5`}>
            <SkeletonBar t={t} className="h-2.5 w-16" />
            <SkeletonBar t={t} className="h-2.5 w-5" />
          </span>
        ))}
      </div>

      <div className={`mb-8 ${t.panel} px-3 py-4`}>
        <SkeletonBar t={t} className="h-3 w-32" />
      </div>

      {[0, 1, 2].map((section) => (
        <div key={section} className="mb-6">
          <SkeletonBar t={t} className="mb-2 h-2.5 w-40" />
          {[0, 1].map((group) => (
            <div key={group} className={`mb-2 ${t.panel} px-4 py-3`}>
              <div className="flex items-center gap-2">
                <SkeletonBar t={t} className="h-4 w-16" />
                <SkeletonBar t={t} className="h-4 flex-1" />
              </div>
              <div className="mt-3 flex items-center gap-3">
                <div className={`h-9 w-9 shrink-0 rounded-full ${t.skeleton}`} />
                <SkeletonBar t={t} className="h-3 w-32" />
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
  t,
}: {
  status: 'loading' | 'fallback'
  onRetry: () => void
  t: Theme
}) {
  const loading = status === 'loading'
  return (
    <div className="relative">
      <div className={`blur-md ${loading ? 'animate-pulse' : ''}`}>
        <GuestListSkeleton t={t} />
      </div>

      <div
        className={`absolute inset-0 flex items-start justify-center ${t.overlay} px-4 pt-20`}
      >
        <div role="status" aria-live="polite" className={`max-w-sm ${t.panel} px-6 py-7 text-center`}>
          {loading ? <Spinner t={t} /> : <WarnIcon t={t} />}
          <p className={`mt-4 font-body text-base ${t.bright}`}>
            {loading
              ? 'Syncing with Google Sheets…'
              : 'Couldn’t sync with Google Sheets'}
          </p>
          <p className={`mt-1.5 font-body text-xs leading-relaxed ${t.muted}`}>
            {loading
              ? 'The guest list stays hidden until it’s confirmed up to date.'
              : 'The guest list is hidden to avoid showing outdated information. Check your connection and try again.'}
          </p>
          {!loading && (
            <button
              type="button"
              onClick={onRetry}
              className={`mt-5 border ${t.refreshBtn} px-5 py-2 font-body text-[11px] uppercase tracking-[0.15em] transition-colors`}
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
  // Seeded empty — the sync gate withholds all data until 'live', so there is
  // nothing to show until the live fetch lands.
  const [data, setData] = useState<GuestSection[]>(EMPTY_SECTIONS)
  const [status, setStatus] = useState<SyncStatus>('loading')
  const [syncedAt, setSyncedAt] = useState('')
  // Flips true one paint after the first successful sync, so the list fades
  // in rather than popping when the gate opens.
  const [revealed, setRevealed] = useState(false)
  // Starts 'dark' (localStorage isn't available during the static prerender);
  // the persisted choice is reconciled on mount below.
  const [mode, setMode] = useState<ColorScheme>('dark')
  const t = THEMES[mode]

  const load = useCallback(async () => {
    setStatus('loading')
    try {
      const sections = await loadGuestSections()
      setData(sections)
      setStatus('live')
      setSyncedAt(new Date().toLocaleTimeString())
    } catch {
      // Sheet unreachable / unpublished — gate the page; there is no snapshot
      // to fall back to, so clear the data and let the sync gate take over.
      setData(EMPTY_SECTIONS)
      setStatus('fallback')
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  // Reconcile the persisted color scheme once on mount.
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'light' || saved === 'dark') setMode(saved)
  }, [])

  // Persist the color scheme whenever it changes.
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, mode)
  }, [mode])

  const toggleMode = useCallback(() => {
    setMode((m) => (m === 'dark' ? 'light' : 'dark'))
  }, [])

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
    <main className={`min-h-screen ${t.page} px-4 py-12 transition-colors duration-200 sm:py-16`}>
      <div className="mx-auto max-w-2xl">
        <header className="mb-8 text-center">
          <h1 className={`font-script text-5xl ${t.primary} sm:text-6xl`}>
            Guest List
          </h1>
          <p className={`mt-2 font-body text-xs uppercase tracking-[0.35em] ${t.secondary}`}>
            Jun &amp; Ariane · RSVP Responses
          </p>
          <div className="mt-3 flex items-center justify-center gap-3">
            <span className={`font-body text-xs ${t.muted}`}>{statusText}</span>
            <button
              type="button"
              onClick={load}
              disabled={status === 'loading'}
              className={`border ${t.refreshBtn} px-3 py-1 font-body text-[11px] uppercase tracking-[0.15em] transition-colors disabled:opacity-40`}
            >
              Refresh
            </button>
            <button
              type="button"
              onClick={toggleMode}
              aria-label={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              className={`border ${t.refreshBtn} flex items-center justify-center px-2.5 py-1 transition-colors`}
            >
              {mode === 'dark' ? <SunIcon /> : <MoonIcon />}
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
                <div key={stat.label} className={`${t.panel} px-4 py-3 text-center`}>
                  <div className={`font-body text-3xl font-semibold leading-none ${t.bright}`}>
                    {stat.value}
                  </div>
                  <div className={`mt-1.5 font-body text-[10px] uppercase tracking-[0.2em] ${t.muted}`}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>

            <div className="mb-8 flex flex-wrap justify-center gap-2">
              {sideCounts.map(({ side, count }) => (
                <span key={side} className={`flex items-center gap-2 ${t.panel} px-3 py-1.5`}>
                  <span className={`font-body text-[10px] font-semibold uppercase tracking-[0.15em] ${t.primary}`}>
                    {side}
                  </span>
                  <span className={`font-body text-xs ${t.muted}`}>{count}</span>
                </span>
              ))}
            </div>

            <div className={`mb-8 flex items-center gap-2 ${t.panel} px-3`}>
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className={`shrink-0 ${t.dimmed}`}
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
                className={`w-full bg-transparent py-2.5 font-body text-base outline-none ${t.input} ${t.placeholder}`}
              />
            </div>

            {sections.length > 0 ? (
              sections.map((section) => (
                <section key={section.title} className="mb-6">
                  <h2 className={`mb-2 flex items-baseline justify-between font-body text-[11px] uppercase tracking-[0.25em] ${t.muted}`}>
                    <span>{section.title}</span>
                    <span className={t.dimmed}>
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
                      <div key={groupKey} className={`mb-2 ${t.panel}`}>
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
                            className={`font-body text-[10px] uppercase tracking-[0.15em] px-2 py-0.5 ${t.badge[group.kind]}`}
                          >
                            {BADGE_LABEL[group.kind]}
                          </span>
                          <span className={`flex-1 font-body text-base font-semibold ${t.bright}`}>
                            {group.label}
                          </span>
                          <span className={`font-body text-xs ${t.muted}`}>
                            {group.guests.length}
                          </span>
                          {!q && (
                            <span className={t.muted}>
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
                                  className={`flex items-center gap-3 border-t ${t.panelBorder} py-2.5`}
                                >
                                  <span
                                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-body text-xs font-semibold ${
                                      guest.flag ? t.avatarFlag : t.avatar
                                    }`}
                                  >
                                    {guest.initials}
                                  </span>
                                  <div className="flex-1">
                                    <div className={`font-body text-base leading-tight ${t.bright}`}>
                                      {guest.name}
                                    </div>
                                    <div className={`font-body text-xs ${t.faint}`}>
                                      {guest.source === 'plus-one'
                                        ? '+1 guest'
                                        : 'RSVP submission'}
                                    </div>
                                    {sharedWith.length > 0 && (
                                      <div className={`mt-1 font-body text-[11px] italic ${t.faint}`}>
                                        Shares one RSVP submission with{' '}
                                        {sharedWith.join(', ')}
                                      </div>
                                    )}
                                    {guest.flag && (
                                      <div className={`mt-1 border-l-2 pl-2 font-body text-[11px] ${t.flagNote}`}>
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
              <div className={`py-16 text-center font-body ${t.muted}`}>
                No guests match &ldquo;{query}&rdquo;
              </div>
            )}
          </div>
        ) : (
          <SyncGate status={status} onRetry={load} t={t} />
        )}

        <p className={`mt-10 text-center font-body text-xs leading-relaxed ${t.dimmed}`}>
          Source: Jun &amp; Ariane Wedding RSVP form responses · Google Sheets.
        </p>
      </div>
    </main>
  )
}
