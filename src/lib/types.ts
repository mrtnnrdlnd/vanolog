export interface CalendarConfig {
    boxSize: number;
    stride: number;
    radius: number;
    minRows: number;
    maxRows: number;
    footerHeight: number;
    titleBarHeight: number; // Central konfiguration
    months: string[];
}

export interface CalendarData {
    day?: number;
    val: number | null;
    isToday: boolean;
    isDisabled: boolean;
    isSunday: boolean;
    monthIdx: number;
    year: number;
    dateStr?: string;
    isHidden?: boolean;
}

export interface ColumnStat {
    val: number;
    hasData: boolean;
}

export interface MonthBound {
    startCol: number;
    startRow: number;
    endCol: number;
    endRow: number;
    y: number;
    m: number;
    pathD: string;
}

export interface GoogleApiItem {
    y: number;
    monthIdx: number;
    d: number;
    val: number | null;
    isToday: boolean;
}

export interface ApiDataItem {
    year: number;
    monthIdx: number;
    day: number;
    val: number | null;
    isToday: boolean;
}

export type GraphMode = 'avg' | 'median' | 'max' | 'min';
export type GraphType = 'line' | 'bar';

export const CONFIG: CalendarConfig = {
    boxSize: 24,
    stride: 26,
    radius: 6,
    minRows: 1,
    maxRows: 16,
    footerHeight: 40,
    titleBarHeight: 50, // Ändra här så slår det igenom överallt
    months: ["Jan", "Feb", "Mar", "Apr", "Maj", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dec"]
};