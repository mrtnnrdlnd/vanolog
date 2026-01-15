<script lang="ts">
    import { uiStore } from '../lib/stores/ui.svelte';
    import { CONFIG } from '../lib/config/constants';

    let { onToggleSettings } = $props<{ onToggleSettings: () => void }>();

    // State för att hålla koll på om vi ska fada ut ringen
    let isFaded = $state(false);
    let fadeTimer: ReturnType<typeof setTimeout>;

    // Övervaka synk-statusen
    $effect(() => {
        // Rensa alltid gammal timer när status ändras
        clearTimeout(fadeTimer);

        if (uiStore.syncStatus === 'idle') {
            // Om vi är klara (idle), vänta 3 sekunder och fada sen ut
            fadeTimer = setTimeout(() => {
                isFaded = true;
            }, 3000);
        } else {
            // Om vi jobbar eller har fel, visa direkt (avbryt fade)
            isFaded = false;
        }

        // Städning om komponenten försvinner
        return () => clearTimeout(fadeTimer);
    });
</script>

<div class="title-bar" style:height="{CONFIG.titleBarHeight}px">
    <div class="left">
        <h1 class="app-title">Kalender</h1>
    </div>
    
    <button 
        class="settings-btn {uiStore.settingsOpen ? 'is-active' : ''}" 
        onclick={onToggleSettings} 
        aria-label={uiStore.settingsOpen ? "Stäng inställningar" : "Öppna inställningar"}
    >
        <div class="absolute-center">
            <svg class="sync-ring {uiStore.syncStatus} {isFaded ? 'faded' : ''}" viewBox="0 0 36 36">
                <path class="ring-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <path class="ring-indicator" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
            </svg>
        </div>

        <div class="absolute-center icon-wrapper">
            {#if uiStore.settingsOpen}
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            {:else}
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="3" y1="12" x2="21" y2="12"></line>
                    <line x1="3" y1="6" x2="21" y2="6"></line>
                    <line x1="3" y1="18" x2="21" y2="18"></line>
                </svg>
            {/if}
        </div>
    </button>
</div>

<style>
    .title-bar {
        position: fixed; top: 0; left: 0; right: 0;
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(5px);
        border-bottom: 1px solid var(--border-color);
        display: flex; align-items: center; justify-content: space-between;
        padding: 0 16px; 
        z-index: 2000; 
    }
    
    .app-title { font-size: 18px; font-weight: 700; color: var(--text-main); margin: 0; }
    
    .settings-btn {
        position: relative; 
        width: 36px; height: 36px;
        padding: 0; margin: 0;
        background: transparent; border: none; 
        cursor: pointer; color: var(--text-main);
        border-radius: 50%;
        transition: background 0.2s;
        display: block; 
        line-height: 0;
    }

    .settings-btn:hover { background: var(--bg-input); }
    .settings-btn.is-active { background: var(--bg-input); }

    .settings-btn svg { position: static !important; transform: none !important; }

    .absolute-center {
        position: absolute; inset: 0;
        display: flex; align-items: center; justify-content: center;
        pointer-events: none;
    }
    
    .icon-wrapper { z-index: 2; }

    /* --- SYNK RING --- */
    .sync-ring {
        width: 100%; height: 100%;
        transform: rotate(-90deg);
        
        /* Transition för hela ringens opacitet (Fade out effekten) */
        opacity: 1;
        transition: opacity 1.5s ease; /* Långsam och mjuk fade */
    }

    /* När den har "somnat" (faded) */
    .sync-ring.faded {
        opacity: 0.15; /* Väldigt transparent, men anas svagt */
    }

    /* Om den jobbar eller har fel ska den ALLTID synas fullt ut */
    .sync-ring.working, .sync-ring.error {
        opacity: 1 !important;
    }

    .ring-bg { 
        fill: none; 
        stroke: var(--border-color); 
        stroke-width: 2.5; 
        opacity: 0.3;
    }
    
    .ring-indicator { 
        fill: none; 
        stroke-width: 2.5; 
        stroke-linecap: round; 
        stroke-dasharray: 100; 
        transition: stroke-dashoffset 0.6s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.3s;
    }

    /* --- STATES --- */

    /* 1. SYNKAD (Klar) */
    .sync-ring .ring-indicator {
        stroke: #22c55e;
        stroke-dashoffset: 0;
        
        /* Här gör vi den gröna färgen lite transparent från början */
        stroke-opacity: 0.6; 
    }

    /* 2. SYNKAR (Working) */
    .sync-ring.working { animation: spin 1s linear infinite; }
    .sync-ring.working .ring-indicator {
        stroke: #00639b;
        stroke-dashoffset: 75;
        stroke-opacity: 1; /* Full styrka när den jobbar */
        transition: stroke-dashoffset 0.3s; 
    }

    /* 3. ERROR (Fel) */
    .sync-ring.error .ring-indicator {
        stroke: #ef5350; 
        stroke-dashoffset: 0; 
        stroke-opacity: 1; /* Full styrka vid fel */
    }
    
    @keyframes spin { 
        from { transform: rotate(-90deg); }
        to { transform: rotate(270deg); }
    }

    /* Dark mode */
    :global(body.dark-mode) .title-bar { background: rgba(30, 30, 30, 0.95); }
    :global(body.dark-mode) .settings-btn:hover { background: rgba(255,255,255,0.1); }
    :global(body.dark-mode) .sync-ring .ring-indicator { stroke: #4ade80; }
    :global(body.dark-mode) .sync-ring.working .ring-indicator { stroke: #38bdf8; }
</style>