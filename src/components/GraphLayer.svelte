<script lang="ts">
    import { layoutStore } from '../lib/stores/layout.svelte';
    import { CONFIG } from '../lib/config/constants';
    import { calculateStat } from '../lib/services/statistics';
    import type { Dataset } from '../lib/types';

    let { renderStart, renderEnd } = $props<{ renderStart: number, renderEnd: number }>();

    // Hjälpfunktion för att räkna ut värdet för en specifik kolumn
    function getStatForColumn(ds: Dataset, colIndex: number): number | null {
        // Konvertera visuell kolumn (relativ till skärmen) till data-kolumn
        const dataColIndex = colIndex + layoutStore.colsToHide;
        
        const rows = layoutStore.rows;
        const startIdx = dataColIndex * rows;
        
        // Samla värden för denna kolumn
        const colItems: number[] = [];
        for (let r = 0; r < rows; r++) {
            const item = ds.data[startIdx + r];
            if (item && item.val !== null) {
                colItems.push(item.val);
            }
        }
        
        if (colItems.length === 0) return null;
        return calculateStat(colItems, ds.graphMode);
    }

    // Bygg SVG-vägen (Line Chart)
    function getSummaryPath(line: any) {
        const start = Math.max(0, renderStart - 1);
        // Vi behöver inte kolla max längd här, getStatForColumn hanterar out-of-bounds
        const end = renderEnd + 1; 

        let d = '';
        let first = true;

        for (let i = start; i < end; i++) {
            const val = getStatForColumn(line.dataset, i);
            if (val === null) continue;

            const xBase = i * CONFIG.stride;
            const xLine = xBase + (CONFIG.stride / 2);
            const y = layoutStore.getY(val);

            if (first) {
                d += `M ${xLine},${y}`;
                first = false;
            } else {
                d += ` L ${xLine},${y}`;
            }
        }
        return d;
    }

    // Detaljerad väg (All data points - "Tidslinje")
    function getDetailedPath(line: any) {
        const ds = line.dataset;
        const rows = layoutStore.rows;
        const stepX = CONFIG.stride / rows;
        
        const startCol = Math.max(0, renderStart - 1);
        const startIndex = (startCol + layoutStore.colsToHide) * rows;
        
        // Vi ritar bara det som syns (plus lite marginal)
        const visibleDataPoints = (renderEnd - renderStart + 2) * rows;
        const endIndex = startIndex + visibleDataPoints;

        let path = '';
        let firstPoint = true;

        for (let i = startIndex; i < endIndex; i++) {
            if (i >= ds.data.length) break;
            const item = ds.data[i];
            if (!item || item.val === null) continue;

            const rawCol = Math.floor(i / rows);
            const rowInCol = i % rows;
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
            
            {#if line.graphMode === 'all'}
                {#if line.showLine}
                    <path 
                        d={getDetailedPath(line)} 
                        fill="none" 
                        stroke={line.color} 
                        stroke-width={Math.max(1, line.width - 1)} 
                        stroke-linejoin="round"
                        vector-effect="non-scaling-stroke"
                    />
                {/if}

            {:else if line.graphType === 'line'}
                
                {#if line.showLine}
                    <path 
                        d={getSummaryPath(line)} 
                        fill="none" 
                        stroke={line.color} 
                        stroke-width={line.width} 
                        stroke-linecap="round" 
                        stroke-linejoin="round" 
                    />
                {/if}
                
                {#if line.showMarkers}
                    {#each {length: (renderEnd - renderStart + 3)} as _, offset}
                        {@const i = renderStart - 1 + offset}
                        {@const val = getStatForColumn(line.dataset, i)}
                        
                        {#if val !== null}
                            {@const xLine = i * CONFIG.stride + (CONFIG.stride / 2)}
                            {@const y = layoutStore.getY(val)}
                            
                            <circle 
                                cx={xLine} 
                                cy={y} 
                                r={line.markerSize} 
                                fill="#fff" 
                                stroke={line.color} 
                                stroke-width={line.width} 
                                opacity={line.markerOpacity}
                            />
                        {/if}
                    {/each}
                {/if}

            {:else}
                {#each {length: (renderEnd - renderStart + 3)} as _, offset}
                    {@const i = renderStart - 1 + offset}
                    {@const val = getStatForColumn(line.dataset, i)}
                    
                    {#if val !== null}
                        {@const xBase = i * CONFIG.stride}
                        {@const margin = 2}
                        {@const y = layoutStore.getY(val)}
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
                {/each}
            {/if}

        {/each}
    </g>
{/if}

<style>
    :global(body.dark-mode) path { stroke-opacity: 0.9; }
    :global(body.dark-mode) circle { fill: #1e1e1e; }
</style>