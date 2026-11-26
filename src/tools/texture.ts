import type { Tool } from './types';
import { icons } from '../ui/icons';
import { createSmoothLine } from './stroke';
import { sparkledTile, textureTile } from './textures';

/** Texturstift: Strich mit Oberfläche (Wachsmalstift, Kreide, Stoff) in der gewählten Farbe. */
export function createTexture(): Tool {
  let size = 24;
  const line = createSmoothLine(() => size);
  return {
    id: 'texture',
    icon: icons.texture,
    order: 80,
    minSize: 6,
    maxSize: 80,
    defaultSize: 24,
    variants: [
      { id: 'crayon', icon: icons.crayon },
      { id: 'chalk', icon: icons.chalk },
      { id: 'fabric', icon: icons.fabric },
    ],
    begin(c, p) {
      size = c.size;
      const variant = c.variant ?? 'crayon';
      const tile = c.glitter ? sparkledTile(c.color, variant) : textureTile(c.color, variant);
      const pat = c.ctx.createPattern(tile, 'repeat')!;
      c.ctx.strokeStyle = c.ctx.fillStyle = pat;
      line.begin(c.ctx, p);
    },
    move: (c, p) => line.move(c.ctx, p),
    end: (c) => line.end(c.ctx),
  };
}
