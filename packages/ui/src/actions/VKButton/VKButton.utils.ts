import type {
  VKButtonEmphasis,
  VKButtonGlow,
  VKButtonIntent,
  VKButtonMaterial,
  VKButtonProps,
} from './VKButton.types';

/**
 * Resolves orthogonal emphasis, intent, and expressive surface material from props
 * or the backward-compatible `variant` shorthand.
 */
export function resolveButtonConfig(
  emphasis?: VKButtonEmphasis,
  intent?: VKButtonIntent,
  material?: VKButtonMaterial,
  variant?: VKButtonProps['variant']
): {
  resolvedEmphasis: VKButtonEmphasis;
  resolvedIntent: VKButtonIntent;
  resolvedMaterial?: VKButtonMaterial;
} {
  let resolvedMaterial = material;
  let resolvedEmphasis = emphasis;
  let resolvedIntent = intent ?? 'brand';

  // Backward-compatible variant shorthand mapping
  if (variant === 'gradient' || variant === 'glass') {
    resolvedMaterial = resolvedMaterial ?? variant;
  } else if (!emphasis && variant) {
    switch (variant) {
      case 'primary':
        resolvedEmphasis = 'primary';
        resolvedIntent = intent ?? 'brand';
        break;
      case 'secondary':
        resolvedEmphasis = 'secondary';
        resolvedIntent = intent ?? 'neutral';
        break;
      case 'outline':
        resolvedEmphasis = 'tertiary';
        resolvedIntent = intent ?? 'brand';
        break;
      case 'ghost':
        resolvedEmphasis = 'ghost';
        resolvedIntent = intent ?? 'neutral';
        break;
      case 'danger':
        resolvedEmphasis = 'primary';
        resolvedIntent = 'danger';
        break;
    }
  }

  return {
    resolvedEmphasis: resolvedEmphasis ?? 'primary',
    resolvedIntent,
    resolvedMaterial,
  };
}

/**
 * Resolves atmospheric ambient glow classes across intent, material, and 3-tier intensity.
 */
export function resolveGlowClass(
  glow?: VKButtonGlow,
  intent: VKButtonIntent = 'brand',
  material?: VKButtonMaterial
): string | null {
  if (!glow) return null;
  const intensity = glow === true ? 'normal' : glow;

  if (material === 'gradient') {
    switch (intensity) {
      case 'subtle':
        return 'shadow-[0_0_12px_rgba(168,85,247,0.35),0_0_24px_rgba(99,102,241,0.2)] hover:shadow-[0_0_18px_rgba(168,85,247,0.5),0_0_36px_rgba(99,102,241,0.3)]';
      case 'intense':
        return 'shadow-[0_0_30px_rgba(168,85,247,0.85),0_0_60px_rgba(99,102,241,0.6)] hover:shadow-[0_0_45px_rgba(168,85,247,1),0_0_80px_rgba(99,102,241,0.8)]';
      case 'normal':
      default:
        return 'shadow-[0_0_20px_rgba(168,85,247,0.55),0_0_40px_rgba(99,102,241,0.3)] hover:shadow-[0_0_30px_rgba(168,85,247,0.8),0_0_60px_rgba(99,102,241,0.5)]';
    }
  }

  if (intent === 'danger') {
    switch (intensity) {
      case 'subtle':
        return 'shadow-[0_0_10px_rgba(239,68,68,0.35),0_0_20px_rgba(249,115,22,0.18)] hover:shadow-[0_0_16px_rgba(239,68,68,0.5),0_0_28px_rgba(249,115,22,0.28)]';
      case 'intense':
        return 'shadow-[0_0_28px_rgba(239,68,68,0.85),0_0_55px_rgba(249,115,22,0.6)] hover:shadow-[0_0_38px_rgba(239,68,68,1),0_0_75px_rgba(249,115,22,0.75)]';
      case 'normal':
      default:
        return 'shadow-vk-glow-danger hover:shadow-[0_0_24px_rgba(239,68,68,0.7),0_0_45px_rgba(249,115,22,0.4)]';
    }
  }

  if (intent === 'warning') {
    switch (intensity) {
      case 'subtle':
        return 'shadow-[0_0_10px_rgba(245,158,11,0.25),0_0_20px_rgba(217,119,6,0.15)] hover:shadow-[0_0_16px_rgba(245,158,11,0.4),0_0_28px_rgba(217,119,6,0.25)]';
      case 'intense':
        return 'shadow-[0_0_28px_rgba(245,158,11,0.85),0_0_55px_rgba(217,119,6,0.6)] hover:shadow-[0_0_38px_rgba(245,158,11,1),0_0_75px_rgba(217,119,6,0.75)]';
      case 'normal':
      default:
        return 'shadow-amber-500/30 hover:shadow-[0_0_24px_rgba(245,158,11,0.7),0_0_45px_rgba(217,119,6,0.4)]';
    }
  }

  // Brand default
  switch (intensity) {
    case 'subtle':
      return 'shadow-[0_0_10px_rgba(99,102,241,0.35),0_0_20px_rgba(168,85,247,0.18)] hover:shadow-[0_0_16px_rgba(99,102,241,0.5),0_0_28px_rgba(168,85,247,0.28)]';
    case 'intense':
      return 'shadow-[0_0_28px_rgba(99,102,241,0.85),0_0_55px_rgba(168,85,247,0.6)] hover:shadow-[0_0_38px_rgba(99,102,241,1),0_0_75px_rgba(168,85,247,0.75)]';
    case 'normal':
    default:
      return 'shadow-vk-glow-brand hover:shadow-[0_0_24px_rgba(99,102,241,0.7),0_0_45px_rgba(168,85,247,0.4)]';
  }
}
