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

    // --- LAYOUT ENGINE (Kärnan i förändringen) ---
    // All tung matematik sker nu i layout-engine.ts
    // Vi skickar bara in datat och får tillbaka färdiga koordinater.
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
    // Dessa används av komponenterna precis som förut, så vi behöver inte ändra i Grid.svelte
    gridH = $derived(this.layoutCalc.gridH);
    chartH = $derived(this.layoutCalc.chartH);
    centerOffset = $derived(this.layoutCalc.centerOffset);
    colsToHide = $derived(this.layoutCalc.colsToHide);
    xShift = $derived(this.layoutCalc.xShift);
    totalCols = $derived(this.layoutCalc.totalCols);
    totalWidth = $derived(this.layoutCalc.totalWidth);
    
    // Visuals objektet (stats & monthBounds)
    visuals = $derived({
        stats: this.layoutCalc.stats,
        monthBounds: this.layoutCalc.monthBounds
    });


    // --- UTILITIES & STORAGE ---
    
    updateDims() {
        this.screenH = window.innerHeight;
        this.screenW = window.innerWidth;
    }

    // Data Range & Scaling
    dataRange = $derived.by(() => {
        const valid = dataStore.data
            .map(d => d.val)
            .filter((v): v is number => v !== null && v !== undefined && !isNaN(v));
        
        if (!valid.length) return { min: 0, max: 100 };
        return { min: Math.min(...valid), max: Math.max(...valid) };
    });

    graphMin = $derived(this.manualMin ?? (this.dataRange.min === this.dataRange.max ? this.dataRange.min - 10 : this.dataRange.min));
    graphMax = $derived(this.manualMax ?? (this.dataRange.min === this.dataRange.max ? this.dataRange.max + 10 : this.dataRange.max));

    getY(val: number) {
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