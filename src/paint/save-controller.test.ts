import { describe, expect, it, vi } from 'vitest';
import { createSaveController } from './save-controller';
import type { Picture } from '../storage/types';

const blobs = { paint: new Blob(['p']), thumb: new Blob(['t']), width: 10, height: 10 };

function pic(id = 'x'): Picture {
  return { id, profileId: 'p1', modeId: 'free-paint', templateId: null, ...blobs, createdAt: 1, updatedAt: 1 };
}

function setup(opts: { existing?: Picture | null; blank?: boolean; failCreate?: boolean } = {}) {
  const store = {
    createPicture: vi.fn(async (input: Omit<Picture, 'id' | 'createdAt' | 'updatedAt'>) => {
      if (opts.failCreate) throw new Error('QuotaExceeded');
      await new Promise((r) => setTimeout(r, 5));
      return { ...input, id: 'neu', createdAt: 1, updatedAt: 1 } as Picture;
    }),
    overwritePicture: vi.fn(async (id: string, _data: unknown, _opts: unknown) => pic(id)),
  };
  const c = createSaveController({
    profileId: 'p1',
    modeId: 'free-paint',
    templateId: null,
    existing: opts.existing ?? null,
    getBlobs: async () => blobs,
    isBlank: () => opts.blank ?? false,
    store: store as never,
  });
  return { c, store };
}

describe('save controller', () => {
  it('ohne Änderung wird nichts gespeichert', async () => {
    const { c, store } = setup();
    expect(await c.save()).toBe('skipped');
    expect(store.createPicture).not.toHaveBeenCalled();
  });

  it('neue leere Fläche wird nicht gespeichert', async () => {
    const { c, store } = setup({ blank: true });
    c.markDirty();
    expect(await c.save()).toBe('skipped');
    expect(store.createPicture).not.toHaveBeenCalled();
  });

  it('zweimal speichern erzeugt einen Eintrag und überschreibt ohne Papierkorb', async () => {
    const { c, store } = setup();
    c.markDirty();
    expect(await c.save()).toBe('saved');
    expect(c.pictureId).toBe('neu');
    expect(c.dirty).toBe(false);
    c.markDirty();
    expect(await c.save()).toBe('saved');
    expect(store.createPicture).toHaveBeenCalledTimes(1);
    expect(store.overwritePicture).toHaveBeenCalledWith('neu', blobs, { keepPrevious: false });
  });

  it('vorhandenes Bild: nur erstes Überschreiben mit keepPrevious', async () => {
    const { c, store } = setup({ existing: pic('alt') });
    expect(c.pictureId).toBe('alt');
    c.markDirty();
    await c.save();
    c.markDirty();
    await c.save();
    expect(store.overwritePicture.mock.calls.map((a) => a[2])).toEqual([{ keepPrevious: true }, { keepPrevious: false }]);
  });

  it('vorhandenes Bild geleert: wird trotzdem gespeichert (Original geht in den Papierkorb)', async () => {
    const { c, store } = setup({ existing: pic('alt'), blank: true });
    c.markDirty();
    expect(await c.save()).toBe('saved');
    expect(store.overwritePicture).toHaveBeenCalledWith('alt', blobs, { keepPrevious: true });
  });

  it('parallele save()-Aufrufe → genau ein createPicture', async () => {
    const { c, store } = setup();
    c.markDirty();
    await Promise.all([c.save(), c.save(), c.save()]);
    expect(store.createPicture).toHaveBeenCalledTimes(1);
  });

  it('Änderung während des Speicherns wird danach nachgespeichert', async () => {
    const { c, store } = setup();
    c.markDirty();
    const first = c.save();
    c.markDirty();
    await first;
    await c.save();
    expect(store.createPicture).toHaveBeenCalledTimes(1);
    expect(store.overwritePicture).toHaveBeenCalledTimes(1);
    expect(c.dirty).toBe(false);
  });

  it('Fehler beim Speichern → error, dirty bleibt true', async () => {
    const { c } = setup({ failCreate: true });
    c.markDirty();
    expect(await c.save()).toBe('error');
    expect(c.dirty).toBe(true);
    expect(c.pictureId).toBeNull();
  });
});
