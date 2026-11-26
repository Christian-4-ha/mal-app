// Bildpaare für „Fehler finden“: gemeinsames Grundbild plus 5 Unterschiede (links / rechts).
// Alle Bilder 800 × 600, selbst gezeichnet, kräftige Farben, klare Formen.
import type { DiffSpot } from './logic';

export interface Diff extends DiffSpot {
  /** SVG im linken Bild */
  left: string;
  /** SVG im rechten Bild (anders, fehlt oder dazugekommen) */
  right: string;
}

export interface Scene {
  id: string;
  name: string;
  /** Grundbild, in beiden Bildern gleich */
  base: string;
  diffs: Diff[];
}

const O = 'stroke="#3e2723" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"';

const sun = (x: number, y: number, r = 45, c = '#ffeb3b') =>
  `<g transform="translate(${x} ${y})"><g stroke="#fbc02d" stroke-width="8" stroke-linecap="round">${Array.from(
    { length: 8 },
    (_, i) => {
      const a = (i * Math.PI) / 4;
      return `<path d="M${Math.cos(a) * (r + 10)} ${Math.sin(a) * (r + 10)} L${Math.cos(a) * (r + 26)} ${Math.sin(a) * (r + 26)}"/>`;
    },
  ).join('')}</g><circle r="${r}" fill="${c}" stroke="#fbc02d" stroke-width="5"/><circle cx="-14" cy="-8" r="5" fill="#5d4037"/><circle cx="14" cy="-8" r="5" fill="#5d4037"/><path d="M-16 12 Q0 26 16 12" stroke="#5d4037" stroke-width="5" fill="none" stroke-linecap="round"/></g>`;

const cloud = (x: number, y: number, s = 1) =>
  `<g transform="translate(${x} ${y}) scale(${s})" fill="#fff"><circle cx="-40" cy="10" r="28"/><circle cx="0" cy="-8" r="38"/><circle cx="40" cy="10" r="28"/><rect x="-40" y="10" width="80" height="28"/></g>`;

const flower = (x: number, y: number, c: string) =>
  `<g transform="translate(${x} ${y})"><path d="M0 0 V50" stroke="#388e3c" stroke-width="6"/><path d="M0 34 Q16 22 24 30 Q12 42 0 38" fill="#66bb6a"/><g fill="${c}" ${O}><circle cx="0" cy="-16" r="12"/><circle cx="15" cy="-5" r="12"/><circle cx="9" cy="13" r="12"/><circle cx="-9" cy="13" r="12"/><circle cx="-15" cy="-5" r="12"/></g><circle r="9" fill="#ffd54f" ${O}/></g>`;

const bird = (x: number, y: number) =>
  `<path d="M${x - 26} ${y} Q${x - 13} ${y - 16} ${x} ${y} Q${x + 13} ${y - 16} ${x + 26} ${y}" fill="none" stroke="#37474f" stroke-width="6" stroke-linecap="round"/>`;

const star = (x: number, y: number, r: number, c: string) => {
  const pts = Array.from({ length: 10 }, (_, k) => {
    const a = -Math.PI / 2 + (k * Math.PI) / 5;
    const rr = k % 2 ? r * 0.45 : r;
    return `${(x + Math.cos(a) * rr).toFixed(1)},${(y + Math.sin(a) * rr).toFixed(1)}`;
  }).join(' ');
  return `<polygon points="${pts}" fill="${c}" ${O}/>`;
};

// ---------- 1. Garten mit Haus ----------
const garden: Scene = {
  id: 'garten',
  name: 'Garten',
  base: `<rect width="800" height="600" fill="#b3e5fc"/>
${cloud(170, 90)}${cloud(560, 70, 0.8)}
<path d="M0 420 Q400 370 800 420 V600 H0 Z" fill="#8bc34a"/>
<rect x="90" y="250" width="250" height="200" fill="#ffe0b2" ${O}/>
<path d="M70 255 L215 140 L360 255 Z" fill="#e53935" ${O}/>
<rect x="115" y="290" width="60" height="55" fill="#e3f2fd" ${O}/><path d="M145 290 V345 M115 317 H175" ${O}/>
<rect x="250" y="290" width="60" height="55" fill="#e3f2fd" ${O}/><path d="M280 290 V345 M250 317 H310" ${O}/>
<rect x="560" y="300" width="36" height="140" fill="#8d6e63" ${O}/>
<circle cx="578" cy="250" r="95" fill="#43a047" ${O}/>
<circle cx="545" cy="235" r="12" fill="#e53935" ${O}/><circle cx="620" cy="280" r="12" fill="#e53935" ${O}/>
<path d="M380 470 H760 M400 440 V495 M450 440 V495 M500 440 V495 M550 440 V495 M600 440 V495 M650 440 V495 M700 440 V495 M750 440 V495" stroke="#fff" stroke-width="8" stroke-linecap="round"/>
${flower(60, 520, '#ec407a')}${flower(420, 540, '#ab47bc')}`,
  diffs: [
    { x: 215, y: 400, r: 50, left: `<rect x="190" y="360" width="50" height="90" fill="#1e88e5" ${O}/><circle cx="230" cy="405" r="4" fill="#3e2723"/>`, right: `<rect x="190" y="360" width="50" height="90" fill="#e53935" ${O}/><circle cx="230" cy="405" r="4" fill="#3e2723"/>` },
    { x: 690, y: 110, r: 70, left: sun(690, 110), right: '' },
    { x: 600, y: 200, r: 40, left: '', right: `<circle cx="600" cy="200" r="12" fill="#e53935" ${O}/>` },
    { x: 260, y: 530, r: 50, left: flower(260, 520, '#ffeb3b'), right: flower(260, 520, '#42a5f5') },
    { x: 380, y: 150, r: 45, left: '', right: bird(380, 150) },
  ],
};

