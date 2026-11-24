import type { TemplateSource } from './types';
import { catalogSource } from './catalog';

// Version 1: nur der mitgelieferte Katalog. Ein Online-Generator wäre eine weitere Quelle (Spec 7.4).
let source: TemplateSource = catalogSource;

export function getTemplateSource(): TemplateSource {
  return source;
}

export function setTemplateSource(s: TemplateSource): void {
  source = s;
}
