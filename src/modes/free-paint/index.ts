import type { Mode } from '../registry';
import { icons } from '../../ui/icons';
import { paintScreen } from '../../paint/paint-screen';

export const freePaintMode: Mode = {
  id: 'free-paint',
  icon: icons.freePaint,
  order: 10,
  open: ({ profile }) => paintScreen({ profile, modeId: 'free-paint' }),
};
