<script lang="ts">
    import { store } from '../lib/store.svelte';
    import { CONFIG } from '../lib/types'; // Se till att CONFIG importeras korrekt
    import GraphLayer from './GraphLayer.svelte';
    
    // Enkel hjälpfunktion för cell-färg (om du inte lagt den i utils)
    function getCellStyle(val: number | null, min: number, max: number): string {
        if (val === null) return '#fff';
        const normalized = Math.max(0, Math.min(1, (val - min) / (max - min)));
        return `hsl(35, ${normalized * 100}%, ${100 - (normalized * 60)}%)`;
    }

    function handleCellClick(idx: number) {
        // Kontrollera att indexet finns och inte är inaktiverat
        if (!store.data[idx] || store.data[idx].isDisabled) return;
        
        console.log("Cell klickad:", idx); // Debug: Kolla konsolen om inget händer
        store.selectedIdx = idx;
    }
    
    // Hitta rätt scroll-element vid mount
    let scroller: HTMLElement;
    $effect(() => {
        if (scroller && !store.loading && store.todayIndex > 0 && scroller.scrollLeft === 0) {
            const centerPos = (store.todayIndex / store.rows) * CONFIG.stride;
            scroller.scrollLeft = Math.max(0, centerPos - (scroller.clientWidth / 2));
        }
    });
</script>

<div class="scroll-view" bind:this={scroller}>
    <div 
        class="grid-container" 
        style:margin-left="{store.centerOffset}px"
        style:margin-right="{store.centerOffset}px"
        style:width="{store.totalWidth}px"
        style:height="{store.screenH}px"
    >
        <svg style:width="100%" style:height="100%">
            {#each store.processedData.monthBounds as b}
                <path d={b.pathD} class="month-bg m-{b.m}" />
            {/each}
            <GraphLayer />
        </svg>

        {#each store.processedData.monthBounds as b}
            <div 
                class="month-marker"
                style:transform="translate({((b.startCol + b.endCol) / 2) * CONFIG.stride}px, 0) translateX(-50%)">

                {CONFIG.months[b.m]} {b.y}
            </div>
        {/each}

        {#each store.data as d, i}
            {@const rawCol = Math.floor(i / store.rows)}
            {@const isHidden = (rawCol * CONFIG.stride) < store.xShift}
            
            {#if !isHidden && d.day}
                {@const row = i % store.rows}
                {@const visualCol = rawCol - store.colsToHide}
                {@const x = (visualCol * CONFIG.stride) + (CONFIG.stride - CONFIG.boxSize)/2}
                {@const y = store.chartH + (row * CONFIG.stride) + (CONFIG.stride - CONFIG.boxSize)/2}
                {@const normalizedVal = d.val !== null ? (d.val - store.graphMin)/(store.graphMax - store.graphMin) : 0}

                <div 
                    class="cell {d.isSunday ? 'is-sunday' : ''} {d.isToday ? 'is-today' : ''} {d.isDisabled ? 'is-disabled' : ''} {normalizedVal > 0.55 ? 'is-dark' : 'is-light'}"
                    style:transform="translate({x}px, {y}px)"
                    style:background-color={getCellStyle(d.val, store.graphMin, store.graphMax)}
                    
                    onclick={() => handleCellClick(i)} 
                    role="button"
                    tabindex="0"
                    onkeypress={(e) => e.key === 'Enter' && handleCellClick(i)}
                >
                    {d.day}
                </div>
            {/if}
        {/each}

        {#each Array(Math.ceil(store.totalCols - store.colsToHide)) as _, i}
            <div class="snap-guide" style:left="{i * CONFIG.stride}px"></div>
        {/each}
    </div>
</div>

<style>
    .month-marker {
        position: absolute; bottom: 0; height: 40px;
        display: flex; align-items: center; justify-content: center;
        font-size: 13px; font-weight: 700; text-transform: uppercase; color: #667;
        pointer-events: none; padding-bottom: 5px;
    }
</style>