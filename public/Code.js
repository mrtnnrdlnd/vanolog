/**
 * KONFIGURATION
 * Ersätt ID:t nedan med ID:t från ditt kalkylarks URL.
 */
const SPREADSHEET_ID = "1y7ThJVWHDYs9b2VG0qILldOD3JcLF5Pu9fDpGvn6h68"; 
const SHEET_NAME = "Data";

/**
 * Serverar den kompilerade Svelte-appen (index.html).
 */
function doGet() {
  // Vite-plugin-singlefile skapar 'index.html' i dist-mappen.
  return HtmlService.createHtmlOutputFromFile('index')
      .setTitle('Min Kalender')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Hämtar data och mappar den direkt till Svelte-appens DayData-interface.
 */
function getSheetData() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME) || ss.getSheets()[0];
    const lastRow = sheet.getLastRow();
    
    if (lastRow < 1) return [];

    // Hämtar datum (kolumn A) och värde (kolumn B)
    const values = sheet.getRange(1, 1, lastRow, 2).getValues();
    const timezone = ss.getSpreadsheetTimeZone();
    const todayStr = Utilities.formatDate(new Date(), timezone, "yyyy-MM-dd");
    
    const cleanData = [];

    for (let i = 0; i < values.length; i++) {
      const row = values[i];
      if (!row[0]) continue; // Hoppa över tomma rader

      const dateObj = new Date(row[0]);
      if (isNaN(dateObj.getTime())) continue; // Hoppa över ogiltiga datum

      const dateString = Utilities.formatDate(dateObj, timezone, "yyyy-MM-dd");
      const [y, m, d] = dateString.split('-').map(Number);
      
      // Mappar mot src/lib/types.ts: DayData
      cleanData.push({
        y: y,
        monthIdx: m - 1, // JS-månader är 0-11
        d: d,
        val: (row[1] === "" || row[1] === null) ? null : Number(row[1]),
        isToday: dateString === todayStr
      });
    }

    return cleanData;
  } catch (err) {
    console.error("Fel i getSheetData: " + err.message);
    return [];
  }
}

/**
 * Uppdaterar eller lägger till ett värde för ett specifikt datum.
 * @param {string} dateString Format: "yyyy-MM-dd"
 * @param {number|null} newValue Värdet som ska sparas
 */
function updateValueInSheet(dateString, newValue) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME) || ss.getSheets()[0];
    const lastRow = sheet.getLastRow();
    const timeZone = ss.getSpreadsheetTimeZone();

    if (lastRow > 0) {
      const values = sheet.getRange(1, 1, lastRow, 1).getValues();
      
      // Leta efter befintligt datum
      for (let i = 0; i < values.length; i++) {
        let cellValue = values[i][0];
        let rowDateString = (cellValue instanceof Date) 
          ? Utilities.formatDate(cellValue, timeZone, "yyyy-MM-dd")
          : String(cellValue);

        if (rowDateString === dateString) {
          // Hittade datumet, uppdatera värdet i kolumn B
          sheet.getRange(i + 1, 2).setValue(newValue);
          return { status: "success", action: "updated" };
        }
      }
    }

    // Om datumet inte fanns, lägg till ny rad längst ned
    sheet.appendRow([new Date(dateString), newValue]);
    return { status: "success", action: "appended" };

  } catch (err) {
    return { status: "error", message: err.message };
  }
}