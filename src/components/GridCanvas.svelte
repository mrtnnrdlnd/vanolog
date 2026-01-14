<script lang="ts">
    import { layoutStore } from '../lib/stores/layout.svelte';
    import GraphLayer from './GraphLayer.svelte';

    // Mask-logik från din tidigare Grid.svelte
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
            <path d={b.pathD} class="month-bg {b.m % 2 === 0 ? 'even' : 'odd'}" />
        {/each}
    {/if}

    <g clip-path="url(#graph-clip)">
        <GraphLayer />
    </g>
</svg>