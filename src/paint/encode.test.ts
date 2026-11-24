// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { dataUrlToBlob } from './encode';

describe('dataUrlToBlob', () => {
  it('wandelt Base64-DataURL in Blob mit Typ', async () => {
    const b = dataUrlToBlob('data:text/plain;base64,SGFsbG8=');
    expect(b.type).toBe('text/plain');
    expect(await b.text()).toBe('Hallo');
  });

  it('erhält Binärdaten unverändert', async () => {
    const b = dataUrlToBlob('data:image/png;base64,iVBORw0KGgo=');
    expect([...new Uint8Array(await b.arrayBuffer())]).toEqual([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  });
});
