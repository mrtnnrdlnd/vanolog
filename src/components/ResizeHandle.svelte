<script lang="ts">
    import { layoutStore } from '../lib/stores/layout.svelte';
    import { CONFIG } from '../lib/config/constants';

    let startY = 0;
    let startRows = 0;

    function handleStart(y: number) {
        startY = y;
        startRows = layoutStore.rows;
        
        // Flagga till systemet att en resize pågår
        layoutStore.isResizing = true;
        
        addListeners();
    }

    function handleMove(currentY: number) {
        const deltaPx = currentY - startY; 
        const deltaRows = Math.round(deltaPx / CONFIG.stride);
        
        const newRows = Math.max(CONFIG.minRows, Math.min(CONFIG.maxRows, startRows - deltaRows));
        
        if (newRows !== layoutStore.rows) {
            layoutStore.rows = newRows;
        }
    }

    // VIKTIGT: Återställ flaggan när vi släpper
    function handleEnd() {
        layoutStore.isResizing = false;
        cleanup();
    }

    function onTouchStart(e: TouchEvent) { 
        e.stopPropagation();
        handleStart(e.touches[0].clientY); 
    }
    
    function onMouseDown(e: MouseEvent) { 
        e.stopPropagation();
        handleStart(e.clientY); 
    }
    
    function onTouchMove(e: TouchEvent) { handleMove(e.touches[0].clientY); }
    function onMouseMove(e: MouseEvent) { handleMove(e.clientY); }

    function addListeners() {
        window.addEventListener('touchmove', onTouchMove, { passive: false });
        window.addEventListener('touchend', handleEnd);
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', handleEnd);
    }

    function cleanup() {
        window.removeEventListener('touchmove', onTouchMove);
        window.removeEventListener('touchend', handleEnd);
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', handleEnd);
    }
</script>

<div 
    class="resize-handle" 
    style:top="{CONFIG.titleBarHeight + layoutStore.chartH - 20}px"
>
    <div 
        class="resize-pill"
        ontouchstart={onTouchStart}
        onmousedown={onMouseDown}
        role="slider"
        aria-valuenow={layoutStore.rows}
        tabindex="0"
    ></div>
</div>

<style>
    .resize-handle {
        position: fixed; left: 0; right: 0; height: 30px; z-index: 300;
        display: flex; align-items: center; justify-content: center;
        background: transparent;
        pointer-events: none;
    }
    
    .resize-pill { 
        position: relative;
        width: 40px; height: 4px; 
        background: #00639b; 
        border-radius: 10px;
        opacity: 0.3;
        transition: opacity 0.2s, height 0.2s;
        cursor: grab;
        pointer-events: auto;
    }

    .resize-pill::after {
        content: '';
        position: absolute;
        top: -15px; bottom: -15px;
        left: -15px; right: -15px;
        z-index: 1;
    }

    .resize-pill:hover, 
    .resize-pill:active {
        opacity: 1;
        height: 6px;
        cursor: grabbing;
    }
</style>