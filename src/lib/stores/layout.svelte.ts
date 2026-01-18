import type { GraphMode, GraphType } from '../types';
import { dataStore } from './data.svelte';
import { calculateLayout, type LayoutResult } from '../engine/layout-engine';

const STORAGE_KEY = 'calendar_settings_v1';

class LayoutStore {
    // --- STATE (Inställningar & Variabler) ---
    rows = $state(7);
    isResizing = $state(false); // Används av Grid.svelte för ankring
    
    graphMode = $state<GraphMode>('avg');
    graphType = $state<GraphType>('line');
    
    showGraph = $state(true);
    showHeatmap = $state(true);
    showMonthLines = $state(true);
    darkMode = $state(false);
    heatmapHue = $state(205);

    screenH = $state(800);
    screenW = $state(400);
    
    // Manual overrides for Y-axis
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

    // --- LAYOUT ENGINE ---
    layoutCalc = $derived<LayoutResult>(
        calculateLayout(
            dataStore.data, 
            this.rows, 
            this.screenW, 
            this.screenH, 
            this.graphMode
        )
    );

    // --- GETTERS (Proxies till motorns resultat) ---
    gridH = $derived(this.layoutCalc.gridH);
    chartH = $derived(this.layoutCalc.chartH);
    centerOffset = $derived(this.layoutCalc.centerOffset);
    colsToHide = $derived(this.layoutCalc.colsToHide);
    xShift = $derived(this.layoutCalc.xShift);
    totalCols = $derived(this.layoutCalc.totalCols);
    totalWidth = $derived(this.layoutCalc.totalWidth);
    
    visuals = $derived({
        stats: this.layoutCalc.stats,
        monthBounds: this.layoutCalc.monthBounds
    });

    // --- UTILITIES & STORAGE ---
    
    updateDims() {
        this.screenH = window.innerHeight;
        this.screenW = window.innerWidth;
    }

    // --- DATA RANGE CALCULATION (Updated) ---
    // Calculates the min/max of the *current view's data* (e.g., daily averages)
    // This is what we show as "Auto" placeholders in settings.
    dataRange = $derived.by(() => {
        // Use visuals.stats instead of raw data to match what the graph actually shows
        const valid = this.visuals.stats
            .filter(s => s.hasData && s.val !== null)
            .map(s => s.val as number);
        
        if (!valid.length) return { min: 0, max: 100 };
        return { min: Math.min(...valid), max: Math.max(...valid) };
    });

    // Explicit getters for Settings.svelte to use
    dataMin = $derived(this.dataRange.min);
    dataMax = $derived(this.dataRange.max);

    // --- GRAPH SCALING ---
    // Determines the actual Y-axis range used for rendering
    graphMin = $derived(this.manualMin ?? (this.dataMin === this.dataMax ? this.dataMin - 10 : this.dataMin));
    graphMax = $derived(this.manualMax ?? (this.dataMin === this.dataMax ? this.dataMax + 10 : this.dataMax));

    getY(val: number) {
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

    // Effect to save settings whenever they change
    saveSettings = $effect.root(() => {
        $effect(() => {
            const settings = {
                rows: this.rows,
                graphMode: this.graphMode,
                graphType: this.graphType,
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
}

export const layoutStore = new LayoutStore();