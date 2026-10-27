import { ReactNode, HTMLAttributes } from 'react';
import {
  VKButtonEmphasis,
  VKButtonIntent,
  VKButtonSize,
} from '../VKButton/VKButton.types';

/**
 * Orientation layout for the button group.
 */
export type VKButtonGroupOrientation = 'horizontal' | 'vertical';

/**
 * Props for the VKButtonGroup component.
 */
export interface VKButtonGroupProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Layout direction for grouped buttons.
   * @default 'horizontal'
   */
  readonly orientation?: VKButtonGroupOrientation;

  /**
   * Uniform button size cascaded to child buttons.
   */
  readonly size?: VKButtonSize;

  /**
   * Uniform button emphasis cascaded to child buttons.
   */
  readonly emphasis?: VKButtonEmphasis;

  /**
   * Uniform button intent cascaded to child buttons.
   */
  readonly intent?: VKButtonIntent;

  /**
   * Whether buttons should be seamlessly attached with collapsed borders and corner radius smoothing.
   * @default true
   */
  readonly attached?: boolean;

  /**
   * Whether the button group stretches to fill the container width.
   * @default false
   */
  readonly fullWidth?: boolean;

  /**
   * Whether all buttons in the group are disabled.
   * @default false
   */
  readonly disabled?: boolean;

  readonly children?: ReactNode;
}
