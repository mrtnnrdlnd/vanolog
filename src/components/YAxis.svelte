<script lang="ts">
    import { layoutStore } from '../lib/stores/layout.svelte';
    import { CONFIG } from '../lib/config/constants';
    import { draggable } from '../lib/actions/draggable';

    let startVal = 0;
    let startRange = 0;
    let activeType: 'min' | 'max' | null = null;

    let hasManualScale = $derived(layoutStore.manualMin !== null || layoutStore.manualMax !== null);

    // Ticks-beräkningen är oförändrad
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

    function handleDragStart(type: 'min' | 'max') {
        activeType = type;
        startVal = type === 'min' ? layoutStore.graphMin : layoutStore.graphMax;
        startRange = Math.max(0.1, layoutStore.graphMax - layoutStore.graphMin);
    }

    function handleDrag({ dy }: { dx: number, dy: number }) {
        if (!activeType) return;
        
        const usableHeight = layoutStore.chartH - layoutStore.graphPadding.top - layoutStore.graphPadding.bottom;
        
        // dy är positivt när vi drar nedåt.
        // För graf-värden: Dra nedåt (ökad Y) = Mindre värde (högre pixel-värde).
        // Så vi inverterar dy (-dy) för att matcha "uppåt = ökat värde".
        const valDelta = ((-dy) / usableHeight) * startRange;
        const newVal = Number((startVal + valDelta).toFixed(1));

        if (activeType === 'max') {
            layoutStore.manualMax = newVal;
            if (newVal <= layoutStore.graphMin + 0.1) {
                layoutStore.manualMin = Number((newVal - 0.1).toFixed(1));
            }
        } else {
            layoutStore.manualMin = newVal;
            if (newVal >= layoutStore.graphMax - 0.1) {
                layoutStore.manualMax = Number((newVal + 0.1).toFixed(1));
            }
        }
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
                aria-label="Återställ zoom"
            >
                <span class="label-text">{tick.displayVal}</span>
                <span class="icon">↺</span>
            </button>
        {:else}
            <div 
                class="axis-label"
                style:top="{tick.y}px"
                class:interactive={tick.isInteractive}
                use:draggable={{
                    axis: 'y',
                    onDragStart: () => tick.isInteractive && handleDragStart(tick.pct === 0 ? 'min' : 'max'),
                    onDrag: (e) => tick.isInteractive && handleDrag(e),
                    onDragEnd: () => activeType = null
                }}
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
    /* CSS är oförändrad */
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
        font-weight: 700; background: rgba(255,255,255,0.9); box-shadow: 0 1px 2px rgba(0,0,0,0.05); cursor: ns-resize;
    }
    :global(body.dark-mode) .axis-label.interactive { background: rgba(50,50,50,0.95); }
    .axis-label.clickable { cursor: pointer; }
    .icon { display: inline-flex; align-items: center; justify-content: center; height: 100%; line-height: 1; font-size: 12px; opacity: 0.7; }
</style>