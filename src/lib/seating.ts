// Seating / table-arrangement data layer for /seating.
//
// Architecture (mirrors src/lib/affiliations.ts and ADR-0002):
//   - The seatable guest pool comes from the existing live RSVP sheets via
//     loadGuestSections() (guestSheets.ts) — seating never re-fetches guests.
//   - Two extra published-to-web Google Sheet tabs persist the plan:
//       tables      — columns: tableNumber, capacity
//       assignments — columns: guestName, tableNumber
//   - The admin's *working* state lives in localStorage. The /seating UI mutates
//     localStorage; the Sheet only reflects whatever the admin has Exported +
//     pasted in. There is no live write endpoint, no auth, no backend.
//
// Assignments key on guestName (normName), the same join key used by sides and
// affiliations — a renamed/removed guest orphans its assignment, surfaced in the
// UI rather than silently dropped.

import { cell, fetchCsv, headerIndex, normName } from './guestSheets'
import { copyToClipboard } from './affiliations'
import { saveRowsToSheet } from './sheetWrite'
import type { GroupKind, Guest, GuestSection } from './guestData'

export type { GroupKind }
export { copyToClipboard }

/** A reception table. Numbered, with a seat capacity. */
export type Table = { number: number; capacity: number }

/** guestName → table number. Absent = unassigned. */
export type Assignments = Record<string, number>

/** The assignable unit on the seating board. Couples / families / review pairs
 *  move as a unit (mirrors the move-as-a-unit rule in guestData.ts); individual
 *  guests are each their own unit. */
export type SeatUnit = {
  /** Stable key — the unit's guest names joined, unique within the pool. */
  id: string
  label: string
  kind: GroupKind
  guests: Guest[]
}

// Published-to-web CSV endpoint for the single seating Sheet. One tab, combined
// schema: columns `type, key, value` (see loadSeatingFromSheet). Empty string
// means "not yet configured" — the page still works locally over localStorage
// and Export still produces valid paste-able output. Mirrors AFFILIATIONS_CSV.
export const SEATING_CSV =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vRiHLq1XZTKF0yNkJHv8Dhjy3MOYrqUntVcvWYUNH7TjdcM7wNgxckNnXHoxsDu656AQPowWyYBZivJ/pub?output=csv'

// One-click write-back via a Google Apps Script web app bound to the seating
// Sheet (see seating-apps-script.gs). The page POSTs the rows; the script
// clears the sheet and writes them. Empty URL = not configured, so the UI
// falls back to the clipboard Export motion.
//
// SECURITY: this is a public endpoint and TOKEN ships in the client bundle, so
// it is obfuscation, not real auth — anyone reading the page source could POST
// and overwrite the sheet. Acceptable for a personal seating sheet; do not
// reuse this pattern for anything sensitive.
// Typed as `string` (not the literal) so config checks like `=== ''` typecheck.
export const SEATING_WRITE_URL: string =
  'https://script.google.com/macros/s/AKfycbxc3XkH9HeTYQ2eUL5-8UuyqR2Y0NMfNc1M9JYWaGu3SZUYe_iOgzAaVNTeOCd3g6nS/exec'
export const SEATING_WRITE_TOKEN = '21>!Vg7oJYvO'

/** True when the Apps Script write-back endpoint is configured. */
export const seatingWriteEnabled = (): boolean => SEATING_WRITE_URL !== ''

/** Posts the full seating dataset to the seating Apps Script web app, which
 *  whole-sheet replaces the seating Sheet. Rows use the combined `type,key,value`
 *  schema. Returns true on a confirmed `{ ok: true }`. */
export async function saveSeatingToSheet(
  tables: Table[],
  assignments: Assignments,
): Promise<boolean> {
  const rows: (string | number)[][] = [['type', 'key', 'value']]
  for (const t of [...tables].sort((a, b) => a.number - b.number)) {
    rows.push(['table', t.number, t.capacity])
  }
  for (const name of Object.keys(assignments).sort((a, b) => a.localeCompare(b))) {
    rows.push(['assignment', name, assignments[name]])
  }
  return saveRowsToSheet(SEATING_WRITE_URL, SEATING_WRITE_TOKEN, rows)
}

// localStorage keys for the picker's working state. Same convention as
// affiliations.ts: KEY MISSING = first visit (seed from the Sheet snapshot);
// KEY PRESENT (even empty) = explicit working state, never re-seed.
const TABLES_STORAGE_KEY = 'seating-tables'
const ASSIGNMENTS_STORAGE_KEY = 'seating-assignments'

// --- Unit derivation -------------------------------------------------------

/** Flattens side-grouped sections into assignable units. Non-individual groups
 *  become one unit each; individual groups split into one unit per guest. */
export function buildUnits(sections: GuestSection[]): SeatUnit[] {
  const units: SeatUnit[] = []
  for (const section of sections) {
    for (const group of section.groups) {
      if (group.kind === 'individual') {
        for (const guest of group.guests) {
          units.push({
            id: guest.name,
            label: guest.name,
            kind: 'individual',
            guests: [guest],
          })
        }
      } else {
        units.push({
          id: group.guests.map((g) => g.name).join('|'),
          label: group.label,
          kind: group.kind,
          guests: group.guests,
        })
      }
    }
  }
  return units
}

/** The table a unit is assigned to, or null. A unit is considered assigned to
 *  the table of its first guest that has an assignment (all guests in a unit are
 *  set together, so in practice they agree). */