// ---------- 2. Strand ----------
const beach: Scene = {
  id: 'strand',
  name: 'Strand',
  base: `<rect width="800" height="600" fill="#81d4fa"/>
${cloud(150, 80, 0.9)}
<rect y="250" width="800" height="150" fill="#0288d1"/>
<path d="M0 270 Q50 255 100 270 T200 270 T300 270 T400 270 T500 270 T600 270 T700 270 T800 270" fill="none" stroke="#b3e5fc" stroke-width="5"/>
<path d="M0 380 Q400 340 800 380 V600 H0 Z" fill="#ffe082"/>
<path d="M600 250 L700 250 L680 280 L620 280 Z" fill="#8d6e63" ${O}/><path d="M650 250 V170" ${O}/>
<path d="M440 500 L470 420 L530 420 L560 500 Z" fill="#ffca28" ${O}/><rect x="455" y="390" width="30" height="35" fill="#ffca28" ${O}/><rect x="515" y="390" width="30" height="35" fill="#ffca28" ${O}/>
<path d="M190 520 V330" stroke="#6d4c41" stroke-width="8"/>
<circle cx="90" cy="540" r="26" fill="#e53935" ${O}/><path d="M64 540 H116 M90 514 V566" stroke="#fff" stroke-width="5"/>`,
  diffs: [
    { x: 190, y: 330, r: 75, left: `<path d="M90 340 Q190 240 290 340 Z" fill="#e53935" ${O}/><path d="M157 340 Q190 255 223 340" fill="#fff" stroke="none"/>`, right: `<path d="M90 340 Q190 240 290 340 Z" fill="#43a047" ${O}/><path d="M157 340 Q190 255 223 340" fill="#fff" stroke="none"/>` },
    { x: 500, y: 365, r: 40, left: `<path d="M500 390 V340" ${O}/><path d="M500 340 L530 350 L500 360 Z" fill="#e53935" ${O}/>`, right: '' },
    { x: 650, y: 205, r: 45, left: `<path d="M655 175 L700 240 H655 Z" fill="#fff" ${O}/>`, right: `<path d="M655 175 L700 240 H655 Z" fill="#ff7043" ${O}/>` },
    { x: 330, y: 520, r: 45, left: `<g transform="translate(330 520)"><ellipse rx="30" ry="20" fill="#ef5350" ${O}/><circle cx="-10" cy="-26" r="6" fill="#fff" ${O}/><circle cx="10" cy="-26" r="6" fill="#fff" ${O}/><path d="M-30 0 L-46 -14 M30 0 L46 -14 M-20 16 L-30 30 M20 16 L30 30" ${O}/></g>`, right: '' },
    { x: 700, y: 520, r: 45, left: '', right: star(700, 520, 30, '#ff8a65') },
  ],
};

