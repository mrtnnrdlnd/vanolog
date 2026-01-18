<script lang="ts">
    // FIX: Dela upp importerna här
    import { slide } from 'svelte/transition';
    import { quintOut } from 'svelte/easing';
    
    import { dataStore } from '../../lib/stores/data.svelte';
    import { layoutStore } from '../../lib/stores/layout.svelte'; 
    import type { Dataset, GraphMode, GraphType } from '../../lib/types';
    
    import Toggle from './controls/Toggle.svelte';
    import Selector from './controls/Selector.svelte';
    import HueSlider from './controls/HueSlider.svelte';

    let { dataset = $bindable(), isEditing, onToggleEdit } = $props<{
        dataset: Dataset,
        isEditing: boolean,
        onToggleEdit: () => void
    }>();

    const GRAPH_TYPES: { label: string, value: GraphType }[] = [
        { label: 'Linje', value: 'line' },
        { label: 'Stapel', value: 'bar' }
    ];

    const CALC_MODES: { label: string, value: GraphMode, fullWidth?: boolean }[] = [
        { label: 'Medel', value: 'avg' },
        { label: 'Median', value: 'median' },
        { label: 'Min', value: 'min' },
        { label: 'Max', value: 'max' },
        { label: 'Tidslinje', value: 'all', fullWidth: true }
    ];
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
        
        <button 
            class="toggle-switch {dataset.isVisible ? 'active' : ''}" 
            onclick={() => dataStore.toggleDataset(dataset.id)}
        >
            <div class="toggle-knob"></div>
        </button>
    </div>

    {#if isEditing}
        <div class="dataset-controls" transition:slide={{duration: 200, easing: quintOut}}>
            
            <div class="control-section-label">DATA & TYP</div>
            <Selector label="Typ" options={GRAPH_TYPES} currentValue={dataset.graphType} onChange={(v) => dataset.graphType = v} layout="flex" />
            <Selector label="Beräkning" options={CALC_MODES} currentValue={dataset.graphMode} onChange={(v) => dataset.graphMode = v} layout="grid" />

            <div class="control-section-label" style:margin-top="8px">LINJESTIL</div>
            
            <div class="setting-group" style="margin-bottom:8px">
                <span class="group-label">Färgton</span>
                <HueSlider bind:hue={dataset.hue} isDark={layoutStore.darkMode} />
            </div>

            <div class="control-row">
                <label>Tjocklek ({dataset.width}px)</label>
                <input type="range" min="0.5" max="8" step="0.5" bind:value={dataset.width} class="width-slider" />
            </div>

            {#if dataset.graphType === 'line'}
                <div class="control-section-label" style:margin-top="8px">ELEMENT</div>
                
                <Toggle label="Visa Linje" checked={dataset.showLine} onChange={(v) => dataset.showLine = v} />
                <Toggle label="Visa Markörer" checked={dataset.showMarkers} onChange={(v) => dataset.showMarkers = v} />

                {#if dataset.showMarkers}
                    <div class="control-row" style="margin-top:6px">
                        <label>Markörstorlek ({dataset.markerSize}px)</label>
                        <input type="range" min="1" max="10" step="0.5" bind:value={dataset.markerSize} class="width-slider" />
                    </div>
                    <div class="control-row">
                        <label>Opacitet ({Math.round(dataset.markerOpacity * 100)}%)</label>
                        <input type="range" min="0" max="1" step="0.1" bind:value={dataset.markerOpacity} class="width-slider" />
                    </div>
                {/if}
            {/if}

            <div class="action-row" style:margin-top="12px">
                <button class="action-btn copy" onclick={() => dataStore.cloneDataset(dataset.id)} title="Duplicera">
                    <span>📋</span> Duplicera
                </button>
                {#if dataStore.datasets.length > 1}
                    <button class="action-btn delete" onclick={() => dataStore.removeDataset(dataset.id)} title="Ta bort">
                        <span>🗑️</span> Ta bort
                    </button>
                {/if}
            </div>
        </div>
    {/if}
</div>

<style>
    .dataset-card { background: rgba(0,0,0,0.03); border-radius: 8px; overflow: hidden; border: 1px solid transparent; transition: background 0.2s; }
    .dataset-card:hover { background: rgba(0,0,0,0.06); }
    .dataset-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 10px; }
    
    .expand-btn { display: flex; align-items: center; gap: 10px; background: transparent; border: none; cursor: pointer; font-size: 14px; font-weight: 500; color: var(--text-main); flex: 1; text-align: left; }
    .ds-name { font-weight: 600; font-size: 13px; }
    .ds-meta { font-size: 10px; color: var(--text-muted); opacity: 0.8; }
    .color-dot { width: 14px; height: 14px; border-radius: 50%; border: 2px solid #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.2); }
    
    .dataset-controls { padding: 12px; background: rgba(0,0,0,0.05); border-top: 1px solid rgba(0,0,0,0.05); display: flex; flex-direction: column; gap: 16px; }
    
    .control-section-label { font-size: 10px; font-weight: 800; color: #00639b; opacity: 0.6; margin-bottom: 4px; letter-spacing: 0.5px; }
    .control-row { display: flex; flex-direction: column; gap: 6px; }
    .control-row label { font-size: 11px; font-weight: 600; text-transform: uppercase; color: var(--text-muted); }
    .setting-group .group-label { display: block; font-size: 11px; font-weight: 700; margin-bottom: 8px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; } 

    .width-slider { width: 100%; cursor: pointer; height: 6px; border-radius: 3px; accent-color: #00639b; }
    
    .action-row { display: flex; gap: 8px; margin-top: 4px; }
    .action-btn { flex: 1; padding: 8px; border-radius: 6px; border: none; font-size: 12px; font-weight: 500; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; transition: background 0.2s; }
    .action-btn.copy { background: rgba(0,0,0,0.05); color: var(--text-main); }
    .action-btn.copy:hover { background: rgba(0,0,0,0.1); }
    .action-btn.delete { background: rgba(255, 59, 48, 0.1); color: #ff3b30; }
    .action-btn.delete:hover { background: rgba(255, 59, 48, 0.2); }

    /* Duplicate Toggle styles just for visibility button in header */
    .toggle-switch { width: 44px; height: 24px; background: #e0e0e0; border-radius: 20px; position: relative; cursor: pointer; border: none; transition: background 0.3s; }
    .toggle-switch.active { background: #00639b; }
    .toggle-knob { width: 20px; height: 20px; background: #fff; border-radius: 50%; position: absolute; top: 2px; left: 2px; transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1); box-shadow: 0 2px 4px rgba(0,0,0,0.15); }
    .toggle-switch.active .toggle-knob { transform: translateX(20px); }

    :global(body.dark-mode) .control-section-label { color: #64b5f6; opacity: 0.8; }
    :global(body.dark-mode) .dataset-card { background: rgba(255,255,255,0.05); }
    :global(body.dark-mode) .dataset-controls { background: rgba(0,0,0,0.2); border-top-color: #333; }
    :global(body.dark-mode) .color-dot { border-color: #333; }
    :global(body.dark-mode) .toggle-switch { background: #444; }
    :global(body.dark-mode) .toggle-switch.active { background: #00639b; }
</style>