import { beforeEach, describe, expect, it } from 'vitest';
import { listTools, registerTool, resetToolsForTest } from './registry';
import type { Tool } from './types';

const t = (id: string, order: number): Tool => ({
  id,
  icon: '',
  order,
  minSize: 1,
  maxSize: 10,
  defaultSize: 5,
  begin() {},
  move() {},
  end() {},
});

describe('tool registry', () => {
  beforeEach(resetToolsForTest);

  it('Werkzeuge nach order sortiert', () => {
    registerTool(t('b', 2));
    registerTool(t('a', 1));
    expect(listTools().map((x) => x.id)).toEqual(['a', 'b']);
  });

  it('doppelte id wirft', () => {
    registerTool(t('a', 1));
    expect(() => registerTool(t('a', 2))).toThrow();
  });
});
