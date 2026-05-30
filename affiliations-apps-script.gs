/**
 * Affiliations Sheet write-proxy — Google Apps Script web app.
 *
 * Lets the static /guests Groom/Bride admin view save affiliation overrides
 * back to the affiliations Sheet with one click (no copy/paste). Identical in
 * shape to seating-apps-script.gs — a SEPARATE deployment because Apps Script
 * binds to one spreadsheet.
 *
 * SETUP
 *   1. Open the AFFILIATIONS Google Sheet → Extensions → Apps Script.
 *   2. Delete any sample code, paste this whole file in (Code.gs).
 *   3. Set TOKEN below to a random string — DIFFERENT from the seating token,
 *      so one leak doesn't expose both Sheets. Keep a copy.
 *   4. Deploy → New deployment → gear → "Web app".
 *        - Execute as:  Me
 *        - Who has access: Anyone        ← not "Anyone with Google account"
 *      Deploy → authorize when prompted.
 *   5. Copy the "Web app URL" (ends with /exec).
 *   6. Send me the /exec URL and the TOKEN. I'll set them in src/lib/affiliations.ts
 *      (AFFILIATIONS_WRITE_URL and AFFILIATIONS_WRITE_TOKEN); the "Save to Sheet"
 *      button then appears in the Groom/Bride admin view.
 *
 * The site writes rows [['guestName','affiliation'], [name, 'Groom'|'Bride'], ...]
 * (overrides only). The script doesn't care about the schema — it writes
 * whatever rows it's handed, whole-sheet replace.
 */

// Must match AFFILIATIONS_WRITE_TOKEN in src/lib/affiliations.ts.
// Use a DIFFERENT value than the seating script's TOKEN.
const TOKEN = 'change-me-affiliations';

// Blank = first/leftmost sheet tab.
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
