// Vorlagen für „Punkte verbinden“: Punkte in Reihenfolge 1…n (Koordinaten 800 × 600).
// Die fertige Form (geschlossener Umriss + Zusatzlinien) dient danach als Ausmalvorlage.

export interface DotPicture {
  id: string;
  name: string;
  /** Punkte in der Reihenfolge, in der sie verbunden werden; der letzte wird mit dem ersten verbunden. */
  points: [number, number][];
  /** Vorgezeichnete Linien (SVG-Pfad), z. B. Auge oder Fenster. */
  extra: string;
}

/** Kreis als SVG-Pfad. */
const circle = (cx: number, cy: number, r: number) =>
  `M${cx - r} ${cy} a${r} ${r} 0 1 0 ${2 * r} 0 a${r} ${r} 0 1 0 ${-2 * r} 0`;

const W = 800;
const H = 600;

/** Stern mit 5 Zacken, beginnt oben. */
function star(): [number, number][] {
  const pts: [number, number][] = [];
  for (let k = 0; k < 10; k++) {
    const a = -Math.PI / 2 + (k * Math.PI) / 5;
    const r = k % 2 === 0 ? 240 : 100;
    pts.push([Math.round(400 + Math.cos(a) * r), Math.round(315 + Math.sin(a) * r)]);
  }
  return pts;
}

export const DOT_PICTURES: DotPicture[] = [
  {
    id: 'stern',
    name: 'Stern',
    points: star(),
    extra: `${circle(370, 300, 9)} ${circle(430, 300, 9)} M372 345 Q400 368 428 345`,
  },
  {
    id: 'haus',
    name: 'Haus',
    points: [
      [220, 520], [220, 300], [400, 140], [490, 220], [490, 150], [530, 150], [530, 256],
      [580, 300], [580, 520], [450, 520], [450, 400], [350, 400], [350, 520],
    ],
    extra: 'M255 330 H320 V385 H255 Z M287 330 V385 M255 357 H320 M485 330 H550 V385 H485 Z M517 330 V385 M485 357 H550 M90 540 H710 ' + circle(432, 462, 6),
  },
  {
    id: 'fisch',
    name: 'Fisch',
    points: [
      [150, 300], [200, 230], [290, 185], [350, 110], [440, 178], [510, 210], [560, 250],
      [680, 170], [650, 300], [680, 430], [560, 350], [490, 400], [400, 425], [290, 415], [200, 370],
    ],
    extra: circle(230, 270, 12) + ' M170 320 Q185 330 200 322 M340 240 Q390 300 340 360 M400 260 Q420 300 400 340 M440 270 Q455 300 440 330',
  },
  {
    id: 'ente',
    name: 'Ente',
    points: [
      [120, 235], [185, 212], [200, 165], [245, 128], [300, 128], [338, 165], [340, 220],
      [325, 280], [430, 300], [530, 285], [610, 240], [625, 300], [600, 370], [520, 430],
      [400, 450], [290, 430], [225, 375], [225, 310], [240, 270], [190, 255],
    ],
    extra: circle(268, 178, 10) + ' M125 238 L190 236 M390 365 Q460 325 550 355 Q480 420 390 365 M300 520 H520',
  },
  {
    id: 'rakete',
    name: 'Rakete',
    points: [
      [400, 50], [450, 120], [470, 215], [470, 400], [540, 465], [540, 520], [480, 485],
      [440, 520], [360, 520], [320, 485], [260, 520], [260, 465], [330, 400], [330, 215], [350, 120],
    ],
    extra: `${circle(400, 250, 40)} ${circle(400, 250, 25)} ` + 'M340 330 H460 M365 535 Q380 585 400 548 Q420 590 435 535',
  },
];

/** Position der Zahl: etwas außerhalb des Punkts, vom Schwerpunkt weg. */
export function labelPos(pic: DotPicture, i: number): [number, number] {
  const n = pic.points.length;
  const cx = pic.points.reduce((s, p) => s + p[0], 0) / n;
  const cy = pic.points.reduce((s, p) => s + p[1], 0) / n;
  const [x, y] = pic.points[i];
  const d = Math.hypot(x - cx, y - cy) || 1;
  return [x + ((x - cx) / d) * 30, y + ((y - cy) / d) * 30 + 8];
}

/** Ausmalvorlage: geschlossener Umriss plus Zusatzlinien. */
export function templateSvg(pic: DotPicture): string {
  const d = 'M' + pic.points.map(([x, y]) => `${x} ${y}`).join(' L') + ' Z';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" fill="none" stroke="#000" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">
  <path d="${d}"/>
  <path d="${pic.extra}"/>
</svg>
`;
}

export const templateIdOf = (pic: DotPicture) => 'punkte-' + pic.id;
