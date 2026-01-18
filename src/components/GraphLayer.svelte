<script lang="ts">
    import { layoutStore } from '../lib/stores/layout.svelte';
    import { dataStore } from '../lib/stores/data.svelte';
    import { CONFIG } from '../lib/config/constants';
    import type { VisualStat } from '../lib/types'; // Bra att importera typen

    let { renderStart, renderEnd } = $props<{ renderStart: number, renderEnd: number }>();

    // Funktion för att skapa path för en specifik "line" (aggregerad data)
    function getSummaryPath(stats: VisualStat[]) {
        const offset = layoutStore.colsToHide;
        const maxVisualIndex = Math.max(0, stats.length - offset);
        const start = Math.max(0, renderStart - 1);
        const end = Math.min(renderEnd + 1, maxVisualIndex);

        let d = '';
        let first = true;

        for (let i = start; i < end; i++) {
            const stat = stats[i + offset];
            // ÄNDRING: Explicit check för val !== null
            if (!stat || !stat.hasData || stat.val === null) continue;

            const xBase = i * CONFIG.stride;
            const xLine = xBase + (CONFIG.stride / 2);
            // ÄNDRING: 'as number' för att lugna TypeScript
            const y = layoutStore.getY(stat.val as number);

            if (first) {
                d += `M ${xLine},${y}`;
                first = false;
            } else {
                d += ` L ${xLine},${y}`;
            }
        }
        return d;
    }

    // Funktion för detaljerad tidslinje ('all' mode) för ett specifikt dataset
    function getDetailedPath(datasetId: string) {
        const ds = dataStore.datasets.find(d => d.id === datasetId);
        if (!ds) return '';

        const stepX = CONFIG.stride / layoutStore.rows;
        const startCol = Math.max(0, renderStart - 1);
        const endCol = renderEnd + 1;
        const startIndex = (startCol + layoutStore.colsToHide) * layoutStore.rows;
        const endIndex = (endCol + layoutStore.colsToHide) * layoutStore.rows;

        let path = '';
        let firstPoint = true;

        for (let i = startIndex; i < endIndex; i++) {
            if (i >= ds.data.length) break;
            
            const item = ds.data[i];
            if (!item || item.val === null) continue;

            const rawCol = Math.floor(i / layoutStore.rows);
            const rowInCol = i % layoutStore.rows;
            const visualCol = rawCol - layoutStore.colsToHide;
            
            const x = (visualCol * CONFIG.stride) + (rowInCol * stepX) + (stepX / 2);
            const y = layoutStore.getY(item.val);

            if (firstPoint) {
                path += `M ${x},${y}`;
                firstPoint = false;
            } else {
                path += ` L ${x},${y}`;
            }
        }
        return path;
    }
</script>

{#if layoutStore.showGraph}
    <g class="graph-layer">
        
        {#each layoutStore.visuals.lines as line (line.id)}
            
            {#if layoutStore.graphMode === 'all'}
                <path 
                    d={getDetailedPath(line.id)} 
                    fill="none" 
                    stroke={line.color} 
                    stroke-width="1.5" 
                    stroke-linejoin="round"
                    vector-effect="non-scaling-stroke"
                />

            {:else if layoutStore.graphType === 'line'}
                {@const pathD = getSummaryPath(line.stats)}
                <path 
                    d={pathD} 
                    fill="none" 
                    stroke={line.color} 
                    stroke-width="2.5" 
                    stroke-linecap="round" 
                    stroke-linejoin="round" 
                />
                
                {#if line.id === 'primary'}
                    {#each line.stats as stat, i}
                        {@const idx = i - layoutStore.colsToHide}
                        {#if idx >= renderStart - 1 && idx <= renderEnd + 1}
                            {#if stat && stat.hasData && stat.val !== null}
                                {@const xLine = idx * CONFIG.stride + (CONFIG.stride / 2)}
                                {@const y = layoutStore.getY(stat.val as number)}
                                <circle cx={xLine} cy={y} r="3.5" fill="#fff" stroke={line.color} stroke-width="2.5" />
                            {/if}
                        {/if}
                    {/each}
                {/if}

            {:else}
                {#if line.id === 'primary'}
                    {#each line.stats as stat, i}
                        {@const idx = i - layoutStore.colsToHide}
                        {#if idx >= renderStart - 1 && idx <= renderEnd + 1}
                            {#if stat && stat.hasData && stat.val !== null}
                                {@const xBase = idx * CONFIG.stride}
                                {@const margin = 2}
                                {@const y = layoutStore.getY(stat.val as number)}
                                {@const yBottom = layoutStore.chartH - layoutStore.graphPadding.bottom}
                                <rect 
                                    x={xBase + margin} 
                                    y={y} 
                                    width={CONFIG.stride - (margin * 2)} 
                                    height={yBottom - y} 
                                    fill={line.color} 
                                    rx="2"
                                    opacity="0.8"
                                />
                            {/if}
                        {/if}
                    {/each}
                {/if}
            {/if}

        {/each}
    </g>
{/if}

<style>
    :global(body.dark-mode) path { stroke-opacity: 0.9; }
    :global(body.dark-mode) circle { fill: #1e1e1e; }
</style>