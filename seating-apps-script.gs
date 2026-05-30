/**
 * Seating Sheet write-proxy — Google Apps Script web app.
 *
 * Lets the static /seating page save the seating plan back to this Sheet with
 * one click (no manual copy/paste), without any backend of your own.
 *
 * SETUP
 *   1. Open the seating Google Sheet → Extensions → Apps Script.
 *   2. Delete any sample code, paste this whole file in (Code.gs).
 *   3. Set TOKEN below to a random string (letters/numbers). Keep a copy.
 *   4. Deploy → New deployment → gear icon → "Web app".
 *        - Description: seating write-proxy
 *        - Execute as:  Me
 *        - Who has access: Anyone        ← must be "Anyone", not "Anyone with Google account"
 *      Deploy → authorize when prompted (allow it to manage this spreadsheet).
 *   5. Copy the "Web app URL" (ends with /exec).
 *   6. Send me the /exec URL and the TOKEN. I'll drop them into seating.ts
 *      (SEATING_WRITE_URL and SEATING_WRITE_TOKEN) and the "Save to Sheet"
 *      button goes live.
 *
 * If you ever edit this script, redeploy: Deploy → Manage deployments → edit →
 * Version: New version → Deploy (the /exec URL stays the same).
 */

// Must match SEATING_WRITE_TOKEN in src/lib/seating.ts.
const TOKEN = '21>!Vg7oJYvO';

// Blank = first/leftmost sheet tab. Set a name to target a specific tab.
const SHEET_NAME = '';

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    if (body.token !== TOKEN) {
      return json({ ok: false, error: 'forbidden' });
    }
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = SHEET_NAME ? ss.getSheetByName(SHEET_NAME) : ss.getSheets()[0];
    const rows = body.rows || [];

    // Whole-sheet replace: clear, then write the new rows (header + data).
    sheet.clearContents();
    if (rows.length > 0) {
      sheet.getRange(1, 1, rows.length, rows[0].length).setValues(rows);
    }
    return json({ ok: true, rows: rows.length });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON,
  );
}
