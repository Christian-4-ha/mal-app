// @vitest-environment node
import { beforeEach, describe, expect, it } from 'vitest';
import { freshDb } from './test-helpers';
import { createProfile, listProfiles, updateProfile } from './profiles';

describe('profiles', () => {
  beforeEach(freshDb);

  it('neues Profil hat Standardwerte', async () => {
    const p = await createProfile('Lena', null);
    expect(p.defaultQuotaMin).toBe(30);
    expect(p.warningsMin).toEqual([5, 1]);
    expect((await listProfiles()).map((x) => x.name)).toEqual(['Lena']);
  });

  it('listet nach Anlagezeit sortiert', async () => {
    await createProfile('B', null);
    await createProfile('A', null);
    expect((await listProfiles()).map((x) => x.name)).toEqual(['B', 'A']);
  });

  it('updateProfile speichert Änderungen', async () => {
    const p = await createProfile('Lena', null);
    await updateProfile({ ...p, name: 'Lena M.' });
    expect((await listProfiles())[0].name).toBe('Lena M.');
  });
});
