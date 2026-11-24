import type { Mode } from '../registry';
import { icons } from '../../ui/icons';
import { galleryScreen } from '../../screens/gallery';

export const galleryMode: Mode = {
  id: 'gallery',
  icon: icons.gallery,
  order: 0,
  pinnedFirst: true,
  open: ({ profile }) => galleryScreen(profile),
};
