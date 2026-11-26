import type { Mode } from '../registry';
import { icons } from '../../ui/icons';
import { navigate } from '../../app/router';
import { playerSelectScreen } from '../../games/player-select';
import { connectFour, muehle, ticTacToe } from '../../games/board-games';
import type { Game } from '../../games/game-screen';
import { listMotifs } from '../../puzzle/motifs';
import { puzzleScreen } from '../../puzzle/puzzle-screen';

const boardGame = (g: Game, label: string, order: number): Mode => ({
  id: g.id,
  icon: g.icon,
  label,
  group: 'play',
  order,
  open: ({ profile }) => playerSelectScreen(profile, g),
});

export const ticTacToeMode = boardGame(ticTacToe, 'Tic-Tac-Toe', 10);
export const connectFourMode = boardGame(connectFour, 'Vier gewinnt', 20);
export const muehleMode = boardGame(muehle, 'Mühle', 30);

// Vorschau-URLs der Galeriebilder (werden beim nächsten Öffnen freigegeben)
const urls: string[] = [];

/** Puzzle: Reihe 2 = Motive (eigene Puzzlebilder und Bilder aus der Galerie). */
export const puzzleMode: Mode = {
  id: 'puzzle',
  icon: icons.puzzle,
  label: 'Puzzle',
  group: 'play',
  order: 40,
  async expand({ profile }, rows) {
    urls.forEach((u) => URL.revokeObjectURL(u));
    urls.length = 0;
    const motifs = await listMotifs(profile.id);
    rows.setRow(
      2,
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
          label: m.name,
          onTap: () => navigate(puzzleScreen(profile, m)),
        };
      }),
    );
  },
};
