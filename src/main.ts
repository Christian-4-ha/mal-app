import './styles.css';
import './tools';
import './modes';
import { registerSW } from 'virtual:pwa-register';
import { setRoot, navigate } from './app/router';
import { purgeTrash } from './storage/pictures';
import { profileSelectScreen } from './screens/profile-select';
import { pinSetupScreen } from './screens/pin-setup';
import { hasPin } from './parent/pin-dialog';

// Neue Version wird im Hintergrund geladen, aktiv erst beim nächsten Start (nie mitten im Malen).
registerSW({ onNeedRefresh() {} });

navigator.storage?.persist?.().catch(() => undefined);
purgeTrash().catch(() => undefined);

setRoot(document.getElementById('app')!);
void hasPin().then((ok) => navigate(ok ? profileSelectScreen() : pinSetupScreen()));
