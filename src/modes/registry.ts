import type { Screen } from '../app/screen';
import type { Profile } from '../storage/types';

export interface AppContext {
  profile: Profile;
}

export interface MenuTile {
  id: string;
  icon: string;
  /** Beschriftung unter der Kachel */
  label?: string;
  onTap(): void;
}

/** Zusatzreihen im Modus-Menü (Reihe 2: z. B. Themen, Reihe 3: z. B. Vorlagen). */
export interface MenuRows {
  setRow(level: 2 | 3, items: MenuTile[] | null): void;
}

/** Ein Modus öffnet entweder direkt einen Bildschirm (open) oder zeigt Zusatzreihen (expand). */
/** Gruppen im Menü: Malen und Spielen (ohne Gruppe = oberste Ebene, z. B. Galerie). */
export type MenuGroup = 'paint' | 'play';

export interface Mode {
  id: string;
  icon: string;
  label: string;
  group?: MenuGroup;
  order: number;
  pinnedFirst?: boolean;
  open?(ctx: AppContext): Screen;
  expand?(ctx: AppContext, rows: MenuRows): void;
}

const modes = new Map<string, Mode>();

export function registerMode(m: Mode): void {
  if (modes.has(m.id)) throw new Error(`Modus ${m.id} ist schon registriert`);
  modes.set(m.id, m);
}

/** Alle Modi, oder nur die einer Gruppe (null = oberste Ebene). */
export function listModes(group?: MenuGroup | null): Mode[] {
  const all = [...modes.values()].filter((m) => group === undefined || (m.group ?? null) === group);
  return all.sort(
    (a, b) => Number(!!b.pinnedFirst) - Number(!!a.pinnedFirst) || a.order - b.order,
  );
}

export function getMode(id: string): Mode | undefined {
  return modes.get(id);
}

export function resetModesForTest(): void {
  modes.clear();
}
