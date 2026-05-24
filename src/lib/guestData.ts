// Wedding guest list — types and curation config.
//
// Live data is fetched at runtime from the two published RSVP sheets — see
// guestSheets.ts. This file holds:
//   - the shared types
//   - FAMILY_GROUPS: curated family groupings (not derivable from the sheets)
//   - COMBINED_ENTRIES: curated "two people, one cell" row splits
//
// There is no static guest snapshot — the /guests page is live-only. If the
// sheet fetch fails, the sync gate shows a failed state; no offline data.
//
// Phone numbers are intentionally omitted everywhere — this page drops
// contact PII.

export type GuestSource = 'primary' | 'plus-one'

export type GroupKind = 'couple' | 'family' | 'individual' | 'review'

export type Guest = {
  /** Full name. Combined "two people, one cell" rows are split before this. */
  name: string
  /** Which sheet the row came from. */
  source: GuestSource
  /** Two-letter initials for the avatar. */
  initials: string
  /** Set when the entry needs manual confirmation; shown as a warning note. */
  flag?: string
  /** Set when this guest was split out of a combined RSVP row. All guests
   *  from the same original row share this id — stats count the submission
   *  once, and the UI shows a "shares submission" note. */
  submissionId?: string
}

export type GuestGroup = {
  label: string
  kind: GroupKind
  guests: Guest[]
}

export type GuestSection = {
  title: string
  groups: GuestGroup[]
}

// Curated family groupings — intentionally empty.
//
// The RSVP sheets carry no family/couple column, so any family grouping would
// have to be a hardcoded editorial list of guest names. The /guests page is
// fully sheet-driven, so no names are curated here: guests that would have
// grouped as a family fall through to "Individual guests" and are then
// wedding-side grouped (Perez / Palad / Domingo / Guests) at the bottom of
// this file.
//
// guestSheets.ts still matches RSVPs against this list, so a family could be
// re-introduced later by adding an entry — but nothing is curated today.
//
// Couples and shared-contact pairs are NOT curated either — guestSheets.ts
// derives those automatically from the +1 sheet and from shared email/phone.
export const FAMILY_GROUPS: { label: string; members: string[] }[] = []

// Combined RSVP rows — a single sheet cell that actually names two people.
// There is no delimiter we can rely on ("Raul Perez Cory Perez" has none at
// all), so these are split by this explicit map rather than a parser. Each
// split guest carries `submissionId` = the combined string, so stats count one
// submission while the list shows two guests. If a new combined entry shows up
// in the sheet, add a row here.
export const COMBINED_ENTRIES: { combined: string; people: string[] }[] = [
  { combined: 'Raul Perez Cory Perez', people: ['Raul Perez', 'Cory Perez'] },
  {
    combined: 'Techie Perez / Chona Esposo',
    people: ['Techie Perez', 'Chona Esposo'],
  },
]

export type GuestStats = {
  totalGuests: number
  submissions: number
  plusOnes: number
  needsReview: number
}

/** Derives summary stats from the data so they can never drift from the list.
 *  Guests split from one combined row (same submissionId) count as separate
 *  guests but as a single RSVP submission. */
export function getGuestStats(sections: GuestSection[]): GuestStats {
  const guests = sections.flatMap((s) => s.groups.flatMap((g) => g.guests))

  const countedSubmissions = new Set<string>()
  let submissions = 0
  for (const g of guests) {
    if (g.source !== 'primary') continue
    if (g.submissionId) {
      if (countedSubmissions.has(g.submissionId)) continue
      countedSubmissions.add(g.submissionId)
    }
    submissions++
  }

  return {
    totalGuests: guests.length,
    submissions,
    plusOnes: guests.filter((g) => g.source === 'plus-one').length,
    needsReview: guests.filter((g) => g.flag).length,
  }
}

// --- Wedding-side grouping --------------------------------------------------
//
// The /guests list is grouped into wedding *sides*. A guest's side is derived
// from their name by whole-word surname match:
//
//   Perez   — the groom's paternal side
//   Palad   — the groom's maternal side
//   Domingo — the bride's side
//   Guests  — anyone whose name matches none of the above (in-laws, +1s,
//             friends). Per the feature brief, non-matching guests land here.
//
// Matching is whole-word and anywhere in the name, not just the last word:
// Filipino names carry the mother's maiden surname as a middle name and often
// a Jr./Sr./III suffix, so the "last word" is an unreliable surname. Catching a
// middle name is correct for *side* purposes — it is a real family link.
//
// Limitation: a surname used as a given name (e.g. "Domingo" as a first name)
// would be a false match. None exist in the current data; if one appears, add
// an explicit override here.

