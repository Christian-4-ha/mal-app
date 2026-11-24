export interface History<T> {
  push(s: T): void;
  undo(): T | undefined;
  canUndo(): boolean;
  clear(): void;
}

/**
 * Rückgängig-Verlauf mit Obergrenze für Anzahl und (optional) Speicherbedarf.
 * Der neueste Eintrag bleibt immer erhalten.
 */
export function createHistory<T>(limit = 20, budget?: { maxBytes: number; sizeOf: (s: T) => number }): History<T> {
  const stack: T[] = [];
  let bytes = 0;
  const size = (s: T) => budget?.sizeOf(s) ?? 0;
  return {
    push(s) {
      stack.push(s);
      bytes += size(s);
      while (stack.length > 1 && (stack.length > limit || (budget && bytes > budget.maxBytes))) {
        bytes -= size(stack.shift()!);
      }
    },
    undo() {
      const s = stack.pop();
      if (s !== undefined) bytes -= size(s);
      return s;
    },
    canUndo: () => stack.length > 0,
    clear() {
      stack.length = 0;
      bytes = 0;
    },
  };
}
