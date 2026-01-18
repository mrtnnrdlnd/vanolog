import { api } from '../api';
import type { CalendarData, ApiDataItem, Dataset } from '../types';
import { uiStore } from './ui.svelte';

class DataStore {
    datasets = $state<Dataset[]>([
        {
            id: 'primary',
            name: 'Huvuddata',
            color: '#00639b',
            width: 3,
            graphType: 'line',
            graphMode: 'avg',
            
            // NYTT: Standard är att visa linjen
            showLine: true,
            
            showMarkers: true,
            markerSize: 3.5,
            markerOpacity: 1.0,

            data: [],
            isVisible: true
        }
    ]);

    todayIndex = $state(0);

    // Bakåtkompatibilitet
    data = $derived(this.datasets[0].data);
    totalCols = $derived(this.datasets[0].data.length > 0 ? Math.ceil(this.datasets[0].data.length / 7) : 0);

    async init() {
        uiStore.loading = true;
        try {
            const raw = await api.getSheetData();
            const processedPrimary = this.processApiData(raw);
            this.datasets[0].data = processedPrimary;
        } catch (e) {
            console.error("Load failed", e);
            uiStore.syncStatus = 'error';
        } finally {
            uiStore.loading = false;
        }
    }

    private processApiData(rawItems: ApiDataItem[]): CalendarData[] {
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
        const todayStr = new Date().toDateString();

        for (let i = 0; i < offset; i++) {
            newData[i] = { val: null, isToday: false, isDisabled: true, isSunday: false, monthIdx: 0, year: 0 };
        }

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
        const item = this.datasets[0].data[idx];
        if (!item || !item.dateStr) return;

        this.datasets.forEach(ds => {
            if (ds.data[idx]) ds.data[idx].val = newVal;
        });
        
        uiStore.syncStatus = 'working';
        try {
            await api.updateValue(item.dateStr, newVal);
            uiStore.syncStatus = 'idle';
        } catch (e) {
            uiStore.syncStatus = 'error';
        }
    }

    toggleDataset(id: string) {
        const ds = this.datasets.find(d => d.id === id);
        if (ds) ds.isVisible = !ds.isVisible;
    }

    cloneDataset(id: string) {
        const original = this.datasets.find(d => d.id === id);
        if (!original) return;
        
        // Shallow copy av datan för prestanda (delar objekt), 
        // men ny array så man kan byta dataset helt om man vill senare.
        const newData = [...original.data]; 

        this.datasets.push({
            ...original,
            id: crypto.randomUUID(),
            name: `${original.name} (Kopia)`,
            color: this.getRandomColor(),
            data: newData,
            isVisible: true
        });
    }

    removeDataset(id: string) {
        if (this.datasets.length <= 1) return;
        this.datasets = this.datasets.filter(d => d.id !== id);
    }

    private getRandomColor() {
        const colors = ['#d9534f', '#5cb85c', '#f0ad4e', '#5bc0de', '#563d7c', '#e83e8c'];
        return colors[Math.floor(Math.random() * colors.length)];
    }
}

export const dataStore = new DataStore();