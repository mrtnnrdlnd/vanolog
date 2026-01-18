import type { GraphMode, GraphType, VisualStat } from '../types';
import { dataStore } from './data.svelte';
import { calculateLayout, type LayoutResult } from '../engine/layout-engine';
import { calculateStat } from '../services/statistics';

const STORAGE_KEY = 'calendar_settings_v1';

class LayoutStore {
    rows = $state(7);
    isResizing = $state(false);
    
    // Global graphMode används nu mest för grid-beräkning om nödvändigt
    graphMode = $state<GraphMode>('avg'); 
    
    showGraph = $state(true);
    showHeatmap = $state(true);
    showMonthLines = $state(true);
    darkMode = $state(false);
    heatmapHue = $state(205);

    screenH = $state(800);
    screenW = $state(400);
    
    manualMin = $state<number | null>(null);
    manualMax = $state<number | null>(null);

    graphPadding = { top: 15, bottom: 15 };

    constructor() {
        if (typeof window !== 'undefined') {
            this.loadSettings();
            this.updateDims();
            window.addEventListener('resize', () => this.updateDims());
        }
    }

    layoutCalc = $derived<LayoutResult>(
        calculateLayout(
            dataStore.data, 
            this.rows, 
            this.screenW, 
            this.screenH, 
            this.graphMode 
        )
    );

    gridH = $derived(this.layoutCalc.gridH);
    chartH = $derived(this.layoutCalc.chartH);
    centerOffset = $derived(this.layoutCalc.centerOffset);
    colsToHide = $derived(this.layoutCalc.colsToHide);
    xShift = $derived(this.layoutCalc.xShift);
    totalCols = $derived(this.layoutCalc.totalCols);
    totalWidth = $derived(this.layoutCalc.totalWidth);
    
    // --- VISUALS ---
    visuals = $derived.by(() => {
        const resultLines: { 
            id: string, 
            color: string, 
            width: number, 
            graphType: GraphType, 
            graphMode: GraphMode,
            
            // NYTT: showLine ingår här
            showLine: boolean,
            
            showMarkers: boolean,
            markerSize: number,
            markerOpacity: number,

            stats: VisualStat[] 
        }[] = [];

        for (const ds of dataStore.datasets) {
            if (!ds.isVisible) continue;

            const colCount = Math.ceil(ds.data.length / this.rows);
            const stats: VisualStat[] = [];

            for (let c = 0; c < colCount; c++) {
                const startIdx = c * this.rows;
                const colItems = [];
                for (let r = 0; r < this.rows; r++) {
                    const item = ds.data[startIdx + r];
                    if (item && item.val !== null) colItems.push(item.val);
                }

                if (colItems.length > 0) {
                    const val = calculateStat(colItems, ds.graphMode);
                    stats.push({ val, hasData: val !== null });
                } else {
                    stats.push({ val: null, hasData: false });
                }
            }
            
            resultLines.push({ 
                id: ds.id, 
                color: ds.color, 
                width: ds.width,
                graphType: ds.graphType,
                graphMode: ds.graphMode,
                
                // Mappa showLine från dataset till layout
                showLine: ds.showLine,
                
                showMarkers: ds.showMarkers,
                markerSize: ds.markerSize,
                markerOpacity: ds.markerOpacity,

                stats 
            });
        }

        return { 
            lines: resultLines,
            monthBounds: this.layoutCalc.monthBounds 
        };
    });

    updateDims() {
        this.screenH = window.innerHeight;
        this.screenW = window.innerWidth;
    }

    dataRange = $derived.by(() => {
        let allValues: number[] = [];
        for (const line of this.visuals.lines) {
            const valid = line.stats
                .filter(s => s.hasData && s.val !== null)
                .map(s => s.val as number);
            allValues = allValues.concat(valid);
        }
        if (!allValues.length) return { min: 0, max: 100 };
        return { min: Math.min(...allValues), max: Math.max(...allValues) };
    });

    dataMin = $derived(this.dataRange.min);
    dataMax = $derived(this.dataRange.max);

    graphMin = $derived(this.manualMin ?? (this.dataMin === this.dataMax ? this.dataMin - 10 : this.dataMin));
    graphMax = $derived(this.manualMax ?? (this.dataMin === this.dataMax ? this.dataMax + 10 : this.dataMax));

    getY(val: number | null) {
        if (val === null) return this.chartH - this.graphPadding.bottom;
        const range = this.graphMax - this.graphMin;
        if (range <= 0) return this.chartH - this.graphPadding.bottom;
        const usableHeight = this.chartH - this.graphPadding.top - this.graphPadding.bottom;
        const normalized = (val - this.graphMin) / range;
        return (this.chartH - this.graphPadding.bottom) - (normalized * usableHeight);
    }

    loadSettings() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed.rows) this.rows = parsed.rows;
                if (parsed.graphMode) this.graphMode = parsed.graphMode;
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

    saveSettings = $effect.root(() => {
        $effect(() => {
            const settings = {
                rows: this.rows,
                graphMode: this.graphMode,
                showGraph: this.showGraph,
                showHeatmap: this.showHeatmap,
                showMonthLines: this.showMonthLines,
                darkMode: this.darkMode,
                heatmapHue: this.heatmapHue,
                manualMin: this.manualMin,
                manualMax: this.manualMax
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
        });
    });

    resetSettings() {
        this.rows = 7;
        this.graphMode = 'avg';
        this.showGraph = true;
        this.showHeatmap = true;
        this.showMonthLines = true;
        this.darkMode = false;
        this.heatmapHue = 205;
        this.manualMin = null;
        this.manualMax = null;
        localStorage.removeItem(STORAGE_KEY);
    }
}

export const layoutStore = new LayoutStore();