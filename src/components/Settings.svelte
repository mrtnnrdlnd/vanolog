<script lang="ts">
    import { fade, fly, slide } from 'svelte/transition';
    import { quintOut } from 'svelte/easing';
    import { layoutStore } from '../lib/stores/layout.svelte';
    import { dataStore } from '../lib/stores/data.svelte';
    import { CONFIG } from '../lib/config/constants';
    import type { Snippet } from 'svelte';
    
    // Importera komponenterna
    import DatasetCard from './settings/DatasetCard.svelte';
    import Toggle from './settings/controls/Toggle.svelte';
    import RangeSlider from './settings/controls/RangeSlider.svelte';

    let { isOpen = $bindable(false) } = $props();
    let expandedSection = $state<string | null>('datasets');
    let editingDatasetId = $state<string | null>(null);

    const TRANS_PANEL = { x: 320, duration: 400, opacity: 1, easing: quintOut };
    
    function close() { isOpen = false; }
    function toggleSection(id: string) { expandedSection = expandedSection === id ? null : id; }
    
    function handleReset() {
        if(confirm('Är du säker på att du vill återställa alla inställningar?')) {
            layoutStore.resetSettings();
            close();
        }
    }
</script>

{#snippet section(id: string, title: string, content: Snippet)}
    <div class="section-item">
        <button class="section-header {expandedSection === id ? 'active' : ''}" onclick={() => toggleSection(id)}>
            <span class="section-title">{title}</span>
            <div class="chevron-box" style:transform={expandedSection === id ? 'rotate(180deg)' : 'rotate(0deg)'}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
            </div>
        </button>
        {#if expandedSection === id}
            <div class="section-body" transition:slide={{duration:300, easing:quintOut}}>
                <div class="section-content">{@render content()}</div>
            </div>
        {/if}
    </div>
{/snippet}

{#if isOpen}
    <div 
        class="settings-backdrop" 
        style:top="{CONFIG.titleBarHeight}px" 
        onclick={close} 
        role="button" 
        tabindex="0" 
        onkeydown={(e) => e.key === 'Escape' && close()} 
        transition:fade={{ duration: 200 }}
    >
        <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
        <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
        <div 
            class="settings-panel" 
            onclick={(e) => e.stopPropagation()} 
            role="document" 
            tabindex="0" 
            onkeydown={(e) => e.stopPropagation()} 
            transition:fly={TRANS_PANEL}
        >
            <div class="panel-scroll-area">
                
                {#snippet datasetsContent()}
                    <div class="content-stack">
                        <p class="help-text" style:text-align="left" style:margin-bottom="8px">
                            Konfigurera grafer och markörer.
                        </p>
                        {#each dataStore.datasets as ds, i (ds.id)}
                            <DatasetCard 
                                bind:dataset={dataStore.datasets[i]} 
                                isEditing={editingDatasetId === ds.id}
                                onToggleEdit={() => editingDatasetId = editingDatasetId === ds.id ? null : ds.id}
                            />
                        {/each}
                    </div>
                {/snippet}
                {@render section('datasets', 'Datakällor', datasetsContent)}


                {#snippet appearanceContent()}
                    <div class="content-stack">
                        <Toggle label="Dark Mode" checked={layoutStore.darkMode} onChange={(v) => layoutStore.darkMode = v} />
                        <Toggle label="Heatmap" checked={layoutStore.showHeatmap} onChange={(v) => layoutStore.showHeatmap = v} />
                        <Toggle label="Månadsgränser" checked={layoutStore.showMonthLines} onChange={(v) => layoutStore.showMonthLines = v} />
                        
                        <div class="setting-group" style:margin-top="12px">
                            <span class="group-label">Rader per kolumn ({layoutStore.rows})</span>
                            
                            <RangeSlider 
                                min={4} 
                                max={31} 
                                step={1} 
                                bind:value={layoutStore.rows} 
                            />
                            
                            <p class="help-text" style:text-align="left; margin-top:8px">
                                Standard är 7 (en vecka).
                            </p>
                        </div>
                        
                        </div>
                {/snippet}
                {@render section('appearance', 'Utseende', appearanceContent)}

                {#snippet graphContent()}
                    <div class="content-stack">
                        <Toggle label="Visa Graf" checked={layoutStore.showGraph} onChange={(v) => layoutStore.showGraph = v} />

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
                        <button class="danger-btn" onclick={handleReset}>Återställ standard</button>
                    </div>
                {/snippet}
                {@render section('system', 'System', systemContent)}

            </div>
        </div>
    </div>
{/if}

<style>
    .settings-backdrop { position: fixed; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.4); backdrop-filter: blur(2px); z-index: 900; display: flex; justify-content: flex-end; }
    .settings-panel { background: var(--bg-card, #fff); width: 320px; height: 100%; box-shadow: -10px 0 40px rgba(0,0,0,0.15); display: flex; flex-direction: column; color: var(--text-main, #333); border-left: 1px solid var(--border-color); }
    .panel-scroll-area { flex: 1; overflow-y: auto; padding: 10px 0; display: flex; flex-direction: column; }
    
    .section-item { border-bottom: 1px solid var(--border-color, #f0f0f0); }
    .section-header { width: 100%; display: flex; align-items: center; justify-content: space-between; padding: 18px 24px; background: transparent; border: none; cursor: pointer; color: var(--text-main); font-size: 15px; font-weight: 500; transition: background 0.2s; }
    .section-header:hover { background: var(--bg-input, #fafafa); }
    .section-header.active { background: var(--bg-input, #f9f9f9); color: #00639b; font-weight: 600; }
    .section-title { font-size: 16px; }
    .chevron-box { transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1); color: var(--text-muted); opacity: 0.6; }
    .section-header.active .chevron-box { opacity: 1; color: #00639b; }
    .section-body { overflow: hidden; background: var(--bg-input, #fafafa); }
    .section-content { padding: 24px 24px; box-shadow: inset 0 4px 6px -4px rgba(0,0,0,0.05); }
    .content-stack { display: flex; flex-direction: column; gap: 24px; }
    
    .setting-group .group-label { display: block; font-size: 11px; font-weight: 700; margin-bottom: 8px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; } 

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
    :global(body.dark-mode) .axis-input { background: rgba(255,255,255,0.05); }
    :global(body.dark-mode) .axis-input:focus { border-color: #4fc3f7; box-shadow: 0 0 0 3px rgba(79, 195, 247, 0.15); }
</style>