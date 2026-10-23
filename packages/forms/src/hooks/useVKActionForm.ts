// [BASE-01] [CS.01] [CS.03] [AP.01] React 19 Server Actions & Progressive Web Forms Hook
import React, { createContext, useContext, useState, useTransition, useCallback } from 'react';
import type { UseFormReturn, FieldValues } from 'react-hook-form';
import { vkAssert, type VKResult } from '@vk-blocks/core';
import {
  mapVKResultErrorsToFormErrors,
  mapVKProblemDetailsToFormErrors,
  type VKProblemDetailsPayload,
} from '../vk-form-mapper.js';

export type VKServerAction<TResult = unknown> = (
  prevState: TResult | null,
  formData: FormData,
) => Promise<TResult> | TResult;

export interface UseVKActionFormOptions<
  TValues extends FieldValues = FieldValues,
  TResult = unknown,
> {
  /**
   * The React Hook Form instance to synchronize with.
   */
  readonly form: UseFormReturn<TValues>;

  /**
   * The Server Action or async mutation receiving (prevState, formData).
   */
  readonly action: VKServerAction<TResult>;

  /**
   * Initial state before any submission.
   */
  readonly initialState?: TResult | null;

  /**
   * Callback invoked upon successful action completion.
   */
  readonly onSuccess?: (result: TResult) => void | Promise<void>;

  /**
   * Callback invoked if the action throws an error or returns a failed VKResult.
   */
  readonly onError?: (error: unknown) => void | Promise<void>;

  /**
   * Whether to clear or reset the form values when action finishes successfully.
   * @default false
   */
  readonly resetOnSuccess?: boolean;

  /**
   * Whether to automatically map VKResult or ProblemDetails errors to form field errors.
   * @default true
   */
  readonly autoMapErrors?: boolean;

  /**
   * Whether to perform client-side validation (`form.trigger()`) before dispatching the action.
   * @default true
   */
  readonly clientValidate?: boolean;
}

export interface UseVKActionFormReturn<
  TValues extends FieldValues = FieldValues,
  TResult = unknown,
> {
  /**
   * The current state returned by the Server Action.
   */
  readonly state: TResult | null;

  /**
   * Action dispatcher suitable for binding directly to `<form action={...}>`.
   */
  readonly formAction: (formData: FormData | React.FormEvent<HTMLFormElement>) => void;

  /**
   * Whether the Server Action is currently executing.
   */
  readonly isPending: boolean;

  /**
   * Reset action state to initial state.
   */
  readonly resetActionState: () => void;

  /**
   * Programmatic dispatch converting current form values to FormData.
   */
  readonly submitAction: () => Promise<void>;
}

export interface VKActionFormContextValue {
  readonly isPending: boolean;
  readonly state: unknown;
}

export const VKActionFormContext = createContext<VKActionFormContextValue>({
  isPending: false,
  state: null,
});

export function useVKActionFormContext(): VKActionFormContextValue {
  return useContext(VKActionFormContext);
}

/**
 * Serializes standard form values to standard Web FormData for Server Action consumption.
 */
export function valuesToFormData(values: Record<string, unknown>): FormData {
  const formData = new FormData();
  for (const [key, val] of Object.entries(values)) {
    if (val === undefined || val === null) {
      continue;
    }
    if (typeof File !== 'undefined' && val instanceof File) {
      formData.append(key, val);
    } else if (typeof FileList !== 'undefined' && val instanceof FileList) {
      for (let i = 0; i < val.length; i++) {
        const file = val.item(i);
        if (file) formData.append(key, file);
      }
    } else if (Array.isArray(val)) {
      for (const item of val) {
        if (typeof item === 'object' && item !== null) {
          formData.append(key, JSON.stringify(item));
        } else {
          formData.append(key, String(item));
        }
      }
    } else if (typeof val === 'object') {
      formData.append(key, JSON.stringify(val));
    } else {
      formData.append(key, String(val));
    }
  }
  return formData;
}

/**
 * `useVKActionForm` — React 19 Server Actions & Progressive Enhancement Form Bridge.
 * Binds native Server Actions (useActionState semantics) with React Hook Form validation,
 * automatic VKResult/RFC 7807 error reversal, and real-time transition pending status.
 */
export function useVKActionForm<
  TValues extends FieldValues = FieldValues,
  TResult = unknown,
>({
  form,
  action,
  initialState = null,
  onSuccess,
  onError,
  resetOnSuccess = false,
  autoMapErrors = true,
  clientValidate = true,
}: UseVKActionFormOptions<TValues, TResult>): UseVKActionFormReturn<TValues, TResult> {
  // [AP.01] Boundary assertions
  vkAssert.notNull(form, 'form');
  vkAssert.notNull(action, 'action');

  const [state, setState] = useState<TResult | null>(initialState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTransitionPending, startTransition] = useTransition();

  const handleActionResult = useCallback(
    async (result: TResult) => {
      let isFailure = false;

      if (autoMapErrors && result && typeof result === 'object') {
        const maybeResult = result as unknown as { isSuccess?: boolean; errors?: readonly unknown[] };
        if (maybeResult.isSuccess === false || (Array.isArray(maybeResult.errors) && maybeResult.errors.length > 0)) {
          isFailure = true;
          mapVKResultErrorsToFormErrors(result as unknown as VKResult<unknown>, form);
        } else {
          const maybeProblem = result as unknown as VKProblemDetailsPayload;
          if (maybeProblem.status && maybeProblem.status >= 400 && maybeProblem.errors) {
            isFailure = true;
            mapVKProblemDetailsToFormErrors(maybeProblem, form);
          }
        }
      }

      if (isFailure) {
        await onError?.(result);
      } else {
        if (resetOnSuccess) {
          form.reset();
        }
        await onSuccess?.(result);
      }
    },
    [autoMapErrors, form, resetOnSuccess, onSuccess, onError],
  );

  const executeAction = useCallback(
    async (formData: FormData) => {
      if (clientValidate) {
        const isValid = await form.trigger();
        if (!isValid) {
          return;
        }
      }

      try {
        setIsSubmitting(true);
        const nextState = await action(state, formData);
        startTransition(() => {
          setState(nextState);
        });
        await handleActionResult(nextState);
      } catch (err: unknown) {
        await onError?.(err);
      } finally {
        setIsSubmitting(false);
      }
    },
    [clientValidate, form, action, state, handleActionResult, onError],
  );

  const formAction = useCallback(
    (payload: FormData | React.FormEvent<HTMLFormElement>) => {
      if (typeof FormData !== 'undefined' && payload instanceof FormData) {
        void executeAction(payload);
      } else if (payload && 'currentTarget' in payload) {
        payload.preventDefault();
        const formData = new FormData(payload.currentTarget as HTMLFormElement);
        void executeAction(formData);
      } else {
        const formData = valuesToFormData(form.getValues() as Record<string, unknown>);
        void executeAction(formData);
      }
    },
    [executeAction, form],
  );

  const submitAction = useCallback(async () => {
    const formData = valuesToFormData(form.getValues() as Record<string, unknown>);
    await executeAction(formData);
  }, [form, executeAction]);

  const resetActionState = useCallback(() => {
    setState(initialState);
  }, [initialState]);

  const isPending = isSubmitting || isTransitionPending;

  return {
    state,
    formAction,
    isPending,
    resetActionState,
    submitAction,
  };
}
