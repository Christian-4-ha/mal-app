import { getSetting, setSetting } from './settings';
import type { Profile } from './types';

/** Heutiges Kontingent je Profil (Minuten); fehlt der Tag, gilt der Standard des Profils. */
export type DayQuota = Record<string, number>;

export const getDayQuota = (day: string) => getSetting<DayQuota>(`quota:${day}`);
export const setDayQuota = (day: string, q: DayQuota) => setSetting(`quota:${day}`, q);

export async function allowedMinutes(day: string, profile: Profile): Promise<number> {
  return (await getDayQuota(day))?.[profile.id] ?? profile.defaultQuotaMin;
}

export async function getUsage(day: string, profileId: string): Promise<number> {
  return (await getSetting<number>(`usage:${day}:${profileId}`)) ?? 0;
}

export async function addUsage(day: string, profileId: string, sec: number): Promise<number> {
  const total = (await getUsage(day, profileId)) + sec;
  await setSetting(`usage:${day}:${profileId}`, total);
  return total;
}
