'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { GuestSection } from '@/lib/guestData'
import { loadGuestSections } from '@/lib/guestSheets'
import {
  assignmentsEqual,
  buildUnits,
  copyToClipboard,
  exportSeatingTSV,
  isSponsor,
  loadLocalAssignments,
  loadLocalSplits,
  loadLocalTables,
  loadSeatingFromSheet,
  orphanedAssignments,
  saveLocalAssignments,
  saveLocalSplits,
  saveLocalTables,
  saveSeatingToSheet,
  seatingWriteEnabled,
  splitsEqual,
  tableDisplayName,
  tableLabelOf,
  tablesEqual,
  unitTable,
  type Assignments,
  type SeatUnit,
  type Splits,
  type Table,
} from '@/lib/seating'
import {
  BADGE_LABEL,
  type ColorScheme,
  COLOR_SCHEME_STORAGE_KEY,
  DropdownPicker,
  MoonIcon,
  OverrideDot,
  Spinner,
  SunIcon,
  type Theme,
  THEMES,
  WarnIcon,
} from '@/components/guestsShared'

// The seating board is live-only, same as /guests: until loadGuestSections()
// confirms, the pool is empty and the sync gate withholds render. Tables and
// assignments come from localStorage + the (optional) seating Sheet.
const EMPTY_SECTIONS: GuestSection[] = []

const DEFAULT_CAPACITY = 10

type SyncStatus = 'loading' | 'live' | 'fallback'

function PlusIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

function PrinterIcon() {
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
      <path d="M6 9V2h12v7" />
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <rect x="6" y="14" width="12" height="8" />
    </svg>
  )
}

