import { CONFIG, type CalendarData, type ApiDataItem, type GraphMode, type GraphType, type MonthBound } from './types';
import { calculateStat, createMonthPath } from './utils';
import { api } from './api';

class CalendarStore {
    // --------------------------------------------------------
    // 1. STATE (Reaktiv data)
    // --------------------------------------------------------
    
    // Layout & Konfiguration
    rows = $state(7);
    
    // Huvuddata
    data = $state<CalendarData[]>([]);
    todayIndex = $state(0);
    
    // Graf-inställningar
    graphMode = $state<GraphMode>('avg');
    graphType = $state<GraphType>('line');
    
    // Y-Axel (Startvärden som skrivs över av autoScale)
    graphMin = $state(0);
    graphMax = $state(100);

    // UI-tillstånd
    selectedIdx = $state<number | null>(null);         // Vilken dag är vald för input?
    editingAxis = $state<'min' | 'max' | null>(null);  // Vilken del av axeln redigeras?
    
    loading = $state(true);
    syncStatus = $state<'idle' | 'working' | 'error'>('idle');

    // Fönsterstorlek
    screenH = $state(800);
    screenW = $state(400);

    // --------------------------------------------------------
    // 2. DERIVED (Automatiska beräkningar)
    // --------------------------------------------------------

    // Grid-mått baserat på fönsterstorlek och antal rader
    gridH = $derived(this.rows * CONFIG.stride);
    chartH = $derived(this.screenH - this.gridH - CONFIG.footerHeight - CONFIG.titleBarHeight);
    centerOffset = $derived((this.screenW - CONFIG.stride) / 2);

    // Virtualisering / Offset-logik
    // Hitta var datan faktiskt börjar (hoppa över placeholders)
    firstRealIndex = $derived(this.data.findIndex(d => d.day !== undefined));
    
    // Hur många kolumner till vänster är "gömda" (tomma) innan datan börjar?
    colsToHide = $derived(this.firstRealIndex === -1 ? 0 : Math.floor(this.firstRealIndex / this.rows));
    
    // Pixel-shift för att flytta hela griden till vänster
    xShift = $derived(this.colsToHide * CONFIG.stride);

    // Total bredd på innehållet
    totalCols = $derived(Math.ceil(this.data.length / this.rows));
    totalWidth = $derived((this.totalCols - this.colsToHide) * CONFIG.stride);

    // --------------------------------------------------------
    // 3. KOMPLEX LOGIK (Grafer & Bakgrund)
    // --------------------------------------------------------
    
    // $derived.by körs varje gång rows, data, graphMode eller chartH ändras
    processedData = $derived.by(() => {
        const stats: { val: number; hasData: boolean }[] = [];
        const monthBounds: MonthBound[] = [];
        const monthMap = new Map<string, MonthBound>();
        let colValues: (number | null)[] = [];

        // Y-koordinat där griden slutar (för SVG-ritning)
        const gridFullBottom = this.chartH + this.gridH + CONFIG.footerHeight;

        for (let i = 0; i < this.data.length; i++) {
            const d = this.data[i];
            
            // Layout-positioner
            const rawCol = Math.floor(i / this.rows);
            const row = i % this.rows;
            const visualCol = rawCol - (this.xShift / CONFIG.stride);

            // --- A. Samla data för grafen ---
            if (d.day && d.val !== null) colValues.push(d.val);

            // --- B. Samla data för månadsbakgrunder ---
            if (d.day) {
                const mKey = `${d.year}-${d.monthIdx}`;
                
                if (!monthMap.has(mKey)) {
                    // Starta ny månad
                    const bound: MonthBound = { 
                        startCol: visualCol, startRow: row, 
                        endCol: visualCol, endRow: row, 
                        y: d.year, m: d.monthIdx, pathD: '' 
                    };
                    monthMap.set(mKey, bound);
                    monthBounds.push(bound);
                } else {
                    // Uppdatera slutet på befintlig månad
                    const b = monthMap.get(mKey)!;
                    b.endCol = visualCol;
                    b.endRow = row;
                }
            }

            // --- C. Avsluta kolumn (Statistik) ---
            if ((i + 1) % this.rows === 0 || i === this.data.length - 1) {
                const s = calculateStat(colValues, this.graphMode);
                stats.push({ val: s === null ? 0 : s, hasData: s !== null });
                colValues = [];
            }
        }

        // --- D. Generera SVG Paths för månaderna ---
        monthBounds.forEach(b => {
            b.pathD = createMonthPath(
                b.startCol, b.startRow, b.endCol, b.endRow, 
                CONFIG.stride, CONFIG.radius, 
                this.chartH, gridFullBottom, this.rows
            );
        });

        return { stats, monthBounds };
    });

