<script lang="ts">
    let { 
        label, 
        options, 
        currentValue, 
        onChange, 
        layout = 'flex',
        color = '#00639b' // Standardfärg
    } = $props<{
        label: string,
        options: { label: string, value: any, fullWidth?: boolean }[],
        currentValue: any,
        onChange: (val: any) => void,
        layout?: 'flex' | 'grid',
        color?: string
    }>();
</script>

<div class="setting-group" style:--accent-color={color}>
    <span class="group-label">{label}</span>
    <div class="selector-container {layout}">
        {#each options as opt}
            <button 
                class:active={currentValue === opt.value} 
                class:full-width={opt.fullWidth}
                onclick={() => onChange(opt.value)}
            >
                {opt.label}
            </button>
        {/each}
    </div>
</div>

<style>
    /* ... (Samma CSS som förut) ... */
    .setting-group .group-label { display: block; font-size: 11px; font-weight: 700; margin-bottom: 8px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; } 
    
    .selector-container { background: rgba(0,0,0,0.05); border-radius: 10px; padding: 4px; }
    .selector-container.flex { display: flex; }
    .selector-container.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 3px; }
    
    .selector-container button { 
        border: none; background: transparent; font-size: 13px; font-weight: 500; 
        color: var(--text-muted); border-radius: 7px; cursor: pointer; transition: all 0.2s;
    }
    .selector-container.flex button { flex: 1; padding: 8px 0; }
    .selector-container.grid button { padding: 10px 0; }
    .selector-container.grid button.full-width { grid-column: 1 / -1; margin-top: 2px; }
    
    .selector-container button:hover { background: rgba(255,255,255,0.4); }
    
    /* ÄNDRING: Använd accent-färgen här */
    .selector-container button.active { 
        background: var(--bg-card, #fff); 
        box-shadow: 0 2px 6px rgba(0,0,0,0.08); 
        color: var(--accent-color); /* Dynamisk textfärg */
        font-weight: 600; 
    }

    :global(body.dark-mode) .selector-container { background: rgba(255,255,255,0.1); }
</style>