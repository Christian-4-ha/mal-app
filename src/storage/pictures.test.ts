// @vitest-environment node
import { beforeEach, describe, expect, it } from 'vitest';
import { blobOf, freshDb, textOf } from './test-helpers';
import { createPicture, getPicture, listPictures, listTrash, overwritePicture, purgeTrash } from './pictures';
import { getDb } from './db';

const DAY = 24 * 60 * 60 * 1000;

function sample(text: string, profileId = 'p1') {
  return { profileId, modeId: 'free-paint', templateId: null, paint: blobOf(text), thumb: blobOf('t' + text), width: 10, height: 10 };
}
function data(text: string) {
  return { paint: blobOf(text), thumb: blobOf('t' + text), width: 10, height: 10 };
}

describe('pictures', () => {
  beforeEach(freshDb);

  it('Überschreiben mit keepPrevious legt Original in den Papierkorb', async () => {
    const pic = await createPicture(sample('A'), 1000);
    await overwritePicture(pic.id, data('B'), { keepPrevious: true }, 2000);
    expect(await textOf((await getPicture(pic.id))!.paint)).toBe('B');
    const trash = await listTrash();
    expect(trash).toHaveLength(1);
    expect(await textOf(trash[0].picture.paint)).toBe('A');
    expect(trash[0].reason).toBe('overwritten');
    expect(trash[0].trashedAt).toBe(2000);
  });

  it('Überschreiben ohne keepPrevious legt nichts in den Papierkorb', async () => {
    const pic = await createPicture(sample('A'), 1000);
    const updated = await overwritePicture(pic.id, data('B'), { keepPrevious: false }, 2000);
    expect(await listTrash()).toHaveLength(0);
    expect(updated.updatedAt).toBe(2000);
    expect(updated.createdAt).toBe(1000);
  });

  it('purgeTrash entfernt nur Einträge älter als 30 Tage', async () => {
    const now = 100 * DAY;
    const a = await createPicture(sample('A'), 0);
    const b = await createPicture(sample('B'), 0);
    await overwritePicture(a.id, data('A2'), { keepPrevious: true }, now - 31 * DAY);
    await overwritePicture(b.id, data('B2'), { keepPrevious: true }, now - 29 * DAY);
    expect(await purgeTrash(now)).toBe(1);
    const left = await listTrash();
    expect(left).toHaveLength(1);
    expect(await textOf(left[0].picture.paint)).toBe('B');
  });

  it('listPictures liefert nur Bilder des Profils, neueste zuerst', async () => {
    await createPicture(sample('alt', 'p1'), 1000);
    await createPicture(sample('neu', 'p1'), 3000);
    await createPicture(sample('fremd', 'p2'), 2000);
    const list = await listPictures('p1');
    expect(await Promise.all(list.map((p) => textOf(p.paint)))).toEqual(['neu', 'alt']);
  });

  it('nutzt die gemeinsame Datenbank', async () => {
    expect(getDb()).toBeTruthy();
  });
});
