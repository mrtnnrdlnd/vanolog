<script lang="ts">
    import { store } from '../lib/store.svelte';
    import { CONFIG } from '../lib/types';
    
    let { onToggleSettings } = $props();
</script>

<div class="title-bar" style:height="{CONFIG.titleBarHeight}px">
    <div class="app-title">Martin</div>
    
    <button class="menu-btn" onclick={onToggleSettings} aria-label="Meny">
        <div id="sync-status" class="sync-{store.syncStatus}">
            <div class="sync-ring"></div>
        </div>
        
        <div class="menu-line"></div>
        <div class="menu-line"></div>
        <div class="menu-line"></div>
    </button>
</div>

<style>
    .title-bar {
        position: fixed;
        top: 0; left: 0; right: 0;
        /* height sätts inline */
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        border-bottom: 1px solid rgba(0,0,0,0.05);
        z-index: 600;
        display: flex;
        align-items: center;
        padding: 0 16px;
        justify-content: space-between;
    }

    .app-title {
        font-size: 18px;
        font-weight: 700;
        color: #333;
        letter-spacing: -0.5px;
    }

    .menu-btn { 
        width: 36px; height: 36px; 
        border-radius: 50%; 
        background: transparent; 
        border: none; 
        display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; 
        cursor: pointer; 
        position: relative; /* Viktigt för absolut positionering inuti */
    }
    .menu-btn:active { transform: scale(0.95); }
    
    .menu-line { width: 16px; height: 2px; background: #444; border-radius: 1px; z-index: 2; }

    /* FIX 2: Wrapper för ringen måste ligga absolut så den inte stör layouten */
    #sync-status {
        position: absolute;
        inset: 0;
        pointer-events: none;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    /* Ringen själv */
    .sync-ring { 
        width: 100%; 
        height: 100%; 
        border-radius: 50%; 
        border: 2px solid transparent; /* Lite tunnare (2px) ser ofta bättre ut på liten knapp */
        transition: all 0.3s; 
    }

    /* FIX 3: Tillbaka med den gröna färgen för idle */
    .sync-idle .sync-ring { 
        border-color: #4caf50; 
        opacity: 0.6; /* Lite genomskinlig så den inte är för skrikig */
    }
    
    .sync-working .sync-ring { 
        border-color: rgba(33, 150, 243, 0.3); 
        border-top-color: #2196f3; 
        animation: spin 0.8s linear infinite; 
        opacity: 1; 
    }
    
    .sync-error .sync-ring { 
        border-color: #f44336; 
        animation: pulse 1s infinite; 
        opacity: 1; 
    }
    
    @keyframes spin { 100% { transform: rotate(360deg); } }
    @keyframes pulse { 50% { transform: scale(1.05); } }
</style>