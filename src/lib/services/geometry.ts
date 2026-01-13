// All SVG-matte för månaderna
export function createMonthPath(
    cStart: number, rStart: number, cEnd: number, rEnd: number, 
    stride: number, r: number, gridTop: number, gridFullBottom: number, rows: number
): string {
    const w = stride, h = stride;
    const xStart = cStart * w, yStart = gridTop + (rStart * h);
    const xEnd = (cEnd * w) + w, yEndBottom = gridTop + (rEnd * h) + h;
    const isEndLastRow = (rEnd === rows - 1);
    const yBottom = isEndLastRow ? gridFullBottom : yEndBottom;
    const M = (x: number, y: number) => `M ${x},${y}`; 
    const L = (x: number, y: number) => `L ${x},${y}`; 
    const arc = (dx: number, dy: number, s = 1) => `a ${r},${r} 0 0 ${s} ${dx},${dy}`;

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