// Wedding guest list — normalized, merged view of the two RSVP sheets.
//
// The Google RSVP flow produces two sheets:
//   File 1 — primary RSVP responses     -> source: 'primary'
//   File 2 — "+1 guest" companion form  -> source: 'plus-one'
//
// This file is the integrated result of merging both. It is committed
// static data: the site is a static export with no server runtime, and
// RSVP closed 2026-05-10, so the list is frozen. To refresh, re-export
// the sheets and regenerate this file.
//
// Phone numbers are intentionally omitted — this page drops contact PII.

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

/** Date this list was last reconciled against the source sheets. */
export const LAST_UPDATED = '2026-05-21'

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
