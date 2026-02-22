import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StatusSelector from '../StatusSelector';

describe('StatusSelector', () => {
  const onChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Display status options', () => {
    it('should display all status options', () => {
      render(<StatusSelector value={null} onChange={onChange} />);

      expect(screen.getByRole('option', { name: /none/i })).toBeInTheDocument();
      expect(
        screen.getByRole('option', { name: /to do/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('option', { name: /in progress/i })
      ).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /done/i })).toBeInTheDocument();
      expect(
        screen.getByRole('option', { name: /blocked/i })
      ).toBeInTheDocument();
    });

    it('should show current status as selected', () => {
      render(<StatusSelector value="todo" onChange={onChange} />);

      const select = screen.getByRole('combobox');
      expect(select).toHaveValue('todo');
    });

    it('should show "None" when value is null', () => {
      render(<StatusSelector value={null} onChange={onChange} />);

      const select = screen.getByRole('combobox');
      expect(select).toHaveValue('');
    });
  });

  describe('Change status', () => {
    it('should call onChange with "in-progress" when selected', async () => {
      const user = userEvent.setup();
      render(<StatusSelector value="todo" onChange={onChange} />);

      await user.selectOptions(
        screen.getByRole('combobox'),
        screen.getByRole('option', { name: /in progress/i })
      );

      expect(onChange).toHaveBeenCalledWith('in-progress');
    });

    it('should call onChange with "done" when selected', async () => {
      const user = userEvent.setup();
      render(<StatusSelector value={null} onChange={onChange} />);

      await user.selectOptions(
        screen.getByRole('combobox'),
        screen.getByRole('option', { name: /done/i })
      );

      expect(onChange).toHaveBeenCalledWith('done');
    });

    it('should call onChange with "blocked" when selected', async () => {
      const user = userEvent.setup();
      render(<StatusSelector value="todo" onChange={onChange} />);

      await user.selectOptions(
        screen.getByRole('combobox'),
        screen.getByRole('option', { name: /blocked/i })
      );

      expect(onChange).toHaveBeenCalledWith('blocked');
    });

    it('should call onChange with null when "None" is selected', async () => {
      const user = userEvent.setup();
      render(<StatusSelector value="todo" onChange={onChange} />);

      await user.selectOptions(
        screen.getByRole('combobox'),
        screen.getByRole('option', { name: /none/i })
      );

      expect(onChange).toHaveBeenCalledWith(null);
    });

    it('should not call onChange when disabled', async () => {
      const user = userEvent.setup();
      render(<StatusSelector value="todo" onChange={onChange} disabled />);

      const select = screen.getByRole('combobox');
      expect(select).toBeDisabled();
    });
  });

  describe('Visual styling', () => {
    it('should have data-testid on each option', () => {
      render(<StatusSelector value={null} onChange={onChange} />);

      expect(screen.getByTestId('status-option-none')).toBeInTheDocument();
      expect(screen.getByTestId('status-option-todo')).toBeInTheDocument();
      expect(
        screen.getByTestId('status-option-in-progress')
      ).toBeInTheDocument();
      expect(screen.getByTestId('status-option-done')).toBeInTheDocument();
      expect(screen.getByTestId('status-option-blocked')).toBeInTheDocument();
    });
  });
});
