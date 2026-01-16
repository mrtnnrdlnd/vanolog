<script lang="ts">
    import { layoutStore } from '../lib/stores/layout.svelte';
    import { dataStore } from '../lib/stores/data.svelte'; // NY IMPORT
    import { CONFIG } from '../lib/config/constants';

    let { renderStart, renderEnd } = $props<{ renderStart: number, renderEnd: number }>();

    // --- BEFINTLIG LOGIK (för staplar och vanliga linjer) ---
    let points = $derived.by(() => {
        // Om vi kör 'all' mode, strunta i att beräkna kolumn-punkter
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
            const y = layoutStore.getY(stat.val) + layoutStore.graphPadding.top;

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

        // 1. Beräkna steglängd per cell (dag)
        // Om en kolumn är 26px bred och har 7 rader, är varje dag ca 3.7px bred.
        const stepX = CONFIG.stride / layoutStore.rows;
        
        // 2. Bestäm vilka data-index vi ska rita
        // Vi måste mappa renderStart (kolumn) till data-index.
        const startCol = Math.max(0, renderStart - 1);
        const endCol = renderEnd + 1;

        // Eftersom dataStore.data innehåller padding i början måste vi 
        // räkna med layoutStore.colsToHide.
        const startIndex = (startCol + layoutStore.colsToHide) * layoutStore.rows;
        const endIndex = (endCol + layoutStore.colsToHide) * layoutStore.rows;

        let path = '';
        let firstPoint = true;

        for (let i = startIndex; i < endIndex; i++) {
            const item = dataStore.data[i];
            
            // Hoppa över om data saknas eller om vi är utanför arrayen
            if (!item || item.val === null) continue;

            // 3. Beräkna position
            const rawCol = Math.floor(i / layoutStore.rows); // Vilken "riktig" kolumn datan ligger i
            const rowInCol = i % layoutStore.rows;           // Vilken rad (0-6)
            
            // Justera för dolda kolumner så grafen börjar på rätt ställe
            const visualCol = rawCol - layoutStore.colsToHide;
            
            // X = (Kolumnens start) + (Dag-offset inuti kolumnen)
            // Vi lägger till hälften av stepX för att centrera punkten i sin "tids-slot"
            const x = (visualCol * CONFIG.stride) + (rowInCol * stepX) + (stepX / 2);
            
            // Y = Värde mappat till grafhöjd
            const y = layoutStore.getY(item.val) + layoutStore.graphPadding.top;

            if (firstPoint) {
                path += `M ${x},${y}`;
                firstPoint = false;
            } else {
                path += ` L ${x},${y}`;
            }
        }
        return path;
    });

    // Vanlig linje-path (för 'avg', 'max' etc)
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
    /* Dark mode override för linjen */
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