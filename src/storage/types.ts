export interface Profile {
  id: string;
  name: string;
  avatar: Blob | null;
  defaultQuotaMin: number;
  warningsMin: number[];
  createdAt: number;
}

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
