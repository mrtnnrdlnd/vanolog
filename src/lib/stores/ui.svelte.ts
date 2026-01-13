class UIStore {
    selectedIdx = $state<number | null>(null);
    settingsOpen = $state(false);
    loading = $state(true);
    syncStatus = $state<'idle' | 'working' | 'error'>('idle');
    
    // NYTT: Minne för om vi har scrollat till idag
    scrolledToToday = $state(false);

    openEditor(idx: number) { this.selectedIdx = idx; }
    closeEditor() { this.selectedIdx = null; }
    toggleSettings() { this.settingsOpen = !this.settingsOpen; }
}

export const uiStore = new UIStore();