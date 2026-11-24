import './styles.css';
import { registerSW } from 'virtual:pwa-register';

// Neue Version wird im Hintergrund geladen, aktiv erst beim nächsten Start (nie mitten im Malen).
registerSW({ onNeedRefresh() {} });

navigator.storage?.persist?.().catch(() => undefined);

const root = document.getElementById('app')!;
root.innerHTML = '<div data-screen="boot"></div>';

import { purgeTrash } from './storage/pictures';
purgeTrash().catch(() => undefined);
