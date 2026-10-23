// [AP.01] [MB.06] VKForm Component with Server Actions & Progressive Enhancement
import React, { forwardRef } from 'react';
import { FormProvider, type UseFormReturn, type FieldValues, type SubmitHandler } from 'react-hook-form';
import { vkAssert } from '@vk-blocks/core';
import { VKActionFormContext, useVKActionFormContext } from '../hooks/useVKActionForm.js';

export interface VKFormProps<T extends FieldValues = FieldValues>
  extends Omit<React.FormHTMLAttributes<HTMLFormElement>, 'onSubmit' | 'action'> {
  /**
   * The React Hook Form instance returned by `useForm` or `useVKForm`.
   */
  readonly form: UseFormReturn<T>;

  /**
   * Type-safe client form submission handler invoked after successful validation.
   */
  readonly onSubmit?: SubmitHandler<T>;

  /**
   * Native form action URL string (for No-JS progressive enhancement fallback)
   * or Server Action dispatcher function (from useVKActionForm or React 19).
   */
  readonly action?:
    | string
    | ((formData: FormData) => void | Promise<void>)
    | ((payload: FormData | React.FormEvent<HTMLFormElement>) => void);

  /**
   * Explicit pending status override. If omitted, consumes from useVKActionFormContext.
   */
  readonly isPending?: boolean;

  /**
   * Optional form elements and form fields.
   */
  readonly children?: React.ReactNode;

  /**
   * Optional CSS class name.
   */
  readonly className?: string;
}

/**
 * `VKForm` wraps the HTML `<form>` element with React Hook Form's `FormProvider` and
 * an isomorphic Action/Pending context provider.
 * Supports progressive enhancement (No-JS action URL POST fallback) alongside React 19 Server Actions.
 */
export const VKForm = forwardRef(function VKForm<T extends FieldValues>(
  {
    form,
    onSubmit,
    action,
    isPending: explicitPending,
    method = 'POST',
    children,
    className,
    ...props
  }: VKFormProps<T>,
  ref: React.ForwardedRef<HTMLFormElement>,
) {
  // [AP.01] Boundary assertions
  vkAssert.notNull(form, 'form');
  vkAssert(
    Boolean(onSubmit || action),
    'VKForm requires either an onSubmit handler or an action prop',
  );

  const parentActionContext = useVKActionFormContext();
  const isPending = explicitPending ?? parentActionContext.isPending;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    if (onSubmit) {
      // Invoke React Hook Form client submission
      await form.handleSubmit(onSubmit)(e);
    } else if (typeof action === 'function') {
      // Client-side progressive enhancement for Server Actions
      e.preventDefault();
      const isValid = await form.trigger();
      if (isValid) {
        const formData = new FormData(e.currentTarget);
        await action(formData);
      }
    }
    // If action is a string without onSubmit, standard native form POST occurs
  };

  const actionUrl = typeof action === 'string' ? action : undefined;

  return (
    <FormProvider {...form}>
      <VKActionFormContext.Provider value={{ isPending, state: parentActionContext.state }}>
        <form
          ref={ref}
          action={actionUrl}
          method={method}
          onSubmit={handleSubmit}
          className={className}
          {...props}
        >
          {children}
        </form>
      </VKActionFormContext.Provider>
    </FormProvider>
  );
}) as <T extends FieldValues = FieldValues>(
  props: VKFormProps<T> & { ref?: React.ForwardedRef<HTMLFormElement> }
) => React.ReactElement;
