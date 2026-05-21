'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  GUEST_SECTIONS,
  getGuestStats,
  type GroupKind,
  type GuestSection,
} from '@/lib/guestData'
import { loadGuestSections } from '@/lib/guestSheets'

type ThemeMode = 'light' | 'dark'

type ThemeTokens = {
  page: string
  card: string
  statValue: string
  muted: string
  dimmed: string
  primary: string
  secondary: string
  inputText: string
  placeholder: string
  rowBorder: string
  refreshBtn: string
  initialsNormal: string
  initialsFlag: string
  guestMeta: string
  flagBorder: string
  flagText: string
  badge: Record<GroupKind, string>
}

const PALETTE: Record<ThemeMode, ThemeTokens> = {
  dark: {
    page:           'bg-[#2a1a15]',
    card:           'bg-[#3a2620] border-[#4a352d]',
    statValue:      'text-[#f2e6df]',
    muted:          'text-[#b59a8e]',
    dimmed:         'text-[#9c8077]',
    primary:        'text-[#e7c6b8]',
    secondary:      'text-[#c9a99b]',
    inputText:      'text-[#f2e6df]',
    placeholder:    'placeholder:text-[#9c8077]',
    rowBorder:      'border-[#4a352d]',
    refreshBtn:     'border-[#5a4038] text-[#c9a99b] hover:bg-white/5',
    initialsNormal: 'bg-[#4e3a32] text-[#e7c6b8]',
    initialsFlag:   'bg-[#d9a48f] text-[#2a1a15]',
    guestMeta:      'text-[#a98d80]',
    flagBorder:     'border-[#d9a48f]',
    flagText:       'text-[#e7c6b8]',
    badge: {
      couple:     'bg-[#c49a8a]/20 text-[#e7c6b8]',
      family:     'bg-[#8b4a3a]/55 text-[#e7c6b8]',
      individual: 'bg-white/5 text-[#c9a99b]',
      review:     'bg-[#d9a48f] text-[#2a1a15]',
    },
  },
  light: {
    page:           'bg-[#FEF0EC]',
    card:           'bg-white border-[#C49A8A]',
    statValue:      'text-[#8B4A3A]',
    muted:          'text-[#C49A8A]',
    dimmed:         'text-[#C49A8A]',
    primary:        'text-[#8B4A3A]',
    secondary:      'text-[#8B4A3A]',
    inputText:      'text-[#8B4A3A]',
    placeholder:    'placeholder:text-[#C49A8A]',
    rowBorder:      'border-[#C49A8A]',
    refreshBtn:     'border-[#8B4A3A] text-[#8B4A3A] hover:bg-[#8B4A3A]/5',
    initialsNormal: 'bg-[#c49a8a]/20 text-[#8B4A3A]',
    initialsFlag:   'bg-[#8B4A3A] text-[#FEF0EC]',
    guestMeta:      'text-[#C49A8A]',
    flagBorder:     'border-[#8B4A3A]',
    flagText:       'text-[#8B4A3A]',
    badge: {
      couple:     'bg-[#c49a8a]/20 text-[#8B4A3A]',
      family:     'bg-[#8b4a3a]/20 text-[#8B4A3A]',
      individual: 'bg-[#8b4a3a]/10 text-[#8B4A3A]',
      review:     'bg-[#8B4A3A] text-[#FEF0EC]',
    },
  },
}

const BADGE_LABEL: Record<GroupKind, string> = {
  couple: 'Couple',
  family: 'Family',
  individual: 'Individual',
  review: 'Needs review',
}

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
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
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
  const [mode, setMode] = useState<ThemeMode>('dark')

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'light' || saved === 'dark') {
      setMode(saved)
    } else {
      setMode(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    }
  }, [])

  const toggleMode = () => {
    const next: ThemeMode = mode === 'dark' ? 'light' : 'dark'
    setMode(next)
    localStorage.setItem(STORAGE_KEY, next)
  }

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
  const t = PALETTE[mode]

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
    <main className={`min-h-screen ${t.page} px-4 py-12 sm:py-16`}>
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

        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {statCards.map((stat) => (
            <div
              key={stat.label}
              className={`border ${t.card} px-4 py-3 text-center`}
            >
              <div className={`font-body text-3xl font-semibold leading-none ${t.statValue}`}>
                {stat.value}
              </div>
              <div className={`mt-1.5 font-body text-[10px] uppercase tracking-[0.2em] ${t.muted}`}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        <div className={`mb-8 flex items-center gap-2 border ${t.card} px-3`}>
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
            className={`w-full bg-transparent py-2.5 font-body text-base ${t.inputText} outline-none ${t.placeholder}`}
          />
        </div>

        {sections.length > 0 ? (
          sections.map((section) => (
            <section key={section.title} className="mb-6">
              <h2 className={`mb-2 font-body text-[11px] uppercase tracking-[0.25em] ${t.muted}`}>
                {section.title}
              </h2>

              {section.groups.map((group) => {
                const open = q ? true : !collapsed[group.label]
                return (
                  <div
                    key={group.label}
                    className={`mb-2 border ${t.card}`}
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
                        className={`font-body text-[10px] uppercase tracking-[0.15em] px-2 py-0.5 ${t.badge[group.kind]}`}
                      >
                        {BADGE_LABEL[group.kind]}
                      </span>
                      <span className={`flex-1 font-body text-base font-semibold ${t.primary}`}>
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
                              className={`flex items-center gap-3 border-t ${t.rowBorder} py-2.5`}
                            >
                              <span
                                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-body text-xs font-semibold ${
                                  guest.flag ? t.initialsFlag : t.initialsNormal
                                }`}
                              >
                                {guest.initials}
                              </span>
                              <div className="flex-1">
                                <div className={`font-body text-base leading-tight ${t.primary}`}>
                                  {guest.name}
                                </div>
                                <div className={`font-body text-xs ${t.guestMeta}`}>
                                  {guest.source === 'plus-one'
                                    ? '+1 guest'
                                    : 'RSVP submission'}
                                </div>
                                {sharedWith.length > 0 && (
                                  <div className={`mt-1 font-body text-[11px] italic ${t.guestMeta}`}>
                                    Shares one RSVP submission with{' '}
                                    {sharedWith.join(', ')}
                                  </div>
                                )}
                                {guest.flag && (
                                  <div className={`mt-1 border-l-2 ${t.flagBorder} pl-2 font-body text-[11px] ${t.flagText}`}>
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

        <p className={`mt-10 text-center font-body text-xs leading-relaxed ${t.dimmed}`}>
          Source: Jun &amp; Ariane Wedding RSVP form responses · Google Sheets.
        </p>
      </div>
    </main>
  )
}
