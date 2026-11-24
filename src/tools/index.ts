// Die eine Stelle, an der Werkzeuge registriert werden.
import { registerTool } from './registry';
import { createBrush } from './brush';
import { createMarker } from './marker';
import { createFineliner } from './fineliner';
import { createSpray } from './spray';
import { createBucket } from './bucket';
import { createMagic } from './magic';
import { createPattern } from './pattern';
import { createTexture } from './texture';
import { createEraser } from './eraser';

registerTool(createBrush());
registerTool(createMarker());
registerTool(createFineliner());
registerTool(createSpray());
registerTool(createBucket());
registerTool(createMagic());
registerTool(createPattern());
registerTool(createTexture());
registerTool(createEraser());
