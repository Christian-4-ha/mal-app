// Die eine Stelle, an der Werkzeuge registriert werden.
import { registerTool } from './registry';
import { createBrush } from './brush';
import { createMarker } from './marker';
import { createFineliner } from './fineliner';
import { createEraser } from './eraser';

registerTool(createBrush());
registerTool(createMarker());
registerTool(createFineliner());
registerTool(createEraser());
