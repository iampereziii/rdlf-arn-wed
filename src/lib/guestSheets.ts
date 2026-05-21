// Live guest data — fetched at runtime from the two published RSVP sheets.
//
// Both sheets are "Published to web", so the browser can read their CSV export
// directly (CORS is open on the published endpoint). No credentials, no server.
//
// Sheet shapes (intentionally different — two separate Google Forms):
//   COUPLES sheet     — the "+1 guest" form. Each row = a primary + their +1.
//   INDIVIDUALS sheet — the simple RSVP form. Each row = one submission.
//
// Grouping is layered on here:
//   - couples           → one row of the +1 sheet = one couple
//   - combined entries  → "two people, one cell" rows split per COMBINED_ENTRIES
//   - shared-contact     → auto-detected: 2+ different names sharing an
//                          email or phone become a "Needs review" pair
//   - duplicate          → auto-detected: same name + email twice = flagged
//   - families           → matched against FAMILY_GROUPS (curated)
//   - everyone else      → "Individual guests"
//
// The association-grouped result is then regrouped into wedding *sides*
// (Perez / Palad / Domingo / Guests) by groupBySide before it is returned.

import {
  COMBINED_ENTRIES,
  FAMILY_GROUPS,
  groupBySide,
  type Guest,
  type GuestGroup,
  type GuestSection,
} from './guestData'

// Published-to-web CSV endpoints. These are public URLs, not secrets.
const COUPLES_CSV =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vQzZ75lKXFyhW0NIaO_4V6Bs0c_xQcAVWyGmIXsBdaNkcGyzQe5BygUPkHm4zamDzcG6UCTwCxi3evY/pub?output=csv'
const INDIVIDUALS_CSV =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vSGgRoCqHchmTE3R01dJ5enIo3mN8O6wM0lTcmfKmlLm_nGRHLq914qL0w5bjc8k4amMKJ4UUTW1PzY/pub?output=csv'

const DUP_FLAG = 'Submitted twice — confirm if 1 or 2 guests'
const SHARED_FLAG = 'Shared email & number — confirm relationship'

// --- CSV parsing -----------------------------------------------------------

/** Minimal RFC-4180 CSV parser — handles quoted fields, escaped quotes, commas
 *  and newlines inside quotes. Avoids pulling in a dependency. */
function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += c
      }
    } else if (c === '"') {
      inQuotes = true
    } else if (c === ',') {
      row.push(field)
      field = ''
    } else if (c === '\n') {
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else if (c !== '\r') {
      field += c
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field)
    rows.push(row)
  }
  return rows
}

/** Maps trimmed/lowercased header names to their column index. */
function headerIndex(headerRow: string[]): Record<string, number | undefined> {
  const idx: Record<string, number | undefined> = {}
  headerRow.forEach((h, i) => {
    const key = h.trim().toLowerCase().replace(/\s+/g, ' ')
    if (key && !(key in idx)) idx[key] = i
  })
  return idx
}

function cell(row: string[], idx: number | undefined): string {
  return idx === undefined ? '' : (row[idx] ?? '')
}

// --- helpers ---------------------------------------------------------------

/** Trim + collapse internal whitespace. */
function normName(s: string): string {
  return s.trim().replace(/\s+/g, ' ')
}

/** Lowercased name key for matching. */
function nameKey(s: string): string {
  return normName(s).toLowerCase()
}

/** Two-letter initials for the avatar. */
function initialsOf(name: string): string {
  const words = normName(name).split(' ').filter(Boolean)
  if (words.length === 0) return '?'
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[1][0]).toUpperCase()
}

/** "Yes, I will attend" → true. */
function isAttending(value: string): boolean {
  return value.toLowerCase().includes('yes')
}

