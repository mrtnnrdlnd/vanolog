<script lang="ts">
    import { layoutStore } from '../lib/stores/layout.svelte';
    import { CONFIG } from '../lib/config/constants';
    import { draggable } from '../lib/actions/draggable';

    let startRows = 0;

    function handleStart() {
        startRows = layoutStore.rows;
        layoutStore.isResizing = true;
    }

    function handleDrag({ dy }: { dx: number, dy: number }) {
        // dy är positivt när vi drar ned.
        // Att dra ned (positiv dy) minskar höjden på kalendern? 
        // Nej vänta, din ResizeHandle sitter under grafen men ovanför kalendern?
        // Om den sitter under grafen: Dra ned -> Graf blir större -> Kalender får mindre plats?
        // Låt oss kolla din gamla logik: "deltaPx = currentY - startY".
        // "startRows - deltaRows".
        // Så om jag drar NED (positiv delta), så minskar startRows.
        
        const deltaRows = Math.round(dy / CONFIG.stride);
        const newRows = Math.max(CONFIG.minRows, Math.min(CONFIG.maxRows, startRows - deltaRows));
        
        if (newRows !== layoutStore.rows) {
            layoutStore.rows = newRows;
        }
    }

    function handleEnd() {
        layoutStore.isResizing = false;
    }
</script>

<div 
    class="resize-handle" 
    style:top="{CONFIG.titleBarHeight + layoutStore.chartH - 20}px"
>
    <div 
        class="resize-pill"
        use:draggable={{
            axis: 'y',
            onDragStart: handleStart,
            onDrag: handleDrag,
            onDragEnd: handleEnd
        }}
        role="slider"
        aria-valuenow={layoutStore.rows}
        tabindex="0"
    ></div>
</div>

<style>
    /* CSS oförändrad förutom borttagning av onödiga stilar om de fanns */
    .resize-handle {
        position: fixed; left: 0; right: 0; height: 30px; z-index: 300;
        display: flex; align-items: center; justify-content: center;
        background: transparent;
        pointer-events: none;
    }
    
    .resize-pill { 
        position: relative;
        width: 50px; height: 4px; 
        background: #00639b; 
        border-radius: 10px;
        opacity: 0.4; 
        transition: opacity 0.2s, height 0.2s, transform 0.2s;
        cursor: ns-resize;
        pointer-events: auto;
        box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }
    .resize-pill:hover, .resize-pill:active { opacity: 0.8; transform: scaleX(1.1); }
    .resize-pill::after {
        content: ''; position: absolute; top: -15px; bottom: -15px; left: -15px; right: -15px; z-index: 1;
    }
</style>