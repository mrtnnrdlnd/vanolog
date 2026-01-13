<script lang="ts">
    import { dataStore } from '../lib/stores/data.svelte';
    import { layoutStore } from '../lib/stores/layout.svelte';
    import { uiStore } from '../lib/stores/ui.svelte';
    import { CONFIG } from '../lib/config/constants';
    import GraphLayer from './GraphLayer.svelte';
    import { getHeatmapColor } from '../lib/theme'; 

    let scroller: HTMLElement;
    
    // Ankare för att behålla fokus vid resize (när rader ändras)
    let anchorIndex = $state(0);

    // Dynamisk beräkning av klippmaskens fönster (mellan max- och min-axeln)
    let maskY = $derived(layoutStore.graphPadding.top);
    let maskHeight = $derived(layoutStore.chartH - layoutStore.graphPadding.top - layoutStore.graphPadding.bottom);

    // Initial scroll till idag
    $effect(() => {
        if (scroller && !uiStore.loading && dataStore.todayIndex > 0) {
            if (!uiStore.scrolledToToday) {
                const startCol = Math.floor(dataStore.todayIndex / layoutStore.rows);
                const centerPos = (startCol * CONFIG.stride) - (scroller.clientWidth / 2) + (CONFIG.stride / 2);
                scroller.scrollLeft = Math.max(0, centerPos);
                uiStore.scrolledToToday = true;
                anchorIndex = dataStore.todayIndex;
            }
        }
    });

    // Resize-logik (följ ankaret)
    $effect(() => {
        const r = layoutStore.rows; 
        if (scroller && layoutStore.isResizing && anchorIndex > 0) {
            const newCol = Math.floor(anchorIndex / r);
            scroller.scrollLeft = newCol * CONFIG.stride;
        }
    });

    // Uppdatera ankaret när man scrollar manuellt
    function handleScroll() {
        if (!scroller || layoutStore.isResizing) return;
        const currentLeftCol = Math.round(scroller.scrollLeft / CONFIG.stride);
        anchorIndex = currentLeftCol * layoutStore.rows;
    }

    function handleCellClick(idx: number) {
        if (!dataStore.data[idx] || dataStore.data[idx].isDisabled) return;
        uiStore.openEditor(idx);
    }
</script>

<div 
    class="scroll-view" 
    bind:this={scroller}
    onscroll={handleScroll} 
>
    <div 
        class="grid-container" 
        style:margin-left="{layoutStore.centerOffset}px"
        style:margin-right="{layoutStore.centerOffset}px"
        style:width="{layoutStore.totalWidth}px"
        style:height="{layoutStore.screenH}px"
    >
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
                    <path d={b.pathD} class="month-bg {b.m % 2 === 0 ? 'even' : 'odd'}" />
                {/each}
            {/if}

            <g clip-path="url(#graph-clip)">
                <GraphLayer />
            </g>
        </svg>

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

        {#each dataStore.data as d, i}
            {@const rawCol = Math.floor(i / layoutStore.rows)}
            {@const isHidden = (rawCol * CONFIG.stride) < layoutStore.xShift}
            
            {#if !isHidden && d.day}
                {@const row = i % layoutStore.rows}
                {@const visualCol = rawCol - layoutStore.colsToHide}
                {@const x = (visualCol * CONFIG.stride) + (CONFIG.stride - CONFIG.boxSize)/2}
                {@const y = layoutStore.chartH + (row * CONFIG.stride) + (CONFIG.stride - CONFIG.boxSize)/2}
                
                {@const norm = d.val !== null 
                    ? ((d.val - layoutStore.graphMin) / (layoutStore.graphMax - layoutStore.graphMin)) 
                    : 0}
                
                {@const textColorClass = layoutStore.showHeatmap 
                    ? (layoutStore.darkMode 
                        ? (norm > 0.6 ? 'is-light' : 'is-dark') 
                        : (norm > 0.55 ? 'is-dark' : 'is-light')
                      )
                    : ''} 

                <div 
                    class="cell 
                           {d.isSunday ? 'is-sunday' : ''} 
                           {d.isToday ? 'is-today' : ''} 
                           {d.isDisabled ? 'is-disabled' : ''} 
                           {textColorClass}
                           {!layoutStore.showHeatmap ? 'no-heatmap' : ''}"
                    
                    style:transform="translate({x}px, {y}px)"
                    
                    style:background-color={layoutStore.showHeatmap 
                        ? getHeatmapColor(
                            d.val, 
                            layoutStore.graphMin, 
                            layoutStore.graphMax, 
                            layoutStore.darkMode,
                            layoutStore.heatmapHue
                          ) 
                        : ''}
                    
                    onclick={() => handleCellClick(i)} 
                    role="button"
                    tabindex="0"
                    onkeypress={(e) => e.key === 'Enter' && handleCellClick(i)}
                >
                    {d.day}
                </div>
            {/if}
        {/each}

        {#each Array(Math.ceil(layoutStore.totalCols - layoutStore.colsToHide)) as _, i}
            <div class="snap-guide" style:left="{(i * CONFIG.stride) + (CONFIG.stride / 2)}px"></div>
        {/each}
    </div>
</div>

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
    
    .month-bg {
        stroke: var(--month-stroke);
        stroke-width: 1.5px;
        stroke-linejoin: round;
    }

    :global(.cell.no-heatmap) {
        background-color: var(--bg-card) !important;
        border: 1px solid rgba(0,0,0,0.1); 
        color: var(--text-main) !important;
        box-shadow: none;
    }
    :global(body.dark-mode .cell.no-heatmap) {
        border-color: rgba(255,255,255,0.1);
    }
</style>