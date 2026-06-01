/**
 * RSVP Sheet write-proxy — Google Apps Script web app (APPEND variant).
 *
 * Backs the native RSVP form (src/components/RSVP.tsx → submitRsvp in
 * src/lib/rsvpSheet.ts → appendRowToSheet in src/lib/sheetWrite.ts). Each
 * submission APPENDS one row to this Sheet — unlike the seating/affiliations
 * proxies, which whole-sheet REPLACE.
 *
 * SETUP
 *   1. Open the RSVP Google Sheet → Extensions → Apps Script.
 *   2. Delete any sample code, paste this whole file in (Code.gs).
 *   3. TOKEN below must match RSVP_WRITE_TOKEN in src/lib/rsvpSheet.ts.
 *   4. Deploy → New deployment → gear icon → "Web app".
 *        - Description: rsvp write-proxy (append)
 *        - Execute as:  Me
 *        - Who has access: Anyone        ← must be "Anyone", not "Anyone with Google account"
 *      Deploy → authorize when prompted (allow it to manage this spreadsheet).
 *   5. The "Web app URL" (ends with /exec) is RSVP_WRITE_URL in rsvpSheet.ts.
 *
 * COLUMN CONTRACT — the Sheet's header row (row 1) must be exactly:
 *   Timestamp | Full Name | Email Address | Contact Number | Are you attending the wedding? | Name of your +1 guest
 * This script is column-agnostic (it appends whatever array submitRsvp sends),
 * but guestSheets.ts reads each column BY HEADER NAME, so the 6th header cell
 * must read "Name of your +1 guest" for the +1 to be picked up.
 *
 * If you ever edit this script, redeploy: Deploy → Manage deployments → edit →
 * Version: New version → Deploy (the /exec URL stays the same).
 */

// Must match RSVP_WRITE_TOKEN in src/lib/rsvpSheet.ts.
const TOKEN = '!G6A!Q2Z~69r';

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

    // Append one row, column-agnostic — whatever submitRsvp sends lands left to
    // right, so adding the trailing +1 cell needs no change here.
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
