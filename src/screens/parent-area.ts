import type { Screen } from '../app/screen';
import type { Profile } from '../storage/types';
import { navigate } from '../app/router';
import { deleteProfile, listProfiles, updateProfile } from '../storage/profiles';
import { deletePicture, deleteTrashEntry, listPictures, listTrash, restoreFromTrash } from '../storage/pictures';
import { allowedMinutes, getDayQuota, getUsage, setDayQuota } from '../storage/quota-store';
import { dayKey } from '../quota/quota';
import { setupPin } from '../parent/pin-dialog';
import { createNumberWheel, createTimePicker } from '../ui/number-wheel';
import { renderAvatar } from '../ui/avatar';
import { icons } from '../ui/icons';
import { profileEditScreen } from './profile-create';
import { profileSelectScreen } from './profile-select';

function el<K extends keyof HTMLElementTagNameMap>(tag: K, text = '', cls = ''): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (text) e.textContent = text;
  if (cls) e.className = cls;
  return e;
}

/** Bilder eines Profils teilen (falls unterstützt) oder einzeln herunterladen. */
async function exportPictures(profile: Profile) {
  const pics = await listPictures(profile.id);
  if (!pics.length) return alert('Noch keine Bilder.');
  const files = pics.map((p, i) => new File([p.paint], `${profile.name}-${i + 1}.png`, { type: 'image/png' }));
  const nav = navigator as Navigator & { canShare?(d: ShareData): boolean };
  if (nav.canShare?.({ files })) {
    try {
      await navigator.share({ files, title: `Bilder von ${profile.name}` });
      return;
    } catch {
      /* abgebrochen → Download */
    }
  }
  for (const f of files) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(f);
    a.download = f.name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }
}

