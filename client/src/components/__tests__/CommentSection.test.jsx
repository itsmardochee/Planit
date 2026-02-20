import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CommentSection from '../CommentSection';
import { commentAPI } from '../../utils/api';

// Mock the API
vi.mock('../../utils/api', () => ({
  commentAPI: {
    getByCard: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: vi.fn(key => store[key] || null),
    setItem: vi.fn((key, value) => {
      store[key] = value.toString();
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('CommentSection', () => {
  const mockComments = [
    {
      _id: 'comment-1',
      content: 'First comment',
      userId: {
        _id: 'user-1',
        username: 'john_doe',
        email: 'john@example.com',
      },
      createdAt: new Date('2024-01-15T10:30:00Z').toISOString(),
      updatedAt: new Date('2024-01-15T10:30:00Z').toISOString(),
    },
    {
      _id: 'comment-2',
      content: 'Second comment',
      userId: {
        _id: 'user-2',
        username: 'jane_smith',
        email: 'jane@example.com',
      },
      createdAt: new Date('2024-01-15T11:00:00Z').toISOString(),
      updatedAt: new Date('2024-01-15T11:00:00Z').toISOString(),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
    // Set up mock user in localStorage
    localStorageMock.setItem('user', JSON.stringify({ _id: 'user-1' }));
  });

  describe('Rendering', () => {
    it('should render section title', async () => {
      commentAPI.getByCard.mockResolvedValue({ data: { data: [] } });

      render(<CommentSection cardId="card-1" />);

      expect(screen.getByText(/comments/i)).toBeInTheDocument();
    });

    it('should show loading state initially', () => {
      commentAPI.getByCard.mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      render(<CommentSection cardId="card-1" />);

      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it('should display list of comments after loading', async () => {
      commentAPI.getByCard.mockResolvedValue({ data: { data: mockComments } });

      render(<CommentSection cardId="card-1" />);

      await waitFor(() => {
        expect(screen.getByText('First comment')).toBeInTheDocument();
        expect(screen.getByText('Second comment')).toBeInTheDocument();
      });
    });

    it('should show empty state when no comments', async () => {
      commentAPI.getByCard.mockResolvedValue({ data: { data: [] } });

      render(<CommentSection cardId="card-1" />);

      await waitFor(() => {
        expect(
          screen.getByText(/no comments yet|be the first/i)
        ).toBeInTheDocument();
      });
    });

    it('should render AddComment component', async () => {
      commentAPI.getByCard.mockResolvedValue({ data: { data: [] } });

      render(<CommentSection cardId="card-1" />);

      await waitFor(() => {
        expect(
          screen.getByPlaceholderText(/write a comment/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe('Fetching comments', () => {
    it('should fetch comments on mount', async () => {
      commentAPI.getByCard.mockResolvedValue({ data: { data: mockComments } });

      render(<CommentSection cardId="card-1" />);

      await waitFor(() => {
        expect(commentAPI.getByCard).toHaveBeenCalledWith('card-1');
      });
    });

    it('should handle fetch error', async () => {
      commentAPI.getByCard.mockRejectedValue(new Error('Failed to fetch'));

      render(<CommentSection cardId="card-1" />);

      await waitFor(() => {
        expect(
          screen.getByText(/failed to load comments|error loading/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe('Adding comments', () => {
    it('should add new comment successfully', async () => {
      const newComment = {
        _id: 'comment-3',
        content: 'New comment',
        userId: {
          _id: 'user-1',
          username: 'john_doe',
          email: 'john@example.com',
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      commentAPI.getByCard.mockResolvedValue({ data: { data: [] } });
      commentAPI.create.mockResolvedValue({ data: { data: newComment } });

      render(<CommentSection cardId="card-1" />);

      await waitFor(() => {
        expect(
          screen.getByPlaceholderText(/write a comment/i)
        ).toBeInTheDocument();
      });

      const textarea = screen.getByPlaceholderText(/write a comment/i);
      const submitButton = screen.getByRole('button', { name: /comment|add/i });

      fireEvent.change(textarea, { target: { value: 'New comment' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(commentAPI.create).toHaveBeenCalledWith('card-1', {
          content: 'New comment',
        });
      });

      // Should display the new comment
      await waitFor(() => {
        expect(screen.getByText('New comment')).toBeInTheDocument();
      });
    });

    it('should handle add comment error', async () => {
      commentAPI.getByCard.mockResolvedValue({ data: { data: [] } });
      commentAPI.create.mockRejectedValue(new Error('Failed to create'));

      render(<CommentSection cardId="card-1" />);

      await waitFor(() => {
        const textarea = screen.getByPlaceholderText(/write a comment/i);
        const submitButton = screen.getByRole('button', {
          name: /comment|add/i,
        });

        fireEvent.change(textarea, { target: { value: 'New comment' } });
        fireEvent.click(submitButton);
      });

      // AddComment component should show the error
      await waitFor(() => {
        expect(screen.getByText(/failed|error/i)).toBeInTheDocument();
      });
    });
  });

  describe('Editing comments', () => {
    it('should edit comment successfully', async () => {
      commentAPI.getByCard.mockResolvedValue({ data: { data: mockComments } });
      commentAPI.update.mockResolvedValue({
        data: {
          data: { ...mockComments[0], content: 'Updated comment' },
        },
      });

      render(<CommentSection cardId="card-1" />);

      await waitFor(() => {
        expect(screen.getByText('First comment')).toBeInTheDocument();
      });

      // Find and click edit button for first comment
      const editButtons = screen.getAllByRole('button', { name: /edit/i });
      fireEvent.click(editButtons[0]);

      // Edit the comment - get the textarea that has the comment content
      const textareas = screen.getAllByRole('textbox');
      const editTextarea = textareas.find(ta => ta.value === 'First comment');
      fireEvent.change(editTextarea, { target: { value: 'Updated comment' } });

      const saveButton = screen.getByRole('button', { name: /save/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(commentAPI.update).toHaveBeenCalledWith('comment-1', {
          content: 'Updated comment',
        });
      });

      // Should display updated content
      await waitFor(() => {
        expect(screen.getByText('Updated comment')).toBeInTheDocument();
      });
    });
  });

  describe('Deleting comments', () => {
    it('should delete comment successfully', async () => {
      commentAPI.getByCard.mockResolvedValue({ data: { data: mockComments } });
      commentAPI.delete.mockResolvedValue({ data: { success: true } });

      render(<CommentSection cardId="card-1" />);

      await waitFor(() => {
        expect(screen.getByText('First comment')).toBeInTheDocument();
      });

      // Find and click delete button for first comment
      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(commentAPI.delete).toHaveBeenCalledWith('comment-1');
      });

      // Comment should be removed from list
      await waitFor(() => {
        expect(screen.queryByText('First comment')).not.toBeInTheDocument();
      });
    });
  });

  describe('Comment count', () => {
    it('should display comment count in header', async () => {
      commentAPI.getByCard.mockResolvedValue({ data: { data: mockComments } });

      render(<CommentSection cardId="card-1" />);

      await waitFor(() => {
        expect(screen.getByText(/2.*comments?/i)).toBeInTheDocument();
      });
    });

    it('should update count after adding comment', async () => {
      const newComment = {
        _id: 'comment-3',
        content: 'New comment',
        userId: {
          _id: 'user-1',
          username: 'john_doe',
          email: 'john@example.com',
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      commentAPI.getByCard.mockResolvedValue({ data: { data: mockComments } });
      commentAPI.create.mockResolvedValue({ data: { data: newComment } });

      render(<CommentSection cardId="card-1" />);

      await waitFor(() => {
        expect(screen.getByText(/2.*comments?/i)).toBeInTheDocument();
      });

      // Add a comment
      const textarea = screen.getByPlaceholderText(/write a comment/i);
      const submitButton = screen.getByRole('button', { name: /add comment/i });

      fireEvent.change(textarea, { target: { value: 'New comment' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/3.*comments?/i)).toBeInTheDocument();
      });
    });
  });
});
