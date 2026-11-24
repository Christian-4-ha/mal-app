import { wheelValue, type WheelRange } from './time-wheel';

const HOLD_MS = 300;

/**
 * Zahl, die per langem Drücken + Ziehen (hoch = mehr, runter = weniger) eingestellt wird.
 * Ein kurzer Tipp ändert nichts. Während des Ziehens zeigt eine Rolle die Nachbarwerte.
 */
export function createNumberWheel(value: number, range: WheelRange, onChange: (v: number) => void, testid?: string) {
  const el = document.createElement('button');
  el.className = 'num-wheel';
  if (testid) el.dataset.testid = testid;
  const roll = document.createElement('div');
  roll.className = 'num-roll';
  let v = value;
  let start = 0;
  let startY = 0;
  let timer = 0;
  let active = false;
  const render = () => {
    el.textContent = String(v);
    const fmt = (n: number) => (n < range.min || n > range.max ? '' : String(n));
    roll.innerHTML = `<span>${fmt(v + 2 * range.step)}</span><span>${fmt(v + range.step)}</span><b>${v}</b><span>${fmt(v - range.step)}</span><span>${fmt(v - 2 * range.step)}</span>`;
  };
  el.addEventListener('pointerdown', (e) => {
    el.setPointerCapture(e.pointerId);
    start = v;
    startY = e.clientY;
    timer = window.setTimeout(() => {
      active = true;
      const r = el.getBoundingClientRect();
      roll.style.left = `${r.left + r.width / 2}px`;
      roll.style.top = `${r.top + r.height / 2}px`;
      document.body.append(roll);
    }, HOLD_MS);
  });
  el.addEventListener('pointermove', (e) => {
    if (!active) return;
    const nv = wheelValue(start, e.clientY - startY, range);
    if (nv !== v) {
      v = nv;
      render();
    }
  });
  const end = () => {
    clearTimeout(timer);
    if (!active) return;
    active = false;
    roll.remove();
    onChange(v);
  };
  el.addEventListener('pointerup', end);
  el.addEventListener('pointercancel', end);
  render();
  return {
    el,
    set(nv: number) {
      v = nv;
      render();
    },
  };
}

/** Zeitregler „[ 0 ] Std [ 30 ] Min“ (Stunden 0–23, Minuten 0–55 in 5er-Schritten). */
export function createTimePicker(totalMin: number, onChange: (min: number) => void, testid = 'time') {
  const wrap = document.createElement('span');
  wrap.className = 'time-picker';
  let h = Math.floor(totalMin / 60);
  let m = Math.round((totalMin % 60) / 5) * 5;
  const emit = () => onChange(h * 60 + m);
  const hw = createNumberWheel(h, { min: 0, max: 23, step: 1 }, (v) => ((h = v), emit()), `${testid}-h`);
  const mw = createNumberWheel(m, { min: 0, max: 55, step: 5 }, (v) => ((m = v), emit()), `${testid}-m`);
  const lh = document.createElement('span');
  lh.textContent = 'Std';
  const lm = document.createElement('span');
  lm.textContent = 'Min';
  wrap.append(hw.el, lh, mw.el, lm);
  return wrap;
}
