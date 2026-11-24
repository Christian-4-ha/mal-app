export interface History<T> {
  push(s: T): void;
  undo(): T | undefined;
  canUndo(): boolean;
  clear(): void;
}

export function createHistory<T>(limit = 20): History<T> {
  const stack: T[] = [];
  return {
    push(s) {
      stack.push(s);
      if (stack.length > limit) stack.shift();
    },
    undo: () => stack.pop(),
    canUndo: () => stack.length > 0,
    clear() {
      stack.length = 0;
    },
  };
}
