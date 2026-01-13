<script lang="ts">
    import Grid from './components/Grid.svelte';
    import ResizeHandle from './components/ResizeHandle.svelte';
    import Settings from './components/Settings.svelte';
    import InputModal from './components/InputModal.svelte';
    import YAxis from './components/YAxis.svelte';
    import TitleBar from './components/TitleBar.svelte';
    import { store } from './lib/store.svelte';
    import { CONFIG } from './lib/types';

    let settingsOpen = $state(false);
</script>

{#if store.loading}
    <div id="loader-wrapper">
        <div class="loader-content">
            <div class="spinner"></div>
            <p>Hämtar data</p>
        </div>
    </div>
{:else}
    <TitleBar onToggleSettings={() => settingsOpen = !settingsOpen} />
    
    <Settings bind:isOpen={settingsOpen} />
    
    <YAxis />
    
    <div class="main-content" style:margin-top="{CONFIG.titleBarHeight}px">
        <Grid />
    </div>
    
    <ResizeHandle />
    <InputModal />
{/if}

<style>
    #loader-wrapper { position: fixed; inset: 0; background: #f4f7fa; z-index: 9999; display: flex; justify-content: center; align-items: center; }
    .loader-content { display: flex; flex-direction: column; align-items: center; }
    .spinner { width: 40px; height: 40px; border: 4px solid rgba(0,0,0,0.1); border-top: 4px solid #00639b; border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 15px; }
    @keyframes spin { 100% { transform: rotate(360deg); } }
    
    .main-content {
        /* Margin-top sätts nu inline för att matcha CONFIG */
        position: relative;
    }
</style>