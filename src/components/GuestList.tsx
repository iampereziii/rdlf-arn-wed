'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  derivedAffiliationOfGuest,
  effectiveAffiliation,
  getAffiliationCounts,
  getGuestStats,
  getSideCounts,
  groupByAffiliation,
  type Affiliation,
  type AffiliationOverrides,
  type GuestSection,
  type OverrideAffiliation,
} from '@/lib/guestData'
import { loadGuestSections } from '@/lib/guestSheets'
import {
  affiliationsWriteEnabled,
  copyToClipboard,
  exportToTSV,
  loadAffiliationsFromSheet,
  loadLocalOverrides,
  overridesEqual,
  saveAffiliationsToSheet,
  saveLocalOverrides,
} from '@/lib/affiliations'
import {
  BADGE_LABEL,
  Chevron,
  type ColorScheme,
  COLOR_SCHEME_STORAGE_KEY,
  MoonIcon,
  OverrideDot,
  OverridePicker,
  Spinner,
  SunIcon,
  type Theme,
  THEMES,
  WarnIcon,
} from '@/components/guestsShared'

// No static fallback — the guest list is live-only. Until the Google Sheets
// sync confirms, the page holds no data and the sync gate withholds render.
const EMPTY_SECTIONS: GuestSection[] = []

// Theme, THEMES, BADGE_LABEL, and the persisted light/dark key live in
// guestsShared.tsx so /guests and /seating share one palette (no drift).

// localStorage key for the persisted grouping mode (side vs Groom / Bride).
const GROUPING_STORAGE_KEY = 'guests-grouping-mode'

// Side view = the four-side breakdown (Perez / Palad / Domingo / Guests).
// Affiliation view = the Groom / Bride / Guests rollup.
type GroupingMode = 'side' | 'affiliation'

type SyncStatus = 'loading' | 'live' | 'fallback'

// Shown when in Side view — the icon depicts the *target* state (Groom / Bride
// rollup), mirroring the dark/light toggle that shows the icon you'd switch to.
function GroomBrideIcon() {
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
      <circle cx="9" cy="13" r="5" />
      <circle cx="15" cy="13" r="5" />
    </svg>
  )
}