// ---------- 3. Weltraum ----------
const space: Scene = {
  id: 'weltraum',
  name: 'Weltraum',
  base: `<rect width="800" height="600" fill="#1a237e"/>
${star(80, 80, 14, '#fff59d')}${star(300, 60, 10, '#fff59d')}${star(520, 120, 12, '#fff59d')}${star(740, 300, 12, '#fff59d')}${star(60, 400, 10, '#fff59d')}${star(420, 560, 12, '#fff59d')}
<circle cx="640" cy="470" r="80" fill="#cfd8dc" ${O}/><circle cx="610" cy="440" r="14" fill="#b0bec5"/><circle cx="670" cy="500" r="10" fill="#b0bec5"/>
<path d="M330 200 Q360 120 390 200 V360 H330 Z" fill="#eceff1" ${O}/>
<path d="M330 330 L300 380 H330 Z M390 330 L420 380 H390 Z" fill="#e53935" ${O}/>
<path d="M340 360 Q360 420 380 360 Z" fill="#ffb300"/>`,
  diffs: [
    { x: 180, y: 240, r: 85, left: `<circle cx="180" cy="240" r="60" fill="#ff7043" ${O}/><ellipse cx="180" cy="240" rx="100" ry="22" fill="none" stroke="#ffcc80" stroke-width="10"/>`, right: `<circle cx="180" cy="240" r="60" fill="#ff7043" ${O}/>` },
    { x: 360, y: 240, r: 40, left: `<circle cx="360" cy="240" r="18" fill="#4fc3f7" ${O}/>`, right: `<circle cx="360" cy="240" r="18" fill="#ffee58" ${O}/>` },
    { x: 680, y: 70, r: 40, left: '', right: star(680, 70, 22, '#fff59d') },
    { x: 615, y: 505, r: 32, left: '', right: `<circle cx="615" cy="505" r="15" fill="#90a4ae"/>` },
    { x: 560, y: 245, r: 42, left: `<g transform="translate(560 280)"><ellipse rx="34" ry="30" fill="#76ff03" ${O}/><circle cx="-12" cy="-6" r="7" fill="#fff" ${O}/><circle cx="12" cy="-6" r="7" fill="#fff" ${O}/><path d="M-10 12 Q0 20 10 12" ${O} fill="none"/><path d="M-14 -28 L-22 -48 M14 -28 L22 -48" ${O}/><circle cx="-22" cy="-50" r="5" fill="#e91e63"/><circle cx="22" cy="-50" r="5" fill="#e91e63"/></g>`, right: `<g transform="translate(560 280)"><ellipse rx="34" ry="30" fill="#76ff03" ${O}/><circle cx="-12" cy="-6" r="7" fill="#fff" ${O}/><circle cx="12" cy="-6" r="7" fill="#fff" ${O}/><path d="M-10 12 Q0 20 10 12" ${O} fill="none"/></g>` },
  ],
};

// ---------- 4. Bauernhof ----------
const pig = (x: number, y: number, tail: boolean) =>
  `<g transform="translate(${x} ${y})"><ellipse rx="55" ry="38" fill="#f8bbd0" ${O}/><circle cx="-55" cy="-10" r="28" fill="#f8bbd0" ${O}/><ellipse cx="-72" cy="-4" rx="11" ry="8" fill="#f48fb1" ${O}/><circle cx="-55" cy="-20" r="4" fill="#3e2723"/><path d="M-30 30 V50 M30 30 V50" stroke="#3e2723" stroke-width="10" stroke-linecap="round"/>${tail ? `<path d="M55 -10 q16 -10 10 6 q-6 12 8 6" fill="none" ${O}/>` : ''}</g>`;
const farm: Scene = {
  id: 'bauernhof',
  name: 'Bauernhof',
  base: `<rect width="800" height="600" fill="#b3e5fc"/>
${sun(90, 80, 38)}
<path d="M0 380 Q400 330 800 380 V600 H0 Z" fill="#9ccc65"/>
<rect x="470" y="200" width="250" height="200" fill="#c62828" ${O}/>
<path d="M450 205 L595 110 L740 205 Z" fill="#8d6e63" ${O}/>
<path d="M530 400 V300 H660 V400" fill="none" ${O}/>
<rect x="560" y="140" width="70" height="45" fill="#fff" ${O}/>
<g transform="translate(220 450)"><ellipse rx="85" ry="50" fill="#fff" ${O}/><ellipse cx="-30" cy="-15" rx="20" ry="14" fill="#3e2723"/><circle cx="-90" cy="-30" r="32" fill="#fff" ${O}/><ellipse cx="-100" cy="-15" rx="18" ry="12" fill="#f8bbd0" ${O}/><circle cx="-92" cy="-40" r="4" fill="#3e2723"/><path d="M-60 40 V75 M-20 40 V75 M30 40 V75 M60 40 V75" stroke="#3e2723" stroke-width="10" stroke-linecap="round"/></g>
${pig(640, 500, false)}
<g transform="translate(400 520)"><ellipse rx="26" ry="22" fill="#fff" ${O}/><circle cx="-20" cy="-20" r="14" fill="#fff" ${O}/><path d="M-34 -20 L-44 -16 L-34 -12 Z" fill="#ffb300" ${O}/><path d="M-22 -36 q4 -8 8 0" fill="#e53935" ${O}/></g>`,
  diffs: [
    { x: 595, y: 350, r: 55, left: `<path d="M530 300 H660 V400 H530 Z M530 300 L660 400 M660 300 L530 400" fill="#fff8e1" ${O}/>`, right: `<path d="M530 300 H660 V400 H530 Z M530 300 L660 400 M660 300 L530 400" fill="#ffeb3b" ${O}/>` },
    { x: 255, y: 450, r: 40, left: `<ellipse cx="255" cy="450" rx="22" ry="16" fill="#3e2723"/>`, right: '' },
    { x: 705, y: 490, r: 35, left: '', right: `<path d="M693 492 q16 -10 10 6 q-6 12 8 6" fill="none" ${O}/>` },
    { x: 455, y: 540, r: 38, left: '', right: `<g transform="translate(455 540)"><circle r="13" fill="#ffee58" ${O}/><path d="M-13 0 L-22 3 L-13 6 Z" fill="#ffb300"/><circle cx="-5" cy="-4" r="2.5" fill="#3e2723"/></g>` },
    { x: 330, y: 110, r: 50, left: cloud(330, 100, 0.8), right: '' },
  ],
};

