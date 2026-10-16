/**
 * William Doo Auditorium — booking store (Google Apps Script web app).
 *
 * Backs the form's three operations:
 *   GET  ?action=get&id=NC-XXXXXX   → { success, booking }   (edit flow)
 *   POST { action:'create', data }  → appends a new row
 *   POST { action:'update', data }  → overwrites the row whose bookingId matches
 *
 * SETUP
 *   1. Create a Google Sheet, note its ID (the long string in its URL).
 *   2. Extensions → Apps Script, paste this file, set SHEET_ID below.
 *   3. Deploy → New deployment → Web app:
 *        Execute as: Me
 *        Who has access: Anyone
 *   4. Copy the /exec URL into .env as VITE_SHEETS_WEBAPP_URL.
 *
 * The client posts with mode:'no-cors', so it cannot read the POST response —
 * that's fine, it only needs the write to land. GET is a normal fetch and does
 * read the JSON below.
 */

var SHEET_ID = 'YOUR_GOOGLE_SHEET_ID';
var SHEET_NAME = 'Bookings';

// Column order for the sheet. The first row is written as headers on first use.
// `bookingId` must stay first — lookups scan that column.
var FIELDS = [
  'bookingId',
  'title','date','attendees','setupStart','startTime','endTime','breakdownEnd','description','groupType',
  'groupName','org1','org1phone','org1email','org2','org2phone','org3','org3phone',
  'avPodiumA','avFamiliar','clickshare','handheld','lapel','podiumMic','assistive','avNotes',
  'atrium','food','foodCatering','alcohol',
  'paymentType','paymentDept','paymentAcct','paymentContact','paymentEmail','paymentPhone','paymentGL','paymentCFC','paymentCC','paymentFund',
  'room','fpPieces','showPartition',
  'sig','sigDate','sigTitle',
  'submittedAt','isUpdate','status'
];

function getSheet_() {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(FIELDS);
  } else if (sheet.getLastRow() === 0) {
    sheet.appendRow(FIELDS);
  }
  return sheet;
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function rowToObject_(headers, row) {
  var o = {};
  for (var i = 0; i < headers.length; i++) o[headers[i]] = row[i];
  return o;
}

function findRowById_(sheet, id) {
  var idCol = sheet.getRange(1, 1, sheet.getLastRow(), 1).getValues();
  for (var r = 1; r < idCol.length; r++) {       // skip header at index 0
    if (String(idCol[r][0]) === String(id)) return r + 1; // 1-based sheet row
  }
  return -1;
}

function doGet(e) {
  try {
    var action = e && e.parameter ? e.parameter.action : '';
    if (action !== 'get') return json_({ success: false, error: 'unknown action' });

    var id = e.parameter.id;
    var sheet = getSheet_();
    var rowNum = findRowById_(sheet, id);
    if (rowNum === -1) return json_({ success: false, error: 'not found' });

    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var row = sheet.getRange(rowNum, 1, 1, sheet.getLastColumn()).getValues()[0];
    return json_({ success: true, booking: rowToObject_(headers, row) });
  } catch (err) {
    return json_({ success: false, error: String(err) });
  }
}

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    var action = body.action;
    var payload = body.data || {};
    var sheet = getSheet_();
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

    var rowValues = headers.map(function (h) {
      var v = payload[h];
      if (v === undefined || v === null) return '';
      return typeof v === 'object' ? JSON.stringify(v) : v;
    });

    if (action === 'update') {
      var rowNum = findRowById_(sheet, payload.bookingId);
      if (rowNum === -1) {
        sheet.appendRow(rowValues); // fall back to insert if id vanished
      } else {
        sheet.getRange(rowNum, 1, 1, rowValues.length).setValues([rowValues]);
      }
      return json_({ success: true, action: 'update', bookingId: payload.bookingId });
    }

    // default: create
    sheet.appendRow(rowValues);
    return json_({ success: true, action: 'create', bookingId: payload.bookingId });
  } catch (err) {
    return json_({ success: false, error: String(err) });
  }
}
