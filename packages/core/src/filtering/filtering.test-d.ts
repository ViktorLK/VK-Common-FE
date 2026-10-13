import { describe, it, expectTypeOf } from 'vitest';
import type { VKEntryFilter, VKFilterVerdictType } from './filtering.types.js';
import { applyFilters } from './apply-filters.js';
import { filterEntries } from './filter-entries.js';
import type { VKResult } from '../result/index.js';

describe('filtering type tests', () => {
  it('should preserve type safety for generic entries', () => {
    interface Item {
      sku: string;
    }

    type Filter = VKEntryFilter<Item, { role: string }>;

    expectTypeOf(applyFilters<Item, { role: string }>).toBeCallableWith(
      [] as Filter[],
      { sku: '123' },
      { role: 'admin' },
    );

    expectTypeOf(filterEntries<Item, { role: string }>).toBeCallableWith(
      [] as Item[],
      [] as Filter[],
      { role: 'admin' },
    );
  });
});
