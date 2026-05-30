// Editorial overrides for the Groom / Bride / Guests rollup on /guests.
//
// Architecture (per ADR-0002):
//   - A dedicated "affiliations" Google Sheet (separate from the two RSVP
//     sheets in guestSheets.ts) holds the published overrides — 2 columns:
//     `guestName` and `affiliation` (Groom or Bride).
//   - The site reads the Sheet at runtime, same client-side fetch pattern
//     as the existing two RSVP sheets.
//   - The admin's *working* state lives in localStorage. The picker UI in
//     GuestList.tsx mutates localStorage; the affiliations Sheet only
//     reflects whatever the admin has explicitly Exported + pasted in.
//   - There is no live write endpoint, no auth, no AWS — see ADR-0002 for
//     why this beats a server-side approach for a batch-publish workflow.

import { cell, fetchCsv, headerIndex, normName } from './guestSheets'
import { saveRowsToSheet } from './sheetWrite'
import type { AffiliationOverrides, OverrideAffiliation } from './guestData'

// Published-to-web CSV endpoint for the affiliations Sheet. Empty string
// means "not yet configured" — the page renders normally and the picker
// still works locally over surname-derived defaults.
export const AFFILIATIONS_CSV =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vSzKaSlYTXgAJ5pDjmqa7ORniI1oGlVIwolvdp2fdhAu5IuXXDvKk-zu7DXImUSP7W3WjrYgEJnEtfr/pub?output=csv'

// One-click write-back to the affiliations Sheet via its OWN Apps Script web app
// (per ADR-0003) — a distinct deployment + token from seating, because Apps
// Script binds to a single spreadsheet. Empty URL = not configured, so the UI
// falls back to the clipboard Export motion. Typed as `string` so the config
// check still typechecks once a non-empty literal is pasted in.
//
// SECURITY: public endpoint; the token ships in the client bundle (obfuscation,
// not auth). Use a DIFFERENT token than seating so one leak doesn't expose both.
export const AFFILIATIONS_WRITE_URL: string =
  'https://script.google.com/macros/s/AKfycbxMwyoxF4yQcw7yNwyRkcAAAMbN1wRkJAeI79u4imCVaxcTuSYwmPFFZLVmKj-WG-Xz/exec'
export const AFFILIATIONS_WRITE_TOKEN = 'vwRo8|GH+6M5'

/** True when the affiliations write-back endpoint is configured. */
export const affiliationsWriteEnabled = (): boolean => AFFILIATIONS_WRITE_URL !== ''

/** Posts the overrides to the affiliations Apps Script web app, which whole-
 *  sheet replaces the affiliations Sheet. Rows mirror exportToTSV: header +
 *  one row per override, sorted by name. Returns true on `{ ok: true }`. */
export async function saveAffiliationsToSheet(
  map: AffiliationOverrides,
): Promise<boolean> {
  const rows: (string | number)[][] = [['guestName', 'affiliation']]
  for (const name of Object.keys(map).sort((a, b) => a.localeCompare(b))) {
    rows.push([name, map[name]])
  }
  return saveRowsToSheet(AFFILIATIONS_WRITE_URL, AFFILIATIONS_WRITE_TOKEN, rows)
}

// localStorage key for the picker's working state.
//
// Convention: KEY MISSING from localStorage means "first visit — seed from
// the Sheet snapshot." KEY PRESENT (even as `{}`) means "explicit working
// state — preserve as-is, never re-seed." That distinction lets the admin
// publish an empty Sheet (no overrides) without the next page load silently
// resurrecting the cleared state from a stale snapshot.
const STORAGE_KEY = 'guests-affiliation-overrides'

export type { AffiliationOverrides, OverrideAffiliation }

/** Reads the affiliations Sheet → guestName → override map. Forgiving on
 *  bad rows (missing name, unknown value): silently dropped. Returns an
 *  empty map on missing URL, parse failure, or fetch failure — the caller
 *  treats that as "no published overrides" rather than an error. */
export async function loadAffiliationsFromSheet(): Promise<AffiliationOverrides> {
  if (!AFFILIATIONS_CSV) return {}
  try {
    const rows = await fetchCsv(AFFILIATIONS_CSV)
    if (rows.length < 2) return {}
    const head = headerIndex(rows[0])
    const out: AffiliationOverrides = {}
    for (const row of rows.slice(1)) {
      const name = normName(cell(row, head['guestname']))
      const value = cell(row, head['affiliation']).trim()
      if (!name) continue
      if (value === 'Groom' || value === 'Bride') {
        out[name] = value
      }
    }
    return out
  } catch {
    return {}
  }
}

/** Reads localStorage. Returns null when the key is missing (first visit),
 *  the parsed map otherwise (even if it's empty `{}`). */
export function loadLocalOverrides(): AffiliationOverrides | null {
  if (typeof window === 'undefined') return null
  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (raw === null) return null
  try {
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as AffiliationOverrides
    }
  } catch {
    // Fall through.
  }
  return null
}

export function saveLocalOverrides(map: AffiliationOverrides): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
}

/** True when both maps have the same keys and values. */
export function overridesEqual(
  a: AffiliationOverrides,
  b: AffiliationOverrides,
): boolean {
  const ak = Object.keys(a)
  if (ak.length !== Object.keys(b).length) return false
  for (const k of ak) {
    if (a[k] !== b[k]) return false
  }
  return true
}

/** Builds the TSV payload to paste into the affiliations Sheet. Header +
 *  one row per override; sorted by name for stable diffs in Sheet revision
 *  history. Per Risk #12 in feature-brief--groom-bride-admin-override.md:
 *  only overridden guests appear; non-overridden guests are absent from the
 *  Sheet (they fall through to surname-derivation at read time). */
export function exportToTSV(map: AffiliationOverrides): string {
  const lines = ['guestName\taffiliation']
  const names = Object.keys(map).sort((a, b) => a.localeCompare(b))
  for (const name of names) {
    lines.push(`${name}\t${map[name]}`)
  }
  return lines.join('\n')
}

export async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.clipboard) return false
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}
