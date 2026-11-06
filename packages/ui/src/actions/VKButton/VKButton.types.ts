import { ButtonHTMLAttributes, ReactNode } from 'react';

/**
 * Visual hierarchy / emphasis levels for `VKButton`:
 * - `primary`: High-emphasis solid fill with subtle top highlight and tactile elevation.
 * - `secondary`: Medium-emphasis subtle fill for common secondary actions.
 * - `tertiary`: Outlined border action maintaining structure without heavy weight.
 * - `ghost`: Low-emphasis flat action that reveals surface on hover (zero visual noise).
 */
export type VKButtonEmphasis = 'primary' | 'secondary' | 'tertiary' | 'ghost';

/**
 * Semantic intent for `VKButton`:
 * - `brand`: Core brand action (Electric Indigo / Luminous Blue).
 * - `neutral`: High-utility neutral action (Slate / Monochrome).
 * - `danger`: High-priority destructive action (Crimson / Red).
 * - `warning`: Cautionary action (Amber / Orange).
 */
export type VKButtonIntent = 'brand' | 'neutral' | 'danger' | 'warning';

/**
 * Standard button dimensions scale:
 * - `sm`: 32px height, compact padding, 12px font
 * - `md`: 40px height, standard padding, 14px font
 * - `lg`: 48px height, spacious padding, 16px font
 */
export type VKButtonSize = 'sm' | 'md' | 'lg';

/**
 * Expressive surface material modifiers (Visual Modifiers layer):
 * - `gradient`: Multi-hue violet-pink gradient for AI actions and high-priority Hero CTAs.
 * - `glass`: Frosted glassmorphism background with backdrop-blur for floating overlays and media toolbars.
 */
export type VKButtonMaterial = 'gradient' | 'glass';

/**
 * Backward-compatible flat variant shorthand.
 */
export type VKButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'gradient'
  | 'glass'
  | 'danger';

/**
 * Atmospheric ambient glow intensity levels:
 * - `subtle`: Minimal low-radius glow (10px–20px), ideal for compact icon buttons and quiet dark surfaces.
 * - `normal`: Standard balanced atmospheric glow elevation.
 * - `intense`: High-energy radiant glow (28px–55px+) for prominent AI CTAs and hero actions.
 */
export type VKGlowIntensity = 'subtle' | 'normal' | 'intense';

/**
 * Prop type for ambient glow elevation:
 * - `boolean`: `true` activates `normal` intensity, `false` disables glow.
 * - `'subtle' | 'normal' | 'intense'`: Explicit intensity level.
 */
export type VKButtonGlow = boolean | VKGlowIntensity;

/**
 * Position of the icon relative to button label.
 * @default 'left'
 */
export type VKButtonIconPosition = 'left' | 'right';

/**
 * Props definition for the `VKButton` component.
 *
 * Implements the 10-dimensional Design System Blueprint:
 * 1. Native Button Semantics
 * 2. Accessibility (WCAG 2.1 AA)
 * 3. Interaction States (default, hover, active, focus, disabled)
 * 4. Design Tokens (Tier 1-3)
 * 5. Visual Hierarchy (`emphasis`)
 * 6. Intent (`intent`)
 * 7. Expressive Surface Materials (`material`)
 * 8. Size (`size`)
 * 9. Icon Layout (`icon`, `iconPosition`)
 * 10. Loading (`isLoading`, Spinner, click blocking)
 * 11. Consistent API (`forwardRef`, readonly props)
 */
export interface VKButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Orthogonal visual emphasis level.
   * @default 'primary'
   */
  readonly emphasis?: VKButtonEmphasis;

  /**
   * Orthogonal semantic intent.
   * @default 'brand'
   */
  readonly intent?: VKButtonIntent;

  /**
   * Optional expressive surface material modifier (Visual Modifiers layer).
   * Decoupled from the 4-level emphasis hierarchy (primary, secondary, tertiary, ghost).
   * Overrides surface background with expressive material while preserving dimensions and accessibility.
   */
  readonly material?: VKButtonMaterial;

  /**
   * Optional backward-compatible variant shorthand.
   * Maps directly to emphasis + intent combinations or material modifiers.
   */
  readonly variant?: VKButtonVariant;

  /**
   * Button dimensions scale.
   * @default 'md'
   */
  readonly size?: VKButtonSize;

  /**
   * Whether the button expands to fill parent container width.
   * @default false
   */
  readonly fullWidth?: boolean;

  /**
   * Whether the button is in an active asynchronous loading state.
   * Automatically sets disabled, renders spinner, sets aria-busy, and blocks clicks.
   * @default false
   */
  readonly isLoading?: boolean;

  /**
   * Optional icon element (ReactNode).
   */
  readonly icon?: ReactNode;

  /**
   * Position of the icon relative to button label.
   * @default 'left'
   */
  readonly iconPosition?: VKButtonIconPosition;

  /**
   * Atmospheric ambient glow elevation.
   * - `boolean`: `true` enables standard ('normal') glow, `false` disables glow.
   * - `'subtle'`: Gentle low-radius glow, ideal for compact icon buttons and quiet dark surfaces.
   * - `'normal'`: Standard atmospheric glow elevation.
   * - `'intense'`: High-energy radiant glow for prominent AI CTAs and hero actions.
   * @default false
   */
  readonly glow?: VKButtonGlow;

  /**
   * Whether to activate a subtle animated light-sweep sheen across the button surface.
   * Highly effective for AI actions, background workers, or high-priority CTAs.
   * @default false
   */
  readonly shimmer?: boolean;

  /**
   * Whether to activate an animated rotating light beam around the button perimeter.
   * High-impact visual magnet for AI triggers, primary landing hero actions, and major conversion points.
   * @default false
   */
  readonly animatedBorder?: boolean;
}
