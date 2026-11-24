import { db, type PictureRecord, type TrashRecord } from './db';
import { packBlob, unpackBlob } from './blob-store';
import type { Picture, TrashEntry } from './types';

const TRASH_KEEP_MS = 30 * 24 * 60 * 60 * 1000;

function fromRecord(r: PictureRecord): Picture {
  return { ...r, paint: unpackBlob(r.paint), thumb: unpackBlob(r.thumb) };
}

function fromTrash(r: TrashRecord): TrashEntry {
  return { ...r, picture: fromRecord(r.picture) };
}

export async function createPicture(
  input: Omit<Picture, 'id' | 'createdAt' | 'updatedAt'>,
  now = Date.now(),
): Promise<Picture> {
  const pic: Picture = { ...input, id: crypto.randomUUID(), createdAt: now, updatedAt: now };
  const rec: PictureRecord = { ...pic, paint: await packBlob(pic.paint), thumb: await packBlob(pic.thumb) };
  await (await db()).put('pictures', rec);
  return pic;
}

export async function overwritePicture(
  id: string,
  data: Pick<Picture, 'paint' | 'thumb' | 'width' | 'height'>,
  opts: { keepPrevious: boolean },
  now = Date.now(),
): Promise<Picture> {
  // Erst packen: ein await außerhalb von IndexedDB würde die Transaktion vorzeitig beenden.
  const paint = await packBlob(data.paint);
  const thumb = await packBlob(data.thumb);
  const tx = (await db()).transaction(['pictures', 'trash'], 'readwrite');
  const old = await tx.objectStore('pictures').get(id);
  if (!old) throw new Error(`Bild ${id} nicht gefunden`);
  const updated: PictureRecord = { ...old, paint, thumb, width: data.width, height: data.height, updatedAt: now };
  if (opts.keepPrevious) {
    const entry: TrashRecord = { id: crypto.randomUUID(), picture: old, trashedAt: now, reason: 'overwritten' };
    await tx.objectStore('trash').put(entry);
  }
  await tx.objectStore('pictures').put(updated);
  await tx.done;
  return fromRecord(updated);
}

export async function listPictures(profileId: string): Promise<Picture[]> {
  const list = await (await db()).getAllFromIndex('pictures', 'byProfile', profileId);
  return list.sort((a, b) => b.updatedAt - a.updatedAt).map(fromRecord);
}

export async function getPicture(id: string): Promise<Picture | undefined> {
  const r = await (await db()).get('pictures', id);
  return r && fromRecord(r);
}

export async function listTrash(): Promise<TrashEntry[]> {
  const list = await (await db()).getAll('trash');
  return list.sort((a, b) => b.trashedAt - a.trashedAt).map(fromTrash);
}

export async function purgeTrash(now = Date.now()): Promise<number> {
  const tx = (await db()).transaction('trash', 'readwrite');
  let removed = 0;
  for (const entry of await tx.store.getAll()) {
    if (now - entry.trashedAt > TRASH_KEEP_MS) {
      await tx.store.delete(entry.id);
      removed++;
    }
  }
  await tx.done;
  return removed;
}

/** Bild löschen = in den Papierkorb (30 Tage wiederherstellbar). */
export async function deletePicture(id: string, now = Date.now()): Promise<void> {
  const tx = (await db()).transaction(['pictures', 'trash'], 'readwrite');
  const old = await tx.objectStore('pictures').get(id);
  if (old) {
    await tx.objectStore('trash').put({ id: crypto.randomUUID(), picture: old, trashedAt: now, reason: 'deleted' });
    await tx.objectStore('pictures').delete(id);
  }
  await tx.done;
}

/** Holt einen Papierkorb-Eintrag zurück; existiert das Bild noch (überschrieben), als Kopie. */
export async function restoreFromTrash(entryId: string, now = Date.now()): Promise<void> {
  const tx = (await db()).transaction(['pictures', 'trash'], 'readwrite');
  const entry = await tx.objectStore('trash').get(entryId);
  if (entry) {
    const exists = await tx.objectStore('pictures').get(entry.picture.id);
    const pic = exists ? { ...entry.picture, id: crypto.randomUUID(), updatedAt: now } : entry.picture;
    await tx.objectStore('pictures').put(pic);
    await tx.objectStore('trash').delete(entryId);
  }
  await tx.done;
}

export async function deleteTrashEntry(entryId: string): Promise<void> {
  await (await db()).delete('trash', entryId);
}
