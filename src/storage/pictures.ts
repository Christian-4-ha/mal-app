import { db } from './db';
import type { Picture, TrashEntry } from './types';

const TRASH_KEEP_MS = 30 * 24 * 60 * 60 * 1000;

export async function createPicture(
  input: Omit<Picture, 'id' | 'createdAt' | 'updatedAt'>,
  now = Date.now(),
): Promise<Picture> {
  const pic: Picture = { ...input, id: crypto.randomUUID(), createdAt: now, updatedAt: now };
  await (await db()).put('pictures', pic);
  return pic;
}

export async function overwritePicture(
  id: string,
  data: Pick<Picture, 'paint' | 'thumb' | 'width' | 'height'>,
  opts: { keepPrevious: boolean },
  now = Date.now(),
): Promise<Picture> {
  const tx = (await db()).transaction(['pictures', 'trash'], 'readwrite');
  const old = await tx.objectStore('pictures').get(id);
  if (!old) throw new Error(`Bild ${id} nicht gefunden`);
  const updated: Picture = { ...old, ...data, updatedAt: now };
  if (opts.keepPrevious) {
    const entry: TrashEntry = { id: crypto.randomUUID(), picture: old, trashedAt: now, reason: 'overwritten' };
    await tx.objectStore('trash').put(entry);
  }
  await tx.objectStore('pictures').put(updated);
  await tx.done;
  return updated;
}

export async function listPictures(profileId: string): Promise<Picture[]> {
  const list = await (await db()).getAllFromIndex('pictures', 'byProfile', profileId);
  return list.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function getPicture(id: string): Promise<Picture | undefined> {
  return (await db()).get('pictures', id);
}

export async function listTrash(): Promise<TrashEntry[]> {
  const list = await (await db()).getAll('trash');
  return list.sort((a, b) => b.trashedAt - a.trashedAt);
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