export function unitTable(unit: SeatUnit, assignments: Assignments): number | null {
  for (const guest of unit.guests) {
    const t = assignments[guest.name]
    if (typeof t === 'number') return t
  }
  return null
}

/** Guests (across all units) seated at a given table, in pool order. */
export function guestsAtTable(
  table: number,
  units: SeatUnit[],
  assignments: Assignments,
): { guest: Guest; unit: SeatUnit }[] {
  const out: { guest: Guest; unit: SeatUnit }[] = []
  for (const unit of units) {
    for (const guest of unit.guests) {
      if (assignments[guest.name] === table) out.push({ guest, unit })
    }
  }
  return out
}

/** Seat count at a table (pool guests only — orphans aren't counted). */
export function tableFill(
  table: number,
  units: SeatUnit[],
  assignments: Assignments,
): number {
  return guestsAtTable(table, units, assignments).length
}

/** Assignment rows whose guest no longer exists in the live pool — surfaced for
 *  reconciliation rather than silently dropped. */
export function orphanedAssignments(
  units: SeatUnit[],
  assignments: Assignments,
): { name: string; table: number }[] {
  const known = new Set<string>()
  for (const unit of units) for (const g of unit.guests) known.add(g.name)
  return Object.entries(assignments)
    .filter(([name]) => !known.has(name))
    .map(([name, table]) => ({ name, table }))
}

// --- Sheet read ------------------------------------------------------------

/** Reads the seating Sheet (one tab, columns `type, key, value`) into tables +
 *  assignments:
 *    type=table       → key = tableNumber, value = capacity
 *    type=assignment  → key = guestName,   value = tableNumber
 *  Forgiving on bad rows. Empty on missing URL, parse failure, or fetch failure. */
export async function loadSeatingFromSheet(): Promise<{
  tables: Table[]
  assignments: Assignments
}> {
  const empty = { tables: [] as Table[], assignments: {} as Assignments }
  if (!SEATING_CSV) return empty
  try {
    const rows = await fetchCsv(SEATING_CSV)
    if (rows.length < 2) return empty
    const head = headerIndex(rows[0])
    const tables: Table[] = []
    const assignments: Assignments = {}
    for (const row of rows.slice(1)) {
      const type = cell(row, head['type']).trim().toLowerCase()
      const key = normName(cell(row, head['key']))
      const value = cell(row, head['value']).trim()
      if (type === 'table') {
        const number = parseInt(key, 10)
        const capacity = parseInt(value, 10)
        if (!Number.isFinite(number)) continue
        tables.push({ number, capacity: Number.isFinite(capacity) ? capacity : 0 })
      } else if (type === 'assignment') {
        const table = parseInt(value, 10)
        if (!key || !Number.isFinite(table)) continue
        assignments[key] = table
      }
    }
    return { tables, assignments }
  } catch {
    return empty
  }
}

// --- localStorage ----------------------------------------------------------

/** Returns null when the key is missing (first visit), the parsed value
 *  otherwise (even if empty). */
export function loadLocalTables(): Table[] | null {
  if (typeof window === 'undefined') return null
  const raw = window.localStorage.getItem(TABLES_STORAGE_KEY)
  if (raw === null) return null
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      return parsed.filter(
        (x): x is Table =>
          x && typeof x.number === 'number' && typeof x.capacity === 'number',
      )
    }
  } catch {
    // Fall through.
  }
  return null
}

export function saveLocalTables(tables: Table[]): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(TABLES_STORAGE_KEY, JSON.stringify(tables))
}

export function loadLocalAssignments(): Assignments | null {
  if (typeof window === 'undefined') return null
  const raw = window.localStorage.getItem(ASSIGNMENTS_STORAGE_KEY)
  if (raw === null) return null
  try {
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Assignments
    }
  } catch {
    // Fall through.
  }
  return null
}

export function saveLocalAssignments(map: Assignments): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(ASSIGNMENTS_STORAGE_KEY, JSON.stringify(map))
}

// --- Equality (for the unpublished-changes indicator) ----------------------

export function tablesEqual(a: Table[], b: Table[]): boolean {
  if (a.length !== b.length) return false
  const sort = (xs: Table[]) => [...xs].sort((x, y) => x.number - y.number)
  const as = sort(a)
  const bs = sort(b)
  return as.every((t, i) => t.number === bs[i].number && t.capacity === bs[i].capacity)
}

export function assignmentsEqual(a: Assignments, b: Assignments): boolean {
  const ak = Object.keys(a)
  if (ak.length !== Object.keys(b).length) return false
  return ak.every((k) => a[k] === b[k])
}

// --- Export ----------------------------------------------------------------

/** TSV for the seating Sheet — header `type, key, value` + table rows (sorted by
 *  number) then assignment rows (sorted by name, for stable Sheet diffs). The
 *  admin pastes this whole-sheet-replace into the seating Sheet. */
export function exportSeatingTSV(tables: Table[], assignments: Assignments): string {
  const lines = ['type\tkey\tvalue']
  for (const t of [...tables].sort((a, b) => a.number - b.number)) {
    lines.push(`table\t${t.number}\t${t.capacity}`)
  }
  for (const name of Object.keys(assignments).sort((a, b) => a.localeCompare(b))) {
    lines.push(`assignment\t${name}\t${assignments[name]}`)
  }
  return lines.join('\n')
}
