import sceneSvg from '../assets/start-bild.svg?raw';

const KEY = 'ente-intro';
// Zusätzlich im Speicher, falls sessionStorage nicht geht (dann nur bis zum Neuladen)
let seen = false;
/** Länge der Startanimation (ms); danach erscheinen die Profile. */
export const INTRO_MS = 5200;

/** Lief die Startanimation in dieser App-Sitzung schon? */
export function introSeen(): boolean {
  if (seen) return true;
  try {
    return sessionStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

function markIntroSeen(): void {
  seen = true;
  try {
    sessionStorage.setItem(KEY, '1');
  } catch {
    /* privater Modus: dann eben jedes Mal */
  }
}

/** Startbild als Hintergrund einfügen (inline, damit die Teile animierbar sind). */
export function mountScene(root: HTMLElement): HTMLElement {
  const scene = document.createElement('div');
  scene.className = 'start-scene';
  scene.innerHTML = sceneSvg;
  root.prepend(scene);
  return scene;
}

/**
 * Spielt die Startanimation: Bild baut sich auf, die Ente hüpft durchs Bild.
 * Antippen überspringt. Löst spätestens nach INTRO_MS (+ Puffer) auf, auch wenn keine Animation läuft.
 */
export function playIntro(root: HTMLElement, scene: HTMLElement): Promise<void> {
  if (introSeen()) return Promise.resolve();
  markIntroSeen();
  root.classList.add('intro-playing');
  scene.classList.add('play');
  const skip = document.createElement('button');
  skip.className = 'intro-skip';
  skip.dataset.testid = 'intro';
  skip.setAttribute('aria-label', 'Weiter');
  root.append(skip);
  return new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      scene.classList.remove('play');
      skip.remove();
      root.classList.remove('intro-playing');
      resolve();
    };
    const timer = window.setTimeout(finish, INTRO_MS);
    skip.onclick = finish;
  });
}
