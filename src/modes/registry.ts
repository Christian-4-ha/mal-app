import type { Screen } from '../app/screen';
import type { Profile } from '../storage/types';

export interface AppContext {
  profile: Profile;
}

export interface Mode {
  id: string;
  icon: string;
  order: number;
  pinnedFirst?: boolean;
  open(ctx: AppContext): Screen;
}

const modes = new Map<string, Mode>();

export function registerMode(m: Mode): void {
  if (modes.has(m.id)) throw new Error(`Modus ${m.id} ist schon registriert`);
  modes.set(m.id, m);
}

export function listModes(): Mode[] {
  return [...modes.values()].sort(
    (a, b) => Number(!!b.pinnedFirst) - Number(!!a.pinnedFirst) || a.order - b.order,
  );
}

export function getMode(id: string): Mode | undefined {
  return modes.get(id);
}

export function resetModesForTest(): void {
  modes.clear();
}
