// Schreibt die Ausmalvorlagen für „Punkte verbinden“ aus src/dots/pictures.ts.
// Aufruf: node scripts/gen-dot-templates.ts
import { writeFileSync } from 'node:fs';
import { DOT_PICTURES, templateSvg } from '../src/dots/pictures.ts';

for (const pic of DOT_PICTURES) writeFileSync(`public/templates/punkte/${pic.id}.svg`, templateSvg(pic));
console.log('geschrieben:', DOT_PICTURES.map((p) => p.id).join(', '));
