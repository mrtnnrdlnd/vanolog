<script lang="ts">
    import { layoutStore } from '../lib/stores/layout.svelte';
    import { CONFIG } from '../lib/config/constants';

    let { renderStart, renderEnd } = $props<{ renderStart: number, renderEnd: number }>();
</script>

{#each layoutStore.visuals.monthBounds as b}
    {#if b.endCol >= renderStart && b.startCol <= renderEnd}
        <div 
            class="month-marker"
            style:top="{layoutStore.chartH + layoutStore.gridH}px"
            style:height="{CONFIG.footerHeight}px"
            style:transform="translate({((b.startCol + b.endCol) / 2) * CONFIG.stride}px, 0) translateX(-50%)"
        >
             <span class="month-label">{CONFIG.months[b.m]} {b.y}</span>
        </div>
    {/if}
{/each}

{#each { length: (renderEnd - renderStart) } as _, i}
    {@const col = renderStart + i}
    <div 
        class="snap-guide" 
        style:left="{(col * CONFIG.stride)}px" 
        style:width="{CONFIG.stride}px"
    ></div>
{/each}

<style>
    .month-marker {
        position: absolute; display: flex; align-items: center; justify-content: center;
        pointer-events: none; z-index: 20; color: #999; font-size: 11px; font-weight: 600;
    }

    .snap-guide {
        position: absolute;
        top: 0; bottom: 0;
        pointer-events: none;

        /* HÄR ÄR MAGIN: */
        scroll-snap-align: start;
        
        /* Debug: Avkommentera nedan om du vill se linjerna du snappar mot */
        /* border-left: 1px dashed red; opacity: 0.5; */
    }
</style>