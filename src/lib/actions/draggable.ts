/**
 * Action för att göra ett element dragbart.
 * Hanterar både MouseEvent och TouchEvent.
 */
export interface DragOptions {
    onDragStart?: (coords: { x: number; y: number }) => void;
    onDrag: (delta: { dx: number; dy: number }) => void;
    onDragEnd?: () => void;
    axis?: 'x' | 'y' | 'both'; // Kan användas för att t.ex. låsa touch-scroll
}

export function draggable(node: HTMLElement, options: DragOptions) {
    let startX = 0;
    let startY = 0;

    function handleStart(event: MouseEvent | TouchEvent) {
        // Förhindra default bara om vi vill stoppa scroll etc, 
        // men oftast vill vi stoppa propagation så inte andra saker triggas.
        event.stopPropagation();
        
        const clientX = (window.TouchEvent && event instanceof TouchEvent) 
            ? event.touches[0].clientX 
            : (event as MouseEvent).clientX;
            
        const clientY = (window.TouchEvent && event instanceof TouchEvent) 
            ? event.touches[0].clientY 
            : (event as MouseEvent).clientY;

        startX = clientX;
        startY = clientY;

        options.onDragStart?.({ x: clientX, y: clientY });

        // Lägg lyssnare på window för att hantera om man drar utanför elementet
        window.addEventListener('mousemove', handleMove);
        window.addEventListener('touchmove', handleMove, { passive: false });
        window.addEventListener('mouseup', handleEnd);
        window.addEventListener('touchend', handleEnd);
    }

    function handleMove(event: MouseEvent | TouchEvent) {
        const clientX = (window.TouchEvent && event instanceof TouchEvent) 
            ? event.touches[0].clientX 
            : (event as MouseEvent).clientX;
            
        const clientY = (window.TouchEvent && event instanceof TouchEvent) 
            ? event.touches[0].clientY 
            : (event as MouseEvent).clientY;

        const dx = clientX - startX;
        const dy = clientY - startY;

        // Om vi bara bryr oss om Y-axeln (som i YAxis), kan vi preventDefault 
        // på touchmove för att stoppa webbläsaren från att scrolla sidan.
        if (options.axis === 'y' && event instanceof TouchEvent) {
            event.preventDefault();
        }

        options.onDrag({ dx, dy });
    }

    function handleEnd() {
        options.onDragEnd?.();
        
        window.removeEventListener('mousemove', handleMove);
        window.removeEventListener('touchmove', handleMove);
        window.removeEventListener('mouseup', handleEnd);
        window.removeEventListener('touchend', handleEnd);
    }

    // Initiera lyssnare på elementet
    node.addEventListener('mousedown', handleStart);
    node.addEventListener('touchstart', handleStart, { passive: false });

    return {
        destroy() {
            node.removeEventListener('mousedown', handleStart);
            node.removeEventListener('touchstart', handleStart);
            // Säkerställ att window-lyssnare tas bort om komponenten dör mitt i ett drag
            window.removeEventListener('mousemove', handleMove);
            window.removeEventListener('touchmove', handleMove);
            window.removeEventListener('mouseup', handleEnd);
            window.removeEventListener('touchend', handleEnd);
        }
    };
}