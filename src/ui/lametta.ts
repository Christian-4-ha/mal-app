// Lametta: glänzende Streifen, die schaukelnd herabfallen (Gewinn-Feier ohne Text).

const COLORS = [
  'linear-gradient(90deg, #b8860b, #ffe082, #b8860b)', // Gold
  'linear-gradient(90deg, #9e9e9e, #ffffff, #9e9e9e)', // Silber
  'linear-gradient(90deg, #c2185b, #f8bbd0, #c2185b)',
  'linear-gradient(90deg, #1565c0, #bbdefb, #1565c0)',
  'linear-gradient(90deg, #2e7d32, #c8e6c9, #2e7d32)',
  'linear-gradient(90deg, #6a1b9a, #e1bee7, #6a1b9a)',
];

/**
 * Lässt etwa 3 Sekunden Lametta über host regnen; räumt sich selbst auf.
 * Nur transform-Animationen (außen fallen, innen schaukeln), damit es auch auf alten iPads flüssig läuft.
 */
export function lametta(host: HTMLElement, count = 45): void {
  const layer = document.createElement('div');
  layer.className = 'lametta';
  layer.dataset.testid = 'lametta';
  for (let i = 0; i < count; i++) {
    const fall = document.createElement('span');
    fall.className = 'lametta-fall';
    fall.style.left = `${Math.random() * 100}%`;
    fall.style.animationDelay = `${Math.random() * 1.2}s`;
    fall.style.animationDuration = `${2.2 + Math.random() * 1.4}s`;
    const strip = document.createElement('span');
    strip.className = 'lametta-strip';
    strip.style.background = COLORS[i % COLORS.length];
    strip.style.height = `${40 + Math.random() * 60}px`;
    strip.style.animationDelay = `${Math.random() * 0.6}s`;
    strip.style.animationDuration = `${0.5 + Math.random() * 0.4}s`;
    fall.append(strip);
    layer.append(fall);
  }
  host.append(layer);
  setTimeout(() => layer.remove(), 4200);
}
