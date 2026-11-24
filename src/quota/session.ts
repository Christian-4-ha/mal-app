import type { Profile } from '../storage/types';
import { addUsage, allowedMinutes, getUsage } from '../storage/quota-store';
import { crossedWarnings, dayKey, remainingSec } from './quota';

/** Länge einer Minute in ms; Tests setzen window.__MAL_MINUTE_MS, um Abläufe zu beschleunigen. */
export function minuteMs(): number {
  return (window as unknown as { __MAL_MINUTE_MS?: number }).__MAL_MINUTE_MS ?? 60_000;
}

export async function remainingToday(profile: Profile): Promise<number> {
  const day = dayKey();
  return remainingSec(await allowedMinutes(day, profile), await getUsage(day, profile.id));
}

const pending = new Map<string, Promise<unknown>>();

export interface QuotaHandlers {
  onWarning(minutesLeft: number, remainingSec: number): void;
  onExpired(): void;
}

/**
 * Zählt die Malzeit, solange die Seite sichtbar ist. Verbrauch wird alle 5 s und beim Stoppen gespeichert.
 * „Sekunden“ sind hier Spielsekunden: minuteMs()/60 echte Millisekunden.
 */
export function startQuotaSession(profile: Profile, h: QuotaHandlers): () => void {
  const secMs = minuteMs() / 60;
  let day = dayKey();
  let allowed = profile.defaultQuotaMin;
  let used = 0;
  let unsaved = 0;
  let last = performance.now();
  let carry = 0;
  let stopped = false;
  let expired = false;

  // Speichervorgänge je Profil nacheinander (auch über Sitzungen hinweg), damit nichts verloren geht
  const flush = () => {
    if (unsaved <= 0) return pending.get(profile.id);
    const n = unsaved;
    const d = day;
    unsaved = 0;
    const next = (pending.get(profile.id) ?? Promise.resolve())
      .then(() => addUsage(d, profile.id, n))
      .catch((e) => console.error(e));
    pending.set(profile.id, next);
    return next;
  };
  const intervalMs = Math.min(1000, Math.max(20, secMs));

  const tick = () => {
    if (stopped) return;
    const now = performance.now();
    const visible = document.visibilityState !== 'hidden';
    // Deckel: eingefrorene Ticks (iOS im Hintergrund) dürfen keinen Riesensprung erzeugen
    if (visible) carry += Math.min(now - last, intervalMs * 2);
    last = now;
    const secs = Math.floor(carry / secMs);
    if (secs <= 0 || expired) return;
    carry -= secs * secMs;
    if (dayKey() !== day) {
      // Mitternacht: neuer Tag, neues Kontingent
      void flush();
      day = dayKey();
      used = 0;
      void allowedMinutes(day, profile).then((a) => (allowed = a));
    }
    const prev = remainingSec(allowed, used);
    used += secs;
    unsaved += secs;
    const rem = remainingSec(allowed, used);
    for (const m of crossedWarnings(prev, rem, profile.warningsMin)) h.onWarning(m, rem);
    if (rem === 0) {
      expired = true;
      void flush();
      h.onExpired();
    }
  };

  let timer = 0;
  let saver = 0;
  // Hintergrund: bis hierhin zählen und sichern; Rückkehr: Zeitpunkt neu setzen
  const onVisibility = () => {
    if (document.visibilityState === 'hidden') {
      tick();
      void flush();
    } else {
      last = performance.now();
    }
  };
  document.addEventListener('visibilitychange', onVisibility);
  void (async () => {
    await pending.get(profile.id); // Rest der vorigen Sitzung erst sichern
    allowed = await allowedMinutes(day, profile);
    used = await getUsage(day, profile.id);
    if (stopped) return;
    last = performance.now();
    if (remainingSec(allowed, used) === 0) {
      expired = true;
      h.onExpired();
      return;
    }
    timer = window.setInterval(tick, intervalMs);
    saver = window.setInterval(() => void flush(), 5000);
  })();

  return () => {
    tick();
    stopped = true;
    document.removeEventListener('visibilitychange', onVisibility);
    clearInterval(timer);
    clearInterval(saver);
    void flush();
  };
}
