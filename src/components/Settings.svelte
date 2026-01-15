<script lang="ts">
    import { fade, fly, slide } from 'svelte/transition';
    import { quintOut } from 'svelte/easing';
    import { layoutStore } from '../lib/stores/layout.svelte';
    import { CONFIG } from '../lib/config/constants';
    import type { Snippet } from 'svelte';

    let { isOpen = $bindable(false) } = $props();

    let expandedSection = $state<string | null>('appearance');

    function close() { 
        isOpen = false; 
    }

    function toggleSection(id: string) {
        expandedSection = expandedSection === id ? null : id;
    }

    function handleReset() {
        if(confirm('Är du säker på att du vill återställa alla inställningar?')) {
            layoutStore.resetSettings();
            close();
        }
    }

    function getGradient(isDark: boolean) {
        return `linear-gradient(to right, 
            hsl(0, ${isDark?50:80}%, 50%), 
            hsl(60, ${isDark?50:80}%, 50%), 
            hsl(120, ${isDark?50:80}%, 50%), 
            hsl(180, ${isDark?50:80}%, 50%), 
            hsl(240, ${isDark?50:80}%, 50%), 
            hsl(300, ${isDark?50:80}%, 50%), 
            hsl(360, ${isDark?50:80}%, 50%))`;
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
            <div class="section-body" transition:slide={{ duration: 300, easing: quintOut }}>
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
            role="switch" 
            aria-checked={checked}
            aria-label={label}
        >
            <div class="toggle-knob"></div>
        </button>
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
        <div 
            class="settings-panel" 
            onclick={(e) => e.stopPropagation()} 
            role="document" 
            tabindex="0" 
            onkeydown={() => {}}
            transition:fly={{ x: 320, duration: 400, opacity: 1, easing: quintOut }}
        >
            <div class="panel-scroll-area">
                
                {#snippet appearanceContent()}
                    <div class="content-stack">
                        {@render toggleRow("Dark Mode", layoutStore.darkMode, (v) => layoutStore.darkMode = v)}
                        {@render toggleRow("Heatmap", layoutStore.showHeatmap, (v) => layoutStore.showHeatmap = v)}
                        {@render toggleRow("Månadsgränser", layoutStore.showMonthLines, (v) => layoutStore.showMonthLines = v)}
                        
                        {#if layoutStore.showHeatmap}
                            <div class="setting-group">
                                <label for="hue-slider">Färgton</label>
                                <div class="hue-wrapper">
                                    <input 
                                        id="hue-slider"
                                        type="range" min="0" max="360" 
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
                                <label>Graftyp</label>
                                <div class="segment-control">
                                    <button class:active={layoutStore.graphType === 'line'} onclick={() => layoutStore.graphType = 'line'}>Linje</button>
                                    <button class:active={layoutStore.graphType === 'bar'} onclick={() => layoutStore.graphType = 'bar'}>Stapel</button>
                                </div>
                            </div>

                            <div class="setting-group">
                                <label>Beräkning</label>
                                <div class="segment-control">
                                    <button class:active={layoutStore.graphMode === 'avg'} onclick={() => layoutStore.graphMode = 'avg'}>Snitt</button>
                                    <button class:active={layoutStore.graphMode === 'median'} onclick={() => layoutStore.graphMode = 'median'}>Median</button>
                                    <button class:active={layoutStore.graphMode === 'min'} onclick={() => layoutStore.graphMode = 'min'}>Min</button>
                                    <button class:active={layoutStore.graphMode === 'max'} onclick={() => layoutStore.graphMode = 'max'}>Max</button>
                                </div>
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
                        <p class="help-text">Detta raderar inte din data.</p>
                    </div>
                {/snippet}
                {@render section('system', 'System', systemContent)}

            </div>
        </div>
    </div>
{/if}

<style>
    .settings-backdrop {
        position: fixed; left: 0; right: 0; bottom: 0;
        background: rgba(0, 0, 0, 0.4); 
        backdrop-filter: blur(2px);
        z-index: 900; 
        display: flex; justify-content: flex-end;
    }
    
    .settings-panel {
        background: var(--bg-card, #fff);
        width: 320px; height: 100%;
        box-shadow: -10px 0 40px rgba(0,0,0,0.15);
        display: flex; flex-direction: column;
        color: var(--text-main, #333);
        border-left: 1px solid var(--border-color);
    }

    .panel-scroll-area {
        flex: 1; overflow-y: auto; padding: 10px 0;
        display: flex; flex-direction: column; 
    }

    /* List Items */
    .section-item { border-bottom: 1px solid var(--border-color, #f0f0f0); }

    .section-header {
        width: 100%; display: flex; align-items: center; justify-content: space-between;
        padding: 18px 24px; /* Lite mer padding nu när ikonerna är borta */
        background: transparent; border: none; cursor: pointer;
        color: var(--text-main); font-size: 15px; font-weight: 500;
        transition: background 0.2s;
    }
    .section-header:hover { background: var(--bg-input, #fafafa); }
    .section-header.active { background: var(--bg-input, #f9f9f9); color: #00639b; font-weight: 600; }

    .section-title { font-size: 16px; }

    .chevron-box { 
        transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1); 
        color: var(--text-muted); opacity: 0.6; 
    }
    .section-header.active .chevron-box { opacity: 1; color: #00639b; }

    /* Content */
    .section-body { overflow: hidden; background: var(--bg-input, #fafafa); }
    .section-content { padding: 24px 24px; box-shadow: inset 0 4px 6px -4px rgba(0,0,0,0.05); }
    .content-stack { display: flex; flex-direction: column; gap: 24px; }

    /* Controls */
    .setting-row { display: flex; justify-content: space-between; align-items: center; }
    .setting-label { font-size: 14px; font-weight: 500; color: var(--text-main); }
    .setting-group label { display: block; font-size: 11px; font-weight: 700; margin-bottom: 8px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; }

    .toggle-switch { width: 44px; height: 24px; background: #e0e0e0; border-radius: 20px; position: relative; cursor: pointer; border: none; transition: background 0.3s; }
    .toggle-switch.active { background: #00639b; }
    .toggle-knob { width: 20px; height: 20px; background: #fff; border-radius: 50%; position: absolute; top: 2px; left: 2px; transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1); box-shadow: 0 2px 4px rgba(0,0,0,0.15); }
    .toggle-switch.active .toggle-knob { transform: translateX(20px); }

    .segment-control { display: flex; background: rgba(0,0,0,0.05); padding: 4px; border-radius: 10px; }
    .segment-control button { flex: 1; border: none; background: transparent; padding: 8px 0; font-size: 13px; border-radius: 7px; cursor: pointer; color: var(--text-muted); font-weight: 500; transition: all 0.2s; }
    .segment-control button.active { background: var(--bg-card, #fff); box-shadow: 0 2px 6px rgba(0,0,0,0.08); color: #00639b; font-weight: 600; }

    .hue-wrapper { display: flex; align-items: center; gap: 12px; }
    .hue-slider { flex: 1; -webkit-appearance: none; height: 6px; border-radius: 3px; outline: none; cursor: pointer; }
    .hue-slider::-webkit-slider-thumb { -webkit-appearance: none; width: 18px; height: 18px; border-radius: 50%; background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.3); border: 1px solid rgba(0,0,0,0.05); transform: scale(1); transition: transform 0.1s; }
    .hue-preview { width: 24px; height: 24px; border-radius: 50%; border: 1px solid rgba(0,0,0,0.1); }

    .danger-btn { width: 100%; padding: 12px; border-radius: 10px; border: 1px solid transparent; background: rgba(255, 59, 48, 0.1); color: #ff3b30; font-weight: 600; font-size: 14px; cursor: pointer; transition: background 0.2s; }
    .danger-btn:hover { background: rgba(255, 59, 48, 0.2); }
    .help-text { font-size: 12px; color: var(--text-muted); margin: 0; text-align: center; opacity: 0.8; }

    :global(body.dark-mode) .section-item { border-color: #333; }
    :global(body.dark-mode) .section-header:hover { background: #252525; }
    :global(body.dark-mode) .section-header.active { background: #252525; color: #64b5f6; }
    :global(body.dark-mode) .section-header.active .chevron-box { color: #64b5f6; }
    :global(body.dark-mode) .section-body { background: #1e1e1e; }
    :global(body.dark-mode) .toggle-switch { background: #444; }
    :global(body.dark-mode) .toggle-switch.active { background: #00639b; }
    :global(body.dark-mode) .segment-control { background: rgba(255,255,255,0.1); }
</style>