// ---------- 5. Kinderzimmer ----------
const room: Scene = {
  id: 'kinderzimmer',
  name: 'Kinderzimmer',
  base: `<rect width="800" height="600" fill="#fff3e0"/>
<rect y="450" width="800" height="150" fill="#bcaaa4"/>
<rect x="80" y="80" width="200" height="160" fill="#1a237e" ${O}/><path d="M180 80 V240 M80 160 H280" stroke="#8d6e63" stroke-width="8"/>
<circle cx="130" cy="120" r="22" fill="#fff59d"/><circle cx="140" cy="113" r="20" fill="#1a237e"/>
<rect x="430" y="370" width="320" height="110" rx="12" fill="#42a5f5" ${O}/><rect x="430" y="330" width="60" height="70" rx="12" fill="#90caf9" ${O}/><rect x="480" y="345" width="260" height="40" rx="14" fill="#fff" ${O}/>
<rect x="470" y="120" width="250" height="14" fill="#8d6e63" ${O}/>
<rect x="490" y="70" width="22" height="50" fill="#e53935" ${O}/><rect x="514" y="76" width="22" height="44" fill="#43a047" ${O}/><rect x="562" y="66" width="22" height="54" fill="#ffb300" ${O}/>
<g transform="translate(230 430)"><circle cx="-26" cy="-70" r="14" fill="#a1887f" ${O}/><circle cx="26" cy="-70" r="14" fill="#a1887f" ${O}/><circle cy="-50" r="36" fill="#a1887f" ${O}/><ellipse cy="10" rx="44" ry="46" fill="#a1887f" ${O}/><circle cx="-12" cy="-56" r="5" fill="#3e2723"/><circle cx="12" cy="-56" r="5" fill="#3e2723"/><ellipse cy="-40" rx="10" ry="7" fill="#5d4037"/></g>
<path d="M60 600 V330" stroke="#5d4037" stroke-width="8"/>`,
  diffs: [
    { x: 230, y: 405, r: 40, left: `<path d="M210 395 L230 405 L210 415 Z M250 395 L230 405 L250 415 Z" fill="#e91e63" ${O}/>`, right: `<path d="M210 395 L230 405 L210 415 Z M250 395 L230 405 L250 415 Z" fill="#00bcd4" ${O}/>` },
    { x: 597, y: 92, r: 35, left: `<rect x="586" y="72" width="22" height="48" fill="#8e24aa" ${O}/>`, right: '' },
    { x: 60, y: 315, r: 55, left: `<path d="M20 340 L40 280 H80 L100 340 Z" fill="#ffca28" ${O}/>`, right: `<path d="M20 340 L40 280 H80 L100 340 Z" fill="#66bb6a" ${O}/>` },
    { x: 360, y: 520, r: 50, left: `<circle cx="360" cy="520" r="34" fill="#fff" ${O}/><path d="M326 520 H394" stroke="#e53935" stroke-width="8"/>`, right: `<circle cx="360" cy="520" r="34" fill="#fff" ${O}/><path d="M326 520 H394" stroke="#e53935" stroke-width="8"/><path d="M360 486 V554" stroke="#1e88e5" stroke-width="8"/>` },
    { x: 240, y: 200, r: 40, left: '', right: star(240, 200, 20, '#fff59d') },
  ],
};

export const SCENES: Scene[] = [garden, beach, space, farm, room];

/** Ganzes Bild (links oder rechts) als SVG-Inhalt. */
export function sceneSvg(scene: Scene, side: 'left' | 'right'): string {
  return scene.base + scene.diffs.map((d) => d[side]).join('');
}
