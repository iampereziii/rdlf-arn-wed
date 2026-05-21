// Wedding guest list — types, curation config, and the offline fallback.
//
// Live data is fetched at runtime from the two published RSVP sheets — see
// guestSheets.ts. This file holds:
//   - the shared types
//   - FAMILY_GROUPS: curated family groupings (not derivable from the sheets)
//   - GUEST_SECTIONS: a static snapshot used as the fallback if the live
//     fetch fails (e.g. the sheet is offline or unpublished)
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

/** Date the fallback snapshot below was last reconciled against the sheets. */
export const LAST_UPDATED = '2026-05-21'

// Curated family groupings. The RSVP sheets have no family/couple column, and
// surname alone is unreliable — so families are an explicit editorial list,
// matched (case-insensitively) by full name against the individual RSVP sheet.
// A new RSVP not listed here falls through to "Individual guests".
//
// NO "Domingo family" — still true. The Domingo guests (Keng, Jobelle,
// Miguelito, Fritz, Paul Michael … Catalan) are unrelated people who happen to
// share a surname, so they are not one household — do NOT add a Domingo family
// entry here.
//
// This is NOT contradicted by the wedding-*side* grouping added at the bottom
// of this file (groupBySide / a "Domingo side"). A side is a broad clan bucket
// — everyone connected to the bride's family — not a household. A "Domingo
// side" section is valid; a "Domingo family" group is still not. They coexist.
//
// Perez members are listed as their POST-SPLIT names (see COMBINED_ENTRIES):
// the combined "two people, one cell" rows are split before family matching.
//
// Couples and shared-contact pairs are NOT curated — guestSheets.ts derives
// those automatically from the +1 sheet and from shared email/phone values.
export const FAMILY_GROUPS: { label: string; members: string[] }[] = [
  { label: 'San Juan family', members: ['Osai San Juan', 'Denz San Juan'] },
  {
    label: 'Agregado family',
    members: ['Emma Agregado', 'Gybel Agregado', 'Arnel Agregado'],
  },
  {
    label: 'Perez family',
    members: [
      'Raul Perez',
      'Cory Perez',
      'Antonio Ray J. Perez',
      'Techie Perez',
      'Chona Esposo',
      'Fernando Perez',
    ],
  },
]

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

export const GUEST_SECTIONS: GuestSection[] = [
  {
    title: 'Couples & pairs',
    groups: [
      {
        label: 'Paul Michael Domingo Catalan',
        kind: 'couple',
        guests: [
          { name: 'Paul Michael Domingo Catalan', source: 'primary', initials: 'PM' },
          { name: 'Maria Sharmainne Rentillo Catalan', source: 'plus-one', initials: 'MS' },
        ],
      },
      {
        label: 'Fritz Domingo',
        kind: 'couple',
        guests: [
          { name: 'Fritz Domingo', source: 'primary', initials: 'FD' },
          { name: 'Tina Prado', source: 'plus-one', initials: 'TP' },
        ],
      },
      {
        label: 'Lamberto Gabagat',
        kind: 'couple',
        guests: [
          { name: 'Lamberto Gabagat', source: 'primary', initials: 'LG' },
          { name: 'Evangeline Gabagat', source: 'plus-one', initials: 'EG' },
        ],
      },
      {
        label: 'Mariasilas Olivia D. Batac',
        kind: 'couple',
        guests: [
          { name: 'Mariasilas Olivia D. Batac', source: 'primary', initials: 'MB' },
          { name: 'March Oliver D. Batac', source: 'plus-one', initials: 'MO' },
        ],
      },
      {
        label: 'Raphael Gomez',
        kind: 'couple',
        guests: [
          { name: 'Raphael Gomez', source: 'primary', initials: 'RG' },
          { name: 'Winnie Rose Gomez', source: 'plus-one', initials: 'WG' },
        ],
      },
    ],
  },
  {
    title: 'Families & shared contacts',
    groups: [
      {
        label: 'San Juan family',
        kind: 'family',
        guests: [
          { name: 'Osai San Juan', source: 'primary', initials: 'OS' },
          { name: 'Denz San Juan', source: 'primary', initials: 'DS' },
        ],
      },
      {
        label: 'Agregado family',
        kind: 'family',
        guests: [
          { name: 'Emma Agregado', source: 'primary', initials: 'EA' },
          { name: 'Gybel Agregado', source: 'primary', initials: 'GA' },
          { name: 'Arnel Agregado', source: 'primary', initials: 'AA' },
        ],
      },
      {
        label: 'Perez family',
        kind: 'family',
        guests: [
          {
            name: 'Raul Perez',
            source: 'primary',
            initials: 'RP',
            submissionId: 'Raul Perez Cory Perez',
          },
          {
            name: 'Cory Perez',
            source: 'primary',
            initials: 'CP',
            submissionId: 'Raul Perez Cory Perez',
          },
          { name: 'Antonio Ray J. Perez', source: 'primary', initials: 'AR' },
          {
            name: 'Techie Perez',
            source: 'primary',
            initials: 'TP',
            submissionId: 'Techie Perez / Chona Esposo',
          },
          {
            name: 'Chona Esposo',
            source: 'primary',
            initials: 'CE',
            submissionId: 'Techie Perez / Chona Esposo',
          },
          {
            name: 'Fernando Perez',
            source: 'primary',
            initials: 'FP',
            flag: 'Submitted twice — confirm if 1 or 2 guests',
          },
        ],
      },
      {
        label: 'Rea Krizza Doña & Miguelito Domingo Jr.',
        kind: 'review',
        guests: [
          {
            name: 'Rea Krizza Doña',
            source: 'primary',
            initials: 'RD',
            flag: 'Shared email & number — confirm relationship',
          },
          { name: 'Miguelito Domingo Jr.', source: 'primary', initials: 'MD' },
        ],
      },
    ],
  },
  {
    title: 'Individual guests',
    groups: [
      {
        label: 'Individuals',
        kind: 'individual',
        guests: [
          { name: 'John Carlo Paragas', source: 'primary', initials: 'JC' },
          { name: 'Chris Co', source: 'primary', initials: 'CC' },
          { name: 'John Paul A. Apuan', source: 'primary', initials: 'JP' },
          { name: 'Jericho Entrada', source: 'primary', initials: 'JE' },
          { name: 'De Ocampo, Daniel Espinosa', source: 'primary', initials: 'DE' },
          { name: 'Ronilo Olvido Jr.', source: 'primary', initials: 'RO' },
          { name: 'Keng Domingo', source: 'primary', initials: 'KD' },
          { name: 'Akis Cortez', source: 'primary', initials: 'AC' },
          { name: 'Cristina Valerio', source: 'primary', initials: 'CV' },
          { name: 'Airo Nyl O. Ceralde', source: 'primary', initials: 'AN' },
          { name: 'Jobelle Domingo', source: 'primary', initials: 'JD' },
        ],
      },
    ],
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
export function getGuestStats(sections: GuestSection[] = GUEST_SECTIONS): GuestStats {
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
