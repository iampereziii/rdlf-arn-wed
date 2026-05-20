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
  /** Full name as submitted. Some rows combine two people ("A / B"). */
  name: string
  /** Which sheet the row came from. */
  source: GuestSource
  /** Two-letter initials for the avatar. */
  initials: string
  /** Set when the entry needs manual confirmation; shown as a warning note. */
  flag?: string
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
// surname alone is unreliable — there are several unrelated "Domingo" guests.
// So families are an explicit editorial list, matched (case-insensitively) by
// full name against the individual RSVP sheet. A new RSVP not listed here
// falls through to "Individual guests" until someone adds it here.
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
      'Raul Perez Cory Perez',
      'Antonio Ray J. Perez',
      'Techie Perez / Chona Esposo',
      'Fernando Perez',
    ],
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
          { name: 'Raul Perez / Cory Perez', source: 'primary', initials: 'RP' },
          { name: 'Antonio Ray J. Perez', source: 'primary', initials: 'AR' },
          { name: 'Techie Perez / Chona Esposo', source: 'primary', initials: 'TP' },
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

/** Derives summary stats from the data so they can never drift from the list. */
export function getGuestStats(sections: GuestSection[] = GUEST_SECTIONS): GuestStats {
  const guests = sections.flatMap((s) => s.groups.flatMap((g) => g.guests))
  return {
    totalGuests: guests.length,
    submissions: guests.filter((g) => g.source === 'primary').length,
    plusOnes: guests.filter((g) => g.source === 'plus-one').length,
    needsReview: guests.filter((g) => g.flag).length,
  }
}
