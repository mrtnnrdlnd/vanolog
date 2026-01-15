<script lang="ts">
    import { tick } from 'svelte';
    import { layoutStore } from '../lib/stores/layout.svelte';
    import { uiStore } from '../lib/stores/ui.svelte';
    import { CONFIG } from '../lib/config/constants';
    import { draggable } from '../lib/actions/draggable';

    let startRows = 0;
    let anchorDayIndex = 0; 

    function handleStart() {
        const scroller = uiStore.scroller;
        if (!scroller) return;

        layoutStore.isResizing = true;
        startRows = layoutStore.rows;

        // 1. LÅS FAST DAGEN
        // Vi räknar ut vilken kolumn som är i mitten just nu.
        // Eftersom vi har marginaler som centrerar allt, är formeln enkel:
        // ScrollLeft / Stride = Kolumnen i mitten.
        const centerCol = scroller.scrollLeft / CONFIG.stride;
        
        // VIKTIGT: Vi avrundar (Math.round) för att "snappa" till närmaste hela dag.
        // Det löser problemet att man hamnar "mellan" dagar.
        const snappedCol = Math.round(centerCol);
        
        // Spara vilken "Tid" (Dag-index) detta motsvarar
        anchorDayIndex = snappedCol * startRows;
    }

    async function handleDrag({ dy }: { dx: number, dy: number }) {
        const scroller = uiStore.scroller;
        if (!scroller) return;

        // 2. ÄNDRA RADER
        const deltaRows = Math.round(dy / CONFIG.stride);
        const newRows = Math.max(CONFIG.minRows, Math.min(CONFIG.maxRows, startRows - deltaRows));
        
        if (newRows !== layoutStore.rows) {
            layoutStore.rows = newRows;

            // 3. VÄNTA PÅ DOM
            await tick(); 
            
            // Tvinga webbläsaren att uppdatera layouten (fixar att den sticker till höger)
            const _forceReflow = scroller.scrollWidth;

            // 4. RÄKNA UT NY POSITION
            // Var hamnar vår dag nu?
            const newCol = anchorDayIndex / newRows;
            
            // Eftersom vi vill behålla "snappen", avrundar vi även här.
            // Då landar vi alltid perfekt mitt i en kolumn.
            const snappedNewCol = Math.round(newCol);
            
            // Sätt scrollen direkt. Inga offset-uträkningar behövs!
            scroller.scrollLeft = snappedNewCol * CONFIG.stride;
        }
    }

    function handleEnd() {
        layoutStore.isResizing = false;
        
        // Säkerhetsåtgärd: Om vi mot förmodan hamnade lite fel (pga sub-pixlar), 
        // se till att snappen är korrekt när vi släpper.
        if (uiStore.scroller) {
            const currentCol = Math.round(uiStore.scroller.scrollLeft / CONFIG.stride);
            uiStore.scroller.scrollTo({
                left: currentCol * CONFIG.stride,
                behavior: 'smooth'
            });
        }
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
    .resize-handle {
        position: fixed; left: 0; right: 0; height: 30px; z-index: 300;
        display: flex; align-items: center; justify-content: center;
        background: transparent;
        pointer-events: none;
    }
    
    .resize-pill { 
        position: relative;
        width: 30px; height: 4px; 
        background: #00639b; 
        border-radius: 10px;
        opacity: 0.3; 
        cursor: row-resize; 
        pointer-events: auto; 
        transition: opacity 0.2s, height 0.2s;
    }

    .resize-pill:hover, .resize-pill:active {
        opacity: 1;
        height: 6px;
    }
    
    .resize-pill::after {
        content: ''; position: absolute; top: -10px; bottom: -10px; left: -10px; right: -10px;
    }
</style>