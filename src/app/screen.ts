export interface Screen {
  readonly name: string;
  mount(root: HTMLElement): void;
  unmount(): Promise<void> | void;
}
