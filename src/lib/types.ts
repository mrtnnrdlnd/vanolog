export interface CalendarData {
    day?: number;
    val: number | null;
    isToday: boolean;
    isDisabled: boolean;
    isSunday: boolean;
    monthIdx: number;
    year: number;
    dateStr?: string;
}

export interface MonthBound {
    startCol: number;
    startRow: number;
    endCol: number;
    endRow: number;
    y: number; // Årtal
    m: number; // Månadsindex
    pathD: string;
}

export interface ColumnStat {
    val: number;
    hasData: boolean;
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