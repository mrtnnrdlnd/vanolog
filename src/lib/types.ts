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
    color: string;
    width: number;
    
    // Graf-typ och beräkning per dataset
    graphType: GraphType;
    graphMode: GraphMode;

    // --- NYTT: Visa/Dölj själva linjen ---
    showLine: boolean; 

    // Markör-inställningar
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

// Denna behövs för layout-motorn
export interface ColumnStat {
    val: number | null;
    hasData: boolean;
}

// Alias
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