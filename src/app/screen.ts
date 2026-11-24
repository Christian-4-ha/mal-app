export interface Screen {
  readonly name: string;
  mount(root: HTMLElement): void;
  /** `false` verhindert den Wechsel (z. B. weil Speichern fehlgeschlagen ist). */
  unmount(): Promise<void | boolean> | void | boolean;
}
