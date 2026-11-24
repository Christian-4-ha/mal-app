// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { hashPin, isValidPin, verifyPin } from './pin';

describe('pin', () => {
  it('nur genau 4 Ziffern', () => {
    expect(isValidPin('1234')).toBe(true);
    expect(isValidPin('123')).toBe(false);
    expect(isValidPin('12a4')).toBe(false);
  });

  it('prüft gegen gesalzenen Hash', async () => {
    const stored = await hashPin('4711');
    expect(stored.hash).not.toContain('4711');
    expect(await verifyPin('4711', stored)).toBe(true);
    expect(await verifyPin('4712', stored)).toBe(false);
  });

  it('gleiche PIN ergibt je Einrichtung anderen Hash (Salz)', async () => {
    expect((await hashPin('1111')).hash).not.toBe((await hashPin('1111')).hash);
  });
});
