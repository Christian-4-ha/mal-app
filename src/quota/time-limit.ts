import { timeLimited, type Profile } from '../storage/types';
import { icons } from '../ui/icons';
import { startQuotaSession } from './session';

/**
 * Nutzungszeit für einen Bildschirm (Malen, Spiele): Sanduhr-Hinweise in host, onExpired bei Ablauf.
 * Erwachsene mit ausgeschalteter Nutzungszeit: nichts.
 */
export function startTimeLimit(profile: Profile, host: HTMLElement, onExpired: () => void): () => void {
  if (!timeLimited(profile)) return () => {};
  return startQuotaSession(profile, {
    onWarning: (_m, rem) => showHourglass(host, rem, profile.defaultQuotaMin),
    onExpired,
  });
}

/** Hinweis vor Ablauf, ohne Text: Sanduhr mit Restzeit-Balken, blockiert nichts. */
function showHourglass(host: HTMLElement, remainingSec: number, totalMin: number): void {
  host.querySelector('.hourglass-toast')?.remove();
  const t = document.createElement('div');
  t.className = 'hourglass-toast';
  t.dataset.testid = 'quota-warning';
  const share = Math.max(0.05, Math.min(1, remainingSec / Math.max(60, totalMin * 60)));
  t.innerHTML = `${icons.hourglass}<span class="rest-bar"><span style="width:${Math.round(share * 100)}%"></span></span>`;
  host.append(t);
  setTimeout(() => t.remove(), 3500);
}
