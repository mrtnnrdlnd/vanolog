import type { GraphMode } from '../types';

export function calculateStat(values: (number | null)[], mode: GraphMode): number | null {
    // Filtrera bort null/undefined/NaN så vi bara har riktiga tal
    const valid = values.filter((v): v is number => v !== null && v !== undefined && !isNaN(v));
    
    if (valid.length === 0) return null;

    // --- NYTT: Fallback för 'all' ---
    // Layout-motorn använder denna funktion för att skapa staplar/punkter per kolumn.
    // Även om vi ska rita en detaljerad linje, kan det vara bra att returnera 
    // medelvärdet här så att systemet inte kraschar om man byter graf-typ.
    if (mode === 'all') {
        return valid.reduce((a, b) => a + b, 0) / valid.length;
    }

    // --- MEDELVÄRDE (Average) ---
    if (mode === 'avg') {
        return valid.reduce((a, b) => a + b, 0) / valid.length;
    }
    
    // --- MAXVÄRDE ---
    if (mode === 'max') {
        return Math.max(...valid);
    }

    // --- MINVÄRDE ---
    if (mode === 'min') {
        return Math.min(...valid);
    }

    // --- MEDIAN ---
    if (mode === 'median') {
        // Sortera kopia av arrayen (för att inte ändra originalet)
        const sorted = [...valid].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        
        // Om udda antal: ta mittenvärdet
        if (sorted.length % 2 !== 0) {
            return sorted[mid];
        } 
        // Om jämnt antal: ta snittet av de två i mitten
        else {
            return (sorted[mid - 1] + sorted[mid]) / 2;
        }
    }

    return 0;
}