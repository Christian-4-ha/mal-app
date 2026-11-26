import type { TemplateInfo, TemplateSource, Theme } from './types';

export interface Catalog {
  themes: Theme[];
  templates: TemplateInfo[];
}

const SAFE_FILE = /^[a-z0-9_-]+\/[a-z0-9_-]+\.svg$/;
const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;

/** Prüft den Katalog; fehlerhafte Einträge werden verworfen, Themen ohne Vorlagen ausgeblendet. */
export function parseCatalog(json: unknown): Catalog {
  const rawThemes = isObj(json) && Array.isArray(json.themes) ? json.themes : [];
  const rawTemplates = isObj(json) && Array.isArray(json.templates) ? json.templates : [];
  const themeList = rawThemes.filter((t): t is { id: string; name?: unknown } => isObj(t) && typeof t.id === 'string');
  const themeIds = themeList.map((t) => t.id);
  const nameOf = (v: unknown) => (typeof v === 'string' && v ? { name: v } : {});
  const seen = new Set<string>();
  const templates: TemplateInfo[] = [];
  for (const t of rawTemplates) {
    if (!isObj(t) || typeof t.id !== 'string' || typeof t.theme !== 'string' || typeof t.file !== 'string') continue;
    if (seen.has(t.id) || !themeIds.includes(t.theme) || !SAFE_FILE.test(t.file)) continue;
    seen.add(t.id);
    templates.push({ id: t.id, ...nameOf(t.name), theme: t.theme, file: t.file, ...(t.hidden === true ? { hidden: true } : {}) });
  }
  const themes: Theme[] = [];
  for (const id of themeIds) {
    const first = templates.find((t) => t.theme === id && !t.hidden);
    if (first) themes.push({ id, ...nameOf(themeList.find((t) => t.id === id)!.name), icon: first.file });
  }
  return { themes, templates };
}

const base = () => `${import.meta.env.BASE_URL}templates/`;

let cached: Promise<Catalog> | null = null;
function load(): Promise<Catalog> {
  cached ??= fetch(base() + 'catalog.json')
    .then((r) => r.json())
    .then(parseCatalog)
    .catch((e) => {
      cached = null;
      console.error(e);
      return { themes: [], templates: [] };
    });
  return cached;
}

export const catalogSource: TemplateSource = {
  id: 'catalog',
  listThemes: async () => (await load()).themes,
  listTemplates: async (themeId) => (await load()).templates.filter((t) => t.theme === themeId && !t.hidden),
  previewUrl: (t) => base() + ('file' in t ? t.file : t.icon),
  async loadSvg(templateId) {
    const t = (await load()).templates.find((x) => x.id === templateId);
    if (!t) return undefined;
    const r = await fetch(base() + t.file);
    return r.ok ? r.text() : undefined;
  },
};
