<script lang="ts">
    import { layoutStore } from '../lib/stores/layout.svelte';
    import GraphLayer from './GraphLayer.svelte';

    let { renderStart, renderEnd } = $props<{ renderStart: number, renderEnd: number }>();

    let maskY = $derived(layoutStore.graphPadding.top);
    let maskHeight = $derived(layoutStore.chartH - layoutStore.graphPadding.top - layoutStore.graphPadding.bottom);
</script>

<svg style:width="100%" style:height="100%">
    <defs>
        <clipPath id="graph-clip">
            <rect 
                x="-100" 
                y={maskY} 
                width={layoutStore.totalWidth + 200} 
                height={maskHeight} 
            />
        </clipPath>
    </defs>

    {#if layoutStore.showMonthLines}
        {#each layoutStore.visuals.monthBounds as b}
            {#if b.endCol >= renderStart && b.startCol <= renderEnd}
                <path 
                    d={b.pathD} 
                    class="month-bg {b.m % 2 === 0 ? 'even' : 'odd'}" 
                />
            {/if}
        {/each}
    {/if}

    <g clip-path="url(#graph-clip)">
        <GraphLayer {renderStart} {renderEnd} />
    </g>
</svg>

<style>
    /* --- LJUST LÄGE (Standard) --- */
    
    /* Bakgrunder i SVG */
    .month-bg.even { fill: #f9f9f9; }
    .month-bg.odd  { fill: #fdfdfd; }

    /* Celler i GridCells */
    :global(.cell) {
        background-color: #ffffff;
        box-shadow: 0 1px 2px rgba(0,0,0,0.09);
    }

    /* --- DARK MODE --- */
    
    /* Vi triggar dessa ENDAST när body har klassen .dark-mode */
    :global(body.dark-mode .month-bg.even) { fill: #111111; }
    :global(body.dark-mode .month-bg.odd)  { fill: #161616; }

    :global(body.dark-mode .cell) { 
        background-color: #1a1a1a; 
        box-shadow: 0 1px 3px rgba(0,0,0,0.3);
    }
</style>