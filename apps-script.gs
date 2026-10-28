/** @OnlyCurrentDoc */
// Wklejane w arkuszu: Rozszerzenia → Apps Script. Przyjmuje wyniki ze strony i dopisuje je do zakładek.

const RAW_SHEET = "surowe";
const SUMMARY_SHEET = "wyniki";

const RAW_COLUMNS = [
  "data", "pseudonim", "id_sesji", "nr_proby", "strona", "pierwszy_klawisz",
  "czas_pierwszej_reakcji_ms", "blad", "czas_poprawnej_reakcji_ms", "zestaw_klawiszy",
  "odstep_sygnal_obiekt_ms", "czas_wykrzyknika_ms", "przerwa_ms",
];
const SUMMARY_COLUMNS = [
  "data", "pseudonim", "id_sesji", "ukonczony", "liczba_prob", "sr_L_ms", "sr_P_ms",
  "sr_L_bez_bledow_ms", "sr_P_bez_bledow_ms", "bledy_L", "bledy_P", "ustawienia",
];

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    const data = JSON.parse(e.postData.contents);
    validate(data);

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const summarySheet = getSheet(ss, SUMMARY_SHEET, SUMMARY_COLUMNS);
    // Ponowiona wysyłka tej samej sesji nie dubluje wierszy.
    if (summarySheet.createTextFinder(data.summary.id_sesji).matchEntireCell(true).findNext()) {
      return reply({ ok: true, duplicate: true });
    }

    appendRows(getSheet(ss, RAW_SHEET, RAW_COLUMNS), data.trials.map(t => toRow(t, RAW_COLUMNS)));
    appendRows(summarySheet, [toRow(data.summary, SUMMARY_COLUMNS)]);
    return reply({ ok: true });
  } catch (err) {
    return reply({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function validate(data) {
  const s = data && data.summary;
  const trials = data && data.trials;
  if (!s || !Array.isArray(trials) || trials.length < 1 || trials.length > 50) throw new Error("Niepoprawne dane");
  if (typeof s.pseudonim !== "string" || !s.pseudonim || s.pseudonim.length > 40) throw new Error("Niepoprawny pseudonim");
  if (!/^[a-z0-9-]{6,40}$/.test(s.id_sesji)) throw new Error("Niepoprawne id sesji");
  trials.forEach(t => {
    if (t.id_sesji !== s.id_sesji || t.pseudonim !== s.pseudonim) throw new Error("Niespójna sesja");
    if (t.strona !== "L" && t.strona !== "P") throw new Error("Niepoprawna strona");
    ["czas_pierwszej_reakcji_ms", "czas_poprawnej_reakcji_ms"].forEach(k => {
      if (typeof t[k] !== "number" || t[k] < 0 || t[k] > 600000) throw new Error("Niepoprawny czas reakcji");
    });
  });
}

function toRow(obj, columns) {
  return columns.map(c => {
    const v = obj[c] === undefined || obj[c] === null ? "" : obj[c];
    // Tekst zaczynający się od =, +, -, @ arkusz potraktowałby jak formułę.
    return typeof v === "string" && /^[=+\-@]/.test(v) ? "'" + v : v;
  });
}

function getSheet(ss, name, columns) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(columns);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function appendRows(sheet, rows) {
  sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
}

function reply(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
