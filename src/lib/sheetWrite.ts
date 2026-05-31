// Shared one-click Sheet write-back transport (per ADR-0003).
//
// Both /seating and /guests (affiliations) publish to their own dedicated
// Google Sheet by POSTing rows to a bound Google Apps Script web app that
// whole-sheet replaces the target. Each Sheet has its OWN deployment and token
// (Apps Script binds to one spreadsheet). This module is just the transport;
// callers build the rows and supply their own URL + token.
//
// SECURITY: the /exec URL is public and the token ships in the client bundle,
// so the token is obfuscation, not auth. Acceptable for personal Sheets only.

/** POSTs `{ token, rows }` to an Apps Script `/exec` web app that whole-sheet
 *  replaces the bound Sheet. Returns true only on a confirmed `{ ok: true }`.
 *
 *  Uses a `text/plain` body so the request stays CORS-"simple" (no preflight,
 *  which Apps Script web apps don't handle); the script reads the raw JSON from
 *  `e.postData.contents`. Returns false on missing URL, network error, or any
 *  non-ok response. */
export async function saveRowsToSheet(
  url: string,
  token: string,
  rows: (string | number)[][],
): Promise<boolean> {
  if (!url) return false
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ token, rows }),
    })
    const data = (await res.json().catch(() => null)) as { ok?: boolean } | null
    return data?.ok === true
  } catch {
    return false
  }
}

/** POSTs `{ token, row, honeypot }` to an Apps Script `/exec` web app that
 *  **appends** a single row to the bound Sheet (unlike `saveRowsToSheet`, which
 *  whole-sheet replaces). Used by the native RSVP form — each submission is one
 *  appended row, never a replace.
 *
 *  `honeypot` carries the value of the form's hidden anti-bot field; the Apps
 *  Script drops the submission (and still reports `{ ok: true }`) when it is
 *  non-empty, so bots see success while no row is written. Same `text/plain`
 *  CORS-"simple" body as `saveRowsToSheet`. Returns false on missing URL,
 *  network error, or any non-ok response. */
export async function appendRowToSheet(
  url: string,
  token: string,
  row: (string | number)[],
  honeypot = '',
): Promise<boolean> {
  if (!url) return false
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ token, row, honeypot }),
    })
    const data = (await res.json().catch(() => null)) as { ok?: boolean } | null
    return data?.ok === true
  } catch {
    return false
  }
}
