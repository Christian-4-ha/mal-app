/** Punkt in Leinwandpixeln. */
export interface StrokePoint {
  x: number;
  y: number;
  pressure: number;
  t: number;
}

export interface ToolContext {
  /** Zeichenziel: Malebene oder (bei overlayAlpha) die Zwischenebene des Strichs. */
  ctx: CanvasRenderingContext2D;
  color: string;
  /** Strichdicke in Leinwandpixeln. */
  size: number;
  variant: string | null;
  /** Vorlagenlinien als Flächengrenzen (Ausmalen); null im freien Malen. */
  boundary?: ImageData | null;
}

export interface ToolVariant {
  id: string;
  icon: string;
}

export interface Tool {
  id: string;
  icon: string;
  order: number;
  /** minSize = maxSize = 0: Werkzeug hat keine Größe (Größen-Punkt ausgegraut). */
  minSize: number;
  maxSize: number;
  defaultSize: number;
  variants?: ToolVariant[];
  /**
   * Wenn gesetzt, malt das Werkzeug auf eine Zwischenebene, die beim Strichende mit dieser Deckkraft
   * auf die Malebene übertragen wird (gleichmäßig in sich, durchscheinend an Überschneidungen).
   */
  overlayAlpha?: number;
  begin(c: ToolContext, p: StrokePoint): void;
  move(c: ToolContext, p: StrokePoint): void;
  end(c: ToolContext): void;
}
