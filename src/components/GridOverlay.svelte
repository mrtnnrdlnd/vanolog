<script lang="ts">
    import { layoutStore } from '../lib/stores/layout.svelte';
    import { CONFIG } from '../lib/config/constants';
</script>

{#each layoutStore.visuals.monthBounds as b}
    <div 
        class="month-marker"
        style:top="{layoutStore.chartH + layoutStore.gridH}px"
        style:height="{CONFIG.footerHeight}px"
        style:transform="translate({((b.startCol + b.endCol) / 2) * CONFIG.stride}px, 0) translateX(-50%)"
    >
            <span class="month-label">{CONFIG.months[b.m]} {b.y}</span>
    </div>
{/each}

{#each Array(Math.ceil(layoutStore.totalCols - layoutStore.colsToHide)) as _, i}
    <div class="snap-guide" style:left="{(i * CONFIG.stride) + (CONFIG.stride / 2)}px"></div>
{/each}

<style>
    .month-marker {
        position: absolute; 
        display: flex; align-items: center; justify-content: center;
        pointer-events: none; 
        z-index: 20; 
    }
    
    .month-label {
        font-size: 13px; 
        font-weight: 700; 
        text-transform: uppercase; 
        color: var(--text-muted);
        background: rgba(255,255,255,0.4); 
        padding: 2px 8px;
        border-radius: 10px;
        backdrop-filter: blur(2px);
    }
    
    :global(body.dark-mode) .month-label {
        background: rgba(0,0,0,0.4);
    }
</style>