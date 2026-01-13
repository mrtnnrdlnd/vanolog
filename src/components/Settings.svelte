<script lang="ts">
    import { store } from '../lib/store.svelte';
    import { CONFIG } from '../lib/types';
    
    let { isOpen = $bindable(false) } = $props();
</script>

{#if isOpen}
    <div class="click-outside" onclick={() => isOpen = false} role="button" tabindex="-1"></div>
{/if}

<div 
    class="settings-panel {isOpen ? 'is-open' : ''}"
    style:top="{CONFIG.titleBarHeight + 12}px"
>
    
    <div class="section">
        <div class="settings-header">Graf Typ</div>
        <div class="radio-group">
            <label class="radio-item"><input type="radio" bind:group={store.graphType} value="line"> <span>Linje</span></label>
            <label class="radio-item"><input type="radio" bind:group={store.graphType} value="bar"> <span>Staplar</span></label>
        </div>
    </div>

    <div class="divider"></div>

    <div class="section">
        <div class="settings-header">Beräkning</div>
        <div class="radio-group">
            <label class="radio-item"><input type="radio" bind:group={store.graphMode} value="avg"> <span>Medelvärde</span></label>
            <label class="radio-item"><input type="radio" bind:group={store.graphMode} value="median"> <span>Median</span></label>
            <label class="radio-item"><input type="radio" bind:group={store.graphMode} value="max"> <span>Max</span></label>
            <label class="radio-item"><input type="radio" bind:group={store.graphMode} value="min"> <span>Min</span></label>
        </div>
    </div>
</div>

<style>
    .click-outside { position: fixed; inset: 0; z-index: 380; }

    .settings-panel {
        position: fixed; 
        /* top sätts via inline style nu */
        right: 12px; 
        z-index: 390; 
        width: 200px;
        
        background: rgba(255, 255, 255, 0.95); 
        backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
        
        border-radius: 16px; 
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12); 
        border: 1px solid rgba(255, 255, 255, 0.5);
        
        padding: 20px;
        
        opacity: 0; transform: translateY(-10px) scale(0.95); pointer-events: none;
        transition: all 0.25s cubic-bezier(0.2, 0.8, 0.2, 1);
        transform-origin: top right;
    }

    .settings-panel.is-open { opacity: 1; transform: translateY(0) scale(1); pointer-events: auto; }

    .settings-header { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #888; font-weight: 700; margin-bottom: 8px; }
    
    .divider { height: 1px; background: rgba(0,0,0,0.06); margin: 16px 0; }

    .radio-group { display: flex; flex-direction: column; gap: 8px; }
    .radio-item { display: flex; align-items: center; gap: 10px; font-size: 14px; color: #333; cursor: pointer; }
    .radio-item input { accent-color: #00639b; width: 16px; height: 16px; margin: 0; }
</style>