import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const store = { usage: 0, allowed: 30 };
vi.mock('../storage/quota-store', () => ({
  allowedMinutes: async () => store.allowed,
  getUsage: async () => store.usage,
  addUsage: async (_d: string, _p: string, s: number) => (store.usage += s),
}));

import { startQuotaSession } from './session';

const profile = { id: 'p1', name: 'Lena', avatar: null, defaultQuotaMin: 30, warningsMin: [5, 1], createdAt: 0 };
const setVisible = (v: boolean) => {
  Object.defineProperty(document, 'visibilityState', { value: v ? 'visible' : 'hidden', configurable: true });
  document.dispatchEvent(new Event('visibilitychange'));
};

describe('startQuotaSession', () => {
  let t = 0;
  beforeEach(() => {
    store.usage = 0;
    t = 0;
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'setTimeout', 'clearTimeout'] });
    vi.spyOn(performance, 'now').mockImplementation(() => t);
    setVisible(true);
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  /** Lässt Zeit vergehen, in der Ticks laufen (App sichtbar). */
  async function run(ms: number) {
    for (let i = 0; i < ms / 1000; i++) {
      t += 1000;
      await vi.advanceTimersByTimeAsync(1000);
    }
  }

  it('Zeit im Hintergrund zählt nicht, auch wenn iOS währenddessen keine Ticks ausführt', async () => {
    const stop = startQuotaSession(profile, { onWarning: () => {}, onExpired: () => {} });
    await vi.advanceTimersByTimeAsync(0);
    await run(10_000);
    setVisible(false);
    t += 3_600_000; // eingefroren: eine Stunde ohne Ticks
    setVisible(true);
    await run(2_000);
    stop();
    await vi.advanceTimersByTimeAsync(0);
    expect(store.usage).toBeGreaterThanOrEqual(11);
    expect(store.usage).toBeLessThanOrEqual(13);
  });

  it('auch ohne visibilitychange: ein einzelner Riesensprung wird gedeckelt', async () => {
    const stop = startQuotaSession(profile, { onWarning: () => {}, onExpired: () => {} });
    await vi.advanceTimersByTimeAsync(0);
    await run(5_000);
    t += 3_600_000; // Tick-Pause ohne Ereignis
    await run(1_000);
    stop();
    await vi.advanceTimersByTimeAsync(0);
    expect(store.usage).toBeLessThanOrEqual(10);
  });
});
