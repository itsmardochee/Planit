import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import DarkModeToggle from '../DarkModeToggle';
import * as ThemeContext from '../../contexts/ThemeContext';

describe('DarkModeToggle', () => {
  it('renders with light mode icon when isDarkMode is false', () => {
    vi.spyOn(ThemeContext, 'useTheme').mockReturnValue({
      isDarkMode: false,
      toggleDarkMode: vi.fn(),
    });

    render(<DarkModeToggle />);

    const button = screen.getByRole('button', {
      name: /switch to dark mode/i,
    });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('title', 'Switch to dark mode');
  });

  it('renders with dark mode icon when isDarkMode is true', () => {
    vi.spyOn(ThemeContext, 'useTheme').mockReturnValue({
      isDarkMode: true,
      toggleDarkMode: vi.fn(),
    });

    render(<DarkModeToggle />);

    const button = screen.getByRole('button', {
      name: /switch to light mode/i,
    });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('title', 'Switch to light mode');
  });

  it('calls toggleDarkMode when clicked', () => {
    const mockToggleDarkMode = vi.fn();
    vi.spyOn(ThemeContext, 'useTheme').mockReturnValue({
      isDarkMode: false,
      toggleDarkMode: mockToggleDarkMode,
    });

    render(<DarkModeToggle />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(mockToggleDarkMode).toHaveBeenCalledTimes(1);
  });

  it('has correct CSS classes', () => {
    vi.spyOn(ThemeContext, 'useTheme').mockReturnValue({
      isDarkMode: false,
      toggleDarkMode: vi.fn(),
    });

    render(<DarkModeToggle />);

    const button = screen.getByRole('button');
    expect(button.className).toContain('p-2');
    expect(button.className).toContain('rounded-lg');
  });
});
