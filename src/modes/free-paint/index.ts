import type { Mode } from '../registry';
import { icons } from '../../ui/icons';

// Malbildschirm folgt in Task 6.
export const freePaintMode: Mode = {
  id: 'free-paint',
  icon: icons.freePaint,
  order: 10,
  open: () => ({ name: 'paint', mount() {}, unmount() {} }),
};
