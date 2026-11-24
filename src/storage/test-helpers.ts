import { openDb, useDb } from './db';

export async function freshDb(): Promise<void> {
  useDb(await openDb('test-' + crypto.randomUUID()));
}

export function blobOf(text: string): Blob {
  return new Blob([text], { type: 'text/plain' });
}

export function textOf(b: Blob): Promise<string> {
  return b.text();
}
