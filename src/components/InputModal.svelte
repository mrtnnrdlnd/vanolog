<script lang="ts">
    import { store } from '../lib/store.svelte';
    import { CONFIG } from '../lib/types';

    let val = $state(0);
    let inputEl: HTMLInputElement;
    
    // Förenklad: Bara kolla selectedIdx
    const d = $derived(store.selectedIdx !== null ? store.data[store.selectedIdx] : null);

    $effect(() => {
        if (d) {
            val = d.val || 0;
            setTimeout(() => inputEl?.focus(), 50);
        }
    });

    function save() {
        store.updateValue(val);
        store.selectedIdx = null;
    }
    
    function close() { store.selectedIdx = null; }
    function handleKeydown(e: KeyboardEvent) {
        if (e.key === 'Enter') save();
        if (e.key === 'Escape') close();
    }
</script>

{#if d}
    <div class="modal-overlay" onclick={close} role="dialog" tabindex="-1">
        <div class="modal-card" onclick={(e) => e.stopPropagation()} role="document" tabindex="0" onkeydown={handleKeydown}>
            
            <div class="modal-header">
                <span class="modal-subtitle">{CONFIG.months[d.monthIdx]} {d.year}</span>
                <h3 class="modal-title">{d.day} {CONFIG.months[d.monthIdx]}</h3>
            </div>

            <div class="input-wrapper">
                <label for="val-input">Värde</label>
                <input 
                    id="val-input"
                    type="number" 
                    bind:this={inputEl}
                    bind:value={val} 
                    class="unified-input big"
                />
            </div>

            <div class="buttons">
                <button class="btn secondary" onclick={close}>Avbryt</button>
                <button class="btn primary" onclick={save}>Spara</button>
            </div>
        </div>
    </div>
{/if}

<style>
    /* ... Samma CSS som du redan har (se tidigare svar) ... */
    /* Du behöver inte ändra CSS här om du redan har den senaste versionen */
    .modal-overlay { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.3); backdrop-filter: blur(4px); z-index: 1000; display: flex; align-items: center; justify-content: center; animation: fade-in 0.2s ease-out; }
    .modal-card { background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border-radius: 16px; box-shadow: 0 20px 50px rgba(0,0,0,0.2); border: 1px solid rgba(255, 255, 255, 0.5); padding: 24px; width: 85%; max-width: 280px; display: flex; flex-direction: column; gap: 20px; transform: scale(0.95); animation: pop-in 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
    .modal-header { text-align: center; }
    .modal-subtitle { font-size: 11px; text-transform: uppercase; color: #888; letter-spacing: 1px; font-weight: 700; display: block; margin-bottom: 4px; }
    .modal-title { margin: 0; color: #333; font-size: 24px; font-weight: 700; }
    .input-wrapper { display: flex; flex-direction: column; gap: 6px; }
    .input-wrapper label { font-size: 12px; color: #666; font-weight: 500; margin-left: 2px; }
    .buttons { display: flex; gap: 10px; margin-top: 5px; }
    .btn { flex: 1; padding: 12px; border: none; border-radius: 10px; font-size: 15px; font-weight: 600; cursor: pointer; transition: transform 0.1s, background 0.2s; }
    .btn:active { transform: scale(0.97); }
    .btn.primary { background: #00639b; color: white; box-shadow: 0 4px 15px rgba(0, 99, 155, 0.25); }
    .btn.secondary { background: rgba(0,0,0,0.05); color: #555; }
    .btn.secondary:hover { background: rgba(0,0,0,0.1); }
    @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
    @keyframes pop-in { to { transform: scale(1); } }
</style>