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
import { ENTOURAGE } from './constants'
import type { GroupKind, Guest, GuestSection } from './guestData'

export type { GroupKind }
export { copyToClipboard }

/** A reception table. Numbered, with a seat capacity and an optional display
 *  name (e.g. "VIP 1") that overrides "Table N" everywhere it's shown. */
export type Table = { number: number; capacity: number; label?: string }

/** guestName → table number. Absent = unassigned. */
export type Assignments = Record<string, number>

/** Unit ids (see SeatUnit.id) the admin has split into per-guest units — e.g.
 *  a sponsor seated at a VIP table while their +1 sits elsewhere. Persisted
 *  alongside tables/assignments so the split survives reloads. */
export type Splits = string[]

/** The assignable unit on the seating board. Couples / families / review pairs
 *  move as a unit (mirrors the move-as-a-unit rule in guestData.ts); individual
 *  guests are each their own unit. */
export type SeatUnit = {
  /** Stable key — the unit's guest names joined, unique within the pool. */
  id: string
  label: string
  kind: GroupKind
  guests: Guest[]
  /** Set on per-guest units carved out of a split group — the original unit's
   *  id, used by the Merge action to restore the group. */
  splitFrom?: string
}

/** Display name for a table — its label when set, "Table N" otherwise. */
export function tableLabelOf(table: Table): string {
  const label = table.label?.trim()
  return label ? label : `Table ${table.number}`
}

/** Display name for a table number against the table list. */
export function tableDisplayName(number: number, tables: Table[]): string {
  const table = tables.find((t) => t.number === number)
  return table ? tableLabelOf(table) : `Table ${number}`
}

// --- Sponsors ----------------------------------------------------------------

// Principal sponsors get a tag on the seating board so they're easy to round up
// for the VIP tables. Names come from ENTOURAGE (single source of truth);
// honorifics are stripped before matching because RSVP names usually omit them
// ("Raymond Deniña" vs "Dr. Raymond Deniña"). Matching is exact after that —
// conservative on purpose; a differently-spelled RSVP name just won't tag.
const HONORIFICS = /^(architect|arch|atty|dr|engr|mrs|ms|mr|mx)\.?\s+/i

function sponsorKey(name: string): string {
  let s = normName(name)
  for (;;) {
    const next = s.replace(HONORIFICS, '')
    if (next === s) break
    s = next
  }
  return s.toLowerCase()
}

const SPONSOR_KEYS: ReadonlySet<string> = new Set(
  ENTOURAGE.principalSponsors.flatMap((pair) => [
    sponsorKey(pair.ninang),
    sponsorKey(pair.ninong),
  ]),
)

/** True when the guest is a principal sponsor (per ENTOURAGE). */
export function isSponsor(name: string): boolean {
  return SPONSOR_KEYS.has(sponsorKey(name))
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
  splits: Splits,
): Promise<boolean> {
  const rows: (string | number)[][] = [['type', 'key', 'value']]
  for (const row of seatingRows(tables, assignments, splits)) rows.push(row)
  return saveRowsToSheet(SEATING_WRITE_URL, SEATING_WRITE_TOKEN, rows)
}

/** The seating dataset as `type, key, value` rows (no header) — shared by the
 *  Apps Script save and the clipboard TSV export so the two can't drift. */
function seatingRows(
  tables: Table[],
  assignments: Assignments,
  splits: Splits,
): (string | number)[][] {
  const rows: (string | number)[][] = []
  const sortedTables = [...tables].sort((a, b) => a.number - b.number)
  for (const t of sortedTables) {
    rows.push(['table', t.number, t.capacity])
  }
  for (const t of sortedTables) {
    const label = t.label?.trim()
    if (label) rows.push(['label', t.number, label])
  }
  for (const name of Object.keys(assignments).sort((a, b) => a.localeCompare(b))) {
    rows.push(['assignment', name, assignments[name]])
  }
  for (const id of [...splits].sort((a, b) => a.localeCompare(b))) {
    rows.push(['split', id, 1])
  }
  return rows
}

