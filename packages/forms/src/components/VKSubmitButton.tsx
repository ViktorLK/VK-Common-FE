// [AP.02] [MB.06] VKSubmitButton Component
import React, { forwardRef } from 'react';
import { useFormContext } from 'react-hook-form';
import { VKButton, type VKButtonProps } from '@vk-blocks/ui';
import { useVKActionFormContext } from '../hooks/useVKActionForm.js';

export interface VKSubmitButtonProps extends Omit<VKButtonProps, 'type'> {
  /**
   * Custom pending text displayed while the Server Action or form submit is executing.
   * If omitted, retains original children or displays loading spinner.
   */
  readonly pendingText?: React.ReactNode;

  /**
   * Explicit override for pending state. If omitted, automatically resolves
   * from useVKActionFormContext() and React Hook Form's formState.isSubmitting.
   */
  readonly isPending?: boolean;
}

/**
 * `VKSubmitButton` — Action-aware Accessible Form Submission Control.
 * Automatically synchronizes with Server Action `isPending` transitions and React Hook Form
 * submission states to toggle busy state, disable double clicks, and render loading indicators.
 */
export const VKSubmitButton = forwardRef<HTMLButtonElement, VKSubmitButtonProps>(
  function VKSubmitButton(
    {
      children,
      pendingText,
      isPending: explicitPending,
      disabled,
      isLoading: explicitLoading,
      variant = 'primary',
      ...props
    },
    ref,
  ) {
    const actionContext = useVKActionFormContext();
    const formContext = useFormContext();

    const isSubmitting = formContext?.formState?.isSubmitting ?? false;
    const isActionPending = actionContext.isPending;

    const resolvedPending =
      explicitPending ??
      explicitLoading ??
      isActionPending ??
      isSubmitting;

    return (
      <VKButton
        ref={ref}
        type="submit"
        variant={variant}
        isLoading={resolvedPending}
        disabled={disabled || resolvedPending}
        aria-busy={resolvedPending ? 'true' : 'false'}
        {...props}
      >
        {resolvedPending && pendingText ? pendingText : children}
      </VKButton>
    );
  },
);

VKSubmitButton.displayName = 'VKSubmitButton';
