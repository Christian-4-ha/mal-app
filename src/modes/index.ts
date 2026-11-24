// Die eine Stelle, an der Modi registriert werden.
import { registerMode } from './registry';
import { galleryMode } from './gallery';
import { freePaintMode } from './free-paint';
import { coloringMode } from './coloring';

registerMode(galleryMode);
registerMode(freePaintMode);
registerMode(coloringMode);
