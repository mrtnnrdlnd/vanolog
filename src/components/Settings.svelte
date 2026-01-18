<script lang="ts">
    import { fade, fly, slide } from 'svelte/transition';
    import { quintOut } from 'svelte/easing';
    import { layoutStore } from '../lib/stores/layout.svelte';
    import { dataStore } from '../lib/stores/data.svelte';
    import { CONFIG } from '../lib/config/constants';
    import type { Snippet } from 'svelte';
    import type { GraphMode, GraphType } from '../lib/types';

    let { isOpen = $bindable(false) } = $props();
    let expandedSection = $state<string | null>('datasets'); // Börja med Datakällor öppet
    let editingDatasetId = $state<string | null>(null);

    const TRANS_SLIDE = { duration: 300, easing: quintOut };
    const TRANS_PANEL = { x: 320, duration: 400, opacity: 1, easing: quintOut };
    
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

    function close() { isOpen = false; }
    
    function toggleSection(id: string) {
        expandedSection = expandedSection === id ? null : id;
    }

    function toggleDatasetEdit(id: string) {
        editingDatasetId = editingDatasetId === id ? null : id;
    }

    function handleReset() {
        if(confirm('Är du säker på att du vill återställa alla inställningar?')) {
            layoutStore.resetSettings();
            close();
        }
    }

    function getGradient(isDark: boolean) {
        const steps = [0, 60, 120, 180, 240, 300, 360];
        const s = isDark ? '50%' : '80%';
        const stops = steps.map(h => `hsl(${h}, ${s}, 50%)`).join(', ');
        return `linear-gradient(to right, ${stops})`;
    }
</script>

