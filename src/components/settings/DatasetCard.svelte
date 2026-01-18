<script lang="ts">
    import { slide } from 'svelte/transition';
    import { quintOut } from 'svelte/easing'; 
    
    import { dataStore } from '../../lib/stores/data.svelte';
    import { layoutStore } from '../../lib/stores/layout.svelte'; 
    import type { Dataset, GraphMode, GraphType } from '../../lib/types';
    
    import Toggle from './controls/Toggle.svelte';
    import Selector from './controls/Selector.svelte';
    import HueSlider from './controls/HueSlider.svelte';
    import RangeSlider from './controls/RangeSlider.svelte';

    let { dataset = $bindable(), isEditing, onToggleEdit } = $props<{
        dataset: Dataset,
        isEditing: boolean,
        onToggleEdit: () => void
    }>();

    const GRAPH_TYPES = [{ label: 'Linje', value: 'line' }, { label: 'Stapel', value: 'bar' }];
    const CALC_MODES = [
        { label: 'Medel', value: 'avg' }, { label: 'Median', value: 'median' },
        { label: 'Min', value: 'min' }, { label: 'Max', value: 'max' },
        { label: 'Tidslinje', value: 'all', fullWidth: true }
    ];
    
    // Helper för att kolla om detta dataset är valt för heatmap
    let isHeatmapSource = $derived(layoutStore.heatmapDatasetId === dataset.id);
    let dsColor = $derived(`hsl(${dataset.hue}, 70%, 50%)`);
</script>

