import type { Tool } from './types';

const tools = new Map<string, Tool>();

export function registerTool(t: Tool): void {
  if (tools.has(t.id)) throw new Error(`Werkzeug ${t.id} ist schon registriert`);
  tools.set(t.id, t);
}

export function listTools(): Tool[] {
  return [...tools.values()].sort((a, b) => a.order - b.order);
}

export function resetToolsForTest(): void {
  tools.clear();
}