// localStorage keys for the picker's working state. Same convention as
// affiliations.ts: KEY MISSING = first visit (seed from the Sheet snapshot);
// KEY PRESENT (even empty) = explicit working state, never re-seed.
const TABLES_STORAGE_KEY = 'seating-tables'
const ASSIGNMENTS_STORAGE_KEY = 'seating-assignments'
const SPLITS_STORAGE_KEY = 'seating-splits'

// --- Unit derivation -------------------------------------------------------

/** Flattens side-grouped sections into assignable units. Non-individual groups
 *  become one unit each; individual groups split into one unit per guest.
 *  Groups whose id is in `splits` are carved into per-guest units (tagged with
 *  `splitFrom`) so each member can be seated independently — the escape hatch
 *  from the move-as-a-unit rule, e.g. a sponsor at a VIP table while their +1
 *  sits elsewhere. */
export function buildUnits(
  sections: GuestSection[],
  splits?: ReadonlySet<string>,
): SeatUnit[] {
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
        const id = group.guests.map((g) => g.name).join('|')
        if (splits?.has(id)) {
          for (const guest of group.guests) {
            units.push({
              id: guest.name,
              label: guest.name,
              kind: 'individual',
              guests: [guest],
              splitFrom: id,
            })
          }
        } else {
          units.push({ id, label: group.label, kind: group.kind, guests: group.guests })
        }
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

// --- Receptionist roster ---------------------------------------------------

/** One row of the receptionist roster: a guest and where they sit. `table` is
 *  null for guests not yet assigned (rendered in the trailing Unassigned block).
 *  Built from the live unit pool, so orphaned assignments never appear. */
export type RosterEntry = { name: string; table: number | null; tableLabel: string | null }

/** Every attending guest as a flat `name → table` list sorted alphabetically by
 *  name — the receptionist's lookup key. Seated guests carry their table's
 *  display label ("VIP 1" / "Table 3"); unassigned guests carry null. No +1 /
 *  review / sponsor annotations — name and table only. */
export function buildRoster(
  units: SeatUnit[],
  assignments: Assignments,
  tables: Table[],
): RosterEntry[] {
  const entries: RosterEntry[] = []
  for (const unit of units) {
    for (const guest of unit.guests) {
      const table = assignments[guest.name]
      if (typeof table === 'number') {
        entries.push({ name: guest.name, table, tableLabel: tableDisplayName(table, tables) })
      } else {
        entries.push({ name: guest.name, table: null, tableLabel: null })
      }
    }
  }
  return entries.sort((a, b) => a.name.localeCompare(b.name))
}

// --- Guest-facing lookup ---------------------------------------------------

/** A guest's seating result: the matched name, their table (number + display
 *  name, e.g. "VIP 1"), and tablemates. */
export type GuestSeat = {
  name: string
  table: number
  tableLabel: string
  tablemates: string[]
}

/** Finds seated guests whose name contains `query` (trim + collapse + lowercase
 *  substring match), each with their table number and the other names at that
 *  table. Returns [] for queries shorter than `minLen` (so a 1–2 char query
 *  can't enumerate the chart). Results are sorted by table, then name. */
export function findSeats(
  query: string,
  assignments: Assignments,
  tables: Table[] = [],
  minLen = 3,
): GuestSeat[] {
  const q = normName(query).toLowerCase()
  if (q.length < minLen) return []
  const entries = Object.entries(assignments)
  return entries
    .filter(([name]) => name.toLowerCase().includes(q))
    .sort((a, b) => a[1] - b[1] || a[0].localeCompare(b[0]))
    .map(([name, table]) => ({
      name,
      table,
      tableLabel: tableDisplayName(table, tables),
      tablemates: entries
        .filter(([n, t]) => t === table && n !== name)
        .map(([n]) => n)
        .sort((a, b) => a.localeCompare(b)),
    }))
}

// --- Sheet read ------------------------------------------------------------

/** Reads the seating Sheet (one tab, columns `type, key, value`) into tables +
 *  assignments + splits:
 *    type=table       → key = tableNumber, value = capacity
 *    type=label       → key = tableNumber, value = display name (e.g. "VIP 1")
 *    type=assignment  → key = guestName,   value = tableNumber
 *    type=split       → key = unit id (member names joined by "|")
 *  Forgiving on bad rows. Empty on missing URL, parse failure, or fetch failure. */
export async function loadSeatingFromSheet(): Promise<{
  tables: Table[]
  assignments: Assignments
  splits: Splits
}> {
  const empty = {
    tables: [] as Table[],
    assignments: {} as Assignments,
    splits: [] as Splits,
  }
  if (!SEATING_CSV) return empty
  try {
    const rows = await fetchCsv(SEATING_CSV)
    if (rows.length < 2) return empty
    const head = headerIndex(rows[0])
    const tables: Table[] = []
    const assignments: Assignments = {}
    const splits: Splits = []
    // Collected separately and applied after the loop — a hand-edited sheet
    // may order label rows before their table rows.
    const labels = new Map<number, string>()
    for (const row of rows.slice(1)) {
      const type = cell(row, head['type']).trim().toLowerCase()
      const key = normName(cell(row, head['key']))
      const value = cell(row, head['value']).trim()
      if (type === 'table') {
        const number = parseInt(key, 10)
        const capacity = parseInt(value, 10)
        if (!Number.isFinite(number)) continue
        tables.push({ number, capacity: Number.isFinite(capacity) ? capacity : 0 })
      } else if (type === 'label') {
        const number = parseInt(key, 10)
        if (!Number.isFinite(number) || !value) continue
        labels.set(number, value)
      } else if (type === 'assignment') {
        const table = parseInt(value, 10)
        if (!key || !Number.isFinite(table)) continue
        assignments[key] = table
      } else if (type === 'split') {
        if (key && !splits.includes(key)) splits.push(key)
      }
    }
    for (const table of tables) {
      const label = labels.get(table.number)
      if (label) table.label = label
    }
    return { tables, assignments, splits }
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
      return parsed
        .filter(
          (x): x is Table =>
            x && typeof x.number === 'number' && typeof x.capacity === 'number',
        )
        .map((x) => ({
          number: x.number,
          capacity: x.capacity,
          ...(typeof x.label === 'string' && x.label.trim() !== ''
            ? { label: x.label }
            : {}),
        }))
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

export function loadLocalSplits(): Splits | null {
  if (typeof window === 'undefined') return null
  const raw = window.localStorage.getItem(SPLITS_STORAGE_KEY)
  if (raw === null) return null
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      return parsed.filter((x): x is string => typeof x === 'string')
    }
  } catch {
    // Fall through.
  }
  return null
}

export function saveLocalSplits(splits: Splits): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(SPLITS_STORAGE_KEY, JSON.stringify(splits))
}