// Shown when in Groom / Bride view — depicts the four-side grid you'd switch to.
function SideGridIcon() {
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
      <rect x="3" y="3" width="8" height="8" />
      <rect x="13" y="3" width="8" height="8" />
      <rect x="3" y="13" width="8" height="8" />
      <rect x="13" y="13" width="8" height="8" />
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
  // Side view is the default — preserves the page's current behavior for
  // anyone who never opens the toggle. Reconciled from localStorage on mount.
  const [groupingMode, setGroupingMode] = useState<GroupingMode>('side')

  // Editorial override state (per ADR-0002).
  //   - `overrides`: the picker's working state — also what gets rendered.
  //     Mirrored to localStorage on every change so it survives reload.
  //   - `sheetSnapshot`: what was fetched from the affiliations Sheet at
  //     load time. Compared against `overrides` to detect unpublished
  //     changes — taken once at load, never re-fetched mid-session.
  //   - `adminMode`: gates picker visibility. Read from `?admin=1` once on
  //     mount. The gate is UX-only — overrides applied to the rollup are
  //     visible to everyone (they ARE the published state from the Sheet).
  const [overrides, setOverrides] = useState<AffiliationOverrides>({})
  const [sheetSnapshot, setSheetSnapshot] = useState<AffiliationOverrides>({})
  const [adminMode, setAdminMode] = useState(false)
  const [exportFeedback, setExportFeedback] = useState('')
  const [saving, setSaving] = useState(false)
  const writeEnabled = affiliationsWriteEnabled()

  // Read the admin gate once on mount.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setAdminMode(params.get('admin') === '1')
  }, [])

  const load = useCallback(async () => {
    setStatus('loading')
    try {
      const [sections, snapshot] = await Promise.all([
        loadGuestSections(),
        // Affiliations fetch can't fail the page — it returns {} on any
        // problem. The picker still works locally even with no Sheet.
        loadAffiliationsFromSheet(),
      ])
      setData(sections)
      setSheetSnapshot(snapshot)
      // Seed localStorage from the Sheet only on first visit (key missing).
      // Once the admin has touched localStorage — even to clear it — we
      // preserve their working state across reloads.
      const saved = loadLocalOverrides()
      if (saved === null) {
        setOverrides(snapshot)
        saveLocalOverrides(snapshot)
      } else {
        setOverrides(saved)
      }
      setStatus('live')
      setSyncedAt(new Date().toLocaleTimeString())
    } catch {
      // Guest sheets unreachable — gate the page; there is no snapshot
      // to fall back to, so clear the data and let the sync gate take over.
      setData(EMPTY_SECTIONS)
      setStatus('fallback')
    }
  }, [])

  // Picker handlers. Couples/families/review groups call setGroupOverride with
  // all of the group's guest names; individual pickers pass one name. Per
  // ADR-0002 (move-as-a-unit), each guest in a group gets the same entry.
  const setGroupOverride = useCallback(
    (guestNames: string[], value: OverrideAffiliation) => {
      setOverrides((prev) => {
        const next = { ...prev }
        for (const name of guestNames) next[name] = value
        saveLocalOverrides(next)
        return next
      })
    },
    [],
  )

  const clearGroupOverride = useCallback((guestNames: string[]) => {
    setOverrides((prev) => {
      const next = { ...prev }
      for (const name of guestNames) delete next[name]
      saveLocalOverrides(next)
      return next
    })
  }, [])

  const resetAllOverrides = useCallback(() => {
    if (
      !window.confirm(
        "Clear all overrides locally? You'll need to Export and replace the affiliations Sheet to publish the cleared state.",
      )
    ) {
      return
    }
    setOverrides({})
    saveLocalOverrides({})
  }, [])

  const handleExport = useCallback(async () => {
    const tsv = exportToTSV(overrides)
    const ok = await copyToClipboard(tsv)
    setExportFeedback(
      ok
        ? `Copied ${Object.keys(overrides).length} row(s). Paste into the affiliations Sheet (select all → delete → paste).`
        : 'Copy failed — clipboard not available in this browser.',
    )
    window.setTimeout(() => setExportFeedback(''), 4000)
  }, [overrides])

  // One-click write-back via the affiliations Apps Script proxy (per ADR-0003).
  // On success, advance the snapshot so the "Unpublished" badge clears.
  const handleSave = useCallback(async () => {
    setSaving(true)
    const ok = await saveAffiliationsToSheet(overrides)
    setSaving(false)
    if (ok) {
      setSheetSnapshot(overrides)
      setExportFeedback('Saved to the affiliations Sheet.')
    } else {
      setExportFeedback('Save failed — check your connection, or use Export as a fallback.')
    }
    window.setTimeout(() => setExportFeedback(''), 4000)
  }, [overrides])

  const hasUnpublishedChanges = useMemo(
    () => !overridesEqual(overrides, sheetSnapshot),
    [overrides, sheetSnapshot],
  )
  const hasAnyOverrides = useMemo(
    () => Object.keys(overrides).length > 0,
    [overrides],
  )

  useEffect(() => {
    load()
  }, [load])

  // Reconcile the persisted color scheme once on mount.
  useEffect(() => {
    const saved = localStorage.getItem(COLOR_SCHEME_STORAGE_KEY)
    if (saved === 'light' || saved === 'dark') setMode(saved)
  }, [])

  // Persist the color scheme whenever it changes.
  useEffect(() => {
    localStorage.setItem(COLOR_SCHEME_STORAGE_KEY, mode)
  }, [mode])

  // Reconcile the persisted grouping mode once on mount.
  useEffect(() => {
    const saved = localStorage.getItem(GROUPING_STORAGE_KEY)
    if (saved === 'side' || saved === 'affiliation') setGroupingMode(saved)
  }, [])

  // Persist the grouping mode whenever it changes.
  useEffect(() => {
    localStorage.setItem(GROUPING_STORAGE_KEY, groupingMode)
  }, [groupingMode])

  const toggleMode = useCallback(() => {
    setMode((m) => (m === 'dark' ? 'light' : 'dark'))
  }, [])

  const toggleGroupingMode = useCallback(() => {
    setGroupingMode((m) => (m === 'side' ? 'affiliation' : 'side'))
  }, [])

  useEffect(() => {
    if (status !== 'live') return
    const id = requestAnimationFrame(() => setRevealed(true))
    return () => cancelAnimationFrame(id)
  }, [status])

  const q = query.trim().toLowerCase()
  const stats = getGuestStats(data)
  // `data` is always side-grouped (groupBySide runs in loadGuestSections).
  // In affiliation mode, roll it up one more level, applying any editorial
  // overrides currently held in localStorage (per ADR-0002).
  const groupedData = useMemo<GuestSection[]>(
    () =>
      groupingMode === 'affiliation'
        ? groupByAffiliation(data, overrides)
        : data,
    [data, groupingMode, overrides],
  )
  const sideCounts = getSideCounts(data)
  const affiliationCounts = getAffiliationCounts(groupedData)

  const sections = useMemo<GuestSection[]>(() => {
    if (!q) return groupedData
    return groupedData
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
  }, [q, groupedData])

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
              onClick={toggleGroupingMode}
              aria-label={
                groupingMode === 'side'
                  ? 'Switch to Groom / Bride view'
                  : 'Switch to four-side view'
              }
              className={`border ${t.refreshBtn} flex items-center justify-center px-2.5 py-1 transition-colors`}
            >
              {groupingMode === 'side' ? <GroomBrideIcon /> : <SideGridIcon />}
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

          {adminMode && groupingMode === 'affiliation' && (
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
              {writeEnabled && (
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className={`border ${t.refreshBtn} px-3 py-1 font-body text-[11px] uppercase tracking-[0.15em] transition-colors disabled:opacity-40`}
                >
                  {saving ? 'Saving…' : 'Save to Sheet'}
                </button>
              )}
              <button
                type="button"
                onClick={handleExport}
                className={`border ${t.refreshBtn} px-3 py-1 font-body text-[11px] uppercase tracking-[0.15em] transition-colors`}
              >
                Export ({Object.keys(overrides).length})
              </button>
              {hasAnyOverrides && (
                <button
                  type="button"
                  onClick={resetAllOverrides}
                  className={`border ${t.refreshBtn} px-3 py-1 font-body text-[11px] uppercase tracking-[0.15em] transition-colors`}
                >
                  Reset all
                </button>
              )}
              {hasUnpublishedChanges && (
                <span
                  className={`flex items-center gap-1.5 border ${t.flagNote} px-2.5 py-1 font-body text-[10px] uppercase tracking-[0.15em]`}
                >
                  <OverrideDot t={t} />
                  Unpublished
                </span>
              )}
            </div>
          )}
          {exportFeedback && (
            <p className={`mt-2 text-center font-body text-xs ${t.muted}`}>
              {exportFeedback}
            </p>
          )}
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
              {groupingMode === 'side'
                ? sideCounts.map(({ side, count }) => (
                    <span key={side} className={`flex items-center gap-2 ${t.panel} px-3 py-1.5`}>
                      <span className={`font-body text-[10px] font-semibold uppercase tracking-[0.15em] ${t.primary}`}>
                        {side}
                      </span>
                      <span className={`font-body text-xs ${t.muted}`}>{count}</span>
                    </span>
                  ))
                : affiliationCounts.map(({ affiliation, count }) => (
                    <span key={affiliation} className={`flex items-center gap-2 ${t.panel} px-3 py-1.5`}>
                      <span className={`font-body text-[10px] font-semibold uppercase tracking-[0.15em] ${t.primary}`}>
                        {affiliation}
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
                    // Overrides apply group-wide for couples/families/review
                    // pairs; for Individuals the override is per-guest (shown
                    // in the guest row, not on the group header).
                    const groupHasOverride =
                      group.kind !== 'individual' &&
                      group.guests.some((g) => g.name in overrides)
                    const showGroupPicker =
                      adminMode &&
                      groupingMode === 'affiliation' &&
                      group.kind !== 'individual'
                    const currentGroupAffiliation: Affiliation = showGroupPicker
                      ? effectiveAffiliation(group, overrides)
                      : 'Guests'
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
                          <span className={`flex flex-1 items-center gap-2 font-body text-base font-semibold ${t.bright}`}>
                            {groupHasOverride && <OverrideDot t={t} />}
                            <span>{group.label}</span>
                          </span>
                          <span className={`font-body text-xs ${t.muted}`}>
                            {group.guests.length}
                          </span>
                          {showGroupPicker && (
                            <OverridePicker
                              current={currentGroupAffiliation}
                              hasOverride={groupHasOverride}
                              onSet={(v) =>
                                setGroupOverride(
                                  group.guests.map((g) => g.name),
                                  v,
                                )
                              }
                              onClear={() =>
                                clearGroupOverride(group.guests.map((g) => g.name))
                              }
                              t={t}
                            />
                          )}
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
                              const showGuestPicker =
                                adminMode &&
                                groupingMode === 'affiliation' &&
                                group.kind === 'individual'
                              const guestOverride = overrides[guest.name]
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
                                  {showGuestPicker && (
                                    <OverridePicker
                                      current={
                                        guestOverride ??
                                        derivedAffiliationOfGuest(guest.name)
                                      }
                                      hasOverride={!!guestOverride}
                                      onSet={(v) =>
                                        setGroupOverride([guest.name], v)
                                      }
                                      onClear={() =>
                                        clearGroupOverride([guest.name])
                                      }
                                      t={t}
                                    />
                                  )}
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
