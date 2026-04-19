import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import Input from '$lib/components/ui/Input.svelte';

describe('Input', () => {
  it('renders with label', () => {
    render(Input, { label: 'Email' });

    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  it('accepts typed input', async () => {
    const user = userEvent.setup();
    let value = '';
    render(Input, {
      label: 'Name',
      get value() { return value; },
      set value(v: string) { value = v; },
    });

    const input = screen.getByLabelText('Name');
    await user.type(input, 'hello');
    expect(value).toBe('hello');
  });

  it('shows error text and sets aria-invalid', () => {
    render(Input, { label: 'Password', error: 'Too short' });

    const input = screen.getByLabelText('Password');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('Too short')).toBeInTheDocument();
  });

  it('shows hint text when no error', () => {
    render(Input, { label: 'Username', hint: '3-30 characters' });

    expect(screen.getByText('3-30 characters')).toBeInTheDocument();
    const input = screen.getByLabelText('Username');
    expect(input).not.toHaveAttribute('aria-invalid');
  });

  it('prioritizes error over hint', () => {
    render(Input, { label: 'Field', hint: 'Help text', error: 'Required' });

    expect(screen.getByText('Required')).toBeInTheDocument();
    expect(screen.queryByText('Help text')).not.toBeInTheDocument();
  });

  it('is disabled when disabled prop is true', () => {
    render(Input, { label: 'Locked', disabled: true });

    expect(screen.getByLabelText('Locked')).toBeDisabled();
  });
});
