class UIStore {
    selectedIdx = $state<number | null>(null);
    settingsOpen = $state(false);
    loading = $state(true);
    syncStatus = $state<'idle' | 'working' | 'error'>('idle');
    
    // NYTT: Referens till scroll-elementet så vi kan styra det från andra ställen
    scroller = $state<HTMLElement | null>(null);

    // Minne för om vi har scrollat till idag
    scrolledToToday = $state(false);

    openEditor(idx: number) { this.selectedIdx = idx; }
    closeEditor() { this.selectedIdx = null; }
    toggleSettings() { this.settingsOpen = !this.settingsOpen; }
}

export const uiStore = new UIStore();