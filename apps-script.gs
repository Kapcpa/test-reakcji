/** @OnlyCurrentDoc */
// Wklejane w arkuszu: Rozszerzenia → Apps Script. Przyjmuje wyniki ze strony i dopisuje je do zakładek.

const SUMMARY_SHEET = "Wyniki";
const RAW_SHEET = "Wszystkie próby";

// [klucz wysyłany ze strony, nagłówek w arkuszu]
const SUMMARY_COLUMNS = [
  ["data", "Data"],
  ["pseudonim", "Pseudonim"],
  ["id_sesji", "ID sesji"],
  ["ukonczony", "Ukończony"],
  ["liczba_prob", "Liczba prób"],
  ["sr_L_ms", "Śr. czas lewa [ms]"],
  ["sr_P_ms", "Śr. czas prawa [ms]"],
  ["sr_L_bez_bledow_ms", "Śr. czas lewa bez błędów [ms]"],
  ["sr_P_bez_bledow_ms", "Śr. czas prawa bez błędów [ms]"],
  ["bledy_L", "Błędy lewa"],
  ["bledy_P", "Błędy prawa"],
  ["ustawienia", "Ustawienia"],
];
const RAW_COLUMNS = [
  ["data", "Data"],
  ["pseudonim", "Pseudonim"],
  ["id_sesji", "ID sesji"],
  ["nr_proby", "Nr próby"],
  ["strona", "Strona bodźca"],
  ["pierwszy_klawisz", "Pierwsza reakcja (strona)"],
  ["czas_pierwszej_reakcji_ms", "Czas pierwszej reakcji [ms]"],
  ["blad", "Błąd"],
  ["czas_poprawnej_reakcji_ms", "Czas poprawnej reakcji [ms]"],
  ["zestaw_klawiszy", "Klawisze"],
  ["odstep_sygnal_obiekt_ms", "Od „!” do bodźca [ms]"],
  ["czas_wykrzyknika_ms", "Czas wyświetlania „!” [ms]"],
  ["przerwa_ms", "Przerwa przed próbą [ms]"],
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
    if (t.strona !== "lewa" && t.strona !== "prawa") throw new Error("Niepoprawna strona");
    ["czas_pierwszej_reakcji_ms", "czas_poprawnej_reakcji_ms"].forEach(k => {
      if (typeof t[k] !== "number" || t[k] < 0 || t[k] > 600000) throw new Error("Niepoprawny czas reakcji");
    });
  });
}

function toRow(obj, columns) {
  return columns.map(([key]) => {
    const v = obj[key] === undefined || obj[key] === null ? "" : obj[key];
    // Tekst zaczynający się od =, +, -, @ arkusz potraktowałby jak formułę.
    return typeof v === "string" && /^[=+\-@]/.test(v) ? "'" + v : v;
  });
}

function getSheet(ss, name, columns) {
  const sheet = ss.getSheetByName(name) || ss.insertSheet(name);
  // Nagłówki odświeżane przy każdym zapisie, więc zmiana nazw kolumn nie wymaga ręcznej poprawki.
  sheet.getRange(1, 1, 1, columns.length).setValues([columns.map(([, label]) => label)]).setFontWeight("bold");
  sheet.setFrozenRows(1);
  return sheet;
}

function appendRows(sheet, rows) {
  sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
}

function reply(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
