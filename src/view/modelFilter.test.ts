import { describe, expect, it } from 'vitest';
import { filterCommonModelOptions } from './modelFilter';

const models = [
  { value: 'a', label: 'A' },
  { value: 'b', label: 'B' },
  { value: 'c', label: 'C' },
];

describe('filterCommonModelOptions', () => {
  it('returns all models when no common models are configured', () => {
    expect(filterCommonModelOptions(models, [], '')).toEqual(models);
  });

  it('returns common models in configured order and ignores unknown IDs', () => {
    expect(filterCommonModelOptions(models, ['c', 'missing', 'a'], '')).toEqual([
      { value: 'c', label: 'C' },
      { value: 'a', label: 'A' },
    ]);
  });

  it('does not include an unchecked default model', () => {
    expect(filterCommonModelOptions(models, ['c'], 'b')).toEqual([
      { value: 'c', label: 'C' },
    ]);
  });
});
