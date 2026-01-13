export const THEME = {
    primary: '#00639b',
    sunday: '#d32f2f',
    bgMonth: (m: number) => `hsl(${m * 30}, 40%, 95%)`, // Dynamisk färg baserat på månad
};

export function getHeatmapColor(val: number | null, min: number, max: number): string {
    if (val === null) return '#ffffff';
    const normalized = Math.max(0, Math.min(1, (val - min) / (max - min)));
    // Guld-orange skala
    return `hsl(35, ${normalized * 100}%, ${100 - (normalized * 60)}%)`;
}