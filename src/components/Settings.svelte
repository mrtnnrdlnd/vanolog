<script lang="ts">
    import { layoutStore } from '../lib/stores/layout.svelte';

    let { isOpen = $bindable(false) } = $props();

    function close() { isOpen = false; }
    
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

    function handleReset() {
        if(confirm('Är du säker på att du vill återställa alla inställningar?')) {
            layoutStore.resetSettings();
        }
    }
</script>

{#if isOpen}
    <div class="settings-overlay" onclick={close} role="button" tabindex="0" onkeydown={(e) => e.key === 'Escape' && close()}>
        <div class="settings-panel" onclick={(e) => e.stopPropagation()} role="dialog" tabindex="-1">
            <div class="header">
                <h2>Inställningar</h2>
                <button class="close-icon" onclick={close}>✕</button>
            </div>
            
            <div class="scroll-area">
                <section>
                    <h3>Utseende</h3>
                    
                    <div class="row">
                        <span>Mörkt läge</span>
                        <button class="toggle-switch" class:checked={layoutStore.darkMode} onclick={() => layoutStore.darkMode = !layoutStore.darkMode}>
                            <div class="knob"></div>
                        </button>
                    </div>

                    <div class="row">
                        <span>Färglägg dagar</span>
                        <button class="toggle-switch" class:checked={layoutStore.showHeatmap} onclick={() => layoutStore.showHeatmap = !layoutStore.showHeatmap}>
                            <div class="knob"></div>
                        </button>
                    </div>

                    {#if layoutStore.showHeatmap}
                        <div class="setting-group">
                            <label>Färgton</label>
                            <div class="hue-wrapper">
                                <input 
                                    type="range" 
                                    min="0" max="360" 
                                    class="hue-slider"
                                    bind:value={layoutStore.heatmapHue}
                                    style:background={getGradient(layoutStore.darkMode)}
                                />
                                <div 
                                    class="hue-preview" 
                                    style:background="hsl({layoutStore.heatmapHue}, 70%, 50%)"
                                ></div>
                            </div>
                        </div>
                    {/if}

                    <div class="row">
                        <span>Visa månadslinjer</span>
                        <button class="toggle-switch" class:checked={layoutStore.showMonthLines} onclick={() => layoutStore.showMonthLines = !layoutStore.showMonthLines}>
                            <div class="knob"></div>
                        </button>
                    </div>
                </section>

                <hr />

                <section>
                    <h3>Graf</h3>
                    <div class="row">
                        <span>Visa graf</span>
                        <button class="toggle-switch" class:checked={layoutStore.showGraph} onclick={() => layoutStore.showGraph = !layoutStore.showGraph}>
                            <div class="knob"></div>
                        </button>
                    </div>
                    
                    {#if layoutStore.showGraph}
                        <div class="setting-group">
                            <label>Typ</label>
                            <div class="segment-control">
                                <button class:active={layoutStore.graphType === 'line'} onclick={() => layoutStore.graphType = 'line'}>Linje</button>
                                <button class:active={layoutStore.graphType === 'bar'} onclick={() => layoutStore.graphType = 'bar'}>Stapel</button>
                            </div>
                        </div>

                        <div class="setting-group">
                            <label>Beräkning</label>
                            <div class="segment-control grid-4">
                                <button class:active={layoutStore.graphMode === 'avg'} onclick={() => layoutStore.graphMode = 'avg'}>Snitt</button>
                                <button class:active={layoutStore.graphMode === 'median'} onclick={() => layoutStore.graphMode = 'median'}>Median</button>
                                <button class:active={layoutStore.graphMode === 'max'} onclick={() => layoutStore.graphMode = 'max'}>Max</button>
                                <button class:active={layoutStore.graphMode === 'min'} onclick={() => layoutStore.graphMode = 'min'}>Min</button>
                            </div>
                            <p class="help-text">
                                {layoutStore.graphMode === 'avg' ? 'Genomsnitt per kolumn.' : 
                                 layoutStore.graphMode === 'median' ? 'Medianvärde per kolumn.' :
                                 layoutStore.graphMode === 'max' ? 'Högsta värdet per kolumn.' : 
                                 'Lägsta värdet per kolumn.'}
                            </p>
                        </div>
                    {/if}
                </section>

                <hr />
                
                <button class="reset-all-btn" onclick={handleReset}>
                    Återställ alla inställningar
                </button>
            </div>
        </div>
    </div>
{/if}

<style>
    .settings-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 2000; display: flex; justify-content: flex-end; backdrop-filter: blur(2px); }
    .settings-panel { width: 300px; background: var(--bg-card, #fff); height: 100%; box-shadow: -5px 0 20px rgba(0,0,0,0.1); display: flex; flex-direction: column; animation: slide-in 0.25s cubic-bezier(0.16, 1, 0.3, 1); color: var(--text-main, #333); }
    .header { padding: 20px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color, #eee); }
    h2 { margin: 0; font-size: 20px; font-weight: 700; }
    h3 { margin: 0 0 15px 0; font-size: 13px; text-transform: uppercase; color: var(--text-muted, #888); letter-spacing: 1px; }
    .scroll-area { padding: 20px; overflow-y: auto; flex: 1; }
    section { margin-bottom: 30px; }
    hr { border: none; border-top: 1px solid var(--border-color, #eee); margin: 0 0 30px 0; }
    .row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; font-size: 15px; font-weight: 500; }
    
    .toggle-switch { width: 44px; height: 24px; border-radius: 12px; background: #e0e0e0; border: none; position: relative; cursor: pointer; transition: background 0.2s; padding: 2px; }
    .toggle-switch .knob { width: 20px; height: 20px; background: #fff; border-radius: 50%; box-shadow: 0 1px 3px rgba(0,0,0,0.2); transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1); }
    .toggle-switch.checked { background: #00639b; }
    .toggle-switch.checked .knob { transform: translateX(20px); }
    
    .setting-group { margin-bottom: 20px; }
    .setting-group label { display: block; font-size: 12px; margin-bottom: 8px; font-weight: 600; }
    
    .segment-control { display: flex; background: var(--bg-input, #f0f0f0); border-radius: 8px; padding: 4px; gap: 4px; }
    .segment-control.grid-4 { display: grid; grid-template-columns: 1fr 1fr; }
    
    .segment-control button {
        flex: 1; border: none; background: transparent; padding: 8px;
        font-size: 13px; font-weight: 500; cursor: pointer; border-radius: 6px;
        color: var(--text-muted, #666); transition: all 0.2s;
    }
    .segment-control button.active { 
        background: var(--bg-card, #fff); 
        box-shadow: 0 2px 5px rgba(0,0,0,0.05); 
        font-weight: 700; color: #00639b; 
    }

    .hue-wrapper { display: flex; align-items: center; gap: 10px; }
    .hue-slider { flex: 1; -webkit-appearance: none; height: 6px; border-radius: 3px; outline: none; }
    .hue-slider::-webkit-slider-thumb { -webkit-appearance: none; width: 18px; height: 18px; border-radius: 50%; background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.3); cursor: pointer; border: 2px solid rgba(0,0,0,0.1); }
    .hue-preview { width: 24px; height: 24px; border-radius: 50%; border: 2px solid rgba(0,0,0,0.1); }

    .help-text { font-size: 11px; color: var(--text-muted, #999); margin-top: 6px; }
    .close-icon { background: none; border: none; font-size: 20px; cursor: pointer; color: var(--text-muted, #999); }

    /* NY STIL FÖR ÅTERSTÄLL-KNAPP */
    .reset-all-btn {
        width: 100%;
        padding: 12px;
        background: rgba(211, 47, 47, 0.1);
        color: #d32f2f;
        border: 1px solid rgba(211, 47, 47, 0.2);
        border-radius: 8px;
        font-weight: 600;
        font-size: 13px;
        cursor: pointer;
        transition: background 0.2s;
    }
    .reset-all-btn:hover {
        background: rgba(211, 47, 47, 0.2);
    }

    @keyframes slide-in { from { transform: translateX(100%); } to { transform: translateX(0); } }
</style>