// [AP.04] [MB.03] React Hook for observing and controlling the Offline Mutation Outbox
import { useState, useEffect, useCallback } from 'react';
import { type VKResult } from '@vk-blocks/core';
import { useVKOutboxContext } from '../providers/VKOutboxProvider.js';
import { type VKOutboxManager } from '../outbox/vk-outbox-manager.js';
import { type VKOutboxReplayResult } from '../outbox/types.js';

export interface UseVKOutboxResult {
  /** Whether the client currently has network connectivity. */
  readonly isOnline: boolean;
  /** Number of pending mutations currently waiting in the outbox. */
  readonly pendingCount: number;
  /** Whether outbox replay is currently in progress. */
  readonly isReplaying: boolean;
  /** Triggers an immediate manual FIFO replay of all pending outbox entries. */
  readonly replay: () => Promise<VKResult<VKOutboxReplayResult>>;
  /** Clears all entries from the outbox write log. */
  readonly clear: () => Promise<VKResult<void>>;
  /** The underlying VKOutboxManager instance. */
  readonly manager: VKOutboxManager;
}

/**
 * Hook providing reactive observability and manual control over the mutation outbox (AP.04).
 */
export function useVKOutbox(): UseVKOutboxResult {
  const { outboxManager } = useVKOutboxContext();

  const [isOnline, setIsOnline] = useState<boolean>(() => outboxManager.isOnline());
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isReplaying, setIsReplaying] = useState<boolean>(() => outboxManager.isReplaying());

  const refreshCount = useCallback(async () => {
    const sizeResult = await outboxManager.size();
    if (sizeResult.isSuccess) {
      setPendingCount(sizeResult.value);
    }
  }, [outboxManager]);

  useEffect(() => {
    void refreshCount();

    const unsubscribe = outboxManager.subscribe((event) => {
      setIsOnline(outboxManager.isOnline());
      setIsReplaying(outboxManager.isReplaying());
      void refreshCount();
    });

    return () => {
      unsubscribe();
    };
  }, [outboxManager, refreshCount]);

  const replay = useCallback(async () => {
    const result = await outboxManager.replay();
    void refreshCount();
    return result;
  }, [outboxManager, refreshCount]);

  const clear = useCallback(async () => {
    const result = await outboxManager.clear();
    void refreshCount();
    return result;
  }, [outboxManager, refreshCount]);

  return {
    isOnline,
    pendingCount,
    isReplaying,
    replay,
    clear,
    manager: outboxManager,
  };
}
