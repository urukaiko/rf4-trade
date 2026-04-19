/**
 * UI component tests — verify variant classes and props.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import type { Snippet } from 'svelte';
import Button from '$lib/components/ui/Button.svelte';
import Badge from '$lib/components/ui/Badge.svelte';

function makeSnippet(text: string): Snippet {
  return (() => text) as unknown as Snippet;
}

describe('Button', () => {
  it('renders default variant with bg-primary', () => {
    const { container } = render(Button, { children: makeSnippet('Go') });
    expect(container.querySelector('button')).toHaveClass('bg-primary');
  });

  it('renders destructive variant', () => {
    const { container } = render(Button, { children: makeSnippet('X'), variant: 'destructive' });
    expect(container.querySelector('button')).toHaveClass('bg-destructive');
  });

  it('renders outline variant', () => {
    const { container } = render(Button, { children: makeSnippet('O'), variant: 'outline' });
    expect(container.querySelector('button')).toHaveClass('border');
    expect(container.querySelector('button')).toHaveClass('border-input');
  });

  it('renders ghost variant', () => {
    const { container } = render(Button, { children: makeSnippet('G'), variant: 'ghost' });
    expect(container.querySelector('button')).toHaveClass('hover:bg-accent');
  });

  it('renders loading state with spinner', () => {
    const { container } = render(Button, { children: makeSnippet('L'), loading: true });
    expect(container.querySelector('button')).toHaveAttribute('aria-busy', 'true');
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders disabled state', () => {
    render(Button, { children: makeSnippet('No'), disabled: true });
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('fires onclick', async () => {
    const user = userEvent.setup();
    const onclick = vi.fn();
    render(Button, { children: makeSnippet('Click'), onclick });
    await user.click(screen.getByRole('button'));
    expect(onclick).toHaveBeenCalled();
  });

  it('applies custom class', () => {
    const { container } = render(Button, { children: makeSnippet('C'), class: 'w-full' });
    expect(container.querySelector('button')).toHaveClass('w-full');
  });

  it('renders icon size', () => {
    const { container } = render(Button, { children: makeSnippet('+'), size: 'icon' });
    expect(container.querySelector('button')).toHaveClass('h-9');
    expect(container.querySelector('button')).toHaveClass('w-9');
  });
});

describe('Badge', () => {
  it('renders default variant', () => {
    const { container } = render(Badge, { children: makeSnippet('New') });
    expect(container.querySelector('div')).toHaveClass('bg-primary');
  });

  it('renders success variant', () => {
    const { container } = render(Badge, { children: makeSnippet('OK'), variant: 'success' });
    expect(container.querySelector('div')).toHaveClass('bg-success');
  });

  it('renders destructive variant', () => {
    const { container } = render(Badge, { children: makeSnippet('Err'), variant: 'destructive' });
    expect(container.querySelector('div')).toHaveClass('bg-destructive');
  });

  it('renders outline variant', () => {
    const { container } = render(Badge, { children: makeSnippet('Tag'), variant: 'outline' });
    expect(container.querySelector('div')).toHaveClass('border');
  });

  it('renders secondary variant', () => {
    const { container } = render(Badge, { children: makeSnippet('2'), variant: 'secondary' });
    expect(container.querySelector('div')).toHaveClass('bg-secondary');
  });

  it('renders warning variant', () => {
    const { container } = render(Badge, { children: makeSnippet('!'), variant: 'warning' });
    expect(container.querySelector('div')).toHaveClass('bg-warning');
  });

  it('has rounded-full shape', () => {
    const { container } = render(Badge, { children: makeSnippet('R') });
    expect(container.querySelector('div')).toHaveClass('rounded-full');
  });
});
