import type { Mode } from '../registry';
import { icons } from '../../ui/icons';
import { navigate } from '../../app/router';
import { paintScreen } from '../../paint/paint-screen';
import { getTemplateSource } from '../../templates';

const img = (src: string) => `<img src="${src}" alt="" draggable="false">`;

/** Ausmalen: Reihe 2 = Themen, Reihe 3 = Vorlagen des Themas, Tipp → Malfläche mit Vorlage. */
export const coloringMode: Mode = {
  id: 'coloring',
  icon: icons.coloring,
  order: 20,
  async expand({ profile }, rows) {
    const source = getTemplateSource();
    const themes = await source.listThemes();
    rows.setRow(
      2,
      themes.map((th) => ({
        id: th.id,
        icon: img(source.previewUrl(th)),
        onTap: async () => {
          const list = await source.listTemplates(th.id);
          rows.setRow(
            3,
            list.map((t) => ({
              id: t.id,
              icon: img(source.previewUrl(t)),
              onTap: () => navigate(paintScreen({ profile, modeId: 'coloring', templateId: t.id })),
            })),
          );
        },
      })),
    );
  },
};
