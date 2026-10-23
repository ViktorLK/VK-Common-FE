// [AP.01] [CS.05] [FS-12] Enterprise Form Autosave & Draft Protection Hook
import { useState, useEffect, useRef, useCallback } from 'react';
import type { UseFormReturn, FieldValues } from 'react-hook-form';
import { vkAssert } from '@vk-blocks/core';

export interface VKFormStorageAdapter {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
}

export interface VKFormDraftPayload<TFieldValues extends FieldValues = FieldValues> {
  readonly values: Partial<TFieldValues>;
  readonly timestamp: number;
}

export const DEFAULT_SENSITIVE_FIELDS: readonly string[] = [
  'password',
  'confirmPassword',
  'token',
  'secret',
  'cardNumber',
  'cvv',
  'pin',
  'accessToken',
  'refreshToken',
  'apiKey',
];

export interface UseFormAutosaveOptions<TFieldValues extends FieldValues = FieldValues> {
  /**
   * The React Hook Form instance to monitor.
   */
  readonly form: UseFormReturn<TFieldValues>;

  /**
   * Unique storage identifier for this form's offline draft.
   */
  readonly storageKey: string;

  /**
   * Whether autosave is actively running.
   * @default true
   */
  readonly enabled?: boolean;

  /**
   * Debounce delay in milliseconds before persisting draft to offline medium.
   * @default 1000
   */
  readonly debounceMs?: number;

  /**
   * Storage medium: 'local' (localStorage) | 'session' (sessionStorage) | custom adapter.
   * @default 'local'
   */
  readonly storage?: 'local' | 'session' | VKFormStorageAdapter;

  /**
   * Field names to scrub/redact from offline storage to prevent credential leakage.
   * @default DEFAULT_SENSITIVE_FIELDS
   */
  readonly excludeFields?: readonly string[];

  /**
   * Optional callback fired immediately after a draft is written.
   */
  readonly onSaved?: (draft: VKFormDraftPayload<TFieldValues>) => void;
}

export interface UseFormAutosaveReturn<TFieldValues extends FieldValues = FieldValues> {
  /**
   * Epoch millisecond timestamp of last successful autosave, or null if unsaved.
   */
  readonly lastSavedAt: number | null;

  /**
   * Whether an autosave operation is currently debouncing or writing.
   */
  readonly isSaving: boolean;

  /**
   * Forces an immediate save of current form values without waiting for debounce.
   */
  readonly saveNow: () => void;

  /**
   * Removes any persisted draft from offline storage.
   */
  readonly clearDraft: () => void;

  /**
   * Reads the current persisted draft from offline storage without modifying form.
   */
  readonly getSavedDraft: () => VKFormDraftPayload<TFieldValues> | null;

  /**
   * Restores the persisted draft into the form. Returns true if draft existed, false otherwise.
   */
  readonly restoreDraft: () => boolean;
}

function resolveStorageAdapter(storage: 'local' | 'session' | VKFormStorageAdapter = 'local'): VKFormStorageAdapter {
  if (typeof storage === 'object' && storage !== null) {
    return storage;
  }

  if (typeof window === 'undefined') {
    // SSR fallback no-op storage
    return {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    };
  }

  const browserStorage = storage === 'session' ? window.sessionStorage : window.localStorage;
  return {
    getItem: (key: string) => {
      try {
        return browserStorage.getItem(key);
      } catch {
        return null;
      }
    },
    setItem: (key: string, value: string) => {
      try {
        browserStorage.setItem(key, value);
      } catch {
        // Storage quota exceeded or disabled
      }
    },
    removeItem: (key: string) => {
      try {
        browserStorage.removeItem(key);
      } catch {
        // Ignored
      }
    },
  };
}

/**
 * Sanitizes form values by stripping sensitive keys before persisting.
 */
function sanitizeDraftValues<TFieldValues extends FieldValues>(
  values: TFieldValues,
  excludeFields: readonly string[],
): Partial<TFieldValues> {
  const result: Record<string, unknown> = {};
  const lowerExcludes = new Set(excludeFields.map((f) => f.toLowerCase()));

  for (const [key, val] of Object.entries(values)) {
    if (!lowerExcludes.has(key.toLowerCase())) {
      result[key] = val;
    }
  }

  return result as Partial<TFieldValues>;
}

/**
 * Universal silent autosave Hook with debouncing, credential redaction, and crash recovery.
 */
export function useFormAutosave<TFieldValues extends FieldValues = FieldValues>({
  form,
  storageKey,
  enabled = true,
  debounceMs = 1000,
  storage = 'local',
  excludeFields = DEFAULT_SENSITIVE_FIELDS,
  onSaved,
}: UseFormAutosaveOptions<TFieldValues>): UseFormAutosaveReturn<TFieldValues> {
  // [AP.01] Boundary assertions
  vkAssert.notNull(form, 'form');
  vkAssert.notEmpty(storageKey, 'storageKey');

  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const storageAdapter = resolveStorageAdapter(storage);

  const getSavedDraft = useCallback((): VKFormDraftPayload<TFieldValues> | null => {
    const raw = storageAdapter.getItem(storageKey);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as VKFormDraftPayload<TFieldValues>;
      if (parsed && typeof parsed.timestamp === 'number' && typeof parsed.values === 'object') {
        return parsed;
      }
      return null;
    } catch {
      return null;
    }
  }, [storageAdapter, storageKey]);

  const clearDraft = useCallback(() => {
    storageAdapter.removeItem(storageKey);
    setLastSavedAt(null);
  }, [storageAdapter, storageKey]);

  const saveValues = useCallback(
    (currentValues: TFieldValues) => {
      const sanitized = sanitizeDraftValues(currentValues, excludeFields);
      const payload: VKFormDraftPayload<TFieldValues> = {
        values: sanitized,
        timestamp: Date.now(),
      };

      storageAdapter.setItem(storageKey, JSON.stringify(payload));
      setLastSavedAt(payload.timestamp);
      setIsSaving(false);
      onSaved?.(payload);
    },
    [excludeFields, onSaved, storageAdapter, storageKey],
  );

  const saveNow = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    saveValues(form.getValues());
  }, [form, saveValues]);

  const restoreDraft = useCallback((): boolean => {
    const draft = getSavedDraft();
    if (!draft || !draft.values) {
      return false;
    }
    form.reset({
      ...form.getValues(),
      ...draft.values,
    });
    return true;
  }, [form, getSavedDraft]);

  // Watch form modifications and schedule debounced autosave
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const subscription = form.watch((values) => {
      if (!form.formState.isDirty) {
        return;
      }

      setIsSaving(true);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      timerRef.current = setTimeout(() => {
        saveValues(values as TFieldValues);
        timerRef.current = null;
      }, debounceMs);
    });

    return () => {
      subscription.unsubscribe();
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [debounceMs, enabled, form, saveValues]);

  return {
    lastSavedAt,
    isSaving,
    saveNow,
    clearDraft,
    getSavedDraft,
    restoreDraft,
  };
}