export type Side = 'Perez' | 'Palad' | 'Domingo' | 'Guests'

/** Surname → side, for the three named sides. "Guests" is the implicit
 *  fall-through for names matching none of these. */
export const SIDE_SURNAMES: { side: Exclude<Side, 'Guests'>; surname: string }[] = [
  { side: 'Perez', surname: 'Perez' },
  { side: 'Palad', surname: 'Palad' },
  { side: 'Domingo', surname: 'Domingo' },
]

/** Display order of side sections — "Guests" is always last. */
export const SIDE_ORDER: readonly Side[] = ['Perez', 'Palad', 'Domingo', 'Guests']

/** The side a single name belongs to, by whole-word surname match. */
export function sideOfName(name: string): Side {
  const lower = name.toLowerCase()
  for (const { side, surname } of SIDE_SURNAMES) {
    if (new RegExp(`\\b${surname.toLowerCase()}\\b`).test(lower)) return side
  }
  return 'Guests'
}

/** The side a multi-person group belongs to. Couples, families, and review
 *  pairs move as a unit — the first guest with a matched side wins; a group
 *  with no match falls to "Guests". */
function sideOfGroup(group: GuestGroup): Side {
  for (const guest of group.guests) {
    const side = sideOfName(guest.name)
    if (side !== 'Guests') return side
  }
  return 'Guests'
}

/** Regroups association-grouped sections (couples / families / individuals)
 *  into wedding-side sections (Perez / Palad / Domingo / Guests).
 *
 *  - Couples, families, and review pairs stay intact and move as a unit.
 *  - "individual" groups are split per guest — each individual is independent,
 *    so one "Individuals" group is rebuilt per side.
 *
 *  Empty sides are omitted; section order follows SIDE_ORDER. */
export function groupBySide(sections: GuestSection[]): GuestSection[] {
  const groupsBySide = new Map<Side, GuestGroup[]>()
  const individualsBySide = new Map<Side, Guest[]>()

  const addGroup = (side: Side, group: GuestGroup) => {
    const bucket = groupsBySide.get(side)
    if (bucket) bucket.push(group)
    else groupsBySide.set(side, [group])
  }

  for (const section of sections) {
    for (const group of section.groups) {
      if (group.kind === 'individual') {
        for (const guest of group.guests) {
          const side = sideOfName(guest.name)
          const bucket = individualsBySide.get(side)
          if (bucket) bucket.push(guest)
          else individualsBySide.set(side, [guest])
        }
      } else {
        addGroup(sideOfGroup(group), group)
      }
    }
  }

  // The rebuilt individuals group goes last within its side.
  for (const [side, guests] of Array.from(individualsBySide.entries())) {
    addGroup(side, { label: 'Individuals', kind: 'individual', guests })
  }

  const result: GuestSection[] = []
  for (const side of SIDE_ORDER) {
    const groups = groupsBySide.get(side)
    if (groups && groups.length > 0) result.push({ title: side, groups })
  }
  return result
}

/** Guest headcount per side, for the attendance summary. Reads side-grouped
 *  sections (the output of groupBySide), where each section title is a Side.
 *  Always returns all four sides in SIDE_ORDER so a zero side still shows —
 *  e.g. Palad before anyone on that side has RSVP'd. */
export function getSideCounts(
  sections: GuestSection[],
): { side: Side; count: number }[] {
  const counts = new Map<string, number>()
  for (const section of sections) {
    const total = section.groups.reduce((n, g) => n + g.guests.length, 0)
    counts.set(section.title, (counts.get(section.title) ?? 0) + total)
  }
  return SIDE_ORDER.map((side) => ({ side, count: counts.get(side) ?? 0 }))
}

// --- Groom / Bride rollup --------------------------------------------------
//
// A two-side rollup over the four sides. The same guest data viewed at a
// higher grain:
//
//   Perez + Palad → Groom   (both lines of the groom's family)
//   Domingo       → Bride
//   Guests        → Guests  (in-laws, +1s, and friends with no surname
//                            match — kept as a third bucket rather than
//                            force-assigned to a side)

export type Affiliation = 'Groom' | 'Bride' | 'Guests'

// Override values are restricted to Groom / Bride. There is no scenario for
// explicitly overriding someone INTO "Guests" — "Guests" is the surname-derived
// fallback, reached by clearing an override. Per ADR-0002.
export type OverrideAffiliation = Extract<Affiliation, 'Groom' | 'Bride'>

