<script lang="ts">
    import { layoutStore } from '../lib/stores/layout.svelte';
    import { dataStore } from '../lib/stores/data.svelte';
    import { CONFIG } from '../lib/config/constants';

    let { renderStart, renderEnd } = $props<{ renderStart: number, renderEnd: number }>();

    // --- BEFINTLIG LOGIK (för staplar och vanliga linjer) ---
    let points = $derived.by(() => {
        if (layoutStore.graphMode === 'all') return [];

        const stats = layoutStore.visuals.stats;
        const offset = layoutStore.colsToHide;
        
        const maxVisualIndex = Math.max(0, stats.length - offset);
        const start = Math.max(0, renderStart - 1);
        const end = Math.min(renderEnd + 1, maxVisualIndex);

        const result = [];

        for (let i = start; i < end; i++) {
            const stat = stats[i + offset];
            if (!stat || !stat.hasData) {
                result.push(null);
                continue;
            }

            const xBase = i * CONFIG.stride;
            const xLine = xBase + (CONFIG.stride / 2);
            
            // ÄNDRING: Tog bort '+ layoutStore.graphPadding.top'
            // Detta flyttar upp grafen 15px så den matchar Y-axeln
            const y = layoutStore.getY(stat.val);

            // För staplar
            const margin = 2;
            const yBottom = layoutStore.chartH - layoutStore.graphPadding.bottom;
            
            result.push({
                xLine,
                xBar: xBase + margin,
                barWidth: CONFIG.stride - (margin * 2),
                y,
                height: yBottom - y,
                val: stat.val
            });
        }
        return result;
    });

    // --- NY LOGIK: Detaljerad Tidslinje ('all') ---
    let detailedPath = $derived.by(() => {
        if (layoutStore.graphMode !== 'all') return '';

        const stepX = CONFIG.stride / layoutStore.rows;
        const startCol = Math.max(0, renderStart - 1);
        const endCol = renderEnd + 1;
        const startIndex = (startCol + layoutStore.colsToHide) * layoutStore.rows;
        const endIndex = (endCol + layoutStore.colsToHide) * layoutStore.rows;

        let path = '';
        let firstPoint = true;

        for (let i = startIndex; i < endIndex; i++) {
            const item = dataStore.data[i];
            
            if (!item || item.val === null) continue;

            const rawCol = Math.floor(i / layoutStore.rows); 
            const rowInCol = i % layoutStore.rows;           
            const visualCol = rawCol - layoutStore.colsToHide;
            const x = (visualCol * CONFIG.stride) + (rowInCol * stepX) + (stepX / 2);
            
            // ÄNDRING: Tog bort '+ layoutStore.graphPadding.top' här också
            const y = layoutStore.getY(item.val);

            if (firstPoint) {
                path += `M ${x},${y}`;
                firstPoint = false;
            } else {
                path += ` L ${x},${y}`;
            }
        }
        return path;
    });

    let summaryPath = $derived.by(() => {
        if (layoutStore.graphMode === 'all' || layoutStore.graphType !== 'line') return '';
        const valid = points.filter(p => p !== null);
        if (!valid.length) return '';
        
        return `M ${valid[0].xLine},${valid[0].y} ` + 
               valid.slice(1).map(p => `L ${p!.xLine},${p!.y}`).join(' ');
    });

</script>

{#if layoutStore.showGraph}
    <g class="graph-layer">
        
        {#if layoutStore.graphMode === 'all'}
            <path 
                d={detailedPath} 
                fill="none" 
                stroke="#00639b" 
                stroke-width="1.5" 
                stroke-linejoin="round"
                vector-effect="non-scaling-stroke"
            />

        {:else if layoutStore.graphType === 'line'}
            <path 
                d={summaryPath} 
                fill="none" 
                stroke="#00639b" 
                stroke-width="2.5" 
                stroke-linecap="round" 
                stroke-linejoin="round" 
            />
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
                        height={p.height} 
                        fill="#00639b" 
                        rx="2"
                        opacity="0.8"
                    />
                {/if}
            {/each}
        {/if}

    </g>
{/if}

<style>
    :global(body.dark-mode) path {
        stroke: #4fc3f7;
    }
    :global(body.dark-mode) circle {
        stroke: #4fc3f7;
        fill: #1e1e1e;
    }
    :global(body.dark-mode) rect {
        fill: #4fc3f7;
    }
</style>