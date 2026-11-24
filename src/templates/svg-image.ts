/** Wandelt SVG-Text in ein Bild, das auf eine Leinwand gezeichnet werden kann. */
export function svgToImage(svg: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Vorlage konnte nicht geladen werden'));
    };
    img.src = url;
  });
}