<div class="dataset-card">
    <div class="dataset-row">
        <button class="expand-btn" onclick={onToggleEdit}>
            <div class="color-dot" style:background="hsl({dataset.hue}, 70%, 50%)"></div>
            <div style="display:flex; flex-direction:column; gap:2px;">
                <span class="ds-name">{dataset.name}</span>
                <span class="ds-meta">
                    {dataset.graphType === 'line' ? 'Linje' : 'Stapel'} • {dataset.graphMode.toUpperCase()}
                </span>
            </div>
        </button>
        
        <Toggle 
            label=""
            checked={dataset.isVisible} 
            onChange={() => dataStore.toggleDataset(dataset.id)} 
            color={dsColor} 
        />
    </div>

    {#if isEditing}
        <div class="dataset-controls" transition:slide={{duration: 200, easing: quintOut}}>
            
            <div class="control-section-label">DATA & TYP</div>
            <Selector label="Typ" options={GRAPH_TYPES} currentValue={dataset.graphType} onChange={(v) => dataset.graphType = v} layout="flex" color={dsColor}/>
            <Selector label="Beräkning" options={CALC_MODES} currentValue={dataset.graphMode} onChange={(v) => dataset.graphMode = v} layout="grid" color={dsColor}/>

            <div class="setting-row" style:margin-top="12px">
               <Toggle 
                    label="Använd för Heatmap" 
                    checked={isHeatmapSource} 
                    onChange={(v) => { if (v) layoutStore.heatmapDatasetId = dataset.id }} 
                    color={dsColor} 
                />
            </div>

            <div class="control-section-label" style:margin-top="12px">LINJESTIL</div>
            
            <div class="setting-group" style="margin-bottom:8px">
                <span class="group-label">Färgton</span>
                <HueSlider bind:hue={dataset.hue} isDark={layoutStore.darkMode} />
            </div>

            <div class="control-row">
                <label>Tjocklek ({dataset.width}px)</label>
                <RangeSlider 
                    min={0.5} max={8} step={0.5} 
                    bind:value={dataset.width} 
                    color={dsColor} 
                />
            </div>

            {#if dataset.graphType === 'line'}
                <div class="control-section-label" style:margin-top="8px">ELEMENT</div>
                <Toggle label="Visa Linje" checked={dataset.showLine} onChange={(v) => dataset.showLine = v} color={dsColor}/>
                <Toggle label="Visa Markörer" checked={dataset.showMarkers} onChange={(v) => dataset.showMarkers = v} color={dsColor}/>
                {#if dataset.showMarkers}
                    <div class="control-row" style="margin-top:6px">
                        <label>Markörstorlek ({dataset.markerSize}px)</label>
                        <RangeSlider 
                            min={1} max={10} step={0.5} 
                            bind:value={dataset.markerSize} 
                            color={dsColor} 
                        />
                    </div>
                    <div class="control-row">
                        <label>Opacitet ({Math.round(dataset.markerOpacity * 100)}%)</label>
                        <RangeSlider 
                            min={0} max={1} step={0.1} 
                            bind:value={dataset.markerOpacity} 
                            color={dsColor} 
                        />
                    </div>
                {/if}
            {/if}

            <div class="action-row" style:margin-top="12px">
                <button class="action-btn copy" onclick={() => dataStore.cloneDataset(dataset.id)} title="Duplicera"><span>📋</span> Duplicera</button>
                {#if dataStore.datasets.length > 1}
                    <button class="action-btn delete" onclick={() => dataStore.removeDataset(dataset.id)} title="Ta bort"><span>🗑️</span> Ta bort</button>
                {/if}
            </div>
        </div>
    {/if}
</div>

<style>
    /* --- NY DESIGN: Vit bakgrund för bättre kontrast --- */

    .dataset-card { 
        background: #ffffff; 
        border-radius: 8px; 
        overflow: hidden; 
        border: 1px solid #e0e0e0; /* Tydligare ram */
        transition: border-color 0.2s, box-shadow 0.2s; 
    }
    
    .dataset-card:hover { 
        border-color: #ccc;
        box-shadow: 0 2px 8px rgba(0,0,0,0.05);
    }

    .dataset-row { 
        display: flex; 
        justify-content: space-between; 
        align-items: center; 
        padding: 10px 12px; /* Lite luftigare padding */
    }
    
    .expand-btn { 
        display: flex; 
        align-items: center; 
        gap: 12px; 
        background: transparent; 
        border: none; 
        cursor: pointer; 
        font-size: 14px; 
        font-weight: 500; 
        color: var(--text-main); 
        flex: 1; 
        text-align: left; 
    }
    
    .ds-name { font-weight: 600; font-size: 14px; }
    .ds-meta { font-size: 11px; color: var(--text-muted); opacity: 0.8; margin-top: 1px; }
    
    .color-dot { 
        width: 14px; 
        height: 14px; 
        border-radius: 50%; 
        border: 2px solid #fff; 
        box-shadow: 0 0 0 1px rgba(0,0,0,0.1); /* Tunn ring för kontrast mot vitt */
    }
    
    /* Panel för kontroller (utfälld) */
    .dataset-controls { 
        padding: 16px; 
        background: #fafafa; /* Mycket ljus grå (nästan vit) */
        border-top: 1px solid #f0f0f0; 
        display: flex; 
        flex-direction: column; 
        gap: 16px; 
    }
    
    .control-section-label { 
        font-size: 10px; 
        font-weight: 800; 
        color: #00639b; 
        opacity: 0.7; 
        margin-bottom: 4px; 
        letter-spacing: 0.5px; 
    }
    
    .control-row { display: flex; flex-direction: column; gap: 6px; }
    .control-row label { font-size: 11px; font-weight: 600; text-transform: uppercase; color: var(--text-muted); }
    
    .setting-group .group-label { 
        display: block; font-size: 11px; font-weight: 700; margin-bottom: 8px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; 
    } 

    .action-row { display: flex; gap: 8px; margin-top: 8px; }
    
    .action-btn { 
        flex: 1; 
        padding: 8px; 
        border-radius: 6px; 
        border: 1px solid rgba(0,0,0,0.1); /* Tunn ram för knappar */
        font-size: 12px; 
        font-weight: 500; 
        cursor: pointer; 
        display: flex; 
        align-items: center; 
        justify-content: center; 
        gap: 6px; 
        transition: all 0.2s; 
    }
    
    .action-btn.copy { background: #fff; color: var(--text-main); }
    .action-btn.copy:hover { background: #f5f5f5; border-color: rgba(0,0,0,0.2); }
    
    .action-btn.delete { background: #fff0f0; color: #d32f2f; border-color: rgba(211, 47, 47, 0.1); }
    .action-btn.delete:hover { background: #ffebee; border-color: rgba(211, 47, 47, 0.3); }

    /* --- DARK MODE ÖVERSKRIDNINGAR --- */
    :global(body.dark-mode) .control-section-label { color: #64b5f6; opacity: 0.8; }
    
    /* Mörkare bakgrund i dark mode men med tydliga gränser */
    :global(body.dark-mode) .dataset-card { 
        background: #2a2a2a; 
        border-color: #404040;
    }
    :global(body.dark-mode) .dataset-card:hover {
        border-color: #555;
    }
    
    :global(body.dark-mode) .dataset-controls { 
        background: #222; 
        border-top-color: #333; 
    }
    
    :global(body.dark-mode) .color-dot { border-color: #444; }
    
    :global(body.dark-mode) .action-btn.copy { background: #333; border-color: #444; color: #ddd; }
    :global(body.dark-mode) .action-btn.copy:hover { background: #404040; }
    :global(body.dark-mode) .action-btn.delete { background: rgba(211, 47, 47, 0.1); border-color: rgba(211, 47, 47, 0.3); }
</style>