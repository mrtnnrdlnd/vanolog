<script lang="ts">
    import { layoutStore } from '../lib/stores/layout.svelte';
    import { CONFIG } from '../lib/config/constants';

    let isDragging = $state<'min' | 'max' | null>(null);
    let startY = 0;
    let startVal = 0;
    let startRange = 0; // NYTT: Sparar skalan vid start för stabil beräkning

    let hasManualScale = $derived(layoutStore.manualMin !== null || layoutStore.manualMax !== null);

    let ticks = $derived([0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
        const val = layoutStore.graphMin + (pct * (layoutStore.graphMax - layoutStore.graphMin));
        return {
            pct,
            displayVal: val.toFixed(1), 
            y: layoutStore.getY(val) + CONFIG.titleBarHeight,
            isMiddle: i === 2,
            isInteractive: i === 0 || i === 4
        };
    }));

    function startDrag(e: MouseEvent | TouchEvent, type: 'min' | 'max') {
        e.preventDefault(); e.stopPropagation(); 
        isDragging = type;
        const clientY = (window.TouchEvent && e instanceof TouchEvent) ? e.touches[0].clientY : (e as MouseEvent).clientY;
        
        startY = clientY;
        startVal = type === 'min' ? layoutStore.graphMin : layoutStore.graphMax;
        
        // VIKTIGT: Spara nuvarande range så att "valDelta" inte ändras under draget
        startRange = Math.max(0.1, layoutStore.graphMax - layoutStore.graphMin);

        window.addEventListener('touchmove', onMove, { passive: false });
        window.addEventListener('mousemove', onMove);
        window.addEventListener('touchend', stopDrag);
        window.addEventListener('mouseup', stopDrag);
    }

    function onMove(e: MouseEvent | TouchEvent) {
        if (!isDragging) return;
        const clientY = (window.TouchEvent && e instanceof TouchEvent) ? e.touches[0].clientY : (e as MouseEvent).clientY;
        
        const deltaPx = startY - clientY; 
        const usableHeight = layoutStore.chartH - layoutStore.graphPadding.top - layoutStore.graphPadding.bottom;
        
        // Använd startRange för en linjär och stabil rörelse
        const valDelta = (deltaPx / usableHeight) * startRange;
        const newVal = Number((startVal + valDelta).toFixed(1));

        if (isDragging === 'max') {
            layoutStore.manualMax = newVal;
            // PUSH: Om Max kommer för nära eller under Min, flytta Min neråt
            if (newVal <= layoutStore.graphMin + 0.1) {
                layoutStore.manualMin = Number((newVal - 0.1).toFixed(1));
            }
        } else if (isDragging === 'min') {
            layoutStore.manualMin = newVal;
            // PUSH: Om Min kommer för nära eller över Max, flytta Max uppåt
            if (newVal >= layoutStore.graphMax - 0.1) {
                layoutStore.manualMax = Number((newVal + 0.1).toFixed(1));
            }
        }
    }

    function stopDrag() {
        isDragging = null;
        window.removeEventListener('touchmove', onMove);
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('touchend', stopDrag);
        window.removeEventListener('mouseup', stopDrag);
    }
    
    function reset() {
        layoutStore.manualMin = null;
        layoutStore.manualMax = null;
    }
</script>

{#if layoutStore.showGraph}
<div class="y-axis-layer">
    {#each ticks as tick}
        <div 
            class="grid-line" 
            style:top="{tick.y}px"
            style:opacity={tick.pct === 0 || tick.pct === 1 ? 0.2 : 0.05}
        ></div>

        {#if tick.isMiddle && hasManualScale}
            <button 
                class="axis-label interactive clickable" 
                style:top="{tick.y}px"
                onclick={reset}
            >
                <span class="label-text">{tick.displayVal}</span>
                <span class="icon">↺</span>
            </button>
        {:else}
            <div 
                class="axis-label"
                style:top="{tick.y}px"
                class:interactive={tick.isInteractive}
                ontouchstart={(e) => (tick.pct===0 ? startDrag(e, 'min') : tick.pct===1 ? startDrag(e, 'max') : null)}
                onmousedown={(e) => (tick.pct===0 ? startDrag(e, 'min') : tick.pct===1 ? startDrag(e, 'max') : null)}
                role="button"
                tabindex="-1"
            >
                <span class="label-text">{tick.displayVal}</span>
                {#if tick.isInteractive}
                    <span class="icon">↕</span>
                {/if}
            </div>
        {/if}
    {/each}
</div>
{/if}

<style>
    .y-axis-layer { position: fixed; inset: 0; pointer-events: none; z-index: 50; }
    .grid-line { position: absolute; left: 0; right: 0; height: 1px; background: var(--text-main); transform: translateY(0.5px); }
    
    .axis-label {
        position: absolute; left: 4px; transform: translateY(-50%);
        pointer-events: auto; user-select: none;
        display: flex; align-items: center; gap: 3px; 
        font-family: inherit; font-size: 10px; font-weight: 600; color: var(--text-muted);
        background: rgba(255,255,255,0.75); backdrop-filter: blur(2px);
        padding: 2px 5px; border-radius: 4px; border: none; margin: 0; 
    }

    :global(body.dark-mode) .axis-label { background: rgba(30,30,30,0.8); }

    .axis-label.interactive {
        font-weight: 700;
        background: rgba(255,255,255,0.9); box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        cursor: ns-resize;
    }
    :global(body.dark-mode) .axis-label.interactive { background: rgba(50,50,50,0.95); }
    
    .axis-label.clickable { cursor: pointer; }

    .icon {
        display: inline-flex; align-items: center; justify-content: center;
        height: 100%; line-height: 1; font-size: 12px; 
        font-weight: normal; margin-top: -1px; opacity: 0.7;
    }
</style>