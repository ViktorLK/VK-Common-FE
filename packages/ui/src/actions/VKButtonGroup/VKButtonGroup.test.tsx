import React, { createRef } from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { VKButtonGroup } from './VKButtonGroup';
import { VKButton } from '../VKButton';

describe('VKButtonGroup (DL.01 & MB.06)', () => {
  it('should render grouped buttons with accessibility role and orientation', () => {
    render(
      <VKButtonGroup orientation="horizontal">
        <VKButton>Left</VKButton>
        <VKButton>Middle</VKButton>
        <VKButton>Right</VKButton>
      </VKButtonGroup>
    );

    const group = screen.getByRole('group');
    expect(group).toBeDefined();
    expect(group.getAttribute('aria-orientation')).toBe('horizontal');
    expect(screen.getAllByRole('button')).toHaveLength(3);
  });

  it('should cascade size, emphasis, and intent down to child buttons via prop cloning', () => {
    render(
      <VKButtonGroup size="sm" emphasis="secondary" intent="danger">
        <VKButton>Delete First</VKButton>
        <VKButton>Delete Second</VKButton>
      </VKButtonGroup>
    );

    const buttons = screen.getAllByRole('button');
    // Check that small size class 'h-8' is applied to both
    expect(buttons[0].className).toContain('h-8');
    expect(buttons[1].className).toContain('h-8');
  });

  it('should cascade disabled state to children when disabled is set on group', () => {
    render(
      <VKButtonGroup disabled>
        <VKButton>Action 1</VKButton>
        <VKButton>Action 2</VKButton>
      </VKButtonGroup>
    );

    const buttons = screen.getAllByRole('button');
    expect((buttons[0] as HTMLButtonElement).disabled).toBe(true);
    expect((buttons[1] as HTMLButtonElement).disabled).toBe(true);
  });

  it('should support vertical orientation', () => {
    render(
      <VKButtonGroup orientation="vertical">
        <VKButton>Top</VKButton>
        <VKButton>Bottom</VKButton>
      </VKButtonGroup>
    );

    const group = screen.getByRole('group');
    expect(group.getAttribute('aria-orientation')).toBe('vertical');
  });

  it('should forward ref to container div', () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <VKButtonGroup ref={ref}>
        <VKButton>Item</VKButton>
      </VKButtonGroup>
    );

    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});