    // --------------------------------------------------------
    // 4. ACTIONS & INIT
    // --------------------------------------------------------

    constructor() {
        if (typeof window !== 'undefined') {
            this.screenH = window.innerHeight;
            this.screenW = window.innerWidth;
            
            window.addEventListener('resize', () => {
                this.screenH = window.innerHeight;
                this.screenW = window.innerWidth;
            });
        }
        this.init();
    }

    async init() {
        this.loading = true;
        try {
            const apiData = await api.getSheetData();
            this.generateData(apiData);
        } catch (e) {
            console.error("Critical: Failed to load data", e);
            this.syncStatus = 'error';
        } finally {
            this.loading = false;
        }
    }

    generateData(rawItems: ApiDataItem[]) {
        const dataMap = new Map(rawItems.map(item => [`${item.year}-${item.monthIdx}-${item.day}`, item.val]));
        
        let sorted = rawItems.sort((a,b) => 
            new Date(a.year, a.monthIdx, a.day).getTime() - new Date(b.year, b.monthIdx, b.day).getTime()
        );

        if(!sorted.length) {
            const now = new Date();
            sorted = [{year: now.getFullYear(), monthIdx: 0, day: 1, val: 0, isToday: false}];
        }
        
        const viewStart = new Date(sorted[0].year, sorted[0].monthIdx, 1);
        const viewEnd = new Date(sorted[sorted.length-1].year, sorted[sorted.length-1].monthIdx + 1, 0);
        const totalDays = Math.ceil((viewEnd.getTime() - viewStart.getTime()) / (1000 * 3600 * 24)) + 1;
        const offset = (viewStart.getDay() + 6) % 7;
        
        const newData: CalendarData[] = new Array(offset + totalDays);
        
        // 1. Fyll placeholders
        for (let i = 0; i < offset; i++) {
            newData[i] = { val: null, isToday: false, isDisabled: true, isSunday: false, monthIdx: 0, year: 0 };
        }
        
        const today = new Date();
        const todayStr = today.toDateString();

        // 2. Fyll riktiga dagar
        for (let i = 0; i < totalDays; i++) {
            const d = new Date(viewStart); 
            d.setDate(viewStart.getDate() + i);
            
            const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
            const val = dataMap.has(key) ? dataMap.get(key) ?? null : null;
            
            const isToday = d.toDateString() === todayStr;
            if(isToday) this.todayIndex = offset + i;

            newData[offset + i] = {
                day: d.getDate(),
                val,
                isToday,
                isDisabled: false,
                isSunday: d.getDay() === 0,
                monthIdx: d.getMonth(),
                year: d.getFullYear(),
                dateStr: `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
            };
        }
        
        this.data = newData;

        // VIKTIGT: Sätt skalan automatiskt baserat på datan vi just laddade
        this.autoScale();
    }

    // --- UPPDATERA VÄRDE (API) ---
    async updateValue(newVal: number | null) {
        if (this.selectedIdx === null) return;
        const item = this.data[this.selectedIdx];
        if (!item.dateStr) return;

        item.val = newVal; // Optimistisk update
        this.syncStatus = 'working';
        
        try {
            const result = await api.updateValue(item.dateStr, newVal);
            if(result && result.status === 'error') throw new Error(result.message);
            this.syncStatus = 'idle';
        } catch (e) {
            console.error("Save failed", e);
            this.syncStatus = 'error';
        }
    }

    // --- AUTOSKALA (Logik) ---
    autoScale() {
        // Hitta alla giltiga numeriska värden
        const validValues = this.data
            .map(d => d.val)
            .filter((v): v is number => v !== null && v !== undefined && !isNaN(v));

        if (validValues.length === 0) {
            this.graphMin = 0;
            this.graphMax = 100;
            return;
        }

        const min = Math.min(...validValues);
        const max = Math.max(...validValues);

        if (min === max) {
            // Om alla värden är samma, skapa lite rymd runt om
            this.graphMin = Math.floor(min - 10);
            this.graphMax = Math.ceil(max + 10);
        } else {
            // Använd exakta värden (du kan lägga till marginal här om du vill, t.ex. min - 5)
            this.graphMin = min;
            this.graphMax = max;
        }
    }
}

export const store = new CalendarStore();