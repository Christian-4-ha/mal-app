export function dataUrlToBlob(url: string): Blob {
  const comma = url.indexOf(',');
  const type = url.slice(5, comma).split(';')[0];
  const bin = atob(url.slice(comma + 1));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type });
}

/**
 * Kodiert eine Leinwand sofort (synchron). `toBlob` wird in Chromium (auch Silk auf dem Fire-Tablet)
 * in Leerlaufphasen verschoben und kann beim Wechsel in den Hintergrund zu spät fertig werden.
 */
export function encodeCanvas(c: HTMLCanvasElement, type = 'image/png', quality?: number): Blob {
  return dataUrlToBlob(c.toDataURL(type, quality));
}
