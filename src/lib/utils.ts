import type { GraphMode } from './types';

export function calculateStat(values: (number | null)[], mode: GraphMode): number | null {
    const valid = values.filter((v): v is number => v !== null && v !== undefined && !isNaN(v));
    if (valid.length === 0) return null;
    
    if (mode === 'avg') return valid.reduce((a, b) => a + b, 0) / valid.length;
    if (mode === 'max') return Math.max(...valid);
    if (mode === 'min') return Math.min(...valid);
    if (mode === 'median') {
        const s = [...valid].sort((a, b) => a - b);
        const m = Math.floor(s.length / 2);
        return s.length % 2 !== 0 ? s[m] : (s[m - 1] + s[m]) / 2;
    }
    return 0;
}

export function createMonthPath(
    cStart: number, rStart: number, cEnd: number, rEnd: number, 
    stride: number, r: number, gridTop: number, gridFullBottom: number, rows: number
): string {
    const w = stride, h = stride;
    const xStart = cStart * w, yStart = gridTop + (rStart * h);
    const xEnd = (cEnd * w) + w, yEndBottom = gridTop + (rEnd * h) + h;
    const isEndLastRow = (rEnd === rows - 1);
    const yBottom = isEndLastRow ? gridFullBottom : yEndBottom;
    const M = (x: number, y: number) => `M ${x},${y}`, L = (x: number, y: number) => `L ${x},${y}`, arc = (dx: number, dy: number, s = 1) => `a ${r},${r} 0 0 ${s} ${dx},${dy}`;

    if (cStart === cEnd) {
        return [M(xStart+r,yStart), L(xStart+w-r,yStart), arc(r,r), L(xStart+w,yBottom-r), arc(-r,r), L(xStart+r,yBottom), arc(-r,-r), L(xStart,yStart+r), arc(r,-r), "Z"].join(" ");
    }
    let p = [M(xStart+r,yStart), L(xStart+w-r,yStart)];
    if (rStart > 0) { p.push(arc(r,-r,0), L(xStart+w, gridTop+r), arc(r,-r)); }
    p.push(L(xEnd-r, gridTop), arc(r,r), L(xEnd, yBottom-r), arc(-r,r));
    if (!isEndLastRow) { p.push(L(xEnd-w+r, yBottom), arc(-r,r,0), L(xEnd-w, gridFullBottom-r), arc(-r,r)); }
    else p.push(L(xEnd-w, gridFullBottom));
    p.push(L(xStart+r, gridFullBottom), arc(-r,-r), L(xStart, yStart+r), arc(r,-r), "Z");
    return p.join(" ");
}

export function getCellStyle(val: number | null, min: number, max: number): string {
    if (val === null) return '#fff';
    const normalized = Math.max(0, Math.min(1, (val - min) / (max - min)));
    return `hsl(35, ${normalized * 100}%, ${100 - (normalized * 60)}%)`;
}