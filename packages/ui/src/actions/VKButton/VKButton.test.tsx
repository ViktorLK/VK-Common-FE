import React, { createRef } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { VKButton } from './VKButton';

describe('VKButton (DL.01 & MB.06)', () => {
  it('should render button text and handle click events in happy path', () => {
    const handleClick = vi.fn();
    render(<VKButton onClick={handleClick}>Submit</VKButton>);

    const button = screen.getByRole('button', { name: /submit/i });
    expect(button).toBeDefined();

    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should pass standard HTML button attributes to the native element', () => {
    render(
      <VKButton type="submit" name="action-button" aria-label="Save Settings">
        Save
      </VKButton>
    );

    const button = screen.getByRole('button', { name: /save settings/i }) as HTMLButtonElement;
    expect(button.type).toBe('submit');
    expect(button.name).toBe('action-button');
    expect(button.getAttribute('aria-label')).toBe('Save Settings');
  });

  it('should be disabled and prevent click execution when disabled is true', () => {
    const handleClick = vi.fn();
    render(
      <VKButton disabled onClick={handleClick}>
        Disabled Button
      </VKButton>
    );

    const button = screen.getByRole('button', { name: /disabled button/i }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    expect(button.className).toContain('cursor-not-allowed');

    fireEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('should automatically disable the button, set aria-busy, and render spinner when isLoading is true', () => {
    const handleClick = vi.fn();
    render(
      <VKButton isLoading onClick={handleClick}>
        Processing
      </VKButton>
    );

    const button = screen.getByRole('button') as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    expect(button.getAttribute('aria-busy')).toBe('true');
    expect(button.className).toContain('cursor-not-allowed');

    // Verify spinner element is mounted
    const spinner = screen.getByRole('status', { hidden: true });
    expect(spinner).toBeDefined();

    // Verify click handler is blocked during loading state
    fireEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('should render icon on the left by default and on the right when iconPosition is right', () => {
    const { rerender } = render(
      <VKButton icon={<span data-testid="button-icon">★</span>}>
        Left Icon
      </VKButton>
    );

    let iconWrapper = screen.getByTestId('button-icon').parentElement;
    expect(iconWrapper).toBeDefined();
    expect(iconWrapper?.className).toContain('mr-vk-2');
    expect(iconWrapper?.className).not.toContain('order-last');

    rerender(
      <VKButton icon={<span data-testid="button-icon">★</span>} iconPosition="right">
        Right Icon
      </VKButton>
    );

    iconWrapper = screen.getByTestId('button-icon').parentElement;
    expect(iconWrapper?.className).toContain('order-last');
    expect(iconWrapper?.className).toContain('ml-vk-2');
  });

  it('should hide custom icon and display spinner when isLoading is active', () => {
    render(
      <VKButton
        isLoading
        icon={<span data-testid="button-custom-icon">Custom Icon</span>}
      >
        Submitting
      </VKButton>
    );

    // Custom icon should yield to the spinner to prevent layout breakage
    expect(screen.queryByTestId('button-custom-icon')).toBeNull();
    expect(screen.getByRole('status', { hidden: true })).toBeDefined();
  });

  it('should correctly forward ref to the underlying HTMLButtonElement', () => {
    const buttonRef = createRef<HTMLButtonElement>();
    render(<VKButton ref={buttonRef}>Forward Ref</VKButton>);

    expect(buttonRef.current).toBeInstanceOf(HTMLButtonElement);
    expect(buttonRef.current?.textContent).toBe('Forward Ref');
  });

  it('should apply variant, size, fullWidth and custom className combinations correctly', () => {
    render(
      <VKButton
        variant="outline"
        size="lg"
        fullWidth
        className="custom-audit-class"
      >
        Styled Button
      </VKButton>
    );

    const button = screen.getByRole('button', { name: /styled button/i });
    expect(button.className).toContain('custom-audit-class');
    expect(button.className).toContain('border-vk-primary');
    expect(button.className).toContain('h-12');
    expect(button.className).toContain('w-full');
  });

  it('should render icon-only button without children safely', () => {
    render(
      <VKButton
        aria-label="Search"
        icon={<span data-testid="search-icon">🔍</span>}
      />
    );

    const button = screen.getByRole('button', { name: /search/i });
    expect(button).toBeDefined();
    expect(screen.getByTestId('search-icon')).toBeDefined();
  });

  it('should support orthogonal emphasis and intent combinations cleanly', () => {
    const { rerender } = render(
      <VKButton emphasis="primary" intent="danger">
        Confirm Delete
      </VKButton>
    );

    let button = screen.getByRole('button', { name: /confirm delete/i });
    expect(button.className).toContain('bg-vk-danger-solid');

    rerender(
      <VKButton emphasis="ghost" intent="danger">
        Subtle Delete
      </VKButton>
    );

    button = screen.getByRole('button', { name: /subtle delete/i });
    expect(button.className).toContain('text-vk-danger-text');

    rerender(
      <VKButton emphasis="primary" intent="brand">
        Primary Brand
      </VKButton>
    );

    button = screen.getByRole('button', { name: /primary brand/i });
    expect(button.className).toContain('bg-vk-primary');

    rerender(
      <VKButton emphasis="tertiary" intent="brand">
        Tertiary Brand
      </VKButton>
    );

    button = screen.getByRole('button', { name: /tertiary brand/i });
    expect(button.className).toContain('border-vk-primary');
  });

  it('should apply ambient glow and shimmer sweep modifiers when enabled', () => {
    const { container, rerender } = render(
      <VKButton emphasis="primary" intent="brand" glow>
        Glow Button
      </VKButton>
    );

    const button = screen.getByRole('button', { name: /glow button/i });
    expect(button.className).toContain('shadow-vk-glow-brand');

    rerender(
      <VKButton emphasis="primary" intent="brand" shimmer>
        Shimmer Button
      </VKButton>
    );

    expect(button.className).toContain('overflow-hidden');
    const shimmerElement = container.querySelector('.animate-shimmer');
    expect(shimmerElement).not.toBeNull();
  });

  it('should support glow intensity levels (subtle, normal, intense)', () => {
    const { rerender } = render(
      <VKButton emphasis="primary" intent="brand" glow="subtle">
        Subtle Glow
      </VKButton>
    );

    let button = screen.getByRole('button', { name: /subtle glow/i });
    expect(button.className).toContain('shadow-[0_0_10px_rgba(99,102,241,0.35)');

    rerender(
      <VKButton emphasis="primary" intent="brand" glow="intense">
        Intense Glow
      </VKButton>
    );

    button = screen.getByRole('button', { name: /intense glow/i });
    expect(button.className).toContain('shadow-[0_0_28px_rgba(99,102,241,0.85)');
  });

  it('should render animated rotating conic beam with intent-aware color when animatedBorder is active', () => {
    const { rerender } = render(
      <VKButton animatedBorder intent="brand">
        Laser Brand
      </VKButton>
    );

    const button = screen.getByRole('button', { name: /laser brand/i });
    expect(button.className).toContain('overflow-hidden');
    expect(button.className).toContain('border-transparent');

    const beam = screen.getByTestId('animated-border-beam');
    expect(beam).toBeDefined();
    expect(beam.className).toContain('vk-animated-border-beam');
    expect(beam.className).toContain('vk-conic-beam-brand');

    // Verify intent switch alters beam gradient class
    rerender(
      <VKButton animatedBorder intent="danger">
        Laser Danger
      </VKButton>
    );

    const updatedBeam = screen.getByTestId('animated-border-beam');
    expect(updatedBeam.className).toContain('vk-conic-beam-danger');
  });

  it('should support decoupled material modifier (gradient & glass) cleanly', () => {
    const { rerender } = render(
      <VKButton material="gradient">
        Gradient Action
      </VKButton>
    );

    let button = screen.getByRole('button', { name: /gradient action/i });
    expect(button.className).toContain('bg-gradient-to-r');
    expect(button.className).toContain('from-indigo-500');
    // Ensure primary solid classes are not colliding
    expect(button.className).not.toContain('bg-vk-primary');

    rerender(
      <VKButton material="glass">
        Glass Action
      </VKButton>
    );

    button = screen.getByRole('button', { name: /glass action/i });
    expect(button.className).toContain('backdrop-blur-md');
    expect(button.className).toContain('border-slate-200/60');
    expect(button.className).not.toContain('bg-vk-primary');
  });

  it('should maintain backward compatibility for variant="gradient" and variant="glass"', () => {
    const { rerender } = render(
      <VKButton variant="gradient">
        Legacy Gradient
      </VKButton>
    );

    let button = screen.getByRole('button', { name: /legacy gradient/i });
    expect(button.className).toContain('bg-gradient-to-r');
    expect(button.className).not.toContain('bg-vk-primary');

    rerender(
      <VKButton variant="glass">
        Legacy Glass
      </VKButton>
    );

    button = screen.getByRole('button', { name: /legacy glass/i });
    expect(button.className).toContain('backdrop-blur-md');
  });
});

