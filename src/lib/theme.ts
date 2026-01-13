export const THEME = {
    primary: '#00639b',
    sunday: '#d32f2f',
};

export function getHeatmapColor(
    val: number | null, 
    min: number, 
    max: number, 
    isDark: boolean = false,
    targetHue: number = 35 // Default
): string {
    // Tomma celler: Vitt i light mode, Mörkgrått i dark mode
    if (val === null) return isDark ? '#1e1e1e' : '#ffffff';

    const range = max - min;
    const normalized = range === 0 ? 0 : Math.max(0, Math.min(1, (val - min) / range));

    if (isDark) {
        // --- DARK MODE PALETT ---
        // Vi använder vald Hue men justerar mättnad och ljus för "neon"-effekt
        // Hue shiftar något mot ljusare (t.ex -15 grader) för dynamik
        const h = targetHue - (normalized * 15); 
        const s = 30 + (normalized * 60);  // Mer mättnad vid höga värden
        const l = 25 + (normalized * 45);  // Ljusare vid höga värden
        return `hsl(${h}, ${s}%, ${l}%)`;
    } else {
        // --- LIGHT MODE PALETT ---
        // Ljusare pastell vid låga värden, starkare vid höga
        // Vi behåller vald Hue.
        const s = 60 + (normalized * 40); 
        const l = 95 - (normalized * 50); // Mörkare (mer färg) vid höga värden
        return `hsl(${targetHue}, ${s}%, ${l}%)`;
    }
}