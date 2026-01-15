<script lang="ts">
    import { tick } from 'svelte';
    import { dataStore } from '../lib/stores/data.svelte';
    import { layoutStore } from '../lib/stores/layout.svelte';
    import { uiStore } from '../lib/stores/ui.svelte';
    import { CONFIG } from '../lib/config/constants';
    
    import GridCanvas from './GridCanvas.svelte';
    import GridCells from './GridCells.svelte';
    import GridOverlay from './GridOverlay.svelte';

    let anchorIndex = $state(0);
    let scrollLeft = $state(0);
    let clientWidth = $state(800); 

    const buffer = 30; 

    // Virtualiserings-gränser
    let renderStart = $derived(Math.max(0, Math.floor(scrollLeft / CONFIG.stride) - buffer));
    let renderEnd = $derived.by(() => {
        const visibleCols = Math.ceil(clientWidth / CONFIG.stride);
        const end = renderStart + visibleCols + (buffer * 2);
        const maxCols = Math.floor(layoutStore.totalWidth / CONFIG.stride);
        return Math.min(end, maxCols);
    });

    // Initial scroll till dagens datum
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
        
        // Vi använder floor för att vara konsekventa med hur vi räknar ut renderStart
        const currentLeftCol = Math.floor(uiStore.scroller.scrollLeft / CONFIG.stride);
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
        /* Ändrat till proximity för att inte "jaga" scrollen så aggressivt */
        scroll-snap-type: x proximity; 
        display: flex; 
        align-items: flex-end;
        -webkit-overflow-scrolling: touch; 
        scrollbar-width: none;
        position: relative;
    }

    /* Inaktivera snapping helt när vi ändrar storlek för att undvika ryck */
    .scroll-view.is-resizing {
        scroll-snap-type: none;
        overflow-x: hidden; 
    }
    
    /* Tvinga bort snap medan användaren faktiskt håller i skärmen/musen */
    .scroll-view:active {
        scroll-snap-type: none;
    }

    .grid-container { 
        position: relative; 
        flex-shrink: 0; 
        box-sizing: content-box;
        display: flex;
    }
</style>