import { cva, type VariantProps } from 'class-variance-authority';
import type { VKButtonMaterial } from './VKButton.types';

/**
 * CVA variant definition — Orthogonal Matrix (Emphasis × Intent)
 * Decouples styling states from component rendering logic.
 * // [AP.03] Public style recipe with vk prefix
 */
export const vkButtonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap font-sans font-medium cursor-pointer transition-all duration-200 ease-out outline-none select-none relative focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-vk-background active:scale-[0.98]',
  {
    variants: {
      emphasis: {
        primary:
          'border border-transparent text-vk-text-inverse shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0',
        secondary:
          'border shadow-sm hover:-translate-y-0.5 active:translate-y-0',
        tertiary:
          'bg-transparent border hover:-translate-y-0.5 active:translate-y-0',
        ghost:
          'bg-transparent border border-transparent active:scale-[0.98]',
      },
      intent: {
        brand: 'focus-visible:ring-vk-brand-solid',
        neutral: 'focus-visible:ring-vk-neutral-solid',
        danger: 'focus-visible:ring-vk-danger-solid',
        warning: 'focus-visible:ring-vk-warningIntent-solid',
      },
      size: {
        sm: 'px-vk-3 h-8 text-vk-xs rounded-vk-md gap-1.5',
        md: 'px-vk-4 h-10 text-vk-sm rounded-vk-md gap-2',
        lg: 'px-vk-6 h-12 text-vk-lg rounded-vk-lg gap-2.5',
      },
      fullWidth: {
        true: 'w-full',
      },
    },
    compoundVariants: [
      // --- Primary + Intents ---
      {
        emphasis: 'primary',
        intent: 'brand',
        class:
          'bg-vk-primary hover:bg-vk-primary-hover active:bg-vk-primary-active text-white shadow-purple-500/20 hover:shadow-purple-500/30 ring-1 ring-inset ring-white/15',
      },
      {
        emphasis: 'primary',
        intent: 'neutral',
        class:
          'bg-vk-neutral-solid hover:bg-vk-neutral-solid-hover active:bg-vk-neutral-solid-active text-vk-text-inverse shadow-slate-900/20 hover:shadow-slate-900/30 ring-1 ring-inset ring-white/15',
      },
      {
        emphasis: 'primary',
        intent: 'danger',
        class:
          'bg-vk-danger-solid hover:bg-vk-danger-solid-hover active:bg-vk-danger-solid-active text-white shadow-red-500/20 hover:shadow-red-500/30 ring-1 ring-inset ring-white/15',
      },
      {
        emphasis: 'primary',
        intent: 'warning',
        class:
          'bg-vk-warningIntent-solid hover:bg-vk-warningIntent-solid-hover active:bg-vk-warningIntent-solid-active text-white shadow-amber-500/20 hover:shadow-amber-500/30 ring-1 ring-inset ring-white/15',
      },

      // --- Secondary + Intents ---
      {
        emphasis: 'secondary',
        intent: 'brand',
        class:
          'bg-vk-brand-subtle text-vk-brand-text border-vk-brand-border/20 hover:bg-vk-brand-subtle-hover',
      },
      {
        emphasis: 'secondary',
        intent: 'neutral',
        class:
          'bg-vk-neutral-subtle text-vk-neutral-text border-vk-neutral-border hover:bg-vk-neutral-subtle-hover hover:border-vk-neutral-border-hover active:bg-vk-neutral-subtle-active',
      },
      {
        emphasis: 'secondary',
        intent: 'danger',
        class:
          'bg-vk-danger-subtle text-vk-danger-text border-vk-danger-border/20 hover:bg-vk-danger-subtle-hover',
      },
      {
        emphasis: 'secondary',
        intent: 'warning',
        class:
          'bg-vk-warningIntent-subtle text-vk-warningIntent-text border-vk-warningIntent-border/20 hover:bg-vk-warningIntent-subtle-hover',
      },

      // --- Tertiary (Outline) + Intents ---
      {
        emphasis: 'tertiary',
        intent: 'brand',
        class:
          'text-vk-primary border-vk-primary hover:bg-vk-brand-subtle',
      },
      {
        emphasis: 'tertiary',
        intent: 'neutral',
        class:
          'text-vk-neutral-text border-vk-neutral-border-strong hover:bg-vk-neutral-subtle-hover hover:border-vk-neutral-solid hover:text-vk-neutral-solid',
      },
      {
        emphasis: 'tertiary',
        intent: 'danger',
        class:
          'text-vk-danger-text border-vk-danger-border hover:bg-vk-danger-subtle',
      },
      {
        emphasis: 'tertiary',
        intent: 'warning',
        class:
          'text-vk-warningIntent-text border-vk-warningIntent-border hover:bg-vk-warningIntent-subtle',
      },

      // --- Ghost + Intents ---
      {
        emphasis: 'ghost',
        intent: 'brand',
        class:
          'text-vk-brand-text hover:bg-vk-brand-subtle hover:text-vk-brand-solid',
      },
      {
        emphasis: 'ghost',
        intent: 'neutral',
        class:
          'text-vk-neutral-text hover:bg-vk-neutral-subtle-hover hover:text-vk-neutral-solid',
      },
      {
        emphasis: 'ghost',
        intent: 'danger',
        class:
          'text-vk-danger-text hover:bg-vk-danger-subtle',
      },
      {
        emphasis: 'ghost',
        intent: 'warning',
        class:
          'text-vk-warningIntent-text hover:bg-vk-warningIntent-subtle',
      },
    ],
    defaultVariants: {
      intent: 'brand',
      size: 'md',
      fullWidth: false,
    },
  }
);

/**
 * Expressive surface material modifiers (Visual Modifiers layer).
 * Decoupled from the 4-level emphasis hierarchy (primary/secondary/tertiary/ghost).
 */
export const materialVariants: Record<VKButtonMaterial, string> = {
  gradient:
    'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white border border-transparent shadow-md hover:shadow-lg hover:shadow-purple-500/25 hover:-translate-y-0.5 hover:brightness-105 active:translate-y-0',
  glass:
    'backdrop-blur-md bg-white/75 dark:bg-slate-900/60 text-vk-text-primary border border-slate-200/60 dark:border-slate-700/60 shadow-sm hover:bg-white/90 dark:hover:bg-slate-900/80 hover:shadow hover:-translate-y-0.5 active:translate-y-0',
};

/**
 * Variant props type derived from vkButtonVariants.
 */
export type VKButtonVariantsProps = VariantProps<typeof vkButtonVariants>;

