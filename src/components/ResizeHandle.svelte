<script lang="ts">
    import { store } from '../lib/store.svelte';
    import { CONFIG } from '../lib/types';

    let isDragging = $state(false);
    let startY = 0;
    let startRows = 0;

    function onStart(y: number) {
        isDragging = true;
        startY = y;
        startRows = store.rows;
    }

    function onMove(y: number) {
        if (!isDragging) return;
        const diff = Math.round((y - startY) / CONFIG.stride);
        let newRows = startRows - diff;
        newRows = Math.max(CONFIG.minRows, Math.min(CONFIG.maxRows, newRows));
        store.rows = newRows;
    }

    function onEnd() { isDragging = false; }
</script>

<svelte:window 
    ontouchmove={(e) => isDragging && onMove(e.touches[0].clientY)} 
    ontouchend={onEnd}
    onmousemove={(e) => isDragging && onMove(e.clientY)}
    onmouseup={onEnd}
/>

<div 
    class="resize-handle" 
    style:transform="translateY({CONFIG.titleBarHeight + store.chartH - 16}px)"
    ontouchstart={(e) => { e.preventDefault(); onStart(e.touches[0].clientY); }}
    onmousedown={(e) => onStart(e.clientY)}
    role="slider" 
    aria-valuenow={store.rows} 
    tabindex="0"
>
    <div class="resize-pill"></div>
</div>

<style>
    .resize-handle {
        position: fixed; 
        left: 0; right: 0; 
        
        /* ÄNDRAT: Mindre höjd (var 30px förut) */
        height: 30px; 
        
        top: 0; 
        z-index: 300; 
        cursor: ns-resize; 
        touch-action: none;
        display: flex; align-items: center; justify-content: center;
    }
    
    .resize-pill { 
        width: 36px; 
        height: 4px; 
        background: rgba(0,0,0,0.25); 
        border-radius: 10px; 
        box-shadow: 0 1px 2px rgba(255,255,255,0.5);
    }
</style>