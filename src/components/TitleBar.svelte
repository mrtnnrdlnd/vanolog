<script lang="ts">
    import { uiStore } from '../lib/stores/ui.svelte';
    import { CONFIG } from '../lib/config/constants';

    let { onToggleSettings } = $props<{ onToggleSettings: () => void }>();
</script>

<div class="title-bar" style:height="{CONFIG.titleBarHeight}px">
    <div class="left">
        <h1 class="app-title">Kalender</h1>
    </div>
    
    <button class="settings-btn" onclick={onToggleSettings} aria-label="Inställningar">
        <svg class="sync-ring {uiStore.syncStatus}" viewBox="0 0 36 36">
            <path class="ring-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
            <path class="ring-indicator" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
        </svg>

        <svg class="menu-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
    </button>
</div>

<style>
    .title-bar {
        position: fixed; top: 0; left: 0; right: 0;
        background: rgba(255,255,255,0.95);
        backdrop-filter: blur(10px);
        border-bottom: 1px solid rgba(0,0,0,0.05);
        display: flex; align-items: center; justify-content: space-between;
        padding: 0 16px; z-index: 200;
    }
    .app-title { font-size: 18px; font-weight: 700; color: #333; margin: 0; }
    
    .settings-btn {
        position: relative; width: 36px; height: 36px;
        background: transparent; border: none; padding: 0;
        cursor: pointer; color: #555;
        
        /* Centrera absolut */
        display: grid; place-items: center;
    }

    .menu-icon {
        position: relative; z-index: 2; /* Ovanpå ringen */
        display: block; /* Tar bort extra inline-utrymme */
    }

    /* --- Sync Ring Styles --- */
    .sync-ring {
        position: absolute; inset: 0; transform: rotate(-90deg);
        pointer-events: none; width: 100%; height: 100%;
    }
    .ring-bg { fill: none; stroke: rgba(0,0,0,0.08); stroke-width: 3; }
    
    .ring-indicator { 
        fill: none; stroke-width: 3; stroke-linecap: round;
        stroke-dasharray: 100; 
        transition: stroke-dashoffset 0.5s, stroke 0.3s;
    }
    
    /* Status Styles */
    .sync-ring.idle .ring-indicator { stroke: #4caf50; stroke-dashoffset: 0; }
    .sync-ring.working .ring-indicator {
        stroke: #00639b; stroke-dashoffset: 75; 
        transform-origin: center; animation: spin 1s linear infinite;
    }
    .sync-ring.error .ring-indicator { stroke: #d32f2f; stroke-dashoffset: 0; }

    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
</style>