/** Elternbereich (mit Text). Nur nach PIN erreichbar. */
export function parentAreaScreen(): Screen {
  const cleanups: (() => void)[] = [];
  const urls: string[] = [];
  const self = (): Screen => parentAreaScreen();
  return {
    name: 'parent-area',
    mount(root) {
      root.classList.add('parent-form', 'parent-area');
      const back = el('button', '', 'icon-btn back');
      back.innerHTML = icons.back;
      back.setAttribute('aria-label', 'Zurück');
      back.onclick = () => navigate(profileSelectScreen());
      root.append(back, el('h1', 'Elternbereich'));

      const render = async () => {
        const day = dayKey();
        // --- Profile ---
        const sec = el('section');
        sec.append(el('h2', 'Kinder'));
        for (const p of await listProfiles()) {
          const cur: Profile = { ...p }; // gemeinsamer, aktueller Stand für alle Regler dieser Karte
          const card = el('div', '', 'parent-card');
          card.dataset.testid = 'parent-profile';
          const head = el('div', '', 'parent-card-head');
          const av = el('span');
          av.classList.add('small');
          cleanups.push(renderAvatar(av, p));
          head.append(av, el('strong', p.name));
          const edit = el('button', 'Bearbeiten', 'file-btn');
          edit.onclick = () => navigate(profileEditScreen(cur, self)); // aktueller Stand, nicht der alte
          const del = el('button', 'Löschen', 'file-btn danger');
          del.onclick = async () => {
            if (!confirm(`Profil „${p.name}“ löschen? Die Bilder kommen 30 Tage in den Papierkorb.`)) return;
            await deleteProfile(p.id);
            navigate(self());
          };
          head.append(edit, del);
          card.append(head);

          const std = el('div', '', 'parent-line');
          std.append(el('span', 'Standard-Nutzungszeit:'), createTimePicker(p.defaultQuotaMin, (m) => void updateProfile(Object.assign(cur, { defaultQuotaMin: m })), `std-${p.name}`));
          card.append(std);

          const today = el('div', '', 'parent-line');
          const used = Math.floor((await getUsage(day, p.id)) / 60);
          today.append(
            el('span', `Heute (schon ${used} Min gemalt):`),
            createTimePicker(await allowedMinutes(day, p), async (m) => {
              await setDayQuota(day, { ...((await getDayQuota(day)) ?? {}), [p.id]: m });
            }, `today-${p.name}`),
          );
          card.append(today);

          // Hinweise vor Ablauf: beliebig viele Zeitpunkte in Minuten
          const warn = el('div', '', 'parent-line');
          warn.append(el('span', 'Hinweise vor Ende (Min):'));
          const chips = el('span', '', 'warn-chips');
          const warnings = [...p.warningsMin];
          const save = () => updateProfile(Object.assign(cur, { warningsMin: [...warnings].sort((a, b) => b - a) }));
          const drawChips = () => {
            chips.replaceChildren();
            warnings.forEach((w, i) => {
              const chip = el('span', '', 'warn-chip');
              chip.append(createNumberWheel(w, { min: 1, max: 60, step: 1 }, (v) => ((warnings[i] = v), void save())).el);
              const x = el('button', '×', 'chip-x');
              x.setAttribute('aria-label', 'Hinweis entfernen');
              x.onclick = () => {
                warnings.splice(i, 1);
                void save();
                drawChips();
              };
              chip.append(x);
              chips.append(chip);
            });
            const add = el('button', '+', 'chip-add');
            add.setAttribute('aria-label', 'Hinweis hinzufügen');
            add.onclick = () => {
              warnings.push(warnings.length ? Math.max(1, Math.min(...warnings) - 1) : 5);
              void save();
              drawChips();
            };
            chips.append(add);
          };
          drawChips();
          warn.append(chips);
          card.append(warn);

          // Bilder verwalten
          const pics = await listPictures(p.id);
          const picLine = el('div', '', 'parent-line');
          picLine.append(el('span', `${pics.length} Bilder`));
          const exp = el('button', 'Exportieren', 'file-btn');
          exp.onclick = () => void exportPictures(p);
          picLine.append(exp);
          card.append(picLine);
          const grid = el('div', '', 'parent-pics');
          for (const pic of pics) {
            const item = el('div', '', 'parent-pic');
            const url = URL.createObjectURL(pic.thumb);
            urls.push(url);
            item.innerHTML = `<img src="${url}" alt="">`;
            const d = el('button', 'Löschen', 'chip-x wide');
            d.onclick = async () => {
              await deletePicture(pic.id);
              navigate(self());
            };
            item.append(d);
            grid.append(item);
          }
          card.append(grid);
          sec.append(card);
        }
        const add = el('button', '+ Neues Kind', 'primary');
        add.dataset.testid = 'parent-add-profile';
        add.onclick = () => navigate(profileEditScreen(null, self));
        sec.append(add);
        root.append(sec);

        // --- Papierkorb ---
        const trash = await listTrash();
        const tsec = el('section');
        tsec.append(el('h2', `Papierkorb (${trash.length}) – wird nach 30 Tagen geleert`));
        const tgrid = el('div', '', 'parent-pics');
        for (const t of trash) {
          const item = el('div', '', 'parent-pic');
          const url = URL.createObjectURL(t.picture.thumb);
          urls.push(url);
          item.innerHTML = `<img src="${url}" alt="">`;
          const r = el('button', 'Zurückholen', 'chip-x wide ok');
          r.onclick = async () => {
            await restoreFromTrash(t.id);
            navigate(self());
          };
          const d = el('button', 'Endgültig löschen', 'chip-x wide');
          d.onclick = async () => {
            if (!confirm('Dieses Bild endgültig löschen? Das kann nicht rückgängig gemacht werden.')) return;
            await deleteTrashEntry(t.id);
            navigate(self());
          };
          item.append(r, d);
          tgrid.append(item);
        }
        tsec.append(tgrid);
        root.append(tsec);

        // --- Sonstiges ---
        const osec = el('section');
        osec.append(el('h2', 'Einstellungen'));
        const pin = el('button', 'PIN ändern', 'file-btn');
        pin.onclick = () => void setupPin();
        osec.append(pin);
        osec.append(
          el(
            'p',
            'Tipp: Die App über Safari → Teilen → „Zum Home-Bildschirm“ installieren und immer über das Symbol öffnen. So bleiben Bilder zuverlässig gespeichert.',
            'hint',
          ),
        );
        root.append(osec);
      };
      void render();
    },
    unmount() {
      cleanups.forEach((c) => c());
      urls.forEach((u) => URL.revokeObjectURL(u));
    },
  };
}

