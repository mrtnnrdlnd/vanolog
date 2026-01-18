<script lang="ts">
    let { hue = $bindable(), isDark } = $props<{ hue: number, isDark: boolean }>();

    function getGradient(dark: boolean) {
        const steps = [0, 60, 120, 180, 240, 300, 360];
        const s = dark ? '50%' : '80%';
        const stops = steps.map(h => `hsl(${h}, ${s}, 50%)`).join(', ');
        return `linear-gradient(to right, ${stops})`;
    }
</script>

<div class="hue-wrapper">
    <input 
        type="range" min="0" max="360" 
        bind:value={hue} 
        class="hue-slider"
        style:background={getGradient(isDark)}
    />
    <div class="hue-preview" style:background="hsl({hue}, 70%, 50%)"></div>
</div>

<style>
    .hue-wrapper { 
        display: flex; 
        align-items: center; 
        gap: 12px; 
    }

    .hue-slider { 
        flex: 1; 
        -webkit-appearance: none; 
        appearance: none; 
        height: 6px; 
        border-radius: 3px; 
        outline: none; 
        cursor: pointer; 
        margin: 0;
    }

    /* --- Thumb (Handtaget) - Standardiserad design --- */
    .hue-slider::-webkit-slider-thumb { 
        -webkit-appearance: none; 
        appearance: none;
        width: 16px; 
        height: 16px; 
        border-radius: 50%; 
        background: #fff; 
        border: 1px solid rgba(0,0,0,0.1); 
        box-shadow: 0 1px 3px rgba(0,0,0,0.3); 
        cursor: pointer; 
        transition: transform 0.1s; 
        transform: scale(1); 
    }

    .hue-slider:active::-webkit-slider-thumb {
        transform: scale(1.1);
    }

    .hue-slider::-moz-range-thumb {
        width: 16px; 
        height: 16px; 
        border-radius: 50%; 
        background: #fff; 
        border: 1px solid rgba(0,0,0,0.1); 
        box-shadow: 0 1px 3px rgba(0,0,0,0.3); 
        cursor: pointer; 
        transition: transform 0.1s;
    }

    .hue-preview { 
        width: 24px; 
        height: 24px; 
        border-radius: 50%; 
        border: 1px solid rgba(0,0,0,0.1); 
    }

    /* Dark mode */
    :global(body.dark-mode) .hue-slider::-webkit-slider-thumb {
        background: #eee;
        border-color: #333;
    }
    :global(body.dark-mode) .hue-slider::-moz-range-thumb {
        background: #eee;
        border-color: #333;
    }
    :global(body.dark-mode) .hue-preview {
        border-color: rgba(255,255,255,0.2);
    }
</style>