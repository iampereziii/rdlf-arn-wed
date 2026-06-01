// Native on-site RSVP → dedicated Google Sheet (per ADR-0003, append variant).
//
// The RSVP form in RSVP.tsx submits here. Submissions are APPENDED (one row per
// person) to a NEW dedicated RSVP spreadsheet via its OWN Apps Script `/exec`
// web app — a distinct deployment + token from seating/affiliations, because
// Apps Script binds to a single spreadsheet. The same sheet is published to web
// as CSV and merged into the individuals pipeline in guestSheets.ts, so native
// RSVPs flow through the existing dedup / family / side-grouping logic.
//
// The Google Forms stay live as a fallback. When the write endpoint below is an
// empty string ("not yet configured"), RSVP.tsx falls back to the Google Form
// link, so this ships safely before the Sheet is wired up.
//
// SECURITY: the /exec URL is public and the token ships in the client bundle
// (obfuscation, not auth). Spam is deterred by a hidden honeypot field, dropped
// server-side. Acceptable for a personal, low-traffic Sheet only.

import { appendRowToSheet } from './sheetWrite'

/** Trim + collapse internal whitespace (kept local to avoid a guestSheets
 *  import cycle — guestSheets imports RSVP_CSV from this module). */
const normName = (s: string): string => s.trim().replace(/\s+/g, ' ')

// Published-to-web CSV of the RSVP Sheet (read side). Empty = not configured;
// guestSheets.ts treats an empty/failed source as "no native RSVPs yet".
export const RSVP_CSV =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vS_9iRjN-0ieAv_nV9JD15miPstODA-rrb7gwTMA8z1hyYsNYDTSp6cIDc55MDQiOp6EsOYvu0O4UG9/pub?output=csv'

// Apps Script append web app for the RSVP Sheet (write side). Empty URL = not
// configured, so RSVP.tsx falls back to the Google Form link. Typed as `string`
// so `rsvpWriteEnabled` still typechecks once a non-empty literal is pasted in.
export const RSVP_WRITE_URL: string =
  'https://script.google.com/macros/s/AKfycbyEdtLXk2b5FQ3TxJ9VBnNi3KqbIT6Sy339Qwhr9CVCO8R83620ZonXmTVR-kFoIL24/exec'
export const RSVP_WRITE_TOKEN = '!G6A!Q2Z~69r'

/** True when the native RSVP write endpoint is configured. */
export const rsvpWriteEnabled = (): boolean => RSVP_WRITE_URL !== ''

export type RsvpInput = {
  name: string
  email: string
  contact: string
  attending: boolean
  /** Optional companion name when the invite granted a +1. Empty = solo.
   *  Only meaningful when `attending` — a declining guest brings no one. */
  plusOneName?: string
  /** Hidden anti-bot field — must be empty for a real submission. */
  honeypot: string
}

// Column order MUST match the RSVP Sheet's physical columns — appendRow writes
// positionally, so the "+1" column MUST be the LAST one on the Sheet (adding it
// mid-sheet would shift every later column). The Sheet's header row must be
// exactly (case-insensitive):
//   Timestamp | Full Name | Email Address | Contact Number | Are you attending the wedding? | Name of your +1 guest
// The last five names are the header contract guestSheets.ts parses (it reads
// by header name, so an as-yet-unadded "+1" column just parses as no +1);
// "Yes" in the attending cell marks attendance (isAttending checks for "yes").
// `Name of your +1 guest` reuses the existing "+1 guest" form's header verbatim
// so guestSheets.ts shares one parse path.
export async function submitRsvp(input: RsvpInput): Promise<boolean> {
  // A declining guest brings no +1, regardless of what the form held.
  const plusOne = input.attending ? normName(input.plusOneName ?? '') : ''
  const row: (string | number)[] = [
    new Date().toISOString(),
    normName(input.name),
    input.email.trim(),
    input.contact.trim(),
    input.attending ? 'Yes, I will attend' : 'No, I cannot attend',
    plusOne,
  ]
  return appendRowToSheet(RSVP_WRITE_URL, RSVP_WRITE_TOKEN, row, input.honeypot)
}
