/**
 * Game Scores Sheet write-proxy — Google Apps Script web app (APPEND variant).
 *
 * Backs the "Catch the Hearts" mini game (src/components/Game.tsx →
 * submitScore in src/lib/gameSheet.ts → appendRowToSheet in
 * src/lib/sheetWrite.ts). Each finished round APPENDS one row to this Sheet —
 * same pattern as the RSVP proxy (rsvp-apps-script.gs).
 *
 * SETUP
 *   1. Create a new Google Sheet ("Game Scores") with header row (row 1):
 *        Timestamp | Name | Score
 *   2. Extensions → Apps Script → delete any sample code, paste this whole
 *      file in (Code.gs).
 *   3. Set a fresh TOKEN below; it must match GAME_WRITE_TOKEN in
 *      src/lib/gameSheet.ts.
 *   4. Deploy → New deployment → gear icon → "Web app".
 *        - Description: game scores write-proxy (append)
 *        - Execute as:  Me
 *        - Who has access: Anyone        ← must be "Anyone", not "Anyone with Google account"
 *      Deploy → authorize when prompted (allow it to manage this spreadsheet).
 *   5. The "Web app URL" (ends with /exec) is GAME_WRITE_URL in gameSheet.ts.
 *   6. For the leaderboard read side: File → Share → Publish to web →
 *      this sheet as CSV → that URL is GAME_CSV in gameSheet.ts.
 *      (Published CSVs refresh on a ~5 minute delay — the site merges fresh
 *      scores client-side, so this only affects other guests' views.)
 *
 * COLUMN CONTRACT — the Sheet's header row (row 1) must be exactly:
 *   Timestamp | Name | Score
 * This script is column-agnostic (it appends whatever array submitScore
 * sends), but loadLeaderboard in gameSheet.ts reads "Name" and "Score" BY
 * HEADER NAME, so renaming those headers breaks the leaderboard.
 *
 * If you ever edit this script, redeploy: Deploy → Manage deployments → edit →
 * Version: New version → Deploy (the /exec URL stays the same).
 */

// Must match GAME_WRITE_TOKEN in src/lib/gameSheet.ts.
const TOKEN = 'CHANGE-ME';

// Blank = first/leftmost sheet tab. Set a name to target a specific tab.
const SHEET_NAME = '';

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    if (body.token !== TOKEN) {
      return json({ ok: false, error: 'forbidden' });
    }

    // Honeypot: a real submission leaves the hidden field empty. A bot that
    // fills it gets a silent success — we report ok but write nothing.
    if (body.honeypot && String(body.honeypot).trim() !== '') {
      return json({ ok: true, dropped: true });
    }

    const row = body.row || [];
    if (row.length === 0) {
      return json({ ok: false, error: 'empty row' });
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = SHEET_NAME ? ss.getSheetByName(SHEET_NAME) : ss.getSheets()[0];

    // Append one row, column-agnostic — whatever submitScore sends lands left
    // to right.
    sheet.appendRow(row);

    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON,
  );
}
