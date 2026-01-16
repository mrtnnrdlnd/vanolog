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

    // --- FIX: LOKAL OFFSET ---
    let localOffset = $derived((containerWidth - CONFIG.stride) / 2);

    // --- VIRTUALISERING ---
    let effectiveScrollX = $derived(scrollLeft - localOffset);
    let currentCol = $derived(Math.floor(effectiveScrollX / CONFIG.stride));
    let renderStart = $derived(Math.max(0, currentCol - BUFFER));
    
    let renderEnd = $derived.by(() => {
        const visibleCols = Math.ceil(containerWidth / CONFIG.stride);
        const totalCols = Math.floor(layoutStore.totalWidth / CONFIG.stride);
        return Math.min(totalCols, currentCol + visibleCols + BUFFER);
    });

    function handleScroll() {
        if (!uiStore.scroller) return;
        scrollLeft = uiStore.scroller.scrollLeft;
    }

    // --- SCROLL TILL IDAG ---
    $effect(() => {
        if (uiStore.scroller && dataStore.data.length > 0 && !uiStore.scrolledToToday && containerWidth > 0) {
            const todayItem = dataStore.data[dataStore.todayIndex];
            
            if (todayItem) {
                // 1. Hitta "Rå-kolumnen" i datan
                const rawColIndex = Math.floor(dataStore.todayIndex / layoutStore.rows);
                
                // 2. BUGGFIX: Dra bort de kolumner som är dolda (padding-dagar)
                // Detta är avgörande när rows är lågt (1-3)
                const visualColIndex = rawColIndex - layoutStore.colsToHide;
                
                // 3. Beräkna position
                const targetX = visualColIndex * CONFIG.stride;

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
    style:scroll-padding-left="{localOffset}px" 
>
    <div 
        class="grid-container" 
        style:margin-left="{localOffset}px"
        style:margin-right="{localOffset}px"
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
        scroll-snap-type: none !important;
        scroll-behavior: auto !important; 
        cursor: ns-resize;
    }
</style>