<script lang="ts">
    import { dataStore } from '../lib/stores/data.svelte';
    import { layoutStore } from '../lib/stores/layout.svelte';
    import { uiStore } from '../lib/stores/ui.svelte';
    import { CONFIG } from '../lib/config/constants';
    
    // De nya komponenterna
    import GridCanvas from './GridCanvas.svelte';
    import GridCells from './GridCells.svelte';
    import GridOverlay from './GridOverlay.svelte';

    let scroller: HTMLElement;
    let anchorIndex = $state(0);

    // --- SCROLL & ANCHOR LOGIK (Oförändrad) ---
    $effect(() => {
        if (scroller && !uiStore.loading && dataStore.todayIndex > 0) {
            if (!uiStore.scrolledToToday) {
                const startCol = Math.floor(dataStore.todayIndex / layoutStore.rows);
                const centerPos = (startCol * CONFIG.stride) - (scroller.clientWidth / 2) + (CONFIG.stride / 2);
                scroller.scrollLeft = Math.max(0, centerPos);
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
        }
    });

    function handleScroll() {
        if (!scroller || layoutStore.isResizing) return;
        const currentLeftCol = Math.round(scroller.scrollLeft / CONFIG.stride);
        anchorIndex = currentLeftCol * layoutStore.rows;
    }
</script>

<div 
    class="scroll-view" 
    bind:this={scroller}
    onscroll={handleScroll} 
>
    <div 
        class="grid-container" 
        style:margin-left="{layoutStore.centerOffset}px"
        style:margin-right="{layoutStore.centerOffset}px"
        style:width="{layoutStore.totalWidth}px"
        style:height="{layoutStore.screenH}px"
    >
        <GridCanvas />

        <GridOverlay />

        <GridCells />
    </div>
</div>

<style>
    /* Containern och bas-styles är kvar här */
    /* Men alla specifika stilar för celler/markers har flyttat till sina filer */
</style>