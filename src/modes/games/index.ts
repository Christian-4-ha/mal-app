import type { Mode } from '../registry';
import { icons } from '../../ui/icons';
import { navigate } from '../../app/router';
import { playerSelectScreen } from '../../games/player-select';
import { connectFour, muehle, ticTacToe } from '../../games/board-games';
import { listMotifs } from '../../puzzle/motifs';
import { puzzleScreen } from '../../puzzle/puzzle-screen';

/** Spiele: Reihe 2 = Spiele; Puzzle öffnet Reihe 3 mit Motiven. */
export const gamesMode: Mode = {
  id: 'games',
  icon: icons.games,
  order: 30,
  expand({ profile }, rows) {
    const urls: string[] = [];
    rows.setRow(2, [
      ...[ticTacToe, connectFour, muehle].map((g) => ({
        id: g.id,
        icon: g.icon,
        onTap: () => navigate(playerSelectScreen(profile, g)),
      })),
      {
        id: 'puzzle',
        icon: icons.puzzle,
        onTap: async () => {
          urls.forEach((u) => URL.revokeObjectURL(u));
          urls.length = 0;
          const motifs = await listMotifs(profile.id);
          rows.setRow(
            3,
            motifs.map((m) => {
              let src: string;
              if (typeof m.preview === 'string') src = m.preview;
              else {
                src = URL.createObjectURL(m.preview);
                urls.push(src);
              }
              return {
                id: m.id,
                icon: `<img src="${src}" alt="" draggable="false">`,
                onTap: () => navigate(puzzleScreen(profile, m)),
              };
            }),
          );
        },
      },
    ]);
  },
};
