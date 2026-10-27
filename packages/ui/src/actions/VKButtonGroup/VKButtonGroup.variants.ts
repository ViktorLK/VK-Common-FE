import { cva } from 'class-variance-authority';

/**
 * CVA variants for the VKButtonGroup container.
 */
export const buttonGroupVariants = cva('inline-flex relative select-none', {
  variants: {
    orientation: {
      horizontal: 'flex-row items-center',
      vertical: 'flex-col items-stretch',
    },
    attached: {
      true: '',
      false: '',
    },
    fullWidth: {
      true: 'w-full [&>button]:grow',
      false: '',
    },
  },
  compoundVariants: [
    // --- Attached Horizontal ---
    {
      orientation: 'horizontal',
      attached: true,
      class:
        '[&>button]:rounded-none [&>button:first-child]:rounded-l-md [&>button:last-child]:rounded-r-md [&>button:not(:first-child)]:-ml-px [&>button]:relative [&>button:hover]:z-10 [&>button:focus-visible]:z-20',
    },
    // --- Attached Vertical ---
    {
      orientation: 'vertical',
      attached: true,
      class:
        '[&>button]:rounded-none [&>button:first-child]:rounded-t-md [&>button:last-child]:rounded-b-md [&>button:not(:first-child)]:-mt-px [&>button]:relative [&>button:hover]:z-10 [&>button:focus-visible]:z-20',
    },
    // --- Detached Horizontal ---
    {
      orientation: 'horizontal',
      attached: false,
      class: 'gap-2',
    },
    // --- Detached Vertical ---
    {
      orientation: 'vertical',
      attached: false,
      class: 'gap-2',
    },
  ],
  defaultVariants: {
    orientation: 'horizontal',
    attached: true,
    fullWidth: false,
  },
});
