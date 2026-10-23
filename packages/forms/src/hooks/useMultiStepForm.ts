// [AP.01] [CS.03] Multi-step Form State Machine Hook with Persistence and Dynamic Skipping
import { useState, useCallback, useEffect } from 'react';
import { vkAssert } from '@vk-blocks/core';

export interface VKMultiStepPersistenceConfig {
  /**
   * Unique identifier key used for persistence storage or URL parameter namespace.
   */
  readonly key: string;

  /**
   * Persistence medium: 'url' (URL search params) | 'session' (sessionStorage) | 'local' (localStorage) | 'memory'.
   * @default 'memory'
   */
  readonly type?: 'url' | 'session' | 'local' | 'memory';

  /**
   * URL parameter query key when type === 'url'.
   * @default 'step'
   */
  readonly urlParamName?: string;
}

export interface UseMultiStepFormOptions<TStep> {
  /**
   * Defined array of steps or metadata for each step.
   */
  readonly steps: readonly TStep[];

  /**
   * Initial step index (0-indexed). Defaults to 0.
   */
  readonly initialStep?: number;

  /**
   * Optional step validation guard before transitioning to the next step.
   * Return true to allow progress, false to block transition.
   */
  readonly onValidateStep?: (
    currentStepIndex: number,
    currentStep: TStep,
  ) => Promise<boolean> | boolean;

  /**
   * Optional dynamic transition resolver calculating the next step index.
   * Allows conditional branching and non-linear workflows.
   */
  readonly getNextStep?: (currentStepIndex: number, currentStep: TStep) => number;

  /**
   * Optional dynamic transition resolver calculating the previous step index.
   */
  readonly getPrevStep?: (currentStepIndex: number, currentStep: TStep) => number;

  /**
   * Predicate checking whether a particular step should be skipped based on current state.
   */
  readonly canSkipStep?: (stepIndex: number, step: TStep) => boolean;

  /**
   * Persistence configuration for preserving active step across reloads.
   */
  readonly persistence?: VKMultiStepPersistenceConfig;
}

export interface UseMultiStepFormReturn<TStep> {
  /**
   * Active step 0-indexed index.
   */
  readonly currentStepIndex: number;

  /**
   * The current active step definition.
   */
  readonly currentStep: TStep;

  /**
   * Total count of defined steps.
   */
  readonly totalSteps: number;

  /**
   * Whether the active step is the first step.
   */
  readonly isFirstStep: boolean;

  /**
   * Whether the active step is the final step.
   */
  readonly isLastStep: boolean;

  /**
   * Navigates to the next step after awaiting validation (if defined).
   * Supports dynamic custom branching and skip predicates.
   * Returns true if transition succeeded, false if blocked.
   */
  readonly goToNext: () => Promise<boolean>;

  /**
   * Navigates backwards to the previous step.
   */
  readonly goToPrev: () => void;

  /**
   * Jumps directly to an arbitrary step index within bounds.
   */
  readonly goToStep: (index: number) => void;

  /**
   * Resets step state machine back to the initial step and clears persistence.
   */
  readonly reset: () => void;

  /**
   * Clears persisted step storage without resetting active state.
   */
  readonly clearPersistence: () => void;
}

function readPersistedStep(
  config: VKMultiStepPersistenceConfig | undefined,
  totalSteps: number,
  fallback: number,
): number {
  if (!config || config.type === 'memory' || typeof window === 'undefined') {
    return fallback;
  }

  const { type = 'memory', key, urlParamName = 'step' } = config;

  try {
    if (type === 'url') {
      const params = new URLSearchParams(window.location.search);
      const val = params.get(urlParamName);
      if (val !== null) {
        const parsed = parseInt(val, 10);
        // Treat 1-indexed in query as 0-indexed internally
        const target = parsed > 0 ? parsed - 1 : parsed;
        if (target >= 0 && target < totalSteps) return target;
      }
    } else {
      const storage = type === 'session' ? window.sessionStorage : window.localStorage;
      const raw = storage.getItem(key);
      if (raw !== null) {
        const parsed = parseInt(raw, 10);
        if (parsed >= 0 && parsed < totalSteps) return parsed;
      }
    }
  } catch {
    // Storage access restricted or invalid
  }

  return fallback;
}

