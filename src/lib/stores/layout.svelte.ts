import { CONFIG } from '../config/constants';
import type { GraphMode, GraphType, MonthBound } from '../types';
import { calculateStat } from '../services/statistics';
import { createMonthPath } from '../services/geometry';
import { dataStore } from './data.svelte';

const STORAGE_KEY = 'calendar_settings_v1';

class LayoutStore {
    // --- GRUNDLÄGGANDE CONFIG ---
    rows = $state(7);
    
    // NYTT: Håller koll på om vi håller på att ändra storlek just nu
    isResizing = $state(false);

    // --- GRAF INSTÄLLNINGAR ---
    graphMode = $state<GraphMode>('avg');
    graphType = $state<GraphType>('line');
    
    // --- UTSEENDE INSTÄLLNINGAR ---
    showGraph = $state(true);
    showHeatmap = $state(true);
    showMonthLines = $state(true);
    darkMode = $state(false);
    heatmapHue = $state(205);

    // --- SKÄRMSTORLEK ---
    screenH = $state(800);
    screenW = $state(400);
    
    // --- GRAF SKALA (MANUELL) ---
    manualMin = $state<number | null>(null);
    manualMax = $state<number | null>(null);

    constructor() {
        if (typeof window !== 'undefined') {
            this.loadSettings();
            this.updateDims();
            window.addEventListener('resize', () => this.updateDims());
        }
    }

    loadSettings() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed.rows) this.rows = parsed.rows;
                if (parsed.graphMode) this.graphMode = parsed.graphMode;
                if (parsed.graphType) this.graphType = parsed.graphType;
                if (parsed.showGraph !== undefined) this.showGraph = parsed.showGraph;
                if (parsed.showHeatmap !== undefined) this.showHeatmap = parsed.showHeatmap;
                if (parsed.showMonthLines !== undefined) this.showMonthLines = parsed.showMonthLines;
                if (parsed.darkMode !== undefined) this.darkMode = parsed.darkMode;
                if (parsed.heatmapHue !== undefined) this.heatmapHue = parsed.heatmapHue;
                if (parsed.manualMin !== undefined) this.manualMin = parsed.manualMin;
                if (parsed.manualMax !== undefined) this.manualMax = parsed.manualMax;
            }
        } catch (e) {
            console.error("Kunde inte ladda inställningar", e);
        }
    }

    resetSettings() {
        this.rows = 7;
        this.graphMode = 'avg';
        this.graphType = 'line';
        this.showGraph = true;
        this.showHeatmap = true;
        this.showMonthLines = true;
        this.darkMode = false;
        this.heatmapHue = 205;
        this.manualMin = null;
        this.manualMax = null;
        localStorage.removeItem(STORAGE_KEY);
    }

    updateDims() {
        this.screenH = window.innerHeight;
        this.screenW = window.innerWidth;
    }

    // --- DERIVED GEOMETRY ---
    gridH = $derived(this.rows * CONFIG.stride);
    chartH = $derived(this.screenH - this.gridH - CONFIG.footerHeight - CONFIG.titleBarHeight);
    centerOffset = $derived((this.screenW - CONFIG.stride) / 2);
    
    firstRealIndex = $derived(dataStore.data.findIndex(d => d.day !== undefined));
    colsToHide = $derived(this.firstRealIndex === -1 ? 0 : Math.floor(this.firstRealIndex / this.rows));
    xShift = $derived(this.colsToHide * CONFIG.stride);
    totalCols = $derived(Math.ceil(dataStore.data.length / this.rows));
    totalWidth = $derived((this.totalCols - this.colsToHide) * CONFIG.stride);

    // --- AUTOMATISK SKALA ---
    dataRange = $derived.by(() => {
        const valid = dataStore.data
            .map(d => d.val)
            .filter((v): v is number => v !== null && v !== undefined && !isNaN(v));
        
        if (!valid.length) return { min: 0, max: 100 };
        return { min: Math.min(...valid), max: Math.max(...valid) };
    });

    graphMin = $derived(this.manualMin ?? (this.dataRange.min === this.dataRange.max ? this.dataRange.min - 10 : this.dataRange.min));
    graphMax = $derived(this.manualMax ?? (this.dataRange.min === this.dataRange.max ? this.dataRange.max + 10 : this.dataRange.max));

    // --- VISUELLT DATA-PREP ---
    visuals = $derived.by(() => {
        const stats: { val: number; hasData: boolean }[] = [];
        const monthBounds: MonthBound[] = [];
        const monthMap = new Map<string, MonthBound>();
        let colValues: (number | null)[] = [];
        
        const gridFullBottom = this.chartH + this.gridH + CONFIG.footerHeight;

        for (let i = 0; i < dataStore.data.length; i++) {
            const d = dataStore.data[i];
            const rawCol = Math.floor(i / this.rows);
            const row = i % this.rows;
            const visualCol = rawCol - (this.xShift / CONFIG.stride);

            if (d.day && d.val !== null) colValues.push(d.val);

            if (d.day) {
                const mKey = `${d.year}-${d.monthIdx}`;
                if (!monthMap.has(mKey)) {
                    const bound = { 
                        startCol: visualCol, startRow: row, endCol: visualCol, endRow: row, 
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

            if ((i + 1) % this.rows === 0 || i === dataStore.data.length - 1) {
                const s = calculateStat(colValues, this.graphMode);
                stats.push({ val: s ?? 0, hasData: s !== null });
                colValues = [];
            }
        }

        monthBounds.forEach(b => {
            b.pathD = createMonthPath(
                b.startCol, b.startRow, b.endCol, b.endRow, 
                CONFIG.stride, CONFIG.radius, 
                this.chartH, gridFullBottom, this.rows
            );
        });

        return { stats, monthBounds };
    });

    getY(val: number) {
        const range = this.graphMax - this.graphMin;
        const availableH = Math.max(0, this.chartH - 20);
        const normalized = Math.max(0, Math.min(1, (val - this.graphMin) / range));
        return (this.chartH - 5) - (normalized * availableH);
    }
}

export const layoutStore = new LayoutStore();