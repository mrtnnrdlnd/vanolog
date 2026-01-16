<script lang="ts">
    import { tick } from 'svelte';
    import { dataStore } from '../lib/stores/data.svelte';
    import { layoutStore } from '../lib/stores/layout.svelte';
    import { uiStore } from '../lib/stores/ui.svelte';
    import { CONFIG } from '../lib/config/constants';
    
    import GridCanvas from './GridCanvas.svelte';
    import GridCells from './GridCells.svelte';
    import GridOverlay from './GridOverlay.svelte';
    import GraphLayer from './GraphLayer.svelte';

    let scrollLeft = $state(0);
    let containerWidth = $state(1000); 

    const BUFFER = 20; 

    // --- VIRTUALISERING (Behåll denna logik!) ---
    let effectiveScrollX = $derived(scrollLeft - layoutStore.centerOffset);
    let currentCol = $derived(Math.floor(effectiveScrollX / CONFIG.stride));
    let renderStart = $derived(Math.max(0, currentCol - BUFFER));
    
    let renderEnd = $derived.by(() => {
        const visibleCols = Math.ceil(containerWidth / CONFIG.stride);
        const totalCols = Math.floor(layoutStore.totalWidth / CONFIG.stride);
        return Math.min(totalCols, currentCol + visibleCols + BUFFER);
    });

    // --- ENDAST UPPDATERING AV STATE ---
    function handleScroll() {
        if (!uiStore.scroller) return;
        scrollLeft = uiStore.scroller.scrollLeft;
    }

    // --- SCROLL TILL IDAG ---
    $effect(() => {
        if (uiStore.scroller && dataStore.data.length > 0 && !uiStore.scrolledToToday && containerWidth > 0) {
            const todayItem = dataStore.data[dataStore.todayIndex];
            if (todayItem) {
                const colIndex = Math.floor(dataStore.todayIndex / layoutStore.rows);
                const colX = colIndex * CONFIG.stride;
                
                // Målpositionen
                const targetX = colX + layoutStore.centerOffset - (containerWidth / 2) + (CONFIG.stride / 2);

                uiStore.scroller.scrollLeft = targetX;
                scrollLeft = targetX; 
                uiStore.scrolledToToday = true;
            }
        }
    });
</script>

<div 
    class="scroll-view" 
    class:is-resizing={layoutStore.isResizing}
    bind:this={uiStore.scroller}
    bind:clientWidth={containerWidth}
    onscroll={handleScroll}
    style:scroll-padding-left="{layoutStore.centerOffset}px" 
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
        <GraphLayer {renderStart} {renderEnd} /> 
    </div>
</div>

<style>
    .is-resizing {
        /* Stäng av snapping medan vi drar i storleken */
        scroll-snap-type: none !important;
        scroll-behavior: auto !important; 
        cursor: ns-resize;
    }
</style>