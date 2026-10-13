import { describe, it, expect } from 'vitest';
import { applyFilters } from './apply-filters.js';
import { filterEntries } from './filter-entries.js';
import { VKFilterVerdict } from './filtering.constants.js';
import type { VKEntryFilter } from './filtering.types.js';
import { VKResult } from '../result/index.js';
import { VKError } from '../errors/index.js';

interface Message {
  id: string;
  sender: string;
  text: string;
  isDeleted: boolean;
  isPinned: boolean;
}

describe('applyFilters and filterEntries', () => {
  const activeMessage: Message = {
    id: 'm1',
    sender: 'alice',
    text: 'hello',
    isDeleted: false,
    isPinned: false,
  };

  const deletedMessage: Message = {
    id: 'm2',
    sender: 'bob',
    text: 'spam',
    isDeleted: true,
    isPinned: false,
  };

  const pinnedDeletedMessage: Message = {
    id: 'm3',
    sender: 'admin',
    text: 'announcement',
    isDeleted: true,
    isPinned: true,
  };

  // Filter 1: If pinned, ForceKeep (bypasses subsequent filters)
  const pinnedFilter: VKEntryFilter<Message, void> = {
    filterOrder: 10,
    filter: (msg) =>
      VKResult.success(msg.isPinned ? VKFilterVerdict.ForceKeep : VKFilterVerdict.Keep),
  };

  // Filter 2: If deleted, Reject
  const deletedFilter: VKEntryFilter<Message, void> = {
    filterOrder: 20,
    filter: (msg) =>
      VKResult.success(msg.isDeleted ? VKFilterVerdict.Reject : VKFilterVerdict.Keep),
  };

  describe('applyFilters', () => {
    it('should keep normal active message', async () => {
      const res = await applyFilters([pinnedFilter, deletedFilter], activeMessage, undefined);
      expect(res.isSuccess).toBe(true);
      expect(res.value).toBe(VKFilterVerdict.Keep);
    });

    it('should reject deleted message', async () => {
      const res = await applyFilters([pinnedFilter, deletedFilter], deletedMessage, undefined);
      expect(res.isSuccess).toBe(true);
      expect(res.value).toBe(VKFilterVerdict.Reject);
    });

    it('should force-keep pinned message even if deleted (short-circuit)', async () => {
      const res = await applyFilters([pinnedFilter, deletedFilter], pinnedDeletedMessage, undefined);
      expect(res.isSuccess).toBe(true);
      expect(res.value).toBe(VKFilterVerdict.ForceKeep);
    });

    it('should halt on filter failure', async () => {
      const faultyFilter: VKEntryFilter<Message, void> = {
        filterOrder: 5,
        filter: () => VKResult.failure(VKError.failure('Err.Filter', 'Filter error')),
      };

      const res = await applyFilters([faultyFilter, pinnedFilter], activeMessage, undefined);
      expect(res.isFailure).toBe(true);
      expect(res.errors[0]?.code).toBe('Err.Filter');
    });
  });

  describe('filterEntries', () => {
    it('should filter an array of entries keeping Keep and ForceKeep', async () => {
      const messages = [activeMessage, deletedMessage, pinnedDeletedMessage];
      const res = await filterEntries(messages, [pinnedFilter, deletedFilter], undefined);

      expect(res.isSuccess).toBe(true);
      expect(res.value).toHaveLength(2);
      expect(res.value).toContain(activeMessage);
      expect(res.value).toContain(pinnedDeletedMessage);
      expect(res.value).not.toContain(deletedMessage);
    });
  });
});
