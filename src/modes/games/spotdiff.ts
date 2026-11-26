import type { Mode } from '../registry';
import { icons } from '../../ui/icons';
import { navigate } from '../../app/router';
import { SCENES } from '../../spotdiff/scenes';
import { scenePreview, spotDiffScreen } from '../../spotdiff/spotdiff-screen';

/** Fehler finden: Reihe 2 = die Bildpaare. */
export const spotDiffMode: Mode = {
  id: 'spotdiff',
  icon: icons.spotDiff,
  label: 'Fehler finden',
  group: 'play',
  order: 50,
  expand({ profile }, rows) {
    rows.setRow(
      2,
      SCENES.map((s) => ({
        id: 'diff-' + s.id,
        icon: scenePreview(s),
        label: s.name,
        onTap: () => navigate(spotDiffScreen(profile, s)),
      })),
    );
  },
};
