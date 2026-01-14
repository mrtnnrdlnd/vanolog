import type { CalendarData, GraphMode, MonthBound, ColumnStat } from '../types';
import { CONFIG } from '../config/constants';
import { calculateStat } from '../services/statistics';
import { createMonthPath } from '../services/geometry';

// Retur-typen för layout-beräkningen
export interface LayoutResult {
    gridH: number;
    chartH: number;
    centerOffset: number;
    colsToHide: number;
    xShift: number;
    totalCols: number;
    totalWidth: number;
    stats: ColumnStat[];
    monthBounds: MonthBound[];
}

/**
 * En ren funktion som räknar ut all geometri för kalendern.
 * Inget Svelte-state här, bara input -> output.
 */
export function calculateLayout(
    data: CalendarData[],
    rows: number,
    screenW: number,
    screenH: number,
    graphMode: GraphMode
): LayoutResult {
    
    // 1. Grundläggande dimensioner
    const gridH = rows * CONFIG.stride;
    const chartH = screenH - gridH - CONFIG.footerHeight - CONFIG.titleBarHeight;
    const centerOffset = (screenW - CONFIG.stride) / 2;

    // 2. Beräkna kolumn-struktur
    const firstRealIndex = data.findIndex(d => d.day !== undefined);
    const colsToHide = firstRealIndex === -1 ? 0 : Math.floor(firstRealIndex / rows);
    const xShift = colsToHide * CONFIG.stride;
    const totalCols = Math.ceil(data.length / rows);
    const totalWidth = (totalCols - colsToHide) * CONFIG.stride;

    // 3. Loopa igenom data för att skapa statistik och månadslinjer
    const stats: ColumnStat[] = [];
    const monthBounds: MonthBound[] = [];
    const monthMap = new Map<string, MonthBound>();
    let colValues: (number | null)[] = [];
    
    const gridFullBottom = chartH + gridH + CONFIG.footerHeight;

    for (let i = 0; i < data.length; i++) {
        const d = data[i];
        const rawCol = Math.floor(i / rows);
        const row = i % rows;
        // visualCol är kolumnens index relativt skärmens vänsterkant (minus dolda kolumner)
        const visualCol = rawCol - (xShift / CONFIG.stride);

        // Samla värden för statistik
        if (d.day && d.val !== null) colValues.push(d.val);

        // Hantera månadsgruppering
        if (d.day) {
            const mKey = `${d.year}-${d.monthIdx}`;
            if (!monthMap.has(mKey)) {
                const bound: MonthBound = { 
                    startCol: visualCol, startRow: row, 
                    endCol: visualCol, endRow: row, 
                    y: d.year, m: d.monthIdx, pathD: '' 
                };
                monthMap.set(mKey, bound);
                monthBounds.push(bound);
            } else {
                const b = monthMap.get(mKey)!;
                b.endCol = visualCol;
                b.endRow = row;
            }
        }

        // När en kolumn är slut (eller datat är slut), räkna ut stats
        if ((i + 1) % rows === 0 || i === data.length - 1) {
            const s = calculateStat(colValues, graphMode);
            stats.push({ val: s ?? 0, hasData: s !== null });
            colValues = [];
        }
    }

    // 4. Generera SVG-paths för månaderna
    monthBounds.forEach(b => {
        b.pathD = createMonthPath(
            b.startCol, b.startRow, b.endCol, b.endRow, 
            CONFIG.stride, CONFIG.radius, 
            chartH, gridFullBottom, rows
        );
    });

    return {
        gridH,
        chartH,
        centerOffset,
        colsToHide,
        xShift,
        totalCols,
        totalWidth,
        stats,
        monthBounds
    };
}