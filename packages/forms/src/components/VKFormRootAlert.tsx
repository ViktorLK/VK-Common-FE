// [AP.01] [AP.02] [MB.06] VKFormRootAlert Component
import React, { forwardRef } from 'react';
import { useFormContext, type UseFormReturn, type FieldValues } from 'react-hook-form';
import { VKAlert, type VKAlertIntent, type VKAlertProps } from '@vk-blocks/ui';

export interface VKFormRootAlertProps extends Omit<VKAlertProps, 'title' | 'description'> {
  /**
   * Optional explicit form instance. If omitted, consumes form from useFormContext.
   */
  readonly form?: UseFormReturn<FieldValues>;

  /**
   * Specific root error subkey or path. Defaults to checking both 'root.server' and 'root'.
   * @default 'root.server'
   */
  readonly errorKey?: 'root' | 'root.server' | string;

  /**
   * Visual intent variant for the alert box.
   * @default 'error'
   */
  readonly intent?: VKAlertIntent;

  /**
   * Optional custom title for the alert. If provided, rendered as heading above the message.
   */
  readonly title?: React.ReactNode;

  /**
   * Custom description or error renderer. If omitted, uses the error message directly.
   */
  readonly description?: React.ReactNode;

  /**
   * Whether the alert should be dismissible by the user.
   * If true, clicking close invokes clearErrors on the targeted root error.
   * @default false
   */
  readonly closable?: boolean;

  /**
   * Optional callback invoked when the alert is dismissed.
   */
  readonly onClose?: () => void;
}

/**
 * `VKFormRootAlert` automatically extracts and displays form-level root errors (e.g. `root.server` or `root`)
 * dispatched by `mapVKResultErrorsToFormErrors` or `mapVKProblemDetailsToFormErrors`.
 * If no root error exists, returns null without taking up layout space.
 */
export const VKFormRootAlert = forwardRef<HTMLDivElement, VKFormRootAlertProps>(
  function VKFormRootAlert(
    {
      form,
      errorKey = 'root.server',
      intent = 'error',
      title,
      description: customDescription,
      closable = false,
      onClose,
      className,
      ...props
    },
    ref,
  ) {
    const formContext = useFormContext();
    const activeForm = form ?? formContext;

    if (!activeForm) {
      return null;
    }

    const errors = activeForm.formState.errors as Record<string, unknown>;
    const rootRecord = errors['root'] as Record<string, unknown> | undefined;

    // Resolve target message from root.server, root, or specific errorKey
    let message: string | undefined;

    if (errorKey === 'root.server') {
      const serverErr = rootRecord?.['server'] as { message?: string } | undefined;
      message = serverErr?.message ?? (rootRecord as { message?: string } | undefined)?.message;
    } else if (errorKey === 'root') {
      message = (rootRecord as { message?: string } | undefined)?.message;
    } else {
      const targetErr = errors[errorKey] as { message?: string } | undefined;
      message = targetErr?.message;
    }

    if (!message && !customDescription) {
      return null;
    }

    const handleDismiss = () => {
      activeForm.clearErrors(errorKey as any);
      if (errorKey === 'root.server') {
        activeForm.clearErrors('root' as any);
      }
      onClose?.();
    };

    return (
      <VKAlert
        ref={ref}
        intent={intent}
        title={title}
        description={customDescription ?? message}
        closable={closable}
        onClose={handleDismiss}
        className={className}
        {...props}
      />
    );
  },
);

VKFormRootAlert.displayName = 'VKFormRootAlert';
