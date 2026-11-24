// @vitest-environment node
import { beforeEach, describe, expect, it } from 'vitest';
import { blobOf, freshDb, textOf } from './test-helpers';
import { getSetting, setSetting } from './settings';
import { addUsage, allowedMinutes, getDayQuota, getUsage, setDayQuota } from './quota-store';
import { createProfile, deleteProfile, listProfiles } from './profiles';
import { createPicture, deletePicture, deleteTrashEntry, getPicture, listPictures, listTrash, overwritePicture, restoreFromTrash } from './pictures';

const sample = (t: string, profileId = 'p1') => ({ profileId, modeId: 'free-paint', templateId: null, paint: blobOf(t), thumb: blobOf(t), width: 1, height: 1 });

describe('Plan-2-Speicher', () => {
  beforeEach(freshDb);

  it('Einstellungen lesen und schreiben', async () => {
    expect(await getSetting('x')).toBeUndefined();
    await setSetting('x', { a: 1 });
    expect(await getSetting('x')).toEqual({ a: 1 });
  });

  it('Tageskontingent: Tageswert, sonst Standard des Profils', async () => {
    const p = await createProfile('Lena', null);
    expect(await allowedMinutes('2026-11-25', p)).toBe(30);
    expect(await getDayQuota('2026-11-25')).toBeUndefined();
    await setDayQuota('2026-11-25', { [p.id]: 45 });
    expect(await allowedMinutes('2026-11-25', p)).toBe(45);
    expect(await allowedMinutes('2026-11-26', p)).toBe(30);
  });

  it('Verbrauch summiert sich je Tag und Profil', async () => {
    await addUsage('2026-11-25', 'p1', 10);
    await addUsage('2026-11-25', 'p1', 5);
    expect(await getUsage('2026-11-25', 'p1')).toBe(15);
    expect(await getUsage('2026-11-26', 'p1')).toBe(0);
    expect(await getUsage('2026-11-25', 'p2')).toBe(0);
  });

  it('Bild löschen legt es in den Papierkorb, Wiederherstellen holt es zurück', async () => {
    const pic = await createPicture(sample('A'), 1);
    await deletePicture(pic.id);
    expect(await listPictures('p1')).toHaveLength(0);
    const [entry] = await listTrash();
    expect(entry.reason).toBe('deleted');
    await restoreFromTrash(entry.id);
    expect(await listTrash()).toHaveLength(0);
    expect(await textOf((await getPicture(pic.id))!.paint)).toBe('A');
  });

  it('Wiederherstellen einer überschriebenen Fassung legt eine Kopie an', async () => {
    const pic = await createPicture(sample('A'), 1);
    await overwritePicture(pic.id, { paint: blobOf('B'), thumb: blobOf('B'), width: 1, height: 1 }, { keepPrevious: true }, 2);
    const [entry] = await listTrash();
    await restoreFromTrash(entry.id);
    const all = await listPictures('p1');
    expect(all).toHaveLength(2);
    expect((await Promise.all(all.map((p) => textOf(p.paint)))).sort()).toEqual(['A', 'B']);
  });

  it('Papierkorb-Eintrag endgültig löschen', async () => {
    const pic = await createPicture(sample('A'), 1);
    await deletePicture(pic.id);
    await deleteTrashEntry((await listTrash())[0].id);
    expect(await listTrash()).toHaveLength(0);
  });

  it('Profil löschen verschiebt seine Bilder in den Papierkorb', async () => {
    const p = await createProfile('Mia', null);
    await createPicture(sample('A', p.id), 1);
    await deleteProfile(p.id);
    expect(await listProfiles()).toHaveLength(0);
    expect(await listPictures(p.id)).toHaveLength(0);
    expect(await listTrash()).toHaveLength(1);
  });
});
