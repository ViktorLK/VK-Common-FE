// [AP.01] [CS.05] Form Unsaved Changes Dirty Guard Hook
import { useEffect } from 'react';

export interface UseDirtyGuardOptions {
  /**
   * Whether the form has unsaved modifications (e.g. from RHF `formState.isDirty`).
   */
  readonly isDirty: boolean;

  /**
   * Whether the guard protection is actively enabled.
   * @default true
   */
  readonly enabled?: boolean;

  /**
   * Optional custom warning message for browser beforeunload prompt.
   * @default 'You have unsaved changes. Are you sure you want to leave?'
   */
  readonly message?: string;

  /**
   * Optional interceptor callback invoked when navigation is attempted.
   * Return true to proceed, false to block.
   */
  readonly onBlock?: (proceed: () => void) => void | boolean | Promise<boolean>;
}

export interface UseDirtyGuardReturn {
  /**
   * Whether the dirty guard is currently protecting the view.
   */
  readonly isGuarded: boolean;

  /**
   * Triggers an interactive confirmation prompt programmatically.
   * Resolves to true if user confirms discarding unsaved changes, false if canceled.
   */
  readonly confirmExit: () => Promise<boolean>;
}

/**
 * Universal browser navigation & tab close guard for forms with unsaved modifications.
 * Listens to window `beforeunload` to prevent accidental data loss.
 */
export function useDirtyGuard({
  isDirty,
  enabled = true,
  message = 'You have unsaved changes. Are you sure you want to leave?',
  onBlock,
}: UseDirtyGuardOptions): UseDirtyGuardReturn {
  const isGuarded = enabled && isDirty;

  useEffect(() => {
    if (!isGuarded || typeof window === 'undefined') {
      return;
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = message;
      return message;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isGuarded, message]);

  const confirmExit = async (): Promise<boolean> => {
    if (!isGuarded) {
      return true;
    }

    if (onBlock) {
      return new Promise<boolean>((resolve) => {
        const proceed = () => resolve(true);
        const result = onBlock(proceed);
        if (typeof result === 'boolean') {
          resolve(result);
        } else if (result && typeof result.then === 'function') {
          result.then(resolve).catch(() => resolve(false));
        }
      });
    }

    if (typeof window !== 'undefined') {
      return window.confirm(message);
    }

    return true;
  };

  return { isGuarded, confirmExit };
}
