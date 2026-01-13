<script lang="ts">
    import { store } from '../lib/store.svelte';
    import { CONFIG } from '../lib/types';

    // Beräkna koordinater för grafen
    let points = $derived.by(() => {
        const { chartH, graphMin, graphMax } = store;
        const range = graphMax - graphMin;
        const availableH = Math.max(0, chartH - 45); // 40px top padding + 5px bottom
        const margin = (CONFIG.stride * 0.25) / 2; // För staplar

        // Skippa de kolumner som är gömda till vänster (colsToHide)
        const visibleStats = store.processedData.stats.slice(store.colsToHide);

        return visibleStats.map((stat, i) => {
            if (!stat.hasData) return null;
            
            const normalized = Math.max(0, Math.min(1, (stat.val - graphMin) / range));
            const y = (chartH - 5) - (normalized * availableH);
            const xBase = (i * CONFIG.stride);
            
            return {
                xLine: xBase + (CONFIG.stride / 2),
                xBar: xBase + margin,
                y,
                height: normalized * availableH,
                val: stat.val
            };
        });
    });

    let linePath = $derived.by(() => {
        if (store.graphType !== 'line') return '';
        const validPoints = points.filter(p => p !== null);
        if (validPoints.length === 0) return '';
        return `M ${validPoints[0].xLine},${validPoints[0].y} ` + 
               validPoints.slice(1).map(p => `L ${p!.xLine},${p!.y}`).join(' ');
    });
</script>

<g class="graph-layer">
    {#if store.graphType === 'line'}
        <path d={linePath} fill="none" stroke="#00639b" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
        {#each points as p}
            {#if p}
                <circle cx={p.xLine} cy={p.y} r="3.5" fill="#fff" stroke="#00639b" stroke-width="2.5" />
            {/if}
        {/each}
    {:else}
        {#each points as p}
            {#if p}
                <rect 
                    x={p.xBar} 
                    y={p.y} 
                    width={CONFIG.stride * 0.75} 
                    height={Math.max(1, p.height)} 
                    fill="rgba(0, 99, 155, 0.5)" 
                    rx="3" 
                />
            {/if}
        {/each}
    {/if}
</g>