import React, { forwardRef } from 'react';
import { cn, ariaAttr } from '../../utils';
import { VKSpinner } from '../../feedback/VKSpinner';
import type { VKButtonProps } from './VKButton.types';
import { vkButtonVariants, materialVariants } from './VKButton.variants';
import { resolveButtonConfig, resolveGlowClass } from './VKButton.utils';

// [AP.03] Public style recipe with vk prefix
export { vkButtonVariants, materialVariants } from './VKButton.variants';
export { resolveGlowClass } from './VKButton.utils';

/**
 * VKButton — VK Design System foundational button component.
 *
 * Implements the 10-dimensional architectural blueprint:
 * 1. Native Button Semantics : Retains full HTML button capabilities and attributes.
 * 2. Accessibility          : Full WCAG 2.1 AA compliance (focus-visible rings, aria-busy).
 * 3. Interaction States     : Default, hover elevation lift, active haptic scale press.
 * 4. Design Tokens          : Binds to 3-tier Design Tokens (primitives -> semantics -> component).
 * 5. Visual Hierarchy       : Decoupled `emphasis` (primary, secondary, tertiary, ghost).
 * 6. Intent                 : Decoupled `intent` (brand, neutral, danger, warning).
 * 7. Expressive Materials   : Decoupled `material` (gradient, glass).
 * 8. Size                   : Standardized scale (sm, md, lg).
 * 9. Icon Layout            : Flex-aligned with smart order and anti-shrink protection.
 * 10. Loading State         : Auto-disabled, spinner replacement, and double-submit blocking.
 * 11. Consistent Public API : Strict TypeScript, readonly props, and React.forwardRef.
 */
// [MB.06] Shared Component Blueprint - ForwardRef & Semantics
export const VKButton = forwardRef<HTMLButtonElement, VKButtonProps>(
  (
    {
      className,
      emphasis,
      intent,
      material,
      variant,
      size,
      fullWidth,
      isLoading,
      glow,
      shimmer,
      animatedBorder,
      icon,
      iconPosition = 'left',
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading;
    const { resolvedEmphasis, resolvedIntent, resolvedMaterial } =
      resolveButtonConfig(emphasis, intent, material, variant);

    const glowClass = resolveGlowClass(glow, resolvedIntent, resolvedMaterial);

    const animatedBorderConicClass =
      resolvedIntent === 'danger'
        ? 'vk-conic-beam-danger'
        : resolvedIntent === 'warning'
        ? 'vk-conic-beam-warning'
        : resolvedIntent === 'neutral'
        ? 'vk-conic-beam-neutral'
        : 'vk-conic-beam-brand';

    const iconElement = icon ? (
      <span
        className={cn(
          'inline-flex shrink-0 relative z-10',
          iconPosition === 'right' ? 'order-last ml-vk-2' : 'mr-vk-2'
        )}
      >
        {icon}
      </span>
    ) : null;

    return (
      <button
        {...props}
        ref={ref}
        className={cn(
          vkButtonVariants({
            emphasis: resolvedMaterial ? undefined : resolvedEmphasis,
            intent: resolvedIntent,
            size,
            fullWidth,
          }),
          resolvedMaterial && materialVariants[resolvedMaterial],
          glowClass,
          (shimmer || animatedBorder) && 'overflow-hidden',
          animatedBorder && 'border-transparent',
          isDisabled && 'opacity-50 cursor-not-allowed pointer-events-none',
          className
        )}
        disabled={isDisabled}
        aria-busy={ariaAttr(isLoading)}
        aria-disabled={ariaAttr(isDisabled)}
      >
        {animatedBorder && (
          <span
            data-testid="animated-border-track"
            className="vk-animated-border-track"
            aria-hidden="true"
          >
            <span
              data-testid="animated-border-beam"
              className={cn(
                'vk-animated-border-beam',
                animatedBorderConicClass
              )}
            />
          </span>
        )}
        {shimmer && (
          <span
            className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none z-10"
            aria-hidden="true"
          />
        )}
        {isLoading ? (
          <VKSpinner size="sm" className="mr-vk-2 relative z-10" aria-hidden="true" />
        ) : (
          iconElement
        )}
        {children !== undefined && children !== null ? (
          <span className="relative z-10 inline-flex items-center gap-1.5 whitespace-nowrap">{children}</span>
        ) : null}
      </button>
    );
  }
);

VKButton.displayName = 'VKButton';
