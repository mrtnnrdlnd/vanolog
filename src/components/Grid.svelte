<script lang="ts">
    import { dataStore } from '../lib/stores/data.svelte';
    import { layoutStore } from '../lib/stores/layout.svelte';
    import { uiStore } from '../lib/stores/ui.svelte';
    import { CONFIG } from '../lib/config/constants';
    
    // De uppdelade komponenterna
    import GridCanvas from './GridCanvas.svelte';
    import GridCells from './GridCells.svelte';
    import GridOverlay from './GridOverlay.svelte';

    // Vi använder nu uiStore.scroller istället för en lokal variabel
    let anchorIndex = $state(0);
    
    // --- VIRTUALISERING STATE ---
    let scrollLeft = $state(0);
    let clientWidth = $state(800); 

    // Buffert
    const buffer = 10; 

    // Start
    let renderStart = $derived(Math.max(0, Math.floor(scrollLeft / CONFIG.stride) - buffer));
    
    // Slut
    let renderEnd = $derived.by(() => {
        const visibleCols = Math.ceil(clientWidth / CONFIG.stride);
        const end = renderStart + visibleCols + (buffer * 2);
        const maxCols = Math.floor(layoutStore.totalWidth / CONFIG.stride);
        return Math.min(end, maxCols);
    });

    // --- INIT: SCROLLA TILL IDAG ---
    $effect(() => {
        if (dataStore.todayIndex > 0 && uiStore.scroller && !uiStore.scrolledToToday && layoutStore.totalWidth > 0) {
            const todayCol = Math.floor(dataStore.todayIndex / layoutStore.rows);
            
            const targetX = (todayCol * CONFIG.stride) - (uiStore.scroller.clientWidth / 2) + (CONFIG.stride / 2);
            
            uiStore.scroller.scrollLeft = targetX;
            uiStore.scrolledToToday = true;
        }
    });

    function handleScroll() {
        if (!uiStore.scroller) return;
        
        scrollLeft = uiStore.scroller.scrollLeft;
        clientWidth = uiStore.scroller.clientWidth; 

        if (layoutStore.isResizing) return;
        
        const currentLeftCol = Math.round(uiStore.scroller.scrollLeft / CONFIG.stride);
        anchorIndex = currentLeftCol * layoutStore.rows;
    }
</script>

<div 
    class="scroll-view" 
    class:is-resizing={layoutStore.isResizing}
    bind:this={uiStore.scroller}
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
    .scroll-view {
        flex: 1;
        overflow-x: auto;
        overflow-y: hidden;
        scroll-snap-type: x mandatory; 
        display: flex; 
        align-items: flex-end;
        -webkit-overflow-scrolling: touch; 
        scrollbar-width: none;
        position: relative;
    }

    .scroll-view.is-resizing {
        scroll-snap-type: none;
        overflow-x: hidden; 
    }
    
    .grid-container { 
        position: relative; 
        flex-shrink: 0; 
        box-sizing: content-box;
        display: flex;
    }
</style>