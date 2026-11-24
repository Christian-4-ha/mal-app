import type { createPicture, overwritePicture } from '../storage/pictures';
import type { Picture } from '../storage/types';

export type SaveResult = 'saved' | 'skipped' | 'error';

export interface SaveController {
  markDirty(): void;
  readonly dirty: boolean;
  readonly pictureId: string | null;
  save(): Promise<SaveResult>;
}

export interface SaveDeps {
  profileId: string;
  modeId: string;
  templateId: string | null;
  existing: Picture | null;
  getBlobs(): Promise<{ paint: Blob; thumb: Blob; width: number; height: number }>;
  isBlank(): boolean;
  store: { createPicture: typeof createPicture; overwritePicture: typeof overwritePicture };
}

/**
 * Regeln:
 * - nichts geändert → skipped; neue, leere Fläche → skipped
 * - erstes Speichern ohne vorhandenes Bild → neuer Eintrag, danach Überschreiben ohne Papierkorb
 * - vorhandenes Bild: erstes Überschreiben in dieser Sitzung legt das Original in den Papierkorb
 * - gleichzeitige Aufrufe teilen sich einen Speichervorgang
 * - Fehler → error, Änderungen bleiben als ungespeichert markiert
 */
export function createSaveController(deps: SaveDeps): SaveController {
  let pictureId: string | null = deps.existing?.id ?? null;
  let originalKept = false;
  let changeGen = 0;
  let savedGen = 0;
  let inflight: Promise<SaveResult> | null = null;

  const run = async (): Promise<SaveResult> => {
    if (changeGen === savedGen) return 'skipped';
    if (pictureId === null && deps.isBlank()) return 'skipped';
    const gen = changeGen;
    try {
      const data = await deps.getBlobs();
      if (pictureId === null) {
        const pic = await deps.store.createPicture({
          profileId: deps.profileId,
          modeId: deps.modeId,
          templateId: deps.templateId,
          ...data,
        });
        pictureId = pic.id;
      } else {
        const keepPrevious = deps.existing !== null && !originalKept;
        await deps.store.overwritePicture(pictureId, data, { keepPrevious });
        if (keepPrevious) originalKept = true;
      }
      savedGen = gen;
      return 'saved';
    } catch (e) {
      console.error(e);
      return 'error';
    }
  };

  return {
    markDirty() {
      changeGen++;
    },
    get dirty() {
      return changeGen !== savedGen;
    },
    get pictureId() {
      return pictureId;
    },
    save() {
      inflight ??= run().finally(() => {
        inflight = null;
      });
      return inflight;
    },
  };
}
