import type { Mode } from '../registry';
import { icons } from '../../ui/icons';

// Bildschirm folgt in Task 9.
export const galleryMode: Mode = {
  id: 'gallery',
  icon: icons.gallery,
  order: 0,
  pinnedFirst: true,
  open: () => ({ name: 'gallery', mount() {}, unmount() {} }),
};
