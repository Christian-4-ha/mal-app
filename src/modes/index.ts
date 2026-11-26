// Die eine Stelle, an der Modi registriert werden.
import { registerMode } from './registry';
import { galleryMode } from './gallery';
import { freePaintMode } from './free-paint';
import { coloringMode } from './coloring';
import { mandalaMode } from './mandala';
import { dotsMode } from './dots';
import { connectFourMode, muehleMode, puzzleMode, ticTacToeMode } from './games';

registerMode(galleryMode);
registerMode(freePaintMode);
registerMode(coloringMode);
registerMode(mandalaMode);
registerMode(dotsMode);
registerMode(ticTacToeMode);
registerMode(connectFourMode);
registerMode(muehleMode);
registerMode(puzzleMode);
