<script lang="ts">
    import { dataStore } from '../lib/stores/data.svelte';
    import { layoutStore } from '../lib/stores/layout.svelte';
    import { uiStore } from '../lib/stores/ui.svelte';
    import { CONFIG } from '../lib/config/constants';
    import { getHeatmapColor } from '../lib/theme';

    let { renderStart, renderEnd } = $props<{ renderStart: number, renderEnd: number }>();

    // FIX 1: Skapa en stabil array av de kolumner som ska visas
    let visibleColumns = $derived(
        Array.from(
            { length: Math.max(0, renderEnd - renderStart) }, 
            (_, i) => renderStart + i
        )
    );

    function handleCellClick(idx: number) {
        if (!dataStore.data[idx] || dataStore.data[idx].isDisabled) return;
        uiStore.openEditor(idx);
    }
</script>

{#each visibleColumns as visualCol (visualCol)}
    
    {@const rawCol = visualCol + layoutStore.colsToHide}

    {#each { length: layoutStore.rows } as _, r}
        {@const idx = (rawCol * layoutStore.rows) + r}
        {@const d = dataStore.data[idx]}

        {#if d && d.day}
            {@const x = (visualCol * CONFIG.stride) + (CONFIG.stride - CONFIG.boxSize)/2}
            {@const y = layoutStore.chartH + (r * CONFIG.stride) + (CONFIG.stride - CONFIG.boxSize)/2}
            
            {@const valueIsEmpty = d.val === null || isNaN(d.val)}

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
                    {!layoutStore.showHeatmap || valueIsEmpty ? 'no-heatmap' : ''}"
                
                    style:transform="translate({x}px, {y}px)"
                    style:background-color={layoutStore.showHeatmap && !valueIsEmpty
                    ? getHeatmapColor(
                        Number(d.val), 
                        layoutStore.graphMin, 
                        layoutStore.graphMax, 
                        layoutStore.darkMode,
                        layoutStore.heatmapHue
                    ) 
                    : ''}
                
                onclick={() => handleCellClick(idx)} 
                role="button"
                tabindex="0"
            >
                {d.day}
            </div>
        {/if}
    {/each}
{/each}

