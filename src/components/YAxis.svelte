<script lang="ts">
    import { store } from '../lib/store.svelte';
    import { CONFIG } from '../lib/types';

    let dragTarget = $state<'min' | 'max' | null>(null);
    let startY = 0;
    let startVal = 0;
    let currentSensitivity = 0;

    const labels = $derived.by(() => {
        const { chartH, graphMin, graphMax } = store;
        const range = graphMax - graphMin;
        const availableH = Math.max(0, chartH - 45);
        
        return [0, 1, 2, 3, 4].map(i => {
            const pct = i / 4;
            const val = graphMin + (range * pct);
            const y = (chartH - 5) - (pct * availableH);
            
            let type: 'min' | 'max' | 'auto' | null = null;
            if (i === 0) type = 'min';
            if (i === 4) type = 'max';
            if (i === 2) type = 'auto';

            return { val: Math.round(val * 10) / 10, y, type };
        });
    });

    function handleStart(e: MouseEvent | TouchEvent, type: 'min' | 'max' | 'auto' | null) {
        if (!type) return;
        if (type === 'auto') { store.autoScale(); return; }
        if (e.cancelable) e.preventDefault();
        e.stopPropagation();
        
        dragTarget = type;
        const clientY = (window.TouchEvent && e instanceof TouchEvent) ? e.touches[0].clientY : (e as MouseEvent).clientY;
        startY = clientY;
        startVal = type === 'min' ? store.graphMin : store.graphMax;
        
        const range = store.graphMax - store.graphMin;
        currentSensitivity = Math.max(0.1, range / 150);
    }

    function handleMove(clientY: number) {
        if (!dragTarget) return;
        const deltaPx = startY - clientY; 
        const deltaVal = deltaPx * currentSensitivity;
        const newVal = startVal + deltaVal;
        const gap = 1;

        if (dragTarget === 'min') {
            store.graphMin = newVal;
            if (store.graphMin >= store.graphMax - gap) store.graphMax = store.graphMin + gap;
        } else {
            store.graphMax = newVal;
            if (store.graphMax <= store.graphMin + gap) store.graphMin = store.graphMax - gap;
        }
    }

    function handleEnd() { dragTarget = null; }
</script>

<svelte:window 
    onmousemove={(e) => dragTarget && handleMove(e.clientY)}
    onmouseup={handleEnd}
    ontouchmove={(e) => dragTarget && handleMove(e.touches[0].clientY)}
    ontouchend={handleEnd}
/>

{#if dragTarget}
    <div class="drag-overlay" role="presentation" onmouseup={handleEnd} ontouchend={handleEnd}></div>
{/if}

<div class="y-axis-layer" style:height="{store.chartH}px" style:top="{CONFIG.titleBarHeight}px">
    {#each labels as label}
        <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
        <div 
            class="y-label {label.type ? 'is-interactive' : ''} {dragTarget === label.type ? 'is-dragging' : ''}" 
            style:top="{label.y}px"
            role={label.type ? "slider" : undefined}
            aria-valuenow={label.type ? label.val : undefined}
            tabindex={label.type ? 0 : -1}
            
            onmousedown={(e) => handleStart(e, label.type)}
            ontouchstart={(e) => handleStart(e, label.type)}
        >
            <span class="val-text">{label.val}</span>
            
            {#if label.type === 'min' || label.type === 'max'}
                <span class="icon">↕</span>
            {:else if label.type === 'auto'}
                <span class="icon">⟳</span>
            {/if}
        </div>
    {/each}
</div>

<style>
    .drag-overlay { position: fixed; inset: 0; z-index: 9999; cursor: ns-resize; touch-action: none; }
    .y-axis-layer { position: fixed; left: 0; width: 100%; z-index: 500; pointer-events: none; }

    .y-label {
        position: absolute; left: 0;
        display: flex; align-items: center; gap: 4px;
        
        /* ÄNDRAT: Större greppyta */
        padding: 8px 10px; 
        min-width: 48px;
        
        transform: translateY(-50%);
        font-size: 11px; font-weight: 600; color: #00639b; 
        background: rgba(255, 255, 255, 0.75); 
        backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px);
        border: 1px solid rgba(0, 0, 0, 0.05); border-left: none;
        box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        border-radius: 0 6px 6px 0;
        transition: color 0.2s;
        pointer-events: none; user-select: none; touch-action: none;
    }

    .y-label.is-interactive { pointer-events: auto; cursor: ns-resize; color: #00639b; }
    .y-label.is-interactive:nth-child(3) { cursor: pointer; }
    .y-label.is-interactive:hover { background: rgba(255, 255, 255, 0.95); z-index: 600; }
    .y-label.is-dragging { background: rgba(255, 255, 255, 1); color: #00639b; z-index: 10000; }
    .val-text { pointer-events: none; }
    .icon { font-size: 10px; opacity: 0.5; pointer-events: none; margin-left: 2px;}
    .y-label::after { content: ""; position: absolute; left: 100%; width: 100vw; height: 1px; border-bottom: 1px dashed rgba(0, 0, 0, 0.08); pointer-events: none; }
</style>