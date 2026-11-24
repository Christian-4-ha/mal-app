import type { Pt } from './view-transform';

export type RouterEvent = {
  kind: 'down' | 'move' | 'up' | 'cancel';
  id: number;
  type: 'touch' | 'pen' | 'mouse';
  x: number;
  y: number;
};

export type RouterAction =
  | { do: 'strokeStart' | 'strokeMove' | 'strokeEnd' | 'strokeAbort'; x: number; y: number }
  | { do: 'gesture'; points: [Pt, Pt] }
  | { do: 'gestureEnd' }
  | { do: 'none' };

/**
 * Entscheidet, welcher Zeiger malen darf.
 * - idle: erster Zeiger startet einen Strich
 * - stroke: nur der malende Zeiger zählt; bei Zoom bricht ein zweiter Finger den Strich ab → gesture
 * - gesture: alle Finger werden verfolgt, Ende erst wenn alle oben sind
 * - blocked: Strich ist zu Ende, aber andere Finger liegen noch (z. B. Handballen); neue werden ignoriert
 */
export function createPointerRouter(getZoomEnabled: () => boolean): (e: RouterEvent) => RouterAction {
  let mode: 'idle' | 'stroke' | 'gesture' | 'blocked' = 'idle';
  let drawer = -1;
  const pointers = new Map<number, { type: RouterEvent['type']; x: number; y: number }>();
  const none: RouterAction = { do: 'none' };

  const penActive = () => [...pointers.values()].some((p) => p.type === 'pen');
  const twoPoints = (): [Pt, Pt] => {
    const [a, b] = [...pointers.values()];
    return [{ x: a.x, y: a.y }, { x: b.x, y: b.y }];
  };

  return (e) => {
    switch (e.kind) {
      case 'down': {
        if (e.type === 'touch' && penActive()) return none;
        if (mode === 'blocked') return none;
        pointers.set(e.id, { type: e.type, x: e.x, y: e.y });
        if (mode === 'idle') {
          mode = 'stroke';
          drawer = e.id;
          return { do: 'strokeStart', x: e.x, y: e.y };
        }
        if (mode === 'stroke' && getZoomEnabled() && e.type !== 'pen' && pointers.get(drawer)?.type !== 'pen') {
          mode = 'gesture';
          return { do: 'strokeAbort', x: e.x, y: e.y };
        }
        return none;
      }
      case 'move': {
        const p = pointers.get(e.id);
        if (!p) return none;
        p.x = e.x;
        p.y = e.y;
        if (mode === 'stroke' && e.id === drawer) return { do: 'strokeMove', x: e.x, y: e.y };
        if (mode === 'gesture' && pointers.size >= 2) return { do: 'gesture', points: twoPoints() };
        return none;
      }
      case 'up':
      case 'cancel': {
        if (!pointers.has(e.id)) return none;
        pointers.delete(e.id);
        if (mode === 'stroke' && e.id === drawer) {
          mode = pointers.size === 0 ? 'idle' : 'blocked';
          return { do: 'strokeEnd', x: e.x, y: e.y };
        }
        if (pointers.size === 0) {
          const wasGesture = mode === 'gesture';
          mode = 'idle';
          if (wasGesture) return { do: 'gestureEnd' };
        }
        return none;
      }
    }
  };
}