/** Map of guestName → override affiliation. Absent entries fall back to
 *  surname-derivation. Names are matched via `normName` (trim + collapse
 *  whitespace), case-sensitive. */
export type AffiliationOverrides = Record<string, OverrideAffiliation>

export const SIDE_TO_AFFILIATION: Record<Side, Affiliation> = {
  Perez: 'Groom',
  Palad: 'Groom',
  Domingo: 'Bride',
  Guests: 'Guests',
}

/** Surname-derived affiliation for a single guest, no overrides applied. */
export function derivedAffiliationOfGuest(name: string): Affiliation {
  return SIDE_TO_AFFILIATION[sideOfName(name)]
}

/** The effective affiliation for a group, applying overrides if present.
 *  Move-as-a-unit rule: if any guest in the group has an override, that
 *  override wins (in practice all guests in a group share the same override
 *  because the picker sets them together — this also tolerates inconsistent
 *  hand-edits in the Sheet). Otherwise the surname-derived side wins. */
export function effectiveAffiliation(
  group: GuestGroup,
  overrides: AffiliationOverrides | undefined,
): Affiliation {
  if (overrides) {
    for (const guest of group.guests) {
      const override = overrides[guest.name]
      if (override) return override
    }
  }
  for (const guest of group.guests) {
    const side = sideOfName(guest.name)
    if (side !== 'Guests') return SIDE_TO_AFFILIATION[side]
  }
  return 'Guests'
}

/** Display order of affiliation sections — "Guests" is always last. */
export const AFFILIATION_ORDER: readonly Affiliation[] = ['Groom', 'Bride', 'Guests']

/** Rolls side-grouped sections (the output of groupBySide) up to Groom /
 *  Bride / Guests. Couples, families, and review pairs move as a unit —
 *  whichever side they were on; only Perez + Palad merge. Individuals
 *  groups from both Perez and Palad sides combine into a single Groom
 *  "Individuals" group. Empty affiliations are omitted.
 *
 *  Optional `overrides` re-routes groups (and individuals, per-guest) based
 *  on admin-set affiliations, applied BEFORE bucketing. Surname-derivation
 *  is the fallback when no override is present. */
export function groupByAffiliation(
  sideSections: GuestSection[],
  overrides?: AffiliationOverrides,
): GuestSection[] {
  const groupsByAffiliation = new Map<Affiliation, GuestGroup[]>()
  const individualsByAffiliation = new Map<Affiliation, Guest[]>()

  for (const section of sideSections) {
    for (const group of section.groups) {
      if (group.kind === 'individual') {
        // Individuals can be overridden per-guest.
        for (const guest of group.guests) {
          const override = overrides?.[guest.name]
          const affiliation: Affiliation = override ?? derivedAffiliationOfGuest(guest.name)
          const bucket = individualsByAffiliation.get(affiliation)
          if (bucket) bucket.push(guest)
          else individualsByAffiliation.set(affiliation, [guest])
        }
      } else {
        // Non-individual groups move as a unit; overrides apply group-wide.
        const affiliation = effectiveAffiliation(group, overrides)
        const bucket = groupsByAffiliation.get(affiliation)
        if (bucket) bucket.push(group)
        else groupsByAffiliation.set(affiliation, [group])
      }
    }
  }

  for (const [affiliation, guests] of Array.from(individualsByAffiliation.entries())) {
    const merged: GuestGroup = { label: 'Individuals', kind: 'individual', guests }
    const bucket = groupsByAffiliation.get(affiliation)
    if (bucket) bucket.push(merged)
    else groupsByAffiliation.set(affiliation, [merged])
  }

  const result: GuestSection[] = []
  for (const affiliation of AFFILIATION_ORDER) {
    const groups = groupsByAffiliation.get(affiliation)
    if (groups && groups.length > 0) result.push({ title: affiliation, groups })
  }
  return result
}

/** Guest headcount per affiliation. Reads affiliation-grouped sections
 *  (the output of groupByAffiliation). Always returns all three buckets
 *  in AFFILIATION_ORDER so a zero affiliation still shows. */
export function getAffiliationCounts(
  sections: GuestSection[],
): { affiliation: Affiliation; count: number }[] {
  const counts = new Map<string, number>()
  for (const section of sections) {
    const total = section.groups.reduce((n, g) => n + g.guests.length, 0)
    counts.set(section.title, (counts.get(section.title) ?? 0) + total)
  }
  return AFFILIATION_ORDER.map((affiliation) => ({
    affiliation,
    count: counts.get(affiliation) ?? 0,
  }))
}