/** Groups items by a string key; empty keys are skipped. */
function groupBy<T>(items: T[], keyOf: (item: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>()
  for (const item of items) {
    const key = keyOf(item)
    if (!key) continue
    const bucket = map.get(key)
    if (bucket) bucket.push(item)
    else map.set(key, [item])
  }
  return map
}

async function fetchCsv(url: string): Promise<string[][]> {
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new Error(`Sheet fetch failed (${res.status})`)
  return parseCsv(await res.text())
}

// --- normalization ---------------------------------------------------------

type IndivRecord = {
  name: string
  email: string
  contact: string
  /** Set when this record was split out of a combined RSVP row. */
  submissionId?: string
}

/** Expands combined RSVP rows ("two people, one cell") into one record per
 *  person, tagging each with the shared submissionId. Other records pass
 *  through unchanged. */
function splitCombinedRecords(records: IndivRecord[]): IndivRecord[] {
  const out: IndivRecord[] = []
  for (const record of records) {
    const combined = COMBINED_ENTRIES.find(
      (c) => nameKey(c.combined) === nameKey(record.name),
    )
    if (!combined) {
      out.push(record)
      continue
    }
    for (const personName of combined.people) {
      out.push({ ...record, name: personName, submissionId: combined.combined })
    }
  }
  return out
}

/** +1 sheet → one couple group per row. */
function buildCouples(rows: string[][]): GuestGroup[] {
  if (rows.length < 2) return []
  const head = headerIndex(rows[0])
  const groups: GuestGroup[] = []

  for (const row of rows.slice(1)) {
    const name = normName(cell(row, head['full name']))
    if (!name) continue
    if (!isAttending(cell(row, head['are you attending the wedding?']))) continue

    const guests: Guest[] = [
      { name, source: 'primary', initials: initialsOf(name) },
    ]
    const plusOne = normName(cell(row, head['name of your +1 guest']))
    if (plusOne) {
      guests.push({
        name: plusOne,
        source: 'plus-one',
        initials: initialsOf(plusOne),
      })
    }
    groups.push({ label: name, kind: 'couple', guests })
  }
  return groups
}

/** Individual sheet → deduped, attending records. */
function buildIndividualRecords(rows: string[][]): {
  records: IndivRecord[]
  duplicateKeys: Set<string>
} {
  const duplicateKeys = new Set<string>()
  if (rows.length < 2) return { records: [], duplicateKeys }

  const head = headerIndex(rows[0])
  const seen = new Map<string, IndivRecord>()

  for (const row of rows.slice(1)) {
    const name = normName(cell(row, head['full name']))
    if (!name) continue
    if (!isAttending(cell(row, head['are you attending the wedding?']))) continue

    const record: IndivRecord = {
      name,
      email: cell(row, head['email address']).trim().toLowerCase(),
      contact: cell(row, head['contact number']).replace(/\D/g, ''),
    }
    // Same person, same email, submitted more than once.
    const key = `${record.email}|${nameKey(record.name)}`
    if (seen.has(key)) duplicateKeys.add(key)
    else seen.set(key, record)
  }
  return { records: Array.from(seen.values()), duplicateKeys }
}

function dupKeyOf(r: IndivRecord): string {
  return `${r.email}|${nameKey(r.name)}`
}

export async function loadGuestSections(): Promise<GuestSection[]> {
  const [couplesRows, indivRows] = await Promise.all([
    fetchCsv(COUPLES_CSV),
    fetchCsv(INDIVIDUALS_CSV),
  ])

  const couples = buildCouples(couplesRows)
  const { records, duplicateKeys } = buildIndividualRecords(indivRows)

  // Split "two people, one cell" rows before any grouping runs.
  const splitRecords = splitCombinedRecords(records)

  const toGuest = (r: IndivRecord): Guest => ({
    name: r.name,
    source: 'primary',
    initials: initialsOf(r.name),
    flag: duplicateKeys.has(dupKeyOf(r)) ? DUP_FLAG : undefined,
    submissionId: r.submissionId,
  })

  // Shared-contact pairs: an email or phone used by 2+ *different* people.
  // Combined-entry split records legitimately share contact info (they are one
  // submission), so they are excluded from this detection.
  const inReview = new Set<IndivRecord>()
  const reviewGroups: GuestGroup[] = []
  const reviewPool = splitRecords.filter((r) => !r.submissionId)
  const byEmail = groupBy(reviewPool, (r) => r.email)
  const byContact = groupBy(reviewPool, (r) => r.contact)

  const buckets = Array.from(byEmail.values()).concat(
    Array.from(byContact.values()),
  )
  for (const bucket of buckets) {
    if (bucket.length < 2) continue
    const fresh = bucket.filter((r) => !inReview.has(r))
    const distinctNames = new Set(fresh.map((r) => nameKey(r.name)))
    if (fresh.length < 2 || distinctNames.size < 2) continue

    fresh.forEach((r) => inReview.add(r))
    reviewGroups.push({
      label: fresh.map((r) => r.name).join(' & '),
      kind: 'review',
      guests: fresh.map((r, i) => ({
        ...toGuest(r),
        flag: i === 0 ? SHARED_FLAG : toGuest(r).flag,
      })),
    })
  }

  // Families: curated, matched by name against whatever is left.
  const remaining = splitRecords.filter((r) => !inReview.has(r))
  const usedInFamily = new Set<IndivRecord>()
  const familyGroups: GuestGroup[] = []

  for (const family of FAMILY_GROUPS) {
    const memberKeys = new Set(family.members.map(nameKey))
    const found = remaining.filter(
      (r) => memberKeys.has(nameKey(r.name)) && !usedInFamily.has(r),
    )
    if (found.length === 0) continue
    found.forEach((r) => usedInFamily.add(r))
    familyGroups.push({
      label: family.label,
      kind: 'family',
      guests: found.map(toGuest),
    })
  }

  // Everyone not placed in a couple, review pair, or family.
  const individuals = remaining.filter((r) => !usedInFamily.has(r))

  const sections: GuestSection[] = []
  if (couples.length > 0) {
    sections.push({ title: 'Couples & pairs', groups: couples })
  }
  if (familyGroups.length > 0 || reviewGroups.length > 0) {
    sections.push({
      title: 'Families & shared contacts',
      groups: [...familyGroups, ...reviewGroups],
    })
  }
  if (individuals.length > 0) {
    sections.push({
      title: 'Individual guests',
      groups: [
        { label: 'Individuals', kind: 'individual', guests: individuals.map(toGuest) },
      ],
    })
  }
  return groupBySide(sections)
}
