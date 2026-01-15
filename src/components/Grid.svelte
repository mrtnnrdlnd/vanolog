<script lang="ts">
    import { tick } from 'svelte';
    import { dataStore } from '../lib/stores/data.svelte';
    import { layoutStore } from '../lib/stores/layout.svelte';
    import { uiStore } from '../lib/stores/ui.svelte';
    import { CONFIG } from '../lib/config/constants';
    
    import GridCanvas from './GridCanvas.svelte';
    import GridCells from './GridCells.svelte';
    import GridOverlay from './GridOverlay.svelte';

    let scrollLeft = $state(0);
    let clientWidth = $state(800); 

    // En buffer på 15-20 räcker oftast och sparar prestanda
    const buffer = 20; 

    // Stabilare virtualisering
    let currentCol = $derived(Math.floor(scrollLeft / CONFIG.stride));
    let renderStart = $derived(Math.max(0, currentCol - buffer));
    
    let renderEnd = $derived.by(() => {
        const visibleCols = Math.ceil(clientWidth / CONFIG.stride);
        const totalCols = Math.floor(layoutStore.totalWidth / CONFIG.stride);
        // Vi lägger till buffer efter de synliga kolumnerna
        return Math.min(totalCols, currentCol + visibleCols + buffer);
    });

    // Scrolla till idag - med tick() för säkerhet
    $effect(() => {
        // Körs när dessa värden ändras
        const scroller = uiStore.scroller;
        const totalWidth = layoutStore.totalWidth;
        const todayIdx = dataStore.todayIndex;

        if (todayIdx > 0 && scroller && !uiStore.scrolledToToday && totalWidth > 0) {
            // Skapa en asynkron funktion för att hantera väntan
            const scrollToToday = async () => {
                // 1. Vänta på Svelte-uppdatering
                await tick();
                
                // 2. Ge webbläsaren en mikropaus för att rendera bredden (viktigt!)
                await new Promise(requestAnimationFrame);

                const todayCol = Math.floor(todayIdx / layoutStore.rows);
                const colX = todayCol * CONFIG.stride;
                
                // Centrera kolumnen i vyn
                const targetX = colX - (scroller.clientWidth / 2) + (CONFIG.stride / 2);
                
                // 3. Utför scrollen
                scroller.scrollLeft = targetX;
                uiStore.scrolledToToday = true;
            };

            scrollToToday();
        }
    });

    function handleScroll() {
        if (!uiStore.scroller) return;
        scrollLeft = uiStore.scroller.scrollLeft;
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
        scroll-snap-type: x proximity; 
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
    
    .scroll-view:active {
        scroll-snap-type: none;
    }

    .grid-container { 
        position: relative; 
        flex-shrink: 0; 
        box-sizing: content-box;
        /* display: flex togs bort härifrån */
    }
</style>