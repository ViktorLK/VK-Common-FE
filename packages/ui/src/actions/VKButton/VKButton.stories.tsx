import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import {
  Search,
  ArrowRight,
  Trash2,
  Sparkles,
  Zap,
  ShieldCheck,
  Bot,
  Copy,
  FolderGit2,
  Palette,
  Check,
} from 'lucide-react';
import { VKButton } from './VKButton';
import type {
  VKButtonProps,
  VKButtonEmphasis,
  VKButtonIntent,
} from './VKButton.types';

/**
 * `VKButton` is the foundational button component for the VK Design System.
 *
 * Implements the 10-dimensional architectural blueprint:
 * 1. Native Button Semantics : Retains full HTML button capabilities and attributes.
 * 2. Accessibility          : Full WCAG 2.1 AA compliance (focus-visible rings, aria-busy, aria-label).
 * 3. Interaction States     : Default, hover elevation lift, active haptic scale press.
 * 4. Design Tokens          : Binds to 3-tier Design Tokens (primitives -> semantics -> component).
 * 5. Visual Hierarchy       : Decoupled `emphasis` (primary, secondary, tertiary, ghost).
 * 6. Intent                 : Decoupled `intent` (brand, neutral, danger, warning).
 * 7. Size                   : Standardized scale (sm, md, lg).
 * 8. Icon Layout            : Flex-aligned with smart order and anti-shrink protection.
 * 9. Loading State          : Auto-disabled, spinner replacement, and double-submit blocking.
 * 10. Consistent Public API : Strict TypeScript, readonly props, and React.forwardRef.
 */
const meta = {
  title: 'Actions/VKButton',
  component: VKButton,
  tags: ['autodocs'],
  
  argTypes: {
    emphasis: {
      control: 'select',
      options: ['primary', 'secondary', 'tertiary', 'ghost'],
      description: 'Orthogonal visual hierarchy level',
    },
    intent: {
      control: 'select',
      options: ['brand', 'neutral', 'danger', 'warning'],
      description: 'Orthogonal semantic action intent',
    },
    material: {
      control: 'select',
      options: [undefined, 'gradient', 'glass'],
      description: 'Expressive surface material modifier (Visual Modifiers layer)',
    },
    variant: {
      table: {
        disable: true,
      },
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Standardized size scale step',
    },
    fullWidth: {
      control: 'boolean',
      description: 'Whether button expands to fill parent container width',
    },
    isLoading: {
      control: 'boolean',
      description: 'Active loading state with spinner and click blocking',
    },
    disabled: {
      control: 'boolean',
      description: 'Disabled state with muted styles and click blocking',
    },
    iconPosition: {
      control: 'radio',
      options: ['left', 'right'],
      description: 'Position of icon relative to button label',
    },
    glow: {
      control: 'select',
      options: [false, true, 'subtle', 'normal', 'intense'],
      description: 'Atmospheric ambient glow shadow with 3-tier intensity control',
    },
    shimmer: {
      control: 'boolean',
      description: 'Subtle animated light-sweep sheen across surface',
    },
    animatedBorder: {
      control: 'boolean',
      description: 'Rotating laser conic-gradient beam around perimeter',
    },
  },
  args: {
    children: 'Interactive Button',
    emphasis: 'primary',
    intent: 'brand',
    size: 'md',
    fullWidth: false,
    isLoading: false,
    disabled: false,
    glow: false,
    shimmer: false,
    animatedBorder: false,
  },
} satisfies Meta<typeof VKButton>;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// 1. PLAYGROUND (Interactive Sandbox)
// ============================================================================

export const Playground: Story = {
  render: (args) => <VKButton {...args} />,
  args: {
    children: 'Interactive Button',
    emphasis: 'primary',
    intent: 'brand',
    size: 'md',
    glow: false,
    shimmer: false,
    animatedBorder: false,
    isLoading: false,
    disabled: false,
  },
};

// ============================================================================
// 2. ORTHOGONAL MATRIX (4 Emphasis × 4 Intent = 16 System Combinations)
// ============================================================================

const EMPHASES: VKButtonEmphasis[] = ['primary', 'secondary', 'tertiary', 'ghost'];
const INTENTS: VKButtonIntent[] = ['brand', 'neutral', 'danger', 'warning'];

