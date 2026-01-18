<script lang="ts">
    let { label, checked, onChange } = $props<{ 
        label: string, 
        checked: boolean, 
        onChange: (v: boolean) => void 
    }>();
</script>

<div class="setting-row">
    <span class="setting-label">{label}</span>
    <button 
        class="toggle-switch {checked ? 'active' : ''}" 
        onclick={() => onChange(!checked)}
        role="switch" 
        aria-checked={checked} 
        aria-label={label}
    >
        <div class="toggle-knob"></div>
    </button>
</div>

<style>
    .setting-row { display: flex; justify-content: space-between; align-items: center; }
    .setting-label { font-size: 14px; font-weight: 500; color: var(--text-main); }
    
    .toggle-switch { width: 44px; height: 24px; background: #e0e0e0; border-radius: 20px; position: relative; cursor: pointer; border: none; transition: background 0.3s; }
    .toggle-switch.active { background: #00639b; }
    .toggle-knob { width: 20px; height: 20px; background: #fff; border-radius: 50%; position: absolute; top: 2px; left: 2px; transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1); box-shadow: 0 2px 4px rgba(0,0,0,0.15); }
    .toggle-switch.active .toggle-knob { transform: translateX(20px); }

    :global(body.dark-mode) .toggle-switch { background: #444; }
    :global(body.dark-mode) .toggle-switch.active { background: #00639b; }
</style>