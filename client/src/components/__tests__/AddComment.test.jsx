import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AddComment from '../AddComment';

describe('AddComment', () => {
  let mockOnSubmit;

  beforeEach(() => {
    mockOnSubmit = vi.fn();
  });

  describe('Rendering', () => {
    it('should render textarea input', () => {
      render(<AddComment onSubmit={mockOnSubmit} />);

      const textarea = screen.getByPlaceholderText(
        /add a comment|write a comment/i
      );
      expect(textarea).toBeInTheDocument();
    });

    it('should render submit button', () => {
      render(<AddComment onSubmit={mockOnSubmit} />);

      expect(
        screen.getByRole('button', { name: /comment|add|submit/i })
      ).toBeInTheDocument();
    });
  });

  describe('Input handling', () => {
    it('should update textarea value on change', () => {
      render(<AddComment onSubmit={mockOnSubmit} />);

      const textarea = screen.getByPlaceholderText(
        /add a comment|write a comment/i
      );
      fireEvent.change(textarea, { target: { value: 'Test comment' } });

      expect(textarea.value).toBe('Test comment');
    });

    it('should allow multiline input', () => {
      render(<AddComment onSubmit={mockOnSubmit} />);

      const textarea = screen.getByPlaceholderText(
        /add a comment|write a comment/i
      );
      const multilineText = 'Line 1\nLine 2\nLine 3';
      fireEvent.change(textarea, { target: { value: multilineText } });

      expect(textarea.value).toBe(multilineText);
    });
  });

  describe('Form submission', () => {
    it('should call onSubmit with comment content when form is submitted', async () => {
      mockOnSubmit.mockResolvedValue();

      render(<AddComment onSubmit={mockOnSubmit} />);

      const textarea = screen.getByPlaceholderText(
        /add a comment|write a comment/i
      );
      const submitButton = screen.getByRole('button', {
        name: /comment|add|submit/i,
      });

      fireEvent.change(textarea, { target: { value: 'Test comment' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith('Test comment');
      });
    });

    it('should clear textarea after successful submission', async () => {
      mockOnSubmit.mockResolvedValue();

      render(<AddComment onSubmit={mockOnSubmit} />);

      const textarea = screen.getByPlaceholderText(
        /add a comment|write a comment/i
      );
      const submitButton = screen.getByRole('button', {
        name: /comment|add|submit/i,
      });

      fireEvent.change(textarea, { target: { value: 'Test comment' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(textarea.value).toBe('');
      });
    });

    it('should not submit if content is empty', () => {
      render(<AddComment onSubmit={mockOnSubmit} />);

      const submitButton = screen.getByRole('button', {
        name: /comment|add|submit/i,
      });
      fireEvent.click(submitButton);

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should not submit if content is only whitespace', () => {
      render(<AddComment onSubmit={mockOnSubmit} />);

      const textarea = screen.getByPlaceholderText(
        /add a comment|write a comment/i
      );
      const submitButton = screen.getByRole('button', {
        name: /comment|add|submit/i,
      });

      fireEvent.change(textarea, { target: { value: '   \n  \n   ' } });
      fireEvent.click(submitButton);

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should trim whitespace from content before submitting', async () => {
      mockOnSubmit.mockResolvedValue();

      render(<AddComment onSubmit={mockOnSubmit} />);

      const textarea = screen.getByPlaceholderText(
        /add a comment|write a comment/i
      );
      const submitButton = screen.getByRole('button', {
        name: /comment|add|submit/i,
      });

      fireEvent.change(textarea, { target: { value: '  Test comment  \n  ' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith('Test comment');
      });
    });
  });

  describe('Loading state', () => {
    it('should show loading state while submitting', async () => {
      // Create a promise that we control
      let resolveSubmit;
      const submitPromise = new Promise(resolve => {
        resolveSubmit = resolve;
      });
      mockOnSubmit.mockReturnValue(submitPromise);

      render(<AddComment onSubmit={mockOnSubmit} />);

      const textarea = screen.getByPlaceholderText(
        /add a comment|write a comment/i
      );
      const submitButton = screen.getByRole('button', {
        name: /comment|add|submit/i,
      });

      fireEvent.change(textarea, { target: { value: 'Test comment' } });
      fireEvent.click(submitButton);

      // Should show loading state
      await waitFor(() => {
        expect(
          screen.getByText(/adding|submitting|posting/i)
        ).toBeInTheDocument();
      });

      // Resolve the promise
      resolveSubmit();
    });

    it('should disable submit button while loading', async () => {
      let resolveSubmit;
      const submitPromise = new Promise(resolve => {
        resolveSubmit = resolve;
      });
      mockOnSubmit.mockReturnValue(submitPromise);

      render(<AddComment onSubmit={mockOnSubmit} />);

      const textarea = screen.getByPlaceholderText(
        /add a comment|write a comment/i
      );
      const submitButton = screen.getByRole('button', {
        name: /comment|add|submit/i,
      });

      fireEvent.change(textarea, { target: { value: 'Test comment' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      });

      resolveSubmit();
    });

    it('should disable textarea while loading', async () => {
      let resolveSubmit;
      const submitPromise = new Promise(resolve => {
        resolveSubmit = resolve;
      });
      mockOnSubmit.mockReturnValue(submitPromise);

      render(<AddComment onSubmit={mockOnSubmit} />);

      const textarea = screen.getByPlaceholderText(
        /add a comment|write a comment/i
      );
      const submitButton = screen.getByRole('button', {
        name: /comment|add|submit/i,
      });

      fireEvent.change(textarea, { target: { value: 'Test comment' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(textarea).toBeDisabled();
      });

      resolveSubmit();
    });
  });

  describe('Error handling', () => {
    it('should handle submission errors', async () => {
      mockOnSubmit.mockRejectedValue(new Error('Failed to add comment'));

      render(<AddComment onSubmit={mockOnSubmit} />);

      const textarea = screen.getByPlaceholderText(
        /add a comment|write a comment/i
      );
      const submitButton = screen.getByRole('button', {
        name: /comment|add|submit/i,
      });

      fireEvent.change(textarea, { target: { value: 'Test comment' } });
      fireEvent.click(submitButton);

      // Should show error message
      await waitFor(() => {
        expect(
          screen.getByText(/failed to add comment|error/i)
        ).toBeInTheDocument();
      });

      // Should not clear textarea on error
      expect(textarea.value).toBe('Test comment');
    });
  });

  describe('Keyboard shortcuts', () => {
    it('should submit on Ctrl+Enter', async () => {
      mockOnSubmit.mockResolvedValue();

      render(<AddComment onSubmit={mockOnSubmit} />);

      const textarea = screen.getByPlaceholderText(
        /add a comment|write a comment/i
      );

      fireEvent.change(textarea, { target: { value: 'Test comment' } });
      fireEvent.keyDown(textarea, { key: 'Enter', ctrlKey: true });

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith('Test comment');
      });
    });

    it('should not submit on Enter without Ctrl', () => {
      render(<AddComment onSubmit={mockOnSubmit} />);

      const textarea = screen.getByPlaceholderText(
        /add a comment|write a comment/i
      );

      fireEvent.change(textarea, { target: { value: 'Test comment' } });
      fireEvent.keyDown(textarea, { key: 'Enter' });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });
});
