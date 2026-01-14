<script lang="ts">
    import { layoutStore } from '../lib/stores/layout.svelte';
    import GraphLayer from './GraphLayer.svelte';

    // Ta emot render-fönstret som props
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
                <path d={b.pathD} class="month-bg {b.m % 2 === 0 ? 'even' : 'odd'}" />
            {/if}
        {/each}
    {/if}

    <g clip-path="url(#graph-clip)">
        <GraphLayer {renderStart} {renderEnd} />
    </g>
</svg>