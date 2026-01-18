<script lang="ts">
    let { 
        value = $bindable(), 
        min = 0, 
        max = 100, 
        step = 1,
        color = '#00639b' 
    } = $props<{
        value: number,
        min?: number,
        max?: number,
        step?: number,
        color?: string
    }>();

    let percentage = $derived(((value - min) / (max - min)) * 100);
</script>

<input 
    type="range" 
    {min} 
    {max} 
    {step} 
    bind:value={value}
    class="custom-slider"
    style:--track-color={color}
    style:--track-fill="{percentage}%"
/>

<style>
    .custom-slider {
        -webkit-appearance: none;
        appearance: none;
        width: 100%;
        height: 6px;
        background: linear-gradient(to right, var(--track-color) 0%, var(--track-color) var(--track-fill), #e0e0e0 var(--track-fill), #e0e0e0 100%);
        border-radius: 3px;
        outline: none;
        margin: 0;
        cursor: pointer;
    }

    /* --- Thumb (Handtaget) - Standardiserad design --- */
    .custom-slider::-webkit-slider-thumb {
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

    .custom-slider:active::-webkit-slider-thumb {
        transform: scale(1.1);
    }

    .custom-slider::-moz-range-thumb {
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: #fff;
        border: 1px solid rgba(0,0,0,0.1);
        box-shadow: 0 1px 3px rgba(0,0,0,0.3);
        cursor: pointer;
        transition: transform 0.1s;
    }

    /* Dark mode */
    :global(body.dark-mode) .custom-slider {
        background: linear-gradient(to right, var(--track-color) 0%, var(--track-color) var(--track-fill), #444 var(--track-fill), #444 100%);
    }
    
    :global(body.dark-mode) .custom-slider::-webkit-slider-thumb {
        background: #eee;
        border-color: #333;
    }
    :global(body.dark-mode) .custom-slider::-moz-range-thumb {
        background: #eee;
        border-color: #333;
    }
</style>