import React, { forwardRef, Children, isValidElement, cloneElement } from 'react';
import { cn } from '../../utils';
import { VKButtonGroupProps } from './VKButtonGroup.types';
import { buttonGroupVariants } from './VKButtonGroup.variants';
import { VKButtonProps } from '../VKButton/VKButton.types';

/**
 * VKButtonGroup groups multiple buttons together, standardizing button sizes and variants
 * while collapsing adjacent borders and smoothing intermediate corner radii.
 */
export const VKButtonGroup = forwardRef<HTMLDivElement, VKButtonGroupProps>(
  (
    {
      className,
      orientation = 'horizontal',
      size,
      emphasis,
      intent,
      attached = true,
      fullWidth = false,
      disabled = false,
      children,
      ...props
    },
    ref
  ) => {
    // Clone children to non-intrusively cascade group props without coupling VKButton to group context
    const clonedChildren = Children.map(children, (child) => {
      if (!isValidElement<VKButtonProps>(child)) {
        return child;
      }

      return cloneElement(child, {
        size: child.props.size ?? size,
        emphasis: child.props.emphasis ?? emphasis,
        intent: child.props.intent ?? intent,
        disabled: child.props.disabled ?? disabled,
      });
    });

    return (
      <div
        ref={ref}
        role="group"
        aria-orientation={orientation}
        className={cn(
          buttonGroupVariants({
            orientation,
            attached,
            fullWidth,
          }),
          className
        )}
        {...props}
      >
        {clonedChildren}
      </div>
    );
  }
);
VKButtonGroup.displayName = 'VKButtonGroup';
