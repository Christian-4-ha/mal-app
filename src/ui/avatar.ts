import type { Profile } from '../storage/types';

export function cropRect(w: number, h: number): { sx: number; sy: number; s: number } {
  const s = Math.min(w, h);
  return { sx: Math.round((w - s) / 2), sy: Math.round((h - s) / 2), s };
}

/** Mittiger quadratischer Ausschnitt als JPEG. */
export async function squareAvatar(file: Blob, size = 256): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  const { sx, sy, s } = cropRect(bmp.width, bmp.height);
  const c = document.createElement('canvas');
  c.width = c.height = size;
  c.getContext('2d')!.drawImage(bmp, sx, sy, s, s, 0, 0, size, size);
  bmp.close();
  return new Promise((resolve, reject) =>
    c.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob fehlgeschlagen'))), 'image/jpeg', 0.85),
  );
}

const AVATAR_COLORS = ['#ef9a9a', '#ffcc80', '#fff59d', '#a5d6a7', '#80deea', '#90caf9', '#ce93d8', '#f48fb1'];

/** Rundes Profilbild; ohne Foto farbiger Kreis mit Initiale. Gibt eine Aufräumfunktion zurück. */
export function renderAvatar(el: HTMLElement, profile: Pick<Profile, 'name' | 'avatar' | 'id'>): () => void {
  el.classList.add('avatar');
  el.replaceChildren();
  if (profile.avatar) {
    const url = URL.createObjectURL(profile.avatar);
    const img = document.createElement('img');
    img.src = url;
    img.alt = '';
    el.append(img);
    return () => URL.revokeObjectURL(url);
  }
  let h = 0;
  for (const ch of profile.id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  el.style.background = AVATAR_COLORS[h % AVATAR_COLORS.length];
  el.textContent = (profile.name.trim()[0] ?? '?').toUpperCase();
  return () => undefined;
}