export default function SeatingChart() {
  const [data, setData] = useState<GuestSection[]>(EMPTY_SECTIONS)
  const [status, setStatus] = useState<SyncStatus>('loading')
  const [syncedAt, setSyncedAt] = useState('')
  const [mode, setMode] = useState<ColorScheme>('dark')
  const t = THEMES[mode]
  const [adminMode, setAdminMode] = useState(false)
  const [query, setQuery] = useState('')
  const [sponsorsOnly, setSponsorsOnly] = useState(false)

  // Working state (localStorage-mirrored) + the Sheet snapshot taken at load,
  // used to flag unpublished changes. Mirrors the affiliations pattern.
  const [tables, setTables] = useState<Table[]>([])
  const [assignments, setAssignments] = useState<Assignments>({})
  const [splits, setSplits] = useState<Splits>([])
  const [tablesSnapshot, setTablesSnapshot] = useState<Table[]>([])
  const [assignmentsSnapshot, setAssignmentsSnapshot] = useState<Assignments>({})
  const [splitsSnapshot, setSplitsSnapshot] = useState<Splits>([])
  const [newCapacity, setNewCapacity] = useState(DEFAULT_CAPACITY)
  const [exportFeedback, setExportFeedback] = useState('')
  const [saving, setSaving] = useState(false)
  const writeEnabled = seatingWriteEnabled()

  // Read the admin gate once on mount (UX-only, same as /guests).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setAdminMode(params.get('admin') === '1')
  }, [])

  const load = useCallback(async () => {
    setStatus('loading')
    try {
      const [sections, seating] = await Promise.all([
        loadGuestSections(),
        loadSeatingFromSheet(),
      ])
      setData(sections)
      setTablesSnapshot(seating.tables)
      setAssignmentsSnapshot(seating.assignments)
      setSplitsSnapshot(seating.splits)

      // Seed working state from the Sheet only on first visit (key missing).
      const savedTables = loadLocalTables()
      if (savedTables === null) {
        setTables(seating.tables)
        saveLocalTables(seating.tables)
      } else {
        setTables(savedTables)
      }
      const savedAssign = loadLocalAssignments()
      if (savedAssign === null) {
        setAssignments(seating.assignments)
        saveLocalAssignments(seating.assignments)
      } else {
        setAssignments(savedAssign)
      }
      const savedSplits = loadLocalSplits()
      if (savedSplits === null) {
        setSplits(seating.splits)
        saveLocalSplits(seating.splits)
      } else {
        setSplits(savedSplits)
      }

      setStatus('live')
      setSyncedAt(new Date().toLocaleTimeString())
    } catch {
      // Guest pool unreachable — gate the page; the seating plan needs the pool.
      setData(EMPTY_SECTIONS)
      setStatus('fallback')
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  // Reconcile + persist the (shared) color scheme.
  useEffect(() => {
    const saved = localStorage.getItem(COLOR_SCHEME_STORAGE_KEY)
    if (saved === 'light' || saved === 'dark') setMode(saved)
  }, [])
  useEffect(() => {
    localStorage.setItem(COLOR_SCHEME_STORAGE_KEY, mode)
  }, [mode])

  const toggleMode = useCallback(() => {
    setMode((m) => (m === 'dark' ? 'light' : 'dark'))
  }, [])

  // --- Mutations -----------------------------------------------------------

  const assignUnit = useCallback((unit: SeatUnit, table: number) => {
    setAssignments((prev) => {
      const next = { ...prev }
      for (const g of unit.guests) next[g.name] = table
      saveLocalAssignments(next)
      return next
    })
  }, [])

  const unassignUnit = useCallback((unit: SeatUnit) => {
    setAssignments((prev) => {
      const next = { ...prev }
      for (const g of unit.guests) delete next[g.name]
      saveLocalAssignments(next)
      return next
    })
  }, [])

  const addTable = useCallback(() => {
    setTables((prev) => {
      const nextNumber = prev.length
        ? Math.max(...prev.map((x) => x.number)) + 1
        : 1
      const cap = Number.isFinite(newCapacity) && newCapacity > 0 ? newCapacity : DEFAULT_CAPACITY
      const next = [...prev, { number: nextNumber, capacity: cap }]
      saveLocalTables(next)
      return next
    })
  }, [newCapacity])

  const updateCapacity = useCallback((number: number, capacity: number) => {
    setTables((prev) => {
      const next = prev.map((x) =>
        x.number === number ? { ...x, capacity: Math.max(0, capacity) } : x,
      )
      saveLocalTables(next)
      return next
    })
  }, [])

  // Display name for a table ("VIP 1"); blank reverts to "Table N".
  const renameTable = useCallback((number: number, label: string) => {
    setTables((prev) => {
      const next = prev.map((x) =>
        x.number === number
          ? { ...x, label: label.trim() === '' ? undefined : label }
          : x,
      )
      saveLocalTables(next)
      return next
    })
  }, [])

  // Carve a couple/family unit into per-guest units so each member can be
  // seated independently (sponsor at a VIP table, +1 elsewhere). Existing
  // assignments carry over — both halves stay where the unit was seated until
  // moved.
  const splitUnit = useCallback((unit: SeatUnit) => {
    setSplits((prev) => {
      if (prev.includes(unit.id)) return prev
      const next = [...prev, unit.id]
      saveLocalSplits(next)
      return next
    })
  }, [])

  // Restore a split unit. Members may sit at different tables by now, so their
  // seats are cleared — the merged unit is reseated together, deliberately.
  const mergeUnit = useCallback((unit: SeatUnit) => {
    const originalId = unit.splitFrom
    if (!originalId) return
    const members = originalId.split('|')
    if (
      !window.confirm(
        `Merge ${members.join(' & ')} back into one unit? Their current seats will be cleared so you can reseat them together.`,
      )
    ) {
      return
    }
    setSplits((prev) => {
      const next = prev.filter((id) => id !== originalId)
      saveLocalSplits(next)
      return next
    })
    setAssignments((prev) => {
      const next = { ...prev }
      for (const name of members) delete next[name]
      saveLocalAssignments(next)
      return next
    })
  }, [])

  const removeTable = useCallback(
    (table: Table) => {
      const number = table.number
      if (
        !window.confirm(
          `Remove ${tableLabelOf(table)}? Anyone seated there will be moved back to Unassigned.`,
        )
      ) {
        return
      }
      setTables((prev) => {
        const next = prev.filter((x) => x.number !== number)
        saveLocalTables(next)
        return next
      })
      // Unassign everyone who was at that table.
      setAssignments((prev) => {
        const next: Assignments = {}
        for (const [name, table] of Object.entries(prev)) {
          if (table !== number) next[name] = table
        }
        saveLocalAssignments(next)
        return next
      })
    },
    [],
  )

  const clearOrphans = useCallback((orphanNames: string[]) => {
    setAssignments((prev) => {
      const next = { ...prev }
      for (const name of orphanNames) delete next[name]
      saveLocalAssignments(next)
      return next
    })
  }, [])

  const handleExport = useCallback(async () => {
    const tsv = exportSeatingTSV(tables, assignments, splits)
    const ok = await copyToClipboard(tsv)
    setExportFeedback(
      ok
        ? `Copied ${tables.length} table(s) + ${Object.keys(assignments).length} seat(s). Paste into the seating Sheet (select all → delete → paste).`
        : 'Copy failed — clipboard not available in this browser.',
    )
    window.setTimeout(() => setExportFeedback(''), 4000)
  }, [tables, assignments, splits])

  // One-click write-back via the Apps Script proxy. On success, advance the
  // snapshot to the just-saved state so the "Unpublished" badge clears.
  const handleSave = useCallback(async () => {
    setSaving(true)
    const ok = await saveSeatingToSheet(tables, assignments, splits)
    setSaving(false)
    if (ok) {
      setTablesSnapshot(tables)
      setAssignmentsSnapshot(assignments)
      setSplitsSnapshot(splits)
      setExportFeedback('Saved to the seating Sheet.')
    } else {
      setExportFeedback('Save failed — check your connection, or use Export as a fallback.')
    }
    window.setTimeout(() => setExportFeedback(''), 4000)
  }, [tables, assignments, splits])

  // --- Derived -------------------------------------------------------------

  const units = useMemo(() => buildUnits(data, new Set(splits)), [data, splits])
  const sortedTables = useMemo(
    () => [...tables].sort((a, b) => a.number - b.number),
    [tables],
  )
  // Display names ("VIP 1" / "Table 3"). Resolved back to table numbers by
  // index — labels may contain digits, so parsing them is not safe.
  const tableOptions = useMemo(
    () => sortedTables.map(tableLabelOf),
    [sortedTables],
  )
  const orphans = useMemo(
    () => orphanedAssignments(units, assignments),
    [units, assignments],
  )

  const q = query.trim().toLowerCase()
  const matchesQuery = useCallback(
    (unit: SeatUnit) =>
      (!q || unit.guests.some((g) => g.name.toLowerCase().includes(q))) &&
      (!sponsorsOnly || unit.guests.some((g) => isSponsor(g.name))),
    [q, sponsorsOnly],
  )

  const unitsAtTable = useCallback(
    (number: number) =>
      units.filter(
        (u) => unitTable(u, assignments) === number && matchesQuery(u),
      ),
    [units, assignments, matchesQuery],
  )

  const unassignedUnits = useMemo(
    () => units.filter((u) => unitTable(u, assignments) === null && matchesQuery(u)),
    [units, assignments, matchesQuery],
  )

  const allGuests = useMemo(() => units.flatMap((u) => u.guests), [units])
  const assignedCount = useMemo(
    () => allGuests.filter((g) => typeof assignments[g.name] === 'number').length,
    [allGuests, assignments],
  )

  const hasUnpublishedChanges =
    !tablesEqual(tables, tablesSnapshot) ||
    !assignmentsEqual(assignments, assignmentsSnapshot) ||
    !splitsEqual(splits, splitsSnapshot)

  const statCards = [
    { value: allGuests.length, label: 'Attending' },
    { value: assignedCount, label: 'Seated' },
    { value: allGuests.length - assignedCount, label: 'Unassigned' },
    { value: tables.length, label: 'Tables' },
  ]

  const statusText =
    status === 'loading'
      ? 'Syncing with Google Sheets…'
      : status === 'live'
        ? `Live from Google Sheets · synced ${syncedAt}`
        : 'Offline — sync failed'

  // Picker for a single unit — assign to a table or unassign.
  const renderPicker = (unit: SeatUnit) => {
    if (!adminMode || tableOptions.length === 0) return null
    const current = unitTable(unit, assignments)
    return (
      <DropdownPicker<string>
        current={current === null ? 'Assign' : tableDisplayName(current, sortedTables)}
        options={tableOptions}
        hasSelection={current !== null}
        onSelect={(val) => {
          const idx = tableOptions.indexOf(val)
          if (idx >= 0) assignUnit(unit, sortedTables[idx].number)
        }}
        onClear={() => unassignUnit(unit)}
        clearLabel="Unassign"
        ariaLabel="Assign to table"
        t={t}
      />
    )
  }

  const renderGuestRow = (unit: SeatUnit) => (
    <div key={unit.id} className={`border-t ${t.panelBorder} py-2.5`}>
      <div className="flex items-center gap-2">
        <span
          className={`font-body text-[10px] uppercase tracking-[0.15em] px-2 py-0.5 ${t.badge[unit.kind]}`}
        >
          {BADGE_LABEL[unit.kind]}
        </span>
        <span className={`flex-1 font-body text-sm font-semibold ${t.bright}`}>
          {unit.label}
        </span>
        {adminMode && unit.guests.length > 1 && !unit.splitFrom && (
          <button
            type="button"
            onClick={() => splitUnit(unit)}
            title="Seat each member independently"
            className={`border ${t.refreshBtn} px-2 py-0.5 font-body text-[10px] uppercase tracking-[0.12em] transition-colors`}
          >
            Split
          </button>
        )}
        {adminMode && unit.splitFrom && (
          <button
            type="button"
            onClick={() => mergeUnit(unit)}
            title="Rejoin this guest with their original unit"
            className={`border ${t.refreshBtn} px-2 py-0.5 font-body text-[10px] uppercase tracking-[0.12em] transition-colors`}
          >
            Merge
          </button>
        )}
        {renderPicker(unit)}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
        {unit.guests.map((guest) => (
          <span key={guest.name} className="flex items-center gap-2">
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-body text-[10px] font-semibold ${
                guest.flag ? t.avatarFlag : t.avatar
              }`}
            >
              {guest.initials}
            </span>
            <span className={`font-body text-sm ${t.bright}`}>{guest.name}</span>
            {isSponsor(guest.name) && (
              <span
                className={`font-body text-[10px] uppercase tracking-[0.12em] ${t.accent}`}
              >
                Sponsor
              </span>
            )}
            {guest.source === 'plus-one' && (
              <span className={`font-body text-[11px] ${t.faint}`}>+1</span>
            )}
            {guest.flag && (
              <span
                className={`border-l-2 pl-1.5 font-body text-[10px] ${t.flagNote}`}
                title={guest.flag}
              >
                review
              </span>
            )}
          </span>
        ))}
      </div>
    </div>
  )

  return (
    <main
      className={`min-h-screen ${t.page} px-4 py-12 transition-colors duration-200 sm:py-16`}
    >
      <div className="mx-auto max-w-2xl">
        <header className="mb-8 text-center print:hidden">
          <h1 className={`font-script text-5xl ${t.primary} sm:text-6xl`}>
            Seating Chart
          </h1>
          <p
            className={`mt-2 font-body text-xs uppercase tracking-[0.35em] ${t.secondary}`}
          >
            Jun &amp; Ariane · Reception Tables
          </p>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-3">
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
              onClick={() => window.print()}
              aria-label="Print seating chart"
              className={`border ${t.refreshBtn} flex items-center justify-center px-2.5 py-1 transition-colors`}
            >
              <PrinterIcon />
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

          {adminMode && (
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
                {writeEnabled ? 'Export' : 'Export to Sheet'} ({tables.length}t · {Object.keys(assignments).length}s)
              </button>
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
          <div className="print:hidden">
            <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {statCards.map((stat) => (
                <div key={stat.label} className={`${t.panel} px-4 py-3 text-center`}>
                  <div
                    className={`font-body text-3xl font-semibold leading-none ${t.bright}`}
                  >
                    {stat.value}
                  </div>
                  <div
                    className={`mt-1.5 font-body text-[10px] uppercase tracking-[0.2em] ${t.muted}`}
                  >
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>

            {orphans.length > 0 && (
              <div className={`mb-6 ${t.panel} px-4 py-3`}>
                <div className={`flex items-center gap-2 font-body text-sm ${t.accent}`}>
                  <span className="font-semibold">
                    {orphans.length} seated guest{orphans.length > 1 ? 's' : ''} no longer in
                    the RSVP list
                  </span>
                </div>
                <p className={`mt-1 font-body text-xs ${t.muted}`}>
                  {orphans.map((o) => `${o.name} (Table ${o.table})`).join(', ')}
                </p>
                {adminMode && (
                  <button
                    type="button"
                    onClick={() => clearOrphans(orphans.map((o) => o.name))}
                    className={`mt-2 border ${t.refreshBtn} px-3 py-1 font-body text-[10px] uppercase tracking-[0.15em] transition-colors`}
                  >
                    Clear orphaned seats
                  </button>
                )}
              </div>
            )}

            <div className={`mb-6 flex items-center gap-2 ${t.panel} px-3`}>
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
              <button
                type="button"
                onClick={() => setSponsorsOnly((v) => !v)}
                aria-pressed={sponsorsOnly}
                title="Show only principal sponsors"
                className={`shrink-0 border px-2.5 py-1 font-body text-[10px] uppercase tracking-[0.15em] transition-colors ${
                  sponsorsOnly ? `${t.flagNote} font-semibold` : t.refreshBtn
                }`}
              >
                Sponsors
              </button>
            </div>

            {/* Tables */}
            {sortedTables.map((tb) => {
              const seated = unitsAtTable(tb.number)
              const fill = seated.reduce((n, u) => n + u.guests.length, 0)
              const over = tb.capacity > 0 && fill > tb.capacity
              return (
                <section key={tb.number} className={`mb-3 ${t.panel}`}>
                  <div className="flex flex-wrap items-center gap-3 px-4 py-3">
                    <h2 className={`flex-1 font-body text-lg font-semibold ${t.bright}`}>
                      {tableLabelOf(tb)}
                    </h2>
                    <span
                      className={`font-body text-sm ${over ? t.accent : t.muted}`}
                    >
                      {fill} / {tb.capacity}
                      {over && ' · over capacity'}
                    </span>
                    {adminMode && (
                      <>
                        <input
                          type="text"
                          value={tb.label ?? ''}
                          onChange={(e) => renameTable(tb.number, e.target.value)}
                          placeholder={`Table ${tb.number}`}
                          aria-label={`Name for Table ${tb.number}`}
                          className={`w-24 border ${t.panelBorder} bg-transparent px-1.5 py-0.5 font-body text-sm ${t.input} ${t.placeholder}`}
                        />
                        <label className="flex items-center gap-1">
                          <span className={`font-body text-[10px] uppercase tracking-[0.12em] ${t.dimmed}`}>
                            cap
                          </span>
                          <input
                            type="number"
                            min={0}
                            value={tb.capacity}
                            onChange={(e) =>
                              updateCapacity(tb.number, parseInt(e.target.value, 10) || 0)
                            }
                            className={`w-14 border ${t.panelBorder} bg-transparent px-1.5 py-0.5 font-body text-sm ${t.input}`}
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => removeTable(tb)}
                          aria-label={`Remove ${tableLabelOf(tb)}`}
                          className={`border ${t.refreshBtn} px-2 py-0.5 font-body text-[10px] uppercase tracking-[0.12em] transition-colors`}
                        >
                          Remove
                        </button>
                      </>
                    )}
                  </div>
                  {seated.length > 0 && (
                    <div className="px-4 pb-1">{seated.map(renderGuestRow)}</div>
                  )}
                  {seated.length === 0 && (
                    <p className={`px-4 pb-3 font-body text-xs italic ${t.dimmed}`}>
                      No one seated here yet
                    </p>
                  )}
                </section>
              )
            })}

            {adminMode && (
              <div className="mb-8 mt-2 flex items-center justify-center gap-2">
                <label className="flex items-center gap-1.5">
                  <span className={`font-body text-[11px] uppercase tracking-[0.12em] ${t.muted}`}>
                    capacity
                  </span>
                  <input
                    type="number"
                    min={1}
                    value={newCapacity}
                    onChange={(e) => setNewCapacity(parseInt(e.target.value, 10) || 0)}
                    className={`w-16 border ${t.panelBorder} bg-transparent px-2 py-1 font-body text-sm ${t.input}`}
                  />
                </label>
                <button
                  type="button"
                  onClick={addTable}
                  className={`flex items-center gap-1.5 border ${t.refreshBtn} px-3 py-1.5 font-body text-[11px] uppercase tracking-[0.15em] transition-colors`}
                >
                  <PlusIcon />
                  Add table
                </button>
              </div>
            )}

            {/* Unassigned */}
            <section className={`mb-6 ${t.panel}`}>
              <h2
                className={`flex items-baseline justify-between px-4 py-3 font-body text-[11px] uppercase tracking-[0.25em] ${t.muted}`}
              >
                <span>Unassigned</span>
                <span className={t.dimmed}>
                  {unassignedUnits.reduce((n, u) => n + u.guests.length, 0)}
                </span>
              </h2>
              {unassignedUnits.length > 0 ? (
                <div className="px-4 pb-1">{unassignedUnits.map(renderGuestRow)}</div>
              ) : (
                <p className={`px-4 pb-3 font-body text-xs italic ${t.dimmed}`}>
                  {q || sponsorsOnly ? 'No matches' : 'Everyone has a seat 🎉'}
                </p>
              )}
            </section>
          </div>
        ) : (
          <div className={`${t.panel} px-6 py-10 text-center`}>
            {status === 'loading' ? <Spinner t={t} /> : <WarnIcon t={t} />}
            <p className={`mt-4 font-body text-base ${t.bright}`}>
              {status === 'loading'
                ? 'Syncing with Google Sheets…'
                : 'Couldn’t sync with Google Sheets'}
            </p>
            <p className={`mt-1.5 font-body text-xs leading-relaxed ${t.muted}`}>
              {status === 'loading'
                ? 'The seating board stays hidden until the guest list is confirmed up to date.'
                : 'The board is hidden to avoid seating against outdated data. Check your connection and try again.'}
            </p>
            {status === 'fallback' && (
              <button
                type="button"
                onClick={load}
                className={`mt-5 border ${t.refreshBtn} px-5 py-2 font-body text-[11px] uppercase tracking-[0.15em] transition-colors`}
              >
                Retry sync
              </button>
            )}
          </div>
        )}

        {/* Print view — clean, plain layout for handing to the coordinator. */}
        {status === 'live' && (
          <div className="hidden text-black print:block">
            <h1 className="mb-4 text-2xl font-semibold">
              Jun &amp; Ariane — Seating Chart
            </h1>
            {sortedTables.map((tb) => {
              const seated = units.filter((u) => unitTable(u, assignments) === tb.number)
              const names = seated.flatMap((u) => u.guests.map((g) => g.name))
              return (
                <div key={tb.number} className="mb-3 break-inside-avoid">
                  <h2 className="text-lg font-semibold">
                    {tableLabelOf(tb)}{' '}
                    <span className="text-sm font-normal">
                      ({names.length} / {tb.capacity})
                    </span>
                  </h2>
                  <p className="text-sm">{names.join(' · ') || '—'}</p>
                </div>
              )
            })}
          </div>
        )}

        <p
          className={`mt-10 text-center font-body text-xs leading-relaxed ${t.dimmed} print:hidden`}
        >
          Source: Jun &amp; Ariane Wedding RSVP form responses · Google Sheets.
        </p>
      </div>
    </main>
  )
}
