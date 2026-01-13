<script lang="ts">
    import { layoutStore } from '../lib/stores/layout.svelte';
    import { CONFIG } from '../lib/config/constants';

    let points = $derived.by(() => {
        const visibleStats = layoutStore.visuals.stats.slice(layoutStore.colsToHide);
        const margin = 2; 

        return visibleStats.map((stat, i) => {
            if (!stat.hasData) return null;
            
            // Vi tar bort Math.max(0, Math.min(1, ...)) så att värdena 
            // får gå utanför skalan om användaren zoomar in för mycket
            const y = layoutStore.getY(stat.val);
            const xBase = (i * CONFIG.stride);
            const yBottom = layoutStore.chartH - layoutStore.graphPadding.bottom; 

            return {
                xLine: xBase + (CONFIG.stride / 2),
                xBar: xBase + margin,
                barWidth: CONFIG.stride - (margin * 2),
                y,
                height: yBottom - y, // Låt höjden vara rå
                val: stat.val
            };
        });
    });

    let linePath = $derived.by(() => {
        if (layoutStore.graphType !== 'line') return '';
        const valid = points.filter(p => p !== null);
        if (!valid.length) return '';
        
        // Vi ritar linjen mellan alla punkter, även de som är "utanför"
        return `M ${valid[0].xLine},${valid[0].y} ` + 
               valid.slice(1).map(p => `L ${p!.xLine},${p!.y}`).join(' ');
    });
</script>

{#if layoutStore.showGraph}
    <g class="graph-layer">
        {#if layoutStore.graphType === 'line'}
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
                        width={p.barWidth} 
                        height={Math.max(0, p.height)} 
                        fill="#00639b" 
                        fill-opacity="0.6"
                        rx="2" 
                    />
                {/if}
            {/each}
        {/if}
    </g>
{/if}