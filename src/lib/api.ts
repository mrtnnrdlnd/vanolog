import type { ApiDataItem, GoogleApiItem } from './types';

// Mock-data för lokal utveckling
const generateMockData = (): ApiDataItem[] => {
  const mockData: ApiDataItem[] = [];
  const now = new Date();
  const startYear = now.getFullYear();
  
  // Skapa mockdata för hela året
  for (let i = 0; i < 3650; i++) {
    const date = new Date(startYear, 0, 1 + i);
    mockData.push({
      year: date.getFullYear(),
      monthIdx: date.getMonth(),
      day: date.getDate(),
      val: Math.random() > 0.8 ? null : Math.floor(Math.random() * 100),
      isToday: date.toDateString() === new Date().toDateString()
    });
  }
  return mockData;
};

export const api = {
  async getSheetData(): Promise<ApiDataItem[]> {
    // 1. Lokal utveckling (Mock)
    if (import.meta.env.DEV) {
      console.log("🛠️ Dev Mode: Använder mock-data");
      return new Promise((resolve) => {
        setTimeout(() => resolve(generateMockData()), 800);
      });
    }

    // 2. Produktion (Google Apps Script)
    return new Promise((resolve, reject) => {
      // @ts-ignore
      if (typeof google === 'undefined') return reject("Google API saknas");
      // @ts-ignore
      google.script.run
        .withSuccessHandler((data: GoogleApiItem[]) => {
          // VIKTIGT: Mappa om Googles {y, d} till Appens {year, day}
          const mappedData: ApiDataItem[] = data.map(item => ({
            year: item.y,         // code.gs skickar 'y'
            monthIdx: item.monthIdx,
            day: item.d,          // code.gs skickar 'd'
            val: item.val,
            isToday: item.isToday
          }));
          resolve(mappedData);
        })
        .withFailureHandler(reject)
        .getSheetData(); // Anropar funktionen i code.gs
    });
  },

  async updateValue(dateStr: string, val: number | null): Promise<any> {
    if (import.meta.env.DEV) {
      console.log(`💾 Mock Save: ${dateStr} -> ${val}`);
      return new Promise((resolve) => setTimeout(() => resolve({ status: "success" }), 500));
    }

    return new Promise((resolve, reject) => {
      // @ts-ignore
      if (typeof google === 'undefined') return reject("Google API saknas");
      // @ts-ignore
      google.script.run
        .withSuccessHandler(resolve)
        .withFailureHandler(reject)
        .updateValueInSheet(dateStr, val);
    });
  }
};
        
      