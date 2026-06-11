// "Catch the Hearts" scores → dedicated Google Sheet (per ADR-0003, append
// variant — same pattern as rsvpSheet.ts).
//
// Game.tsx submits each finished round here; rows are APPENDED to a dedicated
// Game Scores spreadsheet via its OWN Apps Script `/exec` web app (a distinct
// deployment + token from RSVP/seating, because Apps Script binds to a single
// spreadsheet — see game-apps-script.gs for setup). The same sheet is published
// to web as CSV, which GameLeaderboard.tsx reads to render the top scores.
//
// When the constants below are empty strings ("not yet configured"), the game
// runs in play-only mode: guests can play and see their score, but nothing is
// submitted and the leaderboard is hidden — so this ships safely before the
// Sheet is wired up.
//
// SECURITY: the /exec URL is public and the token ships in the client bundle
// (obfuscation, not auth). Spam is deterred by a hidden honeypot field, dropped
// server-side. Scores are client-reported and unverifiable on a static site —
// acceptable for a friendly wedding-day prize, not for anything contested.

import { appendRowToSheet } from './sheetWrite'
import { cell, fetchCsvSafe, headerIndex, normName } from './guestSheets'

// Published-to-web CSV of the Game Scores Sheet (read side). Empty = not
// configured; the leaderboard is hidden until this is set.
export const GAME_CSV: string = ''

// Apps Script append web app for the Game Scores Sheet (write side). Empty URL
// = not configured, so Game.tsx shows the score without a submit form. Typed
// as `string` so the enabled checks still typecheck once a literal is pasted.
export const GAME_WRITE_URL: string = ''
export const GAME_WRITE_TOKEN = ''

/** True when score submission is configured. */
export const gameWriteEnabled = (): boolean => GAME_WRITE_URL !== ''

/** True when the leaderboard read side is configured. */
export const gameReadEnabled = (): boolean => GAME_CSV !== ''

export type ScoreInput = {
  name: string
  score: number
  /** Hidden anti-bot field — must be empty for a real submission. */
  honeypot: string
}

export type ScoreEntry = {
  name: string
  score: number
}

// Column order MUST match the Game Scores Sheet's physical columns — appendRow
// writes positionally. The Sheet's header row must be exactly
// (case-insensitive):  Timestamp | Name | Score
// loadLeaderboard reads by header name, so renaming a header breaks the parse.
export async function submitScore(input: ScoreInput): Promise<boolean> {
  const row: (string | number)[] = [
    new Date().toISOString(),
    normName(input.name),
    Math.floor(input.score),
  ]
  return appendRowToSheet(GAME_WRITE_URL, GAME_WRITE_TOKEN, row, input.honeypot)
}

/** Reads the published Game Scores CSV and reduces it to one entry per player:
 *  best score per normalized name, sorted descending. Returns [] when the read
 *  side is unconfigured or the fetch fails (caller distinguishes via
 *  gameReadEnabled). NOTE: "publish to web" CSVs lag live edits by ~5 minutes,
 *  so a just-submitted score won't appear here immediately — the leaderboard
 *  merges it optimistically client-side. */
export async function loadLeaderboard(): Promise<ScoreEntry[]> {
  const rows = await fetchCsvSafe(GAME_CSV)
  if (rows.length < 2) return []
  const head = headerIndex(rows[0])
  const nameIdx = head['name']
  const scoreIdx = head['score']

  const best = new Map<string, ScoreEntry>()
  for (const row of rows.slice(1)) {
    const name = normName(cell(row, nameIdx))
    const score = Number(cell(row, scoreIdx))
    if (!name || !Number.isFinite(score) || score < 0) continue
    const key = name.toLowerCase()
    const prev = best.get(key)
    // Keep the max; on a tie the earlier (first-appended) row wins.
    if (!prev || score > prev.score) best.set(key, { name, score })
  }
  return Array.from(best.values()).sort((a, b) => b.score - a.score)
}
