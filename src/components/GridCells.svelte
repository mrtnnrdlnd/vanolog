<script lang="ts">
    import { dataStore } from '../lib/stores/data.svelte';
    import { layoutStore } from '../lib/stores/layout.svelte';
    import { uiStore } from '../lib/stores/ui.svelte';
    import { CONFIG } from '../lib/config/constants';
    import { getHeatmapColor } from '../lib/theme';

    function handleCellClick(idx: number) {
        if (!dataStore.data[idx] || dataStore.data[idx].isDisabled) return;
        uiStore.openEditor(idx);
    }
</script>

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