import type { Mode } from '../registry';
import { icons } from '../../ui/icons';
import { galleryScreen } from '../../screens/gallery';

export const galleryMode: Mode = {
  id: 'gallery',
  icon: icons.menuGallery,
  label: 'Galerie',
  order: 0,
  pinnedFirst: true,
  open: ({ profile }) => galleryScreen(profile),
};
