import { db } from './db';
import type { Profile } from './types';

export async function listProfiles(): Promise<Profile[]> {
  const all = await (await db()).getAll('profiles');
  return all.sort((a, b) => a.createdAt - b.createdAt);
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
  await (await db()).put('profiles', profile);
  return profile;
}

export async function updateProfile(p: Profile): Promise<void> {
  await (await db()).put('profiles', p);
}
