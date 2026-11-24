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

  const flush = async () => {
    if (unsaved <= 0) return;
    const n = unsaved;
    unsaved = 0;
    await addUsage(day, profile.id, n);
  };

  const tick = () => {
    if (stopped) return;
    const now = performance.now();
    const visible = document.visibilityState !== 'hidden';
    if (visible) carry += now - last;
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
  void (async () => {
    allowed = await allowedMinutes(day, profile);
    used = await getUsage(day, profile.id);
    if (stopped) return;
    last = performance.now();
    if (remainingSec(allowed, used) === 0) {
      expired = true;
      h.onExpired();
      return;
    }
    timer = window.setInterval(tick, Math.min(1000, Math.max(20, secMs)));
    saver = window.setInterval(() => void flush(), 5000);
  })();

  return () => {
    tick();
    stopped = true;
    clearInterval(timer);
    clearInterval(saver);
    void flush();
  };
}
