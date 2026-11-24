import type { Tool } from './types';
import { icons } from '../ui/icons';
import { createSmoothLine } from './stroke';
import { textureTile } from './textures';

/** Texturstift: Strich mit Oberfläche (Wachsmalstift, Kreide, Stoff, Glitzer) in der gewählten Farbe. */
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
      { id: 'glitter', icon: icons.glitter },
    ],
    begin(c, p) {
      size = c.size;
      const pat = c.ctx.createPattern(textureTile(c.color, c.variant ?? 'crayon'), 'repeat')!;
      c.ctx.strokeStyle = c.ctx.fillStyle = pat;
      line.begin(c.ctx, p);
    },
    move: (c, p) => line.move(c.ctx, p),
    end: (c) => line.end(c.ctx),
  };
}
