/** Binärdaten, wie sie in IndexedDB liegen (WebKit kann Blobs dort nicht zuverlässig ablegen). */
export interface StoredBlob {
  buf: ArrayBuffer;
  type: string;
}

export async function packBlob(b: Blob): Promise<StoredBlob> {
  return { buf: await b.arrayBuffer(), type: b.type };
}

export function unpackBlob(s: StoredBlob): Blob {
  return new Blob([s.buf], { type: s.type });
}
