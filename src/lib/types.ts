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

// --- NYTT: Interface för Dataset ---
export interface Dataset {
    id: string;
    name: string;
    color: string;
    data: CalendarData[];
    isVisible: boolean;
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

// Helper för layout-store (används för graferna)
export interface VisualStat {
    val: number | null;
    hasData: boolean;
}

export interface ApiDataItem {
    year: number;
    monthIdx: number;
    day: number;
    val: number | null;
    isToday: boolean;
}

export interface GoogleApiItem {
    y: number;          // year
    monthIdx: number;
    d: number;          // day
    val: number | null;
    val2?: number | null;
    isToday: boolean;
}

export type GraphMode = 'avg' | 'median' | 'max' | 'min' | 'all';
export type GraphType = 'line' | 'bar';