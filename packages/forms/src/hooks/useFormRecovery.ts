// [AP.01] [CS.05] Form Recovery & Crash Restoration Hook
import { useState, useEffect, useCallback } from 'react';
import type { UseFormReturn, FieldValues } from 'react-hook-form';
import {
  type VKFormStorageAdapter,
  type VKFormDraftPayload,
} from './useFormAutosave.js';
import { vkAssert } from '@vk-blocks/core';

export interface UseFormRecoveryOptions<TFieldValues extends FieldValues = FieldValues> {
  /**
   * The React Hook Form instance to manage.
   */
  readonly form: UseFormReturn<TFieldValues>;

  /**
   * Unique storage identifier for the persisted draft.
   */
  readonly storageKey: string;

  /**
   * Storage backend: 'local' (localStorage) | 'session' (sessionStorage) | custom adapter.
   * @default 'local'
   */
  readonly storage?: 'local' | 'session' | VKFormStorageAdapter;

  /**
   * Whether to automatically restore the draft without prompting if detected.
   * @default false
   */
  readonly autoRestore?: boolean;

  /**
   * Callback invoked when a restorable draft is detected on mount.
   */
  readonly onDraftDetected?: (draft: VKFormDraftPayload<TFieldValues>) => void;
}

export interface UseFormRecoveryReturn<TFieldValues extends FieldValues = FieldValues> {
  /**
   * Whether a valid offline draft exists in storage.
   */
  readonly hasDraft: boolean;

  /**
   * The detected draft values and timestamp, or null if no draft exists.
   */
  readonly draft: VKFormDraftPayload<TFieldValues> | null;

  /**
   * Restores the saved draft into the active form.
   */
  readonly restoreDraft: () => void;

  /**
   * Discards the saved draft from storage and clears detection state.
   */
  readonly discardDraft: () => void;
}

/**
 * Hook for detecting persisted offline drafts upon page load, offering crash recovery.
 */
export function useFormRecovery<TFieldValues extends FieldValues = FieldValues>({
  form,
  storageKey,
  storage = 'local',
  autoRestore = false,
  onDraftDetected,
}: UseFormRecoveryOptions<TFieldValues>): UseFormRecoveryReturn<TFieldValues> {
  // [AP.01] Boundary assertions
  vkAssert.notNull(form, 'form');
  vkAssert.notEmpty(storageKey, 'storageKey');

  const [draft, setDraft] = useState<VKFormDraftPayload<TFieldValues> | null>(null);

  const getStorage = useCallback((): Storage | VKFormStorageAdapter | null => {
    if (typeof storage === 'object' && storage !== null) return storage;
    if (typeof window === 'undefined') return null;
    return storage === 'session' ? window.sessionStorage : window.localStorage;
  }, [storage]);

  const discardDraft = useCallback(() => {
    const s = getStorage();
    try {
      s?.removeItem(storageKey);
    } catch {
      // Ignored
    }
    setDraft(null);
  }, [getStorage, storageKey]);

  const restoreDraft = useCallback(() => {
    if (!draft || !draft.values) return;
    form.reset({
      ...form.getValues(),
      ...draft.values,
    });
  }, [draft, form]);

  useEffect(() => {
    const s = getStorage();
    if (!s) return;

    try {
      const raw = s.getItem(storageKey);
      if (!raw) return;

      const parsed = JSON.parse(raw) as VKFormDraftPayload<TFieldValues>;
      if (parsed && typeof parsed.timestamp === 'number' && typeof parsed.values === 'object') {
        setDraft(parsed);
        onDraftDetected?.(parsed);

        if (autoRestore) {
          form.reset({
            ...form.getValues(),
            ...parsed.values,
          });
        }
      }
    } catch {
      // Parse error: discard corrupted draft
      discardDraft();
    }
  }, [autoRestore, discardDraft, form, getStorage, onDraftDetected, storageKey]);

  return {
    hasDraft: draft !== null,
    draft,
    restoreDraft,
    discardDraft,
  };
}
