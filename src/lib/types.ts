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

export interface Dataset {
    id: string;
    name: string;
    
    // ÄNDRING: Vi använder hue (0-360) istället för hex-färg
    hue: number; 
    
    width: number;
    graphType: GraphType;
    graphMode: GraphMode;
    showLine: boolean; 
    showMarkers: boolean;
    markerSize: number;
    markerOpacity: number;
    
    data: CalendarData[];
    isVisible: boolean;
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

export interface ColumnStat {
    val: number | null;
    hasData: boolean;
}

export type VisualStat = ColumnStat;

export interface ApiDataItem {
    year: number;
    monthIdx: number;
    day: number;
    val: number | null;
    isToday: boolean;
}

export interface GoogleApiItem {
    y: number;
    monthIdx: number;
    d: number;
    val: number | null;
    val2?: number | null;
    isToday: boolean;
}

export type GraphMode = 'avg' | 'median' | 'max' | 'min' | 'all';
export type GraphType = 'line' | 'bar';