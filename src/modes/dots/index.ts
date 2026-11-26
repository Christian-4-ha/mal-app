import type { Mode } from '../registry';
import { icons } from '../../ui/icons';
import { navigate } from '../../app/router';
import { DOT_PICTURES } from '../../dots/pictures';
import { dotsPreview, dotsScreen } from '../../dots/dots-screen';

/** Punkte verbinden: Reihe 2 = die Bilder, Tipp → Punkte-Bildschirm. */
export const dotsMode: Mode = {
  id: 'dots',
  icon: icons.connectDots,
  label: 'Punkte verbinden',
  group: 'paint',
  order: 30,
  expand({ profile }, rows) {
    rows.setRow(
      2,
      DOT_PICTURES.map((pic) => ({
        id: 'dots-' + pic.id,
        icon: dotsPreview(pic),
        label: pic.name,
        onTap: () => navigate(dotsScreen(profile, pic)),
      })),
    );
  },
};