{#snippet section(id: string, title: string, content: Snippet)}
    <div class="section-item">
        <button 
            class="section-header {expandedSection === id ? 'active' : ''}" 
            onclick={() => toggleSection(id)}
        >
            <span class="section-title">{title}</span>
            <div class="chevron-box" style:transform={expandedSection === id ? 'rotate(180deg)' : 'rotate(0deg)'}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
            </div>
        </button>

        {#if expandedSection === id}
            <div class="section-body" transition:slide={TRANS_SLIDE}>
                <div class="section-content">
                    {@render content()}
                </div>
            </div>
        {/if}
    </div>
{/snippet}

{#snippet toggleRow(label: string, checked: boolean, onChange: (v: boolean) => void)}
    <div class="setting-row">
        <span class="setting-label">{label}</span>
        <button 
            class="toggle-switch {checked ? 'active' : ''}" 
            onclick={() => onChange(!checked)}
            role="switch" aria-checked={checked} aria-label={label}
        >
            <div class="toggle-knob"></div>
        </button>
    </div>
{/snippet}

{#snippet selector(
    label: string, 
    options: { label: string, value: any, fullWidth?: boolean }[], 
    currentValue: any, 
    onChange: (val: any) => void,
    layout: 'flex' | 'grid' = 'flex'
)}
    <div class="setting-group">
        <span class="group-label">{label}</span>
        <div class="selector-container {layout}">
            {#each options as opt}
                <button 
                    class:active={currentValue === opt.value} 
                    class:full-width={opt.fullWidth}
                    onclick={() => onChange(opt.value)}
                >
                    {opt.label}
                </button>
            {/each}
        </div>
    </div>
{/snippet}


{#if isOpen}
    <div 
        class="settings-backdrop" style:top="{CONFIG.titleBarHeight}px"
        onclick={close} role="button" tabindex="0" 
        onkeydown={(e) => e.key === 'Escape' && close()} transition:fade={{ duration: 200 }}
    >
        <div 
            class="settings-panel" onclick={(e) => e.stopPropagation()} 
            role="document" tabindex="0" onkeydown={(e) => { e.stopPropagation(); }}
            transition:fly={TRANS_PANEL}
        >
            <div class="panel-scroll-area">
                
                {#snippet datasetsContent()}
                    <div class="content-stack">
                        <p class="help-text" style:text-align="left" style:margin-bottom="8px">
                            Konfigurera grafer. Du kan lägga till flera vyer av samma data.
                        </p>

                        {#each dataStore.datasets as ds}
                            <div class="dataset-card">
                                <div class="dataset-row">
                                    <button class="expand-btn" onclick={() => toggleDatasetEdit(ds.id)}>
                                        <div class="color-dot" style:background={ds.color}></div>
                                        <div style="display:flex; flex-direction:column; gap:2px;">
                                            <span class="ds-name">{ds.name}</span>
                                            <span class="ds-meta">
                                                {ds.graphType === 'line' ? 'Linje' : 'Stapel'} • 
                                                {ds.graphMode.toUpperCase()}
                                            </span>
                                        </div>
                                    </button>
                                    
                                    <button 
                                        class="toggle-switch {ds.isVisible ? 'active' : ''}" 
                                        onclick={() => dataStore.toggleDataset(ds.id)}
                                    >
                                        <div class="toggle-knob"></div>
                                    </button>
                                </div>

                                {#if editingDatasetId === ds.id}
                                    <div class="dataset-controls" transition:slide={{duration: 200, easing: quintOut}}>
                                        
                                        {@render selector('Typ', GRAPH_TYPES, ds.graphType, (v) => ds.graphType = v, 'flex')}
                                        {@render selector('Beräkning', CALC_MODES, ds.graphMode, (v) => ds.graphMode = v, 'grid')}

                                        <div class="control-row">
                                            <label>Färg</label>
                                            <div class="color-input-wrapper">
                                                <input type="color" bind:value={ds.color} />
                                                <span class="color-code">{ds.color}</span>
                                            </div>
                                        </div>

                                        <div class="control-row">
                                            <label>Tjocklek ({ds.width}px)</label>
                                            <input 
                                                type="range" min="0.5" max="8" step="0.5" 
                                                bind:value={ds.width} class="width-slider"
                                            />
                                        </div>
                                        
                                        <div class="action-row">
                                            <button class="action-btn copy" onclick={() => dataStore.cloneDataset(ds.id)} title="Duplicera">
                                                <span>📋</span> Duplicera
                                            </button>
                                            {#if dataStore.datasets.length > 1}
                                                <button class="action-btn delete" onclick={() => dataStore.removeDataset(ds.id)} title="Ta bort">
                                                    <span>🗑️</span> Ta bort
                                                </button>
                                            {/if}
                                        </div>
                                    </div>
                                {/if}
                            </div>
                        {/each}
                    </div>
                {/snippet}
                {@render section('datasets', 'Datakällor', datasetsContent)}


                {#snippet appearanceContent()}
                    <div class="content-stack">
                        {@render toggleRow("Dark Mode", layoutStore.darkMode, (v) => layoutStore.darkMode = v)}
                        {@render toggleRow("Heatmap", layoutStore.showHeatmap, (v) => layoutStore.showHeatmap = v)}
                        {@render toggleRow("Månadsgränser", layoutStore.showMonthLines, (v) => layoutStore.showMonthLines = v)}
                        
                        {#if layoutStore.showHeatmap}
                            <div class="setting-group">
                                <span class="group-label">Färgton (Heatmap)</span>
                                <div class="hue-wrapper">
                                    <input 
                                        id="hue-slider" type="range" min="0" max="360" 
                                        bind:value={layoutStore.heatmapHue}
                                        class="hue-slider"
                                        style:background={getGradient(layoutStore.darkMode)}
                                    />
                                    <div class="hue-preview" style:background="hsl({layoutStore.heatmapHue}, 60%, 50%)"></div>
                                </div>
                            </div>
                        {/if}
                    </div>
                {/snippet}
                {@render section('appearance', 'Utseende', appearanceContent)}

                {#snippet graphContent()}
                    <div class="content-stack">
                        {@render toggleRow("Visa Graf", layoutStore.showGraph, (v) => layoutStore.showGraph = v)}

                        {#if layoutStore.showGraph}
                            <div class="setting-group">
                                <span class="group-label">Y-Axel (Manuell skala)</span>
                                <div class="axis-inputs">
                                    <div class="input-col">
                                        <span class="input-label">Min</span>
                                        <input 
                                            type="number" class="axis-input"
                                            value={layoutStore.manualMin ?? ''}
                                            placeholder={Math.round(layoutStore.dataMin).toString()}
                                            oninput={(e) => {
                                                const val = e.currentTarget.value;
                                                layoutStore.manualMin = val === '' ? null : Number(val);
                                            }}
                                        />
                                    </div>
                                    <div class="input-col">
                                        <span class="input-label">Max</span>
                                        <input 
                                            type="number" class="axis-input"
                                            value={layoutStore.manualMax ?? ''}
                                            placeholder={Math.round(layoutStore.dataMax).toString()}
                                            oninput={(e) => {
                                                const val = e.currentTarget.value;
                                                layoutStore.manualMax = val === '' ? null : Number(val);
                                            }}
                                        />
                                    </div>
                                </div>
                                <p class="help-text" style:margin-top="6px">Lämna tomt för automatisk skala.</p>
                            </div>
                        {/if}
                    </div>
                {/snippet}
                {@render section('graph', 'Graf & Data', graphContent)}


                {#snippet systemContent()}
                    <div class="content-stack">
                        <button class="danger-btn" onclick={handleReset}>
                            Återställ standard
                        </button>
                    </div>
                {/snippet}
                {@render section('system', 'System', systemContent)}

            </div>
        </div>
    </div>
{/if}

<style>
    /* ... (Behåll existerande CSS) ... */

    /* Uppdaterad stil för dataset-kort */
    .dataset-card {
        background: rgba(0,0,0,0.03);
        border-radius: 8px;
        overflow: hidden;
        border: 1px solid transparent;
        transition: background 0.2s;
    }
    .dataset-card:hover { background: rgba(0,0,0,0.06); }

    .dataset-row { 
        display: flex; justify-content: space-between; align-items: center; 
        padding: 8px 10px;
    }
    
    .expand-btn {
        display: flex; align-items: center; gap: 10px;
        background: transparent; border: none; cursor: pointer;
        font-size: 14px; font-weight: 500; color: var(--text-main);
        flex: 1; text-align: left;
    }
    .ds-name { font-weight: 600; font-size: 13px; }
    .ds-meta { font-size: 10px; color: var(--text-muted); opacity: 0.8; }

    .color-dot {
        width: 14px; height: 14px; border-radius: 50%;
        border: 2px solid #fff; 
        box-shadow: 0 1px 3px rgba(0,0,0,0.2);
    }
    
    .dataset-controls {
        padding: 12px;
        background: rgba(0,0,0,0.05);
        border-top: 1px solid rgba(0,0,0,0.05);
        display: flex; flex-direction: column; gap: 16px; /* Lite mer luft */
    }

    .control-row { display: flex; flex-direction: column; gap: 6px; }
    .control-row label { font-size: 11px; font-weight: 600; text-transform: uppercase; color: var(--text-muted); }
    
    .color-input-wrapper { display: flex; align-items: center; gap: 10px; }
    input[type="color"] { border: none; width: 32px; height: 32px; cursor: pointer; background: none; padding: 0; -webkit-appearance: none; }
    input[type="color"]::-webkit-color-swatch-wrapper { padding: 0; }
    input[type="color"]::-webkit-color-swatch { border-radius: 6px; border: 1px solid rgba(0,0,0,0.1); }
    .color-code { font-size: 12px; font-family: monospace; color: var(--text-muted); }
    .width-slider { width: 100%; cursor: pointer; }

    .action-row { display: flex; gap: 8px; margin-top: 4px; }
    .action-btn {
        flex: 1; padding: 8px; border-radius: 6px; border: none;
        font-size: 12px; font-weight: 500; cursor: pointer;
        display: flex; align-items: center; justify-content: center; gap: 6px;
        transition: background 0.2s;
    }
    .action-btn.copy { background: rgba(0,0,0,0.05); color: var(--text-main); }
    .action-btn.copy:hover { background: rgba(0,0,0,0.1); }
    
    .action-btn.delete { background: rgba(255, 59, 48, 0.1); color: #ff3b30; }
    .action-btn.delete:hover { background: rgba(255, 59, 48, 0.2); }

    /* CSS Fixar */
    .settings-backdrop {
        position: fixed; left: 0; right: 0; bottom: 0;
        background: rgba(0, 0, 0, 0.4); backdrop-filter: blur(2px);
        z-index: 900; display: flex; justify-content: flex-end;
    }
    .settings-panel {
        background: var(--bg-card, #fff); width: 320px; height: 100%;
        box-shadow: -10px 0 40px rgba(0,0,0,0.15); display: flex; flex-direction: column;
        color: var(--text-main, #333); border-left: 1px solid var(--border-color);
    }
    .panel-scroll-area { flex: 1; overflow-y: auto; padding: 10px 0; display: flex; flex-direction: column; }
    .section-item { border-bottom: 1px solid var(--border-color, #f0f0f0); }
    .section-header {
        width: 100%; display: flex; align-items: center; justify-content: space-between;
        padding: 18px 24px; background: transparent; border: none; cursor: pointer;
        color: var(--text-main); font-size: 15px; font-weight: 500; transition: background 0.2s;
    }
    .section-header:hover { background: var(--bg-input, #fafafa); }
    .section-header.active { background: var(--bg-input, #f9f9f9); color: #00639b; font-weight: 600; }
    .chevron-box { transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1); color: var(--text-muted); opacity: 0.6; }
    .section-header.active .chevron-box { opacity: 1; color: #00639b; }
    .section-body { overflow: hidden; background: var(--bg-input, #fafafa); }
    .section-content { padding: 24px 24px; box-shadow: inset 0 4px 6px -4px rgba(0,0,0,0.05); }
    .content-stack { display: flex; flex-direction: column; gap: 24px; }
    .setting-row { display: flex; justify-content: space-between; align-items: center; }
    .setting-label { font-size: 14px; font-weight: 500; color: var(--text-main); }
    .setting-group .group-label { display: block; font-size: 11px; font-weight: 700; margin-bottom: 8px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; } 
    .toggle-switch { width: 44px; height: 24px; background: #e0e0e0; border-radius: 20px; position: relative; cursor: pointer; border: none; transition: background 0.3s; }
    .toggle-switch.active { background: #00639b; }
    .toggle-knob { width: 20px; height: 20px; background: #fff; border-radius: 50%; position: absolute; top: 2px; left: 2px; transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1); box-shadow: 0 2px 4px rgba(0,0,0,0.15); }
    .toggle-switch.active .toggle-knob { transform: translateX(20px); }
    .selector-container { background: rgba(0,0,0,0.05); border-radius: 10px; padding: 4px; }
    .selector-container.flex { display: flex; }
    .selector-container.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 3px; }
    .selector-container button { border: none; background: transparent; font-size: 13px; font-weight: 500; color: var(--text-muted); border-radius: 7px; cursor: pointer; transition: all 0.2s; }
    .selector-container.flex button { flex: 1; padding: 8px 0; }
    .selector-container.grid button { padding: 10px 0; }
    .selector-container.grid button.full-width { grid-column: 1 / -1; margin-top: 2px; }
    .selector-container button:hover { background: rgba(255,255,255,0.4); }
    .selector-container button.active { background: var(--bg-card, #fff); box-shadow: 0 2px 6px rgba(0,0,0,0.08); color: #00639b; font-weight: 600; }
    .hue-wrapper { display: flex; align-items: center; gap: 12px; }
    .hue-slider { flex: 1; -webkit-appearance: none; appearance: none; height: 6px; border-radius: 3px; outline: none; cursor: pointer; }
    .hue-slider::-webkit-slider-thumb { -webkit-appearance: none; width: 18px; height: 18px; border-radius: 50%; background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.3); border: 1px solid rgba(0,0,0,0.05); transform: scale(1); transition: transform 0.1s; }
    .hue-preview { width: 24px; height: 24px; border-radius: 50%; border: 1px solid rgba(0,0,0,0.1); }
    .danger-btn { width: 100%; padding: 12px; border-radius: 10px; border: 1px solid transparent; background: rgba(255, 59, 48, 0.1); color: #ff3b30; font-weight: 600; font-size: 14px; cursor: pointer; transition: background 0.2s; }
    .danger-btn:hover { background: rgba(255, 59, 48, 0.2); }
    .help-text { font-size: 12px; color: var(--text-muted); margin: 0; text-align: center; opacity: 0.8; }
    .axis-inputs { display: flex; gap: 12px; }
    .input-col { flex: 1; display: flex; flex-direction: column; gap: 4px; }
    .input-label { font-size: 11px; color: var(--text-muted); font-weight: 500; margin-left: 2px; }
    .axis-input { width: 100%; box-sizing: border-box; padding: 10px; border-radius: 8px; border: 1px solid var(--border-color); background: var(--bg-card); color: var(--text-main); font-size: 14px; font-weight: 500; outline: none; transition: all 0.2s; appearance: textfield; -moz-appearance: textfield; }
    .axis-input:focus { border-color: #00639b; box-shadow: 0 0 0 3px rgba(0, 99, 155, 0.1); }
    .axis-input::placeholder { color: var(--text-muted); opacity: 0.5; }

    :global(body.dark-mode) .section-item { border-color: #333; }
    :global(body.dark-mode) .section-header:hover { background: #252525; }
    :global(body.dark-mode) .section-header.active { background: #252525; color: #64b5f6; }
    :global(body.dark-mode) .section-header.active .chevron-box { color: #64b5f6; }
    :global(body.dark-mode) .section-body { background: #1e1e1e; }
    :global(body.dark-mode) .toggle-switch { background: #444; }
    :global(body.dark-mode) .toggle-switch.active { background: #00639b; }
    :global(body.dark-mode) .selector-container { background: rgba(255,255,255,0.1); }
    :global(body.dark-mode) .axis-input { background: rgba(255,255,255,0.05); }
    :global(body.dark-mode) .axis-input:focus { border-color: #4fc3f7; box-shadow: 0 0 0 3px rgba(79, 195, 247, 0.15); }
    :global(body.dark-mode) .dataset-card { background: rgba(255,255,255,0.05); }
    :global(body.dark-mode) .dataset-controls { background: rgba(0,0,0,0.2); border-top-color: #333; }
    :global(body.dark-mode) .color-dot { border-color: #333; }
</style>