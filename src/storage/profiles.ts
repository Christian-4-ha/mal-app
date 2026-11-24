import { db, type ProfileRecord } from './db';
import { packBlob, unpackBlob } from './blob-store';
import type { Profile } from './types';

const fromRecord = (r: ProfileRecord): Profile => ({ ...r, avatar: r.avatar && unpackBlob(r.avatar) });
const toRecord = async (p: Profile): Promise<ProfileRecord> => ({ ...p, avatar: p.avatar && (await packBlob(p.avatar)) });

export async function listProfiles(): Promise<Profile[]> {
  const all = await (await db()).getAll('profiles');
  return all.sort((a, b) => a.createdAt - b.createdAt).map(fromRecord);
}

let lastCreatedAt = 0;

export async function createProfile(name: string, avatar: Blob | null): Promise<Profile> {
  // streng steigend, damit die Reihenfolge auch bei gleicher Millisekunde stabil ist
  lastCreatedAt = Math.max(Date.now(), lastCreatedAt + 1);
  const profile: Profile = {
    id: crypto.randomUUID(),
    name,
    avatar,
    defaultQuotaMin: 30,
    warningsMin: [5, 1],
    createdAt: lastCreatedAt,
  };
  const rec = await toRecord(profile);
  await (await db()).put('profiles', rec);
  return profile;
}

export async function updateProfile(p: Profile): Promise<void> {
  const rec = await toRecord(p);
  await (await db()).put('profiles', rec);
}
