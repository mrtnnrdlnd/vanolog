<script lang="ts">
    import { layoutStore } from '../lib/stores/layout.svelte';
    import { CONFIG } from '../lib/config/constants';

    // --- INSTÄLLNINGAR FÖR YTA ---
    // Ändra dessa för att flytta grafens arbetsområde vertikalt
    const topPadding = 15;    // Avstånd från titellisten ner till max-värdet
    const bottomPadding = 15; // Avstånd från kalenderns kant upp till min-värdet

    let isDragging = $state<'min' | 'max' | null>(null);
    let startY = 0;
    let startVal = 0;

    let hasManualScale = $derived(layoutStore.manualMin !== null || layoutStore.manualMax !== null);

    let ticks = $derived([0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
        const val = layoutStore.graphMin + (pct * (layoutStore.graphMax - layoutStore.graphMin));
        // --- BERÄKNING AV POSITION ---
        // 1. Vi utgår från den totala chartH
        // 2. Vi drar av padding för att få den "användbara" höjden
        const usableHeight = layoutStore.chartH - topPadding - bottomPadding;
        
        // 3. Vi räknar ut Y-positionen (0% är botten, 100% är toppen)
        const yPos = (layoutStore.chartH - bottomPadding) - (pct * usableHeight);
        
        return {
            pct,
            val: Math.round(val),
            y: yPos + CONFIG.titleBarHeight, // Addera titellistens höjd för global position
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

        window.addEventListener('touchmove', onMove, { passive: false });
        window.addEventListener('mousemove', onMove);
        window.addEventListener('touchend', stopDrag);
        window.addEventListener('mouseup', stopDrag);
    }

    function onMove(e: MouseEvent | TouchEvent) {
        if (!isDragging) return;
        const clientY = (window.TouchEvent && e instanceof TouchEvent) ? e.touches[0].clientY : (e as MouseEvent).clientY;
        const deltaPx = startY - clientY; 
        const range = layoutStore.graphMax - layoutStore.graphMin;
        const pxPerValue = layoutStore.chartH / (range || 1);
        const valDelta = deltaPx / (pxPerValue || 1);

        if (isDragging === 'max') {
            layoutStore.manualMax = Math.max(layoutStore.graphMin + 1, Math.round(startVal + valDelta));
        } else {
            layoutStore.manualMin = Math.min(layoutStore.graphMax - 1, Math.round(startVal + valDelta));
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
    {#each ticks as tick, i}
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
                <span class="label-text">{tick.val}</span>
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
                <span class="label-text">{tick.val}</span>
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
    }
    :global(body.dark-mode) .axis-label.interactive { background: rgba(50,50,50,0.95); }
    
    .axis-label.interactive { cursor: ns-resize; }
    .axis-label.clickable { cursor: pointer; }

    .icon {
        display: inline-flex; align-items: center; justify-content: center;
        height: 100%; line-height: 1; font-size: 12px; 
        font-weight: normal; margin-top: -1px; opacity: 0.7;
    }
</style>