<script lang="ts">
    import { layoutStore } from '../lib/stores/layout.svelte';
    import { CONFIG } from '../lib/config/constants';

    let { renderStart, renderEnd } = $props<{ renderStart: number, renderEnd: number }>();

    let points = $derived.by(() => {
        const stats = layoutStore.visuals.stats;
        const offset = layoutStore.colsToHide;
        
        // SÄKERHETS-FIX:
        // Vi måste se till att 'end' aldrig går bortom vad som faktiskt finns i stats-arrayen.
        // Eftersom vi hämtar med index [i + offset], är max tillåtna 'i' lika med (stats.length - offset).
        const maxVisualIndex = Math.max(0, stats.length - offset);
        
        // Vi vill rendera en extra (+1) för linjens skull (för att binda ihop med nästa),
        // MEN vi får inte gå över maxVisualIndex.
        const start = Math.max(0, renderStart - 1);
        const end = Math.min(renderEnd + 1, maxVisualIndex);

        const result = [];

        for (let i = start; i < end; i++) {
            // Hämta statistik för rätt kolumn
            const stat = stats[i + offset];
            
            // Extra säkerhetskoll så vi inte kraschar om stat saknas eller är undefined
            if (!stat || !stat.hasData) {
                result.push(null);
                continue;
            }

            const y = layoutStore.getY(stat.val);
            const xBase = (i * CONFIG.stride);
            const yBottom = layoutStore.chartH - layoutStore.graphPadding.bottom; 
            const margin = 2;

            result.push({
                xLine: xBase + (CONFIG.stride / 2),
                xBar: xBase + margin,
                barWidth: CONFIG.stride - (margin * 2),
                y,
                height: yBottom - y,
                val: stat.val
            });
        }
        return result;
    });

    let linePath = $derived.by(() => {
        if (layoutStore.graphType !== 'line') return '';
        const valid = points.filter(p => p !== null);
        if (!valid.length) return '';
        
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