export interface Profile {
  id: string;
  name: string;
  avatar: Blob | null;
  defaultQuotaMin: number;
  warningsMin: number[];
  createdAt: number;
  /** Kind (Standard) oder Erwachsener; Erwachsene öffnen ihr Profil nur mit PIN. */
  kind?: ProfileKind;
  /** Nur Erwachsene: Nutzungszeit ausgeschaltet. */
  unlimited?: boolean;
}

export type ProfileKind = 'child' | 'adult';

export const isAdult = (p: Pick<Profile, 'kind'>) => p.kind === 'adult';
/** Gilt für dieses Profil eine Nutzungszeit? */
export const timeLimited = (p: Pick<Profile, 'kind' | 'unlimited'>) => !(isAdult(p) && p.unlimited);

export interface Picture {
  id: string;
  profileId: string;
  modeId: string;
  templateId: string | null;
  paint: Blob;
  thumb: Blob;
  width: number;
  height: number;
  createdAt: number;
  updatedAt: number;
}

export interface TrashEntry {
  id: string;
  picture: Picture;
  trashedAt: number;
  reason: 'overwritten' | 'deleted';
}
