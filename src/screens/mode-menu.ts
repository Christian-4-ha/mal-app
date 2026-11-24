import type { Screen } from '../app/screen';
import type { Profile } from '../storage/types';

export function modeMenuScreen(_profile: Profile): Screen {
  return {
    name: 'mode-menu',
    mount() {},
    unmount() {},
  };
}