export const OrthogonalMatrix: Story = {
  parameters: {
    controls: { disable: true },
  },
  name: '01. Orthogonal Matrix (4×4)',
  render: () => (
    <div className="p-8 rounded-2xl bg-vk-surface border border-vk-border shadow-xl space-y-6 max-w-4xl">
      <div className="border-b border-vk-border pb-4">
        <h3 className="text-base font-bold text-vk-text-primary">
          Orthogonal Design Matrix (Emphasis × Intent)
        </h3>
        <p className="text-xs text-vk-text-secondary mt-1">
          4 Emphasis levels × 4 Semantic Intents = 16 clean decoupled combinations.
          Zero class collision, predictable visual weight.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="border-b border-vk-border text-xs text-vk-text-secondary uppercase">
              <th className="py-3 px-4 font-semibold">Emphasis \ Intent</th>
              {INTENTS.map((intent) => (
                <th key={intent} className="py-3 px-4 font-semibold capitalize">
                  {intent}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-vk-border">
            {EMPHASES.map((emphasis) => (
              <tr key={emphasis}>
                <td className="py-4 px-4 font-semibold capitalize text-vk-text-secondary text-xs">
                  {emphasis}
                </td>
                {INTENTS.map((intent) => (
                  <td key={`${emphasis}-${intent}`} className="py-4 px-4">
                    <VKButton emphasis={emphasis} intent={intent} size="sm" className="w-28 justify-center">
                      Action
                    </VKButton>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  ),
};

// ============================================================================
// 3. VISUAL MODIFIERS (Modern Aesthetics: Glow, Shimmer, AnimatedBorder)
// ============================================================================

export const VisualModifiers: Story = {
  parameters: {
    controls: { disable: true },
  },
  name: '02. Visual Modifiers (Aesthetics)',
  render: () => (
    <div className="p-8 rounded-2xl bg-vk-surface border border-vk-border shadow-xl space-y-8 max-w-3xl">
      <div>
        <h3 className="text-base font-bold text-vk-text-primary">
          Atmospheric & Dynamic Modifiers
        </h3>
        <p className="text-xs text-vk-text-secondary mt-1">
          Non-over-engineered visual enhancers for AI workflows, key conversion points, and premium CTAs.
        </p>
      </div>

      {/* Row 1: Modifier Types */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold text-vk-text-secondary uppercase tracking-wider">
          Effect Types (Brand Intent)
        </h4>
        <div className="flex flex-wrap items-center gap-4">
          <VKButton emphasis="primary" intent="brand">
            Standard Solid
          </VKButton>
          <VKButton emphasis="primary" intent="brand" glow icon={<Zap className="w-4 h-4" />}>
            Ambient Glow
          </VKButton>
          <VKButton emphasis="primary" intent="brand" shimmer icon={<Sparkles className="w-4 h-4" />}>
            Shimmer Sweep
          </VKButton>
          <VKButton animatedBorder intent="brand" icon={<Bot className="w-4 h-4" />}>
            Animated Border
          </VKButton>
        </div>
      </div>

      {/* Row 2: Intent-Aware Conic Beams */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold text-vk-text-secondary uppercase tracking-wider">
          Intent-Aware Animated Beams
        </h4>
        <div className="flex flex-wrap items-center gap-4">
          <VKButton animatedBorder intent="brand" icon={<Sparkles className="w-4 h-4" />}>
            Brand Laser
          </VKButton>
          <VKButton animatedBorder intent="danger" icon={<Trash2 className="w-4 h-4 text-red-500" />}>
            Danger Laser
          </VKButton>
          <VKButton animatedBorder intent="warning" icon={<ShieldCheck className="w-4 h-4 text-amber-500" />}>
            Warning Laser
          </VKButton>
          <VKButton animatedBorder intent="neutral" icon={<Search className="w-4 h-4" />}>
            Neutral Laser
          </VKButton>
        </div>
      </div>

      {/* Row 3: High-Energy AI Combo */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold text-vk-text-secondary uppercase tracking-wider">
          AI Hero Power Combo (Gradient + Glow + Shimmer)
        </h4>
        <div className="flex items-center gap-4">
          <VKButton
            variant="gradient"
            size="lg"
            glow
            shimmer
            icon={<Sparkles className="w-5 h-5" />}
          >
            Synthesize Autonomous Agent
          </VKButton>
        </div>
      </div>
    </div>
  ),
};

// ============================================================================
// 4. SPECIAL SURFACES (Gradient & Glassmorphism)
// ============================================================================

export const SpecialSurfaces: Story = {
  parameters: {
    controls: { disable: true },
  },
  name: '03. Special Surfaces (Gradient & Glass)',
  render: () => (
    <div className="p-8 rounded-2xl bg-gradient-to-br from-indigo-950 via-slate-900 to-black border border-slate-800 shadow-2xl space-y-6 max-w-xl text-white">
      <div>
        <h3 className="text-base font-bold text-white">
          Special Surface Materials
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          Designed for landing page heroes, video overlays, and floating toolbars.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-4 pt-2">
        <VKButton
          material="gradient"
          size="md"
          icon={<Sparkles className="w-4 h-4" />}
        >
          Gradient Modifier
        </VKButton>

        <VKButton
          material="glass"
          size="md"
          icon={<Bot className="w-4 h-4 text-indigo-400" />}
        >
          Frosted Glass
        </VKButton>

        <VKButton
          material="gradient"
          glow
          size="md"
          icon={<Zap className="w-4 h-4" />}
        >
          Gradient + Glow
        </VKButton>

        <VKButton
          animatedBorder
          size="md"
          icon={<Zap className="w-4 h-4 text-indigo-400" />}
        >
          Laser on Dark Card
        </VKButton>
      </div>
    </div>
  ),
};

// ============================================================================
// 5. SIZES & FULL-WIDTH
// ============================================================================

export const SizesAndFullWidth: Story = {
  parameters: {
    controls: { disable: true },
  },
  name: '04. Sizes & Layout',
  render: () => (
    <div className="p-8 rounded-2xl bg-vk-surface border border-vk-border shadow-xl space-y-6 max-w-md">
      <div>
        <h3 className="text-base font-bold text-vk-text-primary">
          Dimensions & Container Filling
        </h3>
        <p className="text-xs text-vk-text-secondary mt-1">
          Standardized 32px / 40px / 48px height steps with proportional typography and padding.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <VKButton size="sm">Small (32px)</VKButton>
        <VKButton size="md">Medium (40px)</VKButton>
        <VKButton size="lg">Large (48px)</VKButton>
      </div>

      <div className="pt-2 border-t border-vk-border space-y-2">
        <span className="text-xs font-semibold text-vk-text-secondary">Full Width (Container Responsive)</span>
        <VKButton fullWidth emphasis="primary" intent="brand">
          Complete Order (100% Width)
        </VKButton>
      </div>
    </div>
  ),
};

// ============================================================================
// 6. ICON PATTERNS (Leading, Trailing, & Icon-Only Accessible)
// ============================================================================

export const IconPatterns: Story = {
  parameters: {
    controls: { disable: true },
  },
  name: '05. Icon Patterns & Accessibility',
  render: () => (
    <div className="p-8 rounded-2xl bg-vk-surface border border-vk-border shadow-xl space-y-6 max-w-lg">
      <div>
        <h3 className="text-base font-bold text-vk-text-primary">
          Icon Positioning & Icon-Only
        </h3>
        <p className="text-xs text-vk-text-secondary mt-1">
          Smart alignment, zero icon shrinking, and accessible aria-label compliance.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <VKButton
          emphasis="primary"
          intent="brand"
          icon={<Search className="w-4 h-4" />}
          iconPosition="left"
        >
          Search Node
        </VKButton>

        <VKButton
          emphasis="secondary"
          intent="neutral"
          icon={<ArrowRight className="w-4 h-4" />}
          iconPosition="right"
        >
          Continue
        </VKButton>

        <VKButton
          emphasis="ghost"
          intent="neutral"
          icon={<Copy className="w-4 h-4" />}
          aria-label="Copy code snippet to clipboard"
        />

        <VKButton
          emphasis="ghost"
          intent="danger"
          icon={<Trash2 className="w-4 h-4" />}
          aria-label="Delete resource"
        />
      </div>
    </div>
  ),
};

// ============================================================================
// 7. FUNCTIONAL STATES (Loading, Disabled, Interaction)
// ============================================================================

export const FunctionalStates: Story = {
  parameters: {
    controls: { disable: true },
  },
  name: '06. Functional & Lifecycle States',
  render: () => (
    <div className="p-8 rounded-2xl bg-vk-surface border border-vk-border shadow-xl space-y-6 max-w-lg">
      <div>
        <h3 className="text-base font-bold text-vk-text-primary">
          Lifecycle & Interaction Guards
        </h3>
        <p className="text-xs text-vk-text-secondary mt-1">
          Loading auto-replaces icons with accessible VKSpinner and blocks double-click events.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <VKButton emphasis="primary" intent="brand">
          Interactive Default
        </VKButton>

        <VKButton emphasis="primary" intent="brand" isLoading>
          Syncing Cluster...
        </VKButton>

        <VKButton emphasis="secondary" intent="neutral" disabled>
          Disabled Action
        </VKButton>

        <VKButton emphasis="primary" intent="danger" isLoading>
          Deleting...
        </VKButton>
      </div>
    </div>
  ),
};

// ============================================================================
// 8. REAL-WORLD PRODUCTION SCENARIOS
// ============================================================================

export const Scenario_DestructiveModal: Story = {
  parameters: {
    controls: { disable: true },
  },
  name: '07. Scenario: Destructive Modal',
  render: () => (
    <div className="max-w-md p-6 rounded-2xl bg-vk-surface border border-vk-border shadow-2xl space-y-5">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-600 flex items-center justify-center shrink-0">
          <Trash2 className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-base font-bold text-vk-text-primary">
            Delete Production Cluster?
          </h4>
          <p className="text-xs text-vk-text-secondary mt-1 leading-relaxed">
            This action cannot be undone. All 14 running pods, persistent volumes, and routing rules will be permanently deprovisioned.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-vk-border">
        <VKButton emphasis="secondary" intent="neutral">
          Cancel
        </VKButton>
        <VKButton emphasis="primary" intent="danger" icon={<Trash2 className="w-4 h-4" />}>
          Confirm Deletion
        </VKButton>
      </div>
    </div>
  ),
};

export const Scenario_AICommandBar: Story = {
  parameters: {
    controls: { disable: true },
  },
  name: '08. Scenario: AI Command Bar',
  render: () => (
    <div className="max-w-xl w-full p-3 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
        <Bot className="w-4 h-4" />
      </div>
      <input
        type="text"
        placeholder="Ask VK Agent to generate architecture or refactor code..."
        className="flex-1 bg-transparent text-sm text-slate-200 placeholder-slate-500 outline-none"
        defaultValue="Generate scalable Kubernetes deployment topology for FE microfrontends"
      />
      <VKButton
        animatedBorder
        intent="brand"
        size="sm"
        icon={<Sparkles className="w-3.5 h-3.5 text-indigo-400" />}
      >
        Generate
      </VKButton>
    </div>
  ),
};

export const Scenario_TableRowActions: Story = {
  parameters: {
    controls: { disable: true },
  },
  name: '09. Scenario: Table Row Actions',
  render: () => (
    <div className="p-4 rounded-xl border border-vk-border bg-vk-surface shadow-sm max-w-2xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FolderGit2 className="w-5 h-5 text-vk-primary" />
          <div>
            <div className="text-sm font-semibold text-vk-text-primary">
              vk-blocks-gateway / prod-cluster
            </div>
            <div className="text-xs text-vk-text-secondary font-mono">
              commit 8f24a1b • updated 4m ago
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <VKButton emphasis="ghost" intent="neutral" size="sm">
            View
          </VKButton>
          <VKButton emphasis="ghost" intent="brand" size="sm">
            Edit
          </VKButton>
          <VKButton
            emphasis="ghost"
            intent="danger"
            size="sm"
            icon={<Trash2 className="w-3.5 h-3.5" />}
            aria-label="Delete cluster"
          />
        </div>
      </div>
    </div>
  ),
};

export const Scenario_EnterpriseClusterCard: Story = {
  parameters: {
    controls: { disable: true },
  },
  name: '10. Scenario: Enterprise Cluster Card',
  render: () => (
    <div className="max-w-md p-6 rounded-2xl bg-vk-surface border border-vk-border shadow-xl space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center font-bold text-sm">
            VK
          </div>
          <div>
            <h4 className="text-sm font-semibold text-vk-text-primary">Enterprise Cluster</h4>
            <p className="text-xs text-vk-text-secondary">v2.4.0 • Active</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
          <ShieldCheck className="w-3.5 h-3.5" /> Healthy
        </span>
      </div>

      <p className="text-sm text-vk-text-secondary leading-relaxed">
        Scale real-time agentic workloads across distributed nodes with zero-downtime reconfiguration.
      </p>

      <div className="flex items-center gap-3 pt-2">
        <VKButton
          emphasis="primary"
          intent="brand"
          size="md"
          glow
          icon={<Zap className="w-4 h-4" />}
        >
          Deploy Node
        </VKButton>
        <VKButton emphasis="secondary" intent="neutral" size="md">
          Documentation
        </VKButton>
        <VKButton
          emphasis="ghost"
          intent="danger"
          size="md"
          icon={<Trash2 className="w-4 h-4 text-red-500" />}
          aria-label="Delete node"
        />
      </div>
    </div>
  ),
};

export const BrandTonalScaleAndGradients: Story = {
  parameters: {
    controls: { disable: true },
  },
  name: '11. Brand Tonal Scale & Gradients',
  render: () => {
    const swatches = [
      { step: '100', hex: '#f3e8ff', role: 'Subtle Tint / Container Accent', textColor: '#581c87', bgClass: 'bg-vk-brand-100' },
      { step: '200', hex: '#e9d5ff', role: 'Subtle Border / Secondary Surface', textColor: '#581c87', bgClass: 'bg-vk-brand-200' },
      { step: '300', hex: '#d8b4fe', role: 'Muted Border / Indicator Badge', textColor: '#3b0764', bgClass: 'bg-vk-brand-300' },
      { step: '400', hex: '#c084fc', role: 'Dark Text / Luminous Icon Accent', textColor: '#ffffff', bgClass: 'bg-vk-brand-400' },
      { step: '500', hex: '#a855f7', role: 'Dark Solid Primary Anchor', textColor: '#ffffff', bgClass: 'bg-vk-brand-500' },
      { step: '600', hex: '#9333ea', role: 'Gradient Midtone / Vibrant High', textColor: '#ffffff', bgClass: 'bg-vk-brand-600' },
      { step: '700', hex: '#7e22ce', role: 'Light Solid Primary (Default)', textColor: '#ffffff', bgClass: 'bg-vk-brand-700' },
      { step: '800', hex: '#6b21a8', role: 'Light Hover / Focused Accent', textColor: '#ffffff', bgClass: 'bg-vk-brand-800' },
      { step: '900', hex: '#581c87', role: 'Light Active Press / Deep Anchor', textColor: '#ffffff', bgClass: 'bg-vk-brand-900' },
    ];

    return (
      <div className="space-y-10 max-w-4xl py-4">
        {/* Banner */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-purple-950 via-purple-900 to-indigo-950 text-white shadow-xl border border-purple-500/20">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-white/10 backdrop-blur-md">
              <Palette className="w-6 h-6 text-purple-300" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-bold tracking-tight">
                  VK Brand System: Royal Amethyst
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-400/20 text-purple-200 border border-purple-300/30">
                  Official Brand 100 ~ 900
                </span>
              </div>
              <p className="text-sm text-purple-200/80 mt-1.5 max-w-2xl leading-relaxed">
                VK official brand palette: <strong>Royal Amethyst</strong>.
                Light mode default solid resolves to <code className="bg-white/15 px-1 rounded font-mono text-xs">brand-700 (#7e22ce)</code> with a 6.5:1 contrast ratio (approaching AAA),
                while dark mode dynamically transitions to <code className="bg-white/15 px-1 rounded font-mono text-xs">brand-500 (#a855f7)</code>.
              </p>
            </div>
          </div>
        </div>

        {/* Tonal Color Scale (100 ~ 900) */}
        <div className="p-6 rounded-2xl border border-vk-border bg-vk-surface shadow-sm space-y-4">
          <div>
            <h3 className="text-base font-bold text-vk-text-primary">
              1. Tonal Color Scale (Official 100 ~ 900 Scale)
            </h3>
            <p className="text-xs text-vk-text-secondary mt-1">
              Curated 9-step industrial scale covering backgrounds, borders, interaction states, and accents.
            </p>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-9 gap-2">
            {swatches.map((s) => (
              <div
                key={s.step}
                className="group flex flex-col rounded-xl overflow-hidden border border-vk-border/80 shadow-sm transition-transform hover:-translate-y-1"
              >
                <div
                  className="h-16 flex flex-col items-center justify-center p-2"
                  style={{ backgroundColor: s.hex }}
                >
                  <span
                    className="text-xs font-bold font-mono tracking-tight"
                    style={{ color: s.textColor }}
                  >
                    {s.step}
                  </span>
                  <span
                    className="text-[10px] font-mono opacity-80"
                    style={{ color: s.textColor }}
                  >
                    {s.hex}
                  </span>
                </div>
                <div className="p-2 bg-vk-surface text-center">
                  <div className="text-[10px] text-vk-text-secondary font-medium leading-tight">
                    {s.role}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Orthogonal Visual Hierarchies */}
        <div className="p-6 rounded-2xl border border-vk-border bg-vk-surface shadow-sm space-y-4">
          <div>
            <h3 className="text-base font-bold text-vk-text-primary">
              2. Orthogonal Visual Hierarchies (Real Component Render)
            </h3>
            <p className="text-xs text-vk-text-secondary mt-1">
              Decoupled hierarchy and intent. Anchored to <code className="bg-vk-brand-100 text-vk-brand-700 px-1 py-0.5 rounded font-mono text-[11px]">brand-700</code> in light mode and luminous amethyst in dark mode.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 p-5 rounded-xl bg-vk-background/50 border border-vk-border">
            <VKButton
              emphasis="primary"
              intent="brand"
              size="md"
              icon={<Sparkles className="w-4 h-4" />}
            >
              Primary (Solid 700)
            </VKButton>

            <VKButton emphasis="secondary" intent="brand" size="md">
              Secondary (Subtle 100)
            </VKButton>

            <VKButton emphasis="tertiary" intent="brand" size="md">
              Tertiary Outline (700)
            </VKButton>

            <VKButton emphasis="ghost" intent="brand" size="md">
              Ghost Action
            </VKButton>
          </div>
        </div>

        {/* Gradients & Expressive Materials */}
        <div className="p-6 rounded-2xl border border-vk-border bg-vk-surface shadow-sm space-y-4">
          <div>
            <h3 className="text-base font-bold text-vk-text-primary">
              3. Gradients & Material Modifiers
            </h3>
            <p className="text-xs text-vk-text-secondary mt-1">
              Supports monochromatic depth gradients, cross-hue AI streamers, luminous glow, and frosted glass.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 p-5 rounded-xl bg-vk-background/50 border border-vk-border">
            {/* Monochromatic Gradient */}
            <button
              type="button"
              className="px-4 py-2 text-sm rounded-lg font-medium text-white shadow-sm transition-all hover:opacity-90 active:scale-95 bg-gradient-to-r from-vk-brand-800 via-vk-brand-700 to-vk-brand-500 flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Monochromatic Depth (800 → 500)
            </button>

            {/* Cross-Hue Streamer Gradient */}
            <button
              type="button"
              className="px-4 py-2 text-sm rounded-lg font-medium text-white shadow-md transition-all hover:opacity-90 active:scale-95 bg-gradient-to-r from-purple-800 via-purple-600 to-pink-500 flex items-center gap-2"
            >
              <Zap className="w-4 h-4" />
              Cross-Hue Streamer (Purple → Pink)
            </button>

            {/* Luminous Glow */}
            <VKButton
              emphasis="primary"
              intent="brand"
              size="md"
              glow
              icon={<Zap className="w-4 h-4" />}
            >
              Luminous Glow
            </VKButton>

            {/* Frosted Glass */}
            <VKButton
              emphasis="primary"
              intent="brand"
              size="md"
              material="glass"
            >
              Frosted Glass
            </VKButton>
          </div>
        </div>
      </div>
    );
  },
};


