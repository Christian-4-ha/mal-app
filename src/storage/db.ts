import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Picture, Profile } from './types';
import type { StoredBlob } from './blob-store';

// Gespeicherte Form: Blobs als StoredBlob
export type ProfileRecord = Omit<Profile, 'avatar'> & { avatar: StoredBlob | null };
export type PictureRecord = Omit<Picture, 'paint' | 'thumb'> & { paint: StoredBlob; thumb: StoredBlob };
export interface TrashRecord {
  id: string;
  picture: PictureRecord;
  trashedAt: number;
  reason: 'overwritten' | 'deleted';
}

export interface MalDB extends DBSchema {
  profiles: { key: string; value: ProfileRecord };
  pictures: { key: string; value: PictureRecord; indexes: { byProfile: string } };
  trash: { key: string; value: TrashRecord };
  settings: { key: string; value: unknown };
}

export type Db = IDBPDatabase<MalDB>;

export function openDb(name = 'mal-app'): Promise<Db> {
  return openDB<MalDB>(name, 1, {
    upgrade(db) {
      db.createObjectStore('profiles', { keyPath: 'id' });
      const pictures = db.createObjectStore('pictures', { keyPath: 'id' });
      pictures.createIndex('byProfile', 'profileId');
      db.createObjectStore('trash', { keyPath: 'id' });
      db.createObjectStore('settings');
    },
  });
}

let current: Db | null = null;
let opening: Promise<Db> | null = null;

/** Setzt die zu verwendende Datenbank (Start der App, Tests). */
export function useDb(db: Db): void {
  current = db;
  opening = null;
}

export function getDb(): Db | null {
  return current;
}

export async function db(): Promise<Db> {
  if (current) return current;
  opening ??= openDb().then((d) => (current = d));
  return opening;
}
