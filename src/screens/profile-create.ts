import type { Screen } from '../app/screen';
import type { Profile } from '../storage/types';
import { navigate } from '../app/router';
import { createProfile, listProfiles, updateProfile } from '../storage/profiles';
import { listPictures } from '../storage/pictures';
import { getDayQuota, setDayQuota } from '../storage/quota-store';
import { dayKey } from '../quota/quota';
import { renderAvatar, squareAvatar } from '../ui/avatar';
import { icons } from '../ui/icons';

/** Profil anlegen oder bearbeiten (nur aus dem Elternbereich erreichbar). */
export function profileEditScreen(existing: Profile | null, back: () => Screen): Screen {
  let cleanup = () => undefined as void;
  const urls: string[] = [];
  return {
    name: existing ? 'profile-edit' : 'profile-create',
    mount(root) {
      root.classList.add('parent-form');
      root.innerHTML = `
        <button class="icon-btn back" aria-label="Zurück">${icons.back}</button>
        <h1></h1>
        <div class="avatar-preview"><span class="avatar big"></span></div>
        <label>Name <input name="name" autocomplete="off" maxlength="20"></label>
        <div class="row">
          <label class="file-btn">Kamera<input type="file" accept="image/*" capture="user" hidden></label>
          <label class="file-btn">Fotos<input type="file" accept="image/*" hidden></label>
          <button class="file-btn" data-testid="avatar-from-gallery" hidden>Aus der Galerie</button>
        </div>
        <div class="avatar-pick" hidden></div>
        <button class="primary" disabled>Fertig</button>`;
      root.querySelector('h1')!.textContent = existing ? 'Profil bearbeiten' : 'Neues Profil';
      const nameInput = root.querySelector<HTMLInputElement>('input[name=name]')!;
      const preview = root.querySelector<HTMLElement>('.avatar-preview .avatar')!;
      const done = root.querySelector<HTMLButtonElement>('button.primary')!;
      const fromGallery = root.querySelector<HTMLButtonElement>('[data-testid="avatar-from-gallery"]')!;
      const pick = root.querySelector<HTMLElement>('.avatar-pick')!;
      let avatar: Blob | null = existing?.avatar ?? null;
      nameInput.value = existing?.name ?? '';

      const refresh = () => {
        cleanup();
        cleanup = renderAvatar(preview, { id: existing?.id ?? 'neu', name: nameInput.value || '?', avatar });
        done.disabled = nameInput.value.trim() === '';
      };
      nameInput.oninput = refresh;
      root.querySelectorAll<HTMLInputElement>('input[type=file]').forEach((inp) => {
        inp.onchange = async () => {
          const file = inp.files?.[0];
          if (!file) return;
          try {
            avatar = await squareAvatar(file);
          } catch (e) {
            console.error(e);
          }
          refresh();
        };
      });
      // Profilbild aus den eigenen gemalten Bildern
      if (existing) {
        listPictures(existing.id).then((pics) => {
          if (!pics.length) return;
          fromGallery.hidden = false;
          fromGallery.onclick = () => {
            pick.hidden = !pick.hidden;
            if (pick.childElementCount) return;
            for (const p of pics) {
              const b = document.createElement('button');
              const url = URL.createObjectURL(p.thumb);
              urls.push(url);
              b.innerHTML = `<img src="${url}" alt="">`;
              b.onclick = async () => {
                avatar = await squareAvatar(p.thumb);
                pick.hidden = true;
                refresh();
              };
              pick.append(b);
            }
          };
        });
      }
      root.querySelector<HTMLButtonElement>('.back')!.onclick = () => navigate(back());
      done.onclick = async () => {
        done.disabled = true;
        const name = nameInput.value.trim();
        if (existing) {
          await updateProfile({ ...existing, name, avatar });
        } else {
          const first = (await listProfiles()).length === 0;
          const p = await createProfile(name, avatar);
          // Erstes Profil: heutiges Kontingent = Standard, damit nicht sofort die Tagesabfrage erscheint
          if (first && !(await getDayQuota(dayKey()))) await setDayQuota(dayKey(), { [p.id]: p.defaultQuotaMin });
        }
        navigate(back());
      };
      refresh();
    },
    unmount() {
      cleanup();
      urls.forEach((u) => URL.revokeObjectURL(u));
    },
  };
}