function writePersistedStep(
  config: VKMultiStepPersistenceConfig | undefined,
  stepIndex: number,
): void {
  if (!config || config.type === 'memory' || typeof window === 'undefined') {
    return;
  }

  const { type = 'memory', key, urlParamName = 'step' } = config;

  try {
    if (type === 'url') {
      const url = new URL(window.location.href);
      // Write 1-indexed to URL for user-friendly query string
      url.searchParams.set(urlParamName, String(stepIndex + 1));
      window.history.replaceState(window.history.state, '', url.toString());
    } else {
      const storage = type === 'session' ? window.sessionStorage : window.localStorage;
      storage.setItem(key, String(stepIndex));
    }
  } catch {
    // Storage quota or restriction
  }
}

/**
 * Universal state machine Hook for coordinating multi-step wizards and multi-stage forms.
 * Features automated step persistence (URL / LocalStorage / SessionStorage) and dynamic skipping.
 */
export function useMultiStepForm<TStep>({
  steps,
  initialStep = 0,
  onValidateStep,
  getNextStep,
  getPrevStep,
  canSkipStep,
  persistence,
}: UseMultiStepFormOptions<TStep>): UseMultiStepFormReturn<TStep> {
  // [AP.01] Boundary assertions
  vkAssert.notNull(steps, 'steps');
  vkAssert.notEmptyArray(steps, 'steps');

  const totalSteps = steps.length;

  const [currentStepIndex, setCurrentStepIndex] = useState(() => {
    const persisted = readPersistedStep(persistence, totalSteps, initialStep);
    if (persisted < 0) return 0;
    if (persisted >= totalSteps) return totalSteps - 1;
    return persisted;
  });

  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === totalSteps - 1;
  const currentStep = steps[currentStepIndex];

  // Sync active step to persistence medium
  useEffect(() => {
    writePersistedStep(persistence, currentStepIndex);
  }, [currentStepIndex, persistence]);

  const goToNext = useCallback(async (): Promise<boolean> => {
    if (currentStepIndex >= totalSteps - 1) {
      return false;
    }

    if (onValidateStep) {
      const isValid = await onValidateStep(currentStepIndex, steps[currentStepIndex]);
      if (!isValid) {
        return false;
      }
    }

    let nextTarget = getNextStep
      ? getNextStep(currentStepIndex, steps[currentStepIndex])
      : currentStepIndex + 1;

    // Check if subsequent steps should be skipped
    while (
      canSkipStep &&
      nextTarget < totalSteps - 1 &&
      canSkipStep(nextTarget, steps[nextTarget])
    ) {
      nextTarget += 1;
    }

    setCurrentStepIndex(Math.min(nextTarget, totalSteps - 1));
    return true;
  }, [canSkipStep, currentStepIndex, getNextStep, onValidateStep, steps, totalSteps]);

  const goToPrev = useCallback(() => {
    if (currentStepIndex <= 0) return;

    let prevTarget = getPrevStep
      ? getPrevStep(currentStepIndex, steps[currentStepIndex])
      : currentStepIndex - 1;

    // Check if previous step should be skipped
    while (
      canSkipStep &&
      prevTarget > 0 &&
      canSkipStep(prevTarget, steps[prevTarget])
    ) {
      prevTarget -= 1;
    }

    setCurrentStepIndex(Math.max(prevTarget, 0));
  }, [canSkipStep, currentStepIndex, getPrevStep, steps]);

  const goToStep = useCallback(
    (index: number) => {
      if (index >= 0 && index < totalSteps) {
        setCurrentStepIndex(index);
      }
    },
    [totalSteps],
  );

  const clearPersistence = useCallback(() => {
    if (!persistence || persistence.type === 'memory' || typeof window === 'undefined') {
      return;
    }
    const { type = 'memory', key, urlParamName = 'step' } = persistence;
    try {
      if (type === 'url') {
        const url = new URL(window.location.href);
        url.searchParams.delete(urlParamName);
        window.history.replaceState(window.history.state, '', url.toString());
      } else {
        const storage = type === 'session' ? window.sessionStorage : window.localStorage;
        storage.removeItem(key);
      }
    } catch {
      // Ignored
    }
  }, [persistence]);

  const reset = useCallback(() => {
    clearPersistence();
    setCurrentStepIndex(initialStep >= 0 && initialStep < totalSteps ? initialStep : 0);
  }, [clearPersistence, initialStep, totalSteps]);

  return {
    currentStepIndex,
    currentStep,
    totalSteps,
    isFirstStep,
    isLastStep,
    goToNext,
    goToPrev,
    goToStep,
    reset,
    clearPersistence,
  };
}
