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

    // --- SÄKER ROTATIONSHANTERING ---
    let isRotating = $state(false);
    let resizeTimer: ReturnType<typeof setTimeout>;

    function handleWindowResize() {
        // 1. Stäng av snapping direkt
        isRotating = true;

        clearTimeout(resizeTimer);
        
        // 2. Ge webbläsaren gott om tid att rotera klart och rita om layouten (500ms)
        resizeTimer = setTimeout(() => {
            finalizeRotation();
        }, 500);
    }

    async function finalizeRotation() {
        if (!uiStore.scroller) return;

        // Vänta på att Svelte har uppdaterat DOMen med nya bredder
        await tick();

        // 1. Behåll nuvarande "logiska" kolumn
        // (Vi litar inte på pixelvärden här eftersom bredden ändrats)
        const currentCenter = uiStore.scroller.scrollLeft; // Rå scroll
        const nearestCol = Math.round(currentCenter / CONFIG.stride);
        const targetX = nearestCol * CONFIG.stride;

        // 2. Sätt positionen exakt (utan animering)
        uiStore.scroller.scrollLeft = targetX;

        // 3. Slå på snapping igen
        isRotating = false;
    }

    // --- LOKAL OFFSET ---
    // Detta måste vara reaktivt ($derived) så paddingen uppdateras vid rotation
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

    // --- SCROLL TILL IDAG (Initialt) ---
    $effect(() => {
        if (uiStore.scroller && dataStore.data.length > 0 && !uiStore.scrolledToToday && containerWidth > 0) {
            const todayItem = dataStore.data[dataStore.todayIndex];
            
            if (todayItem) {
                const rawColIndex = Math.floor(dataStore.todayIndex / layoutStore.rows);
                const visualColIndex = rawColIndex - layoutStore.colsToHide;
                
                // BUGGFIX: Lägg till +2 pixlar ("The Nudge")
                // På mobiler kan exakta värden avrundas nedåt (t.ex 99.99px).
                // Då tror snap-motorn att vi är på föregående kolumn.
                // Genom att sikta 2px för långt garanterar vi att vi korsar gränsen.
                // CSS Snapping drar sedan tillbaka oss till exakt 0.
                const targetX = (visualColIndex * CONFIG.stride) + 2;

                uiStore.scroller.scrollLeft = targetX;
                scrollLeft = targetX; 
                uiStore.scrolledToToday = true;
            }
        }
    });
</script>

<svelte:window onresize={handleWindowResize} />

<div 
    class="scroll-view" 
    class:is-resizing={layoutStore.isResizing}
    class:is-rotating={isRotating}
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
    /* Detta säkerställer att touch fungerar som förväntat på mobiler 
       pan-y tillåter vertikal scroll (sidan), pan-x tillåter vår horisontella
    */
    .scroll-view {
        touch-action: pan-x pan-y;
    }

    .is-resizing {
        scroll-snap-type: none !important;
        scroll-behavior: auto !important; 
        cursor: ns-resize;
    }

    /* SÄKERHETS-CSS:
       När vi roterar: Stäng BARA av snapping och smooth scroll.
       Rör ALDRIG overflow eller touch-events. Då kan den inte låsa sig.
    */
    .is-rotating {
        scroll-snap-type: none !important;
        scroll-behavior: auto !important;
    }
</style>