// --- Equality (for the unpublished-changes indicator) ----------------------

export function tablesEqual(a: Table[], b: Table[]): boolean {
  if (a.length !== b.length) return false
  const sort = (xs: Table[]) => [...xs].sort((x, y) => x.number - y.number)
  const as = sort(a)
  const bs = sort(b)
  return as.every(
    (t, i) =>
      t.number === bs[i].number &&
      t.capacity === bs[i].capacity &&
      (t.label?.trim() || '') === (bs[i].label?.trim() || ''),
  )
}

export function assignmentsEqual(a: Assignments, b: Assignments): boolean {
  const ak = Object.keys(a)
  if (ak.length !== Object.keys(b).length) return false
  return ak.every((k) => a[k] === b[k])
}

export function splitsEqual(a: Splits, b: Splits): boolean {
  if (a.length !== b.length) return false
  const bs = new Set(b)
  return a.every((id) => bs.has(id))
}

// --- Export ----------------------------------------------------------------

/** TSV for the seating Sheet — header `type, key, value` + the same rows the
 *  Apps Script save writes (tables, labels, assignments, splits — each block
 *  sorted, for stable Sheet diffs). The admin pastes this whole-sheet-replace
 *  into the seating Sheet. */
export function exportSeatingTSV(
  tables: Table[],
  assignments: Assignments,
  splits: Splits,
): string {
  const lines = ['type\tkey\tvalue']
  for (const row of seatingRows(tables, assignments, splits)) {
    lines.push(row.join('\t'))
  }
  return lines.join('\n')
}
