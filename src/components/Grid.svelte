<script lang="ts">
    import { dataStore } from '../lib/stores/data.svelte';
    import { layoutStore } from '../lib/stores/layout.svelte';
    import { uiStore } from '../lib/stores/ui.svelte';
    import { CONFIG } from '../lib/config/constants';
    
    // De uppdelade komponenterna
    import GridCanvas from './GridCanvas.svelte';
    import GridCells from './GridCells.svelte';
    import GridOverlay from './GridOverlay.svelte';

    let scroller: HTMLElement;
    let anchorIndex = $state(0);
    
    // --- VIRTUALISERING STATE ---
    let scrollLeft = $state(0);
    let clientWidth = $state(800); 

    // Buffert: Renderar 20 kolumner extra åt varje håll för mjukare scroll
    const buffer = 10; 

    // Start: Vilken kolumn börjar vi rendera från?
    let renderStart = $derived(Math.max(0, Math.floor(scrollLeft / CONFIG.stride) - buffer));
    
    // Slut: Vilken kolumn slutar vi på?
    let renderEnd = $derived.by(() => {
        const visibleCols = Math.ceil(clientWidth / CONFIG.stride);
        const end = renderStart + visibleCols + (buffer * 2);
        
        // VIKTIG FIX: 
        // Vi måste dra bort 'colsToHide' från totalen, annars försöker vi rendera 
        // kolumner som ligger bortom datats slut (vilket skapar flimmer).
        return Math.min(layoutStore.totalCols - layoutStore.colsToHide, end);
    });

    // --- SCROLL & ANCHOR LOGIK ---
    $effect(() => {
        if (scroller && !uiStore.loading && dataStore.todayIndex > 0) {
            if (!uiStore.scrolledToToday) {
                const startCol = Math.floor(dataStore.todayIndex / layoutStore.rows);
                const centerPos = (startCol * CONFIG.stride) - (scroller.clientWidth / 2) + (CONFIG.stride / 2);
                scroller.scrollLeft = Math.max(0, centerPos);
                
                // Uppdatera state direkt
                scrollLeft = scroller.scrollLeft;
                clientWidth = scroller.clientWidth;

                uiStore.scrolledToToday = true;
                anchorIndex = dataStore.todayIndex;
            }
        }
    });

    $effect(() => {
        const r = layoutStore.rows; 
        if (scroller && layoutStore.isResizing && anchorIndex > 0) {
            const newCol = Math.floor(anchorIndex / r);
            scroller.scrollLeft = newCol * CONFIG.stride;
            scrollLeft = scroller.scrollLeft; 
        }
    });

    function handleScroll() {
        if (!scroller) return;
        
        scrollLeft = scroller.scrollLeft;
        clientWidth = scroller.clientWidth; 

        if (layoutStore.isResizing) return;
        
        const currentLeftCol = Math.round(scroller.scrollLeft / CONFIG.stride);
        anchorIndex = currentLeftCol * layoutStore.rows;
    }
</script>

<div 
    class="scroll-view" 
    bind:this={scroller}
    onscroll={handleScroll}
    bind:clientWidth={clientWidth} 
>
    <div 
        class="grid-container" 
        style:margin-left="{layoutStore.centerOffset}px"
        style:margin-right="{layoutStore.centerOffset}px"
        style:width="{layoutStore.totalWidth}px"
        style:height="{layoutStore.screenH}px"
    >
        <GridCanvas {renderStart} {renderEnd} />

        <GridOverlay {renderStart} {renderEnd} />

        <GridCells {renderStart} {renderEnd} />
    </div>
</div>

<style>
    /* Containern och bas-styles */
    .scroll-view {
        flex: 1;
        overflow-x: auto;
        overflow-y: hidden;
        scroll-snap-type: x mandatory; 
        display: flex; align-items: flex-end;
        -webkit-overflow-scrolling: touch; 
        scrollbar-width: none;
    }

    .grid-container { 
        position: relative; 
        flex-shrink: 0; 
        box-sizing: content-box;
        display: flex;
    }
</style>