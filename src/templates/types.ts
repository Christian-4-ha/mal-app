export interface Theme {
  id: string;
  /** Pfad relativ zu templates/ (Symbolbild) */
  icon: string;
}

export interface TemplateInfo {
  id: string;
  theme: string;
  /** Pfad relativ zu templates/ */
  file: string;
  /** Nur für alte gespeicherte Bilder: nicht in der Auswahl zeigen. */
  hidden?: boolean;
}

/** Austauschbare Quelle für Ausmal-Vorlagen (heute: Katalog; später z. B. Online-Generator). */
export interface TemplateSource {
  readonly id: string;
  listThemes(): Promise<Theme[]>;
  listTemplates(themeId: string): Promise<TemplateInfo[]>;
  /** URL zum Anzeigen (Vorschau) */
  previewUrl(t: TemplateInfo | Theme): string;
  /** SVG-Text der Vorlage; undefined, wenn unbekannt */
  loadSvg(templateId: string): Promise<string | undefined>;
}
