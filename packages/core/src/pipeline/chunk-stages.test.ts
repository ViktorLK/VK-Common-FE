import { describe, it, expect } from 'vitest';
import { chunkStages } from './chunk-stages.js';

interface TestStage {
  id: string;
  order: number;
  group?: number;
}

describe('chunkStages', () => {
  it('should return empty array for empty stages', () => {
    expect(chunkStages([], (s) => s.order, (s) => s.group)).toEqual([]);
  });

  it('should chunk sequentially when no groups match and orders are distinct', () => {
    const stages: TestStage[] = [
      { id: 'a', order: 10 },
      { id: 'b', order: 20 },
      { id: 'c', order: 30 },
    ];

    const chunks = chunkStages(stages, (s) => s.order, (s) => s.group);
    expect(chunks).toHaveLength(3);
    expect(chunks[0]?.map((s) => s.id)).toEqual(['a']);
    expect(chunks[1]?.map((s) => s.id)).toEqual(['b']);
    expect(chunks[2]?.map((s) => s.id)).toEqual(['c']);
  });

  it('should group stages with matching parallelGroup into one chunk', () => {
    const stages: TestStage[] = [
      { id: 'init', order: 1 },
      { id: 'loadUser', order: 10, group: 1 },
      { id: 'loadSettings', order: 10, group: 1 },
      { id: 'finish', order: 20 },
    ];

    const chunks = chunkStages(stages, (s) => s.order, (s) => s.group);
    expect(chunks).toHaveLength(3);
    expect(chunks[0]?.map((s) => s.id)).toEqual(['init']);
    expect(chunks[1]?.map((s) => s.id)).toEqual(['loadUser', 'loadSettings']);
    expect(chunks[2]?.map((s) => s.id)).toEqual(['finish']);
  });

  it('should group stages with same order into one chunk', () => {
    const stages: TestStage[] = [
      { id: 'a', order: 5 },
      { id: 'b', order: 5 },
    ];

    const chunks = chunkStages(stages, (s) => s.order, (s) => s.group);
    expect(chunks).toHaveLength(1);
    expect(chunks[0]?.map((s) => s.id)).toEqual(['a', 'b']);
  });
});
