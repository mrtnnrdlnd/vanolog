import { api } from '../api';
import type { CalendarData, ApiDataItem, Dataset } from '../types';
import { uiStore } from './ui.svelte';

class DataStore {
    // --- NYTT: Datasets array istället för en platt data-array ---
    datasets = $state<Dataset[]>([
        {
            id: 'primary',
            name: 'Huvuddata',
            color: '#00639b',
            data: [],
            isVisible: true
        },
        // En demo-dataset för att visa funktionaliteten
        {
            id: 'demo',
            name: 'Målvärde (Demo)',
            color: '#d9534f', // Röd
            data: [],
            isVisible: false
        }
    ]);

    todayIndex = $state(0);

    // --- COMPUTED: Bakåtkompatibilitet ---
    // Heatmapen och logiken använder alltid det första datasetet
    data = $derived(this.datasets[0].data);
    
    // Totala antalet kolumner baseras på primärdata
    totalCols = $derived(this.datasets[0].data.length > 0 ? Math.ceil(this.datasets[0].data.length / 7) : 0);

    async init() {
        uiStore.loading = true;
        try {
            const raw = await api.getSheetData();
            
            // Bearbeta huvuddata
            const processedPrimary = this.processApiData(raw);
            this.datasets[0].data = processedPrimary;

            // --- SKAPA DEMO DATA (Bara för exempel) ---
            // Skapar en kopia som ligger lite högre
            this.datasets[1].data = processedPrimary.map(d => ({
                ...d,
                val: d.val !== null ? d.val + 5 : null // Lägger på 5 på värdet
            }));

        } catch (e) {
            console.error("Load failed", e);
            uiStore.syncStatus = 'error';
        } finally {
            uiStore.loading = false;
        }
    }

    private processApiData(rawItems: ApiDataItem[]): CalendarData[] {
        // Skapa Map för snabb uppslagning
        const dataMap = new Map(rawItems.map(item => [`${item.year}-${item.monthIdx}-${item.day}`, item.val]));
        
        // Sortering
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
        const todayStr = new Date().toDateString();

        // 1. Fyll placeholders
        for (let i = 0; i < offset; i++) {
            newData[i] = { val: null, isToday: false, isDisabled: true, isSunday: false, monthIdx: 0, year: 0 };
        }

        // 2. Fyll dagar
        for (let i = 0; i < totalDays; i++) {
            const d = new Date(viewStart); 
            d.setDate(viewStart.getDate() + i);
            const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
            const isToday = d.toDateString() === todayStr;
            if(isToday) this.todayIndex = offset + i;

            newData[offset + i] = {
                day: d.getDate(),
                val: dataMap.get(key) ?? null,
                isToday,
                isDisabled: false,
                isSunday: d.getDay() === 0,
                monthIdx: d.getMonth(),
                year: d.getFullYear(),
                dateStr: `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
            };
        }
        return newData;
    }

    async updateValue(idx: number, newVal: number | null) {
        // Vi uppdaterar bara primärdata vid editering
        const item = this.datasets[0].data[idx];
        if (!item || !item.dateStr) return;

        item.val = newVal; // Optimistisk update
        uiStore.syncStatus = 'working';
        
        try {
            await api.updateValue(item.dateStr, newVal);
            uiStore.syncStatus = 'idle';
        } catch (e) {
            uiStore.syncStatus = 'error';
        }
    }

    // --- NYTT: Toggle funktion ---
    toggleDataset(id: string) {
        const ds = this.datasets.find(d => d.id === id);
        if (ds) ds.isVisible = !ds.isVisible;
    }
}

export const dataStore = new DataStore();