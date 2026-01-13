<script lang="ts">
    import Grid from './components/Grid.svelte';
    import ResizeHandle from './components/ResizeHandle.svelte';
    import Settings from './components/Settings.svelte';
    import InputModal from './components/InputModal.svelte';
    import YAxis from './components/YAxis.svelte';
    import TitleBar from './components/TitleBar.svelte';
    
    import { dataStore } from './lib/stores/data.svelte';
    import { uiStore } from './lib/stores/ui.svelte';
    import { layoutStore } from './lib/stores/layout.svelte';
    import { CONFIG } from './lib/config/constants';

    dataStore.init();

    // 1. Dark Mode Effekt (CSS-klass på body)
    $effect(() => {
        if (layoutStore.darkMode) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
    });

    // 2. Spar-Effekt (LocalStorage)
    // Denna körs automatiskt varje gång någon av dessa variabler ändras
    $effect(() => {
        const settingsToSave = {
            rows: layoutStore.rows,
            graphMode: layoutStore.graphMode,
            graphType: layoutStore.graphType,
            showGraph: layoutStore.showGraph,
            showHeatmap: layoutStore.showHeatmap,
            showMonthLines: layoutStore.showMonthLines,
            darkMode: layoutStore.darkMode,
            heatmapHue: layoutStore.heatmapHue,
            manualMin: layoutStore.manualMin,
            manualMax: layoutStore.manualMax
        };
        localStorage.setItem('calendar_settings_v1', JSON.stringify(settingsToSave));
    });
</script>

{#if uiStore.loading}
    <div id="loader-wrapper">
        <div class="loader-content">
            <div class="spinner"></div>
            <p>Hämtar data</p>
        </div>
    </div>
{:else}
    <TitleBar onToggleSettings={() => uiStore.toggleSettings()} />
    <Settings bind:isOpen={uiStore.settingsOpen} />
    <YAxis />
    
    <div class="main-content" style:margin-top="{CONFIG.titleBarHeight}px">
        <Grid />
    </div>
    
    <ResizeHandle />
    <InputModal />
{/if}

<style>
    #loader-wrapper { position: fixed; inset: 0; background: var(--bg-body); z-index: 9999; display: flex; justify-content: center; align-items: center; color: var(--text-main); }
    .loader-content { display: flex; flex-direction: column; align-items: center; }
    .spinner { width: 40px; height: 40px; border: 4px solid rgba(0,0,0,0.1); border-top: 4px solid #00639b; border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 15px; }
    @keyframes spin { 100% { transform: rotate(360deg); } }
    .main-content { position: relative; }
</style>