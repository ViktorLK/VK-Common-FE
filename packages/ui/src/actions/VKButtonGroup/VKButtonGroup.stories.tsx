import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { VKButtonGroup } from './VKButtonGroup';
import { VKButtonGroupProps } from './VKButtonGroup.types';
import { VKButton } from '../VKButton';
import { ChevronDown, AlignLeft, AlignCenter, AlignRight, Bold, Italic, Underline } from 'lucide-react';

const meta: Meta<VKButtonGroupProps> = {
  title: 'Actions/VKButtonGroup',
  component: VKButtonGroup,
  tags: ['autodocs'],
  argTypes: {
    orientation: {
      control: 'select',
      options: ['horizontal', 'vertical'],
      description: 'Layout direction of buttons in group.',
    },
    attached: {
      control: 'boolean',
      description: 'Whether borders and corner radii are collapsed and merged.',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Cascaded button size scale.',
    },
    emphasis: {
      control: 'select',
      options: ['primary', 'secondary', 'tertiary', 'ghost'],
      description: 'Cascaded button visual emphasis.',
    },
    intent: {
      control: 'select',
      options: ['brand', 'neutral', 'danger', 'warning'],
      description: 'Cascaded button intent tone.',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether all buttons in the group are disabled.',
    },
  },
};

export default meta;
type Story = StoryObj<VKButtonGroupProps>;

export const Playground: Story = {
  args: {
    orientation: 'horizontal',
    attached: true,
    size: 'md',
    emphasis: 'secondary',
    intent: 'neutral',
    disabled: false,
  },
  render: (args) => (
    <div className="p-8 max-w-xl mx-auto flex justify-center">
      <VKButtonGroup {...args}>
        <VKButton>Years</VKButton>
        <VKButton>Months</VKButton>
        <VKButton>Days</VKButton>
      </VKButtonGroup>
    </div>
  ),
};

export const RichTextEditorToolbar: Story = {
  parameters: {
    controls: { disable: true },
  },
  render: () => (
    <div className="p-8 max-w-2xl mx-auto flex items-center gap-4 flex-wrap bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
      {/* Formatting Group */}
      <VKButtonGroup size="sm" emphasis="secondary">
        <VKButton icon={<Bold className="w-3.5 h-3.5" />} aria-label="Bold" />
        <VKButton icon={<Italic className="w-3.5 h-3.5" />} aria-label="Italic" />
        <VKButton icon={<Underline className="w-3.5 h-3.5" />} aria-label="Underline" />
      </VKButtonGroup>

      {/* Alignment Group */}
      <VKButtonGroup size="sm" emphasis="secondary">
        <VKButton icon={<AlignLeft className="w-3.5 h-3.5" />} aria-label="Align Left" />
        <VKButton icon={<AlignCenter className="w-3.5 h-3.5" />} aria-label="Align Center" />
        <VKButton icon={<AlignRight className="w-3.5 h-3.5" />} aria-label="Align Right" />
      </VKButtonGroup>

      {/* Split Action Button */}
      <VKButtonGroup size="sm" emphasis="primary" intent="brand">
        <VKButton>Publish Changes</VKButton>
        <VKButton icon={<ChevronDown className="w-3.5 h-3.5" />} aria-label="More publishing options" />
      </VKButtonGroup>
    </div>
  ),
};

export const VerticalStack: Story = {
  parameters: {
    controls: { disable: true },
  },
  render: () => (
    <div className="p-8 max-w-xs mx-auto">
      <VKButtonGroup orientation="vertical" size="md" emphasis="secondary" fullWidth>
        <VKButton>Account Settings</VKButton>
        <VKButton>Billing & Invoices</VKButton>
        <VKButton>API Keys</VKButton>
        <VKButton intent="danger">Delete Team</VKButton>
      </VKButtonGroup>
    </div>
  ),
};
