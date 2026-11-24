import type { Screen } from '../app/screen';
import { navigate } from '../app/router';
import { createProfile } from '../storage/profiles';
import { renderAvatar, squareAvatar } from '../ui/avatar';
import { icons } from '../ui/icons';
import { profileSelectScreen } from './profile-select';

/** Vorläufig ohne PIN; wird in Plan 2 in den Elternbereich verlegt. */
export function profileCreateScreen(): Screen {
  let cleanup = () => undefined as void;
  return {
    name: 'profile-create',
    mount(root) {
      root.classList.add('parent-form');
      root.innerHTML = `
        <button class="icon-btn back" aria-label="Zurück">${icons.back}</button>
        <h1>Neues Profil</h1>
        <div class="avatar-preview"><span class="avatar big"></span></div>
        <label>Name <input name="name" autocomplete="off" maxlength="20"></label>
        <div class="row">
          <label class="file-btn">Kamera<input type="file" accept="image/*" capture="user" hidden></label>
          <label class="file-btn">Fotos<input type="file" accept="image/*" hidden></label>
        </div>
        <button class="primary" disabled>Fertig</button>`;
      const nameInput = root.querySelector<HTMLInputElement>('input[name=name]')!;
      const preview = root.querySelector<HTMLElement>('.avatar-preview .avatar')!;
      const done = root.querySelector<HTMLButtonElement>('button.primary')!;
      let avatar: Blob | null = null;

      const refresh = () => {
        cleanup();
        cleanup = renderAvatar(preview, { id: 'neu', name: nameInput.value || '?', avatar });
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
      root.querySelector<HTMLButtonElement>('.back')!.onclick = () => navigate(profileSelectScreen());
      done.onclick = async () => {
        done.disabled = true;
        await createProfile(nameInput.value.trim(), avatar);
        navigate(profileSelectScreen());
      };
      refresh();
    },
    unmount() {
      cleanup();
    },
  };
}
