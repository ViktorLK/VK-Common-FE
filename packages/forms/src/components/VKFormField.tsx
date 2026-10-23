// [AP.01] [MB.06] VKFormField Modern Deconstructed Binding Component
import React, { ReactElement, ReactNode, CSSProperties } from 'react';
import {
  useController,
  useFormContext,
  ControllerRenderProps,
  ControllerFieldState,
} from 'react-hook-form';
import { VKField, VKFieldSize, VKFieldOrientation } from '@vk-blocks/ui';
import { vkAssert } from '@vk-blocks/core';

export interface VKFormFieldRenderProps {
  readonly field: ControllerRenderProps;
  readonly fieldState: ControllerFieldState;
  readonly error?: string;
  readonly required?: boolean;
  readonly disabled?: boolean;
}

export interface VKFormFieldProps {
  /**
   * Field path name bound to React Hook Form schema.
   */
  readonly name: string;

  /**
   * Accessible field label.
   */
  readonly label?: ReactNode;

  /**
   * Secondary label adornment or action (e.g. "(Optional)", tooltip link).
   */
  readonly labelExtra?: ReactNode;

  /**
   * Supporting contextual help / description text.
   */
  readonly description?: ReactNode;

  /**
   * Displays a visual asterisk indicator (*) on the label.
   * @default false
   */
  readonly required?: boolean;

  /**
   * Mutes interaction and cascades disabled state to label and input control.
   * @default false
   */
  readonly disabled?: boolean;

  /**
   * Standardized dimension scale step.
   * @default 'md'
   */
  readonly size?: VKFieldSize;

  /**
   * Layout orientation ('vertical' | 'horizontal').
   * @default 'vertical'
   */
  readonly orientation?: VKFieldOrientation;

  /**
   * Optional custom CSS class name for the field root.
   */
  readonly className?: string;

  /**
   * Optional inline styles for the field root.
   */
  readonly style?: CSSProperties;

  /**
   * Optional custom CSS class name for the label container.
   */
  readonly labelClassName?: string;

  /**
   * Optional custom CSS class name for the description text.
   */
  readonly descriptionClassName?: string;

  /**
   * Optional custom CSS class name for the error text.
   */
  readonly errorClassName?: string;

  /**
   * Optional custom CSS class name for the control slot container.
   */
  readonly controlClassName?: string;

  /**
   * Child form control element or render function for deconstructed binding.
   */
  readonly children:
    | ReactElement
    | ((props: VKFormFieldRenderProps) => ReactElement);
}

/**
 * Connects a form control to the parent `VKForm` React Hook Form context.
 * Supports seamless deconstructive render-props or automated cloneElement prop injection.
 */
export const VKFormField: React.FC<VKFormFieldProps> = ({
  name,
  label,
  labelExtra,
  description,
  required = false,
  disabled = false,
  size = 'md',
  orientation = 'vertical',
  className,
  style,
  labelClassName,
  descriptionClassName,
  errorClassName,
  controlClassName,
  children,
}) => {
  // [AP.01] Boundary checks
  vkAssert.notEmpty(name, 'name');

  const formContext = useFormContext();
  if (!formContext || !formContext.control) {
    throw new Error('VKFormField must be used within a VKForm component');
  }

  const { control } = formContext;
  const {
    field,
    fieldState,
  } = useController({ name, control });

  const errorMessage = fieldState.error?.message;

  let renderedControl: ReactNode = null;

  if (typeof children === 'function') {
    // Modern deconstructed injection pattern
    renderedControl = children({
      field,
      fieldState,
      error: errorMessage,
      required,
      disabled,
    });
  } else if (React.isValidElement(children)) {
    // Automatic prop injection via cloneElement
    const childProps = children.props as Record<string, unknown>;

    renderedControl = React.cloneElement(
      children as ReactElement<Record<string, unknown>>,
      {
        ...field,
        disabled: disabled || Boolean(childProps.disabled),
        onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | unknown) => {
          field.onChange(e);
          if (typeof childProps.onChange === 'function') {
            (childProps.onChange as (val: unknown) => void)(e);
          }
        },
        onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement> | unknown) => {
          field.onBlur();
          if (typeof childProps.onBlur === 'function') {
            (childProps.onBlur as (val: unknown) => void)(e);
          }
        },
      }
    );
  }

  return (
    <VKField
      fieldId={name}
      label={label}
      labelExtra={labelExtra}
      description={description}
      error={errorMessage}
      required={required}
      disabled={disabled}
      size={size}
      orientation={orientation}
      className={className}
      style={style}
      labelClassName={labelClassName}
      descriptionClassName={descriptionClassName}
      errorClassName={errorClassName}
      controlClassName={controlClassName}
    >
      {renderedControl}
    </VKField>
  );
};

VKFormField.displayName = 'VKFormField';
