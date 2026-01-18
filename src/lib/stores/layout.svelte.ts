import type { GraphMode, GraphType, VisualStat, Dataset } from '../types';
import { dataStore } from './data.svelte';
import { calculateLayout, type LayoutResult } from '../engine/layout-engine';

const STORAGE_KEY = 'calendar_settings_v1';

class LayoutStore {
    rows = $state(7);
    isResizing = $state(false);
    
    graphMode = $state<GraphMode>('avg');
    graphType = $state<GraphType>('line');
    
    showGraph = $state(true);
    showHeatmap = $state(true);
    showMonthLines = $state(true);
    darkMode = $state(false);
    
    // Dataset ID för heatmap
    heatmapDatasetId = $state<string | null>('primary');

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

    // --- COMPUTED: Heatmap ---
    heatmapHue = $derived.by(() => {
        const ds = dataStore.datasets.find(d => d.id === this.heatmapDatasetId);
        return ds ? ds.hue : 205;
    });

    heatmapData = $derived.by(() => {
        const ds = dataStore.datasets.find(d => d.id === this.heatmapDatasetId);
        return ds ? ds.data : dataStore.datasets[0]?.data || [];
    });

    // --- LAYOUT ENGINE (Geometry Only) ---
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
    
    // --- VISUALS (Metadata Only) ---
    // Vi räknar INTE ut statistik här. GraphLayer gör det "on-the-fly".
    visuals = $derived.by(() => {
        const resultLines: { 
            id: string, dataset: Dataset, color: string, width: number, 
            graphType: GraphType, graphMode: GraphMode,
            showLine: boolean, showMarkers: boolean, 
            markerSize: number, markerOpacity: number
        }[] = [];

        for (const ds of dataStore.datasets) {
            if (!ds.isVisible) continue;
            const colorStr = `hsl(${ds.hue}, 70%, 50%)`;
            
            resultLines.push({ 
                id: ds.id, 
                dataset: ds, 
                color: colorStr, 
                width: ds.width,
                graphType: ds.graphType,
                graphMode: ds.graphMode,
                showLine: ds.showLine,
                showMarkers: ds.showMarkers,
                markerSize: ds.markerSize,
                markerOpacity: ds.markerOpacity
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

    // --- SNABBARE DATA RANGE ---
    // Kollar på rådata = Inget lagg vid resize
    dataRange = $derived.by(() => {
        let min = Infinity; let max = -Infinity; let hasData = false;
        for (const ds of dataStore.datasets) {
            if (!ds.isVisible) continue;
            for (const item of ds.data) {
                if (item.val !== null) {
                    if (item.val < min) min = item.val;
                    if (item.val > max) max = item.val;
                    hasData = true;
                }
            }
        }
        if (!hasData) return { min: 0, max: 100 };
        return { min, max };
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

    setRows(newVal: number) {
        const clamped = Math.max(4, Math.min(31, Math.round(newVal)));
        this.rows = clamped;
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
                if (parsed.heatmapDatasetId !== undefined) this.heatmapDatasetId = parsed.heatmapDatasetId;
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
                graphType: this.graphType,
                showGraph: this.showGraph,
                showHeatmap: this.showHeatmap,
                showMonthLines: this.showMonthLines,
                darkMode: this.darkMode,
                heatmapDatasetId: this.heatmapDatasetId,
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
        this.heatmapDatasetId = 'primary';
        this.manualMin = null;
        this.manualMax = null;
        localStorage.removeItem(STORAGE_KEY);
    }
}

export const layoutStore = new LayoutStore();