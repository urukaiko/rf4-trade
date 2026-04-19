import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import type { Snippet } from 'svelte';
import Button from '$lib/components/ui/Button.svelte';

function makeSnippet(text: string): Snippet {
  return (() => text) as unknown as Snippet;
}

describe('Button', () => {
  it('renders as a button element', () => {
    render(Button, { children: makeSnippet('Click me') });

    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('fires onclick when clicked', async () => {
    const user = userEvent.setup();
    const onclick = vi.fn();
    render(Button, { children: makeSnippet('Submit'), onclick });

    await user.click(screen.getByRole('button'));
    expect(onclick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is true', () => {
    render(Button, { children: makeSnippet('Disabled'), disabled: true });

    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('shows loading spinner and sets aria-busy', () => {
    render(Button, { children: makeSnippet('Loading'), loading: true });

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button.querySelector('svg')).toBeInTheDocument();
  });

  it('does not show spinner when not loading', () => {
    render(Button, { children: makeSnippet('Idle'), loading: false });

    const button = screen.getByRole('button');
    expect(button).not.toHaveAttribute('aria-busy');
    expect(button.querySelector('svg')).not.toBeInTheDocument();
  });

  it('applies full width class', () => {
    render(Button, { children: makeSnippet('Full'), class: 'w-full' });

    expect(screen.getByRole('button')).toHaveClass('w-full');
  });

  it('does not apply full width by default', () => {
    render(Button, { children: makeSnippet('Auto') });

    expect(screen.getByRole('button')).not.toHaveClass('w-full');
  });
});
