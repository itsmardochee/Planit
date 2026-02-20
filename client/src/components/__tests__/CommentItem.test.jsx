import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CommentItem from '../CommentItem';

describe('CommentItem', () => {
  const mockComment = {
    _id: 'comment-1',
    content: 'This is a test comment',
    userId: {
      _id: 'user-1',
      username: 'john_doe',
      email: 'john@example.com',
    },
    createdAt: new Date('2024-01-15T10:30:00Z').toISOString(),
    updatedAt: new Date('2024-01-15T10:30:00Z').toISOString(),
  };

  let mockOnEdit;
  let mockOnDelete;

  beforeEach(() => {
    mockOnEdit = vi.fn();
    mockOnDelete = vi.fn();
  });

  describe('Display', () => {
    it('should render comment content', () => {
      render(
        <CommentItem
          comment={mockComment}
          currentUserId="user-1"
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText('This is a test comment')).toBeInTheDocument();
    });

    it('should display author username', () => {
      render(
        <CommentItem
          comment={mockComment}
          currentUserId="user-1"
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText('john_doe')).toBeInTheDocument();
    });

    it('should display author avatar with initials', () => {
      render(
        <CommentItem
          comment={mockComment}
          currentUserId="user-1"
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      // Should show initials "JD" for john_doe
      expect(screen.getByText('JD')).toBeInTheDocument();
    });

    it('should display relative timestamp', () => {
      // Create a comment from 2 hours ago
      const twoHoursAgo = new Date(
        Date.now() - 2 * 60 * 60 * 1000
      ).toISOString();
      const recentComment = {
        ...mockComment,
        createdAt: twoHoursAgo,
      };

      render(
        <CommentItem
          comment={recentComment}
          currentUserId="user-1"
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      // Should show relative time like "2 hours ago" or "2h ago"
      expect(screen.getByText(/ago|il y a/i)).toBeInTheDocument();
    });
  });

  describe('Edit/Delete buttons', () => {
    it('should show edit and delete buttons for comment author', () => {
      render(
        <CommentItem
          comment={mockComment}
          currentUserId="user-1"
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /delete/i })
      ).toBeInTheDocument();
    });

    it('should not show edit/delete buttons for other users', () => {
      render(
        <CommentItem
          comment={mockComment}
          currentUserId="user-2"
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      expect(
        screen.queryByRole('button', { name: /edit/i })
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: /delete/i })
      ).not.toBeInTheDocument();
    });
  });

  describe('Edit functionality', () => {
    it('should toggle edit mode when edit button is clicked', () => {
      render(
        <CommentItem
          comment={mockComment}
          currentUserId="user-1"
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const editButton = screen.getByRole('button', { name: /edit/i });
      fireEvent.click(editButton);

      // Should show textarea with current content
      const textarea = screen.getByRole('textbox');
      expect(textarea).toBeInTheDocument();
      expect(textarea.value).toBe('This is a test comment');
    });

    it('should call onEdit when save button is clicked', () => {
      render(
        <CommentItem
          comment={mockComment}
          currentUserId="user-1"
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      // Enter edit mode
      const editButton = screen.getByRole('button', { name: /edit/i });
      fireEvent.click(editButton);

      // Modify content
      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'Updated comment' } });

      // Save
      const saveButton = screen.getByRole('button', { name: /save/i });
      fireEvent.click(saveButton);

      expect(mockOnEdit).toHaveBeenCalledWith('comment-1', 'Updated comment');
    });

    it('should cancel edit mode when cancel button is clicked', () => {
      render(
        <CommentItem
          comment={mockComment}
          currentUserId="user-1"
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      // Enter edit mode
      const editButton = screen.getByRole('button', { name: /edit/i });
      fireEvent.click(editButton);

      // Modify content
      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'Updated comment' } });

      // Cancel
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);

      // Should show original content
      expect(screen.getByText('This is a test comment')).toBeInTheDocument();
      expect(mockOnEdit).not.toHaveBeenCalled();
    });

    it('should not call onEdit if content is empty', () => {
      render(
        <CommentItem
          comment={mockComment}
          currentUserId="user-1"
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      // Enter edit mode
      const editButton = screen.getByRole('button', { name: /edit/i });
      fireEvent.click(editButton);

      // Clear content
      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: '   ' } });

      // Try to save
      const saveButton = screen.getByRole('button', { name: /save/i });
      fireEvent.click(saveButton);

      expect(mockOnEdit).not.toHaveBeenCalled();
    });
  });

  describe('Delete functionality', () => {
    it('should call onDelete when delete button is clicked', () => {
      render(
        <CommentItem
          comment={mockComment}
          currentUserId="user-1"
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const deleteButton = screen.getByRole('button', { name: /delete/i });
      fireEvent.click(deleteButton);

      expect(mockOnDelete).toHaveBeenCalledWith('comment-1');
    });
  });

  describe('Updated indicator', () => {
    it('should show "edited" indicator if comment was updated', () => {
      const editedComment = {
        ...mockComment,
        createdAt: new Date('2024-01-15T10:30:00Z').toISOString(),
        updatedAt: new Date('2024-01-15T12:30:00Z').toISOString(),
      };

      render(
        <CommentItem
          comment={editedComment}
          currentUserId="user-1"
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText(/edited/i)).toBeInTheDocument();
    });

    it('should not show "edited" indicator if comment was not updated', () => {
      render(
        <CommentItem
          comment={mockComment}
          currentUserId="user-1"
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.queryByText(/edited/i)).not.toBeInTheDocument();
    });
  });

  describe('Time formatting', () => {
    it('should display "just now" for very recent comments', () => {
      const justNow = new Date(Date.now() - 10 * 1000).toISOString(); // 10 seconds ago
      const recentComment = {
        ...mockComment,
        createdAt: justNow,
      };

      render(
        <CommentItem
          comment={recentComment}
          currentUserId="user-1"
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText(/just now/i)).toBeInTheDocument();
    });

    it('should display minutes for comments less than 1 hour old', () => {
      const minutesAgo = new Date(Date.now() - 45 * 60 * 1000).toISOString(); // 45 minutes ago
      const recentComment = {
        ...mockComment,
        createdAt: minutesAgo,
      };

      render(
        <CommentItem
          comment={recentComment}
          currentUserId="user-1"
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText(/45 minutes? ago/i)).toBeInTheDocument();
    });

    it('should display days for comments less than 1 month old', () => {
      const daysAgo = new Date(
        Date.now() - 5 * 24 * 60 * 60 * 1000
      ).toISOString(); // 5 days ago
      const oldComment = {
        ...mockComment,
        createdAt: daysAgo,
      };

      render(
        <CommentItem
          comment={oldComment}
          currentUserId="user-1"
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText(/5 days? ago/i)).toBeInTheDocument();
    });

    it('should display months for comments less than 1 year old', () => {
      const monthsAgo = new Date(
        Date.now() - 3 * 30 * 24 * 60 * 60 * 1000
      ).toISOString(); // ~3 months ago
      const oldComment = {
        ...mockComment,
        createdAt: monthsAgo,
      };

      render(
        <CommentItem
          comment={oldComment}
          currentUserId="user-1"
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText(/months? ago/i)).toBeInTheDocument();
    });

    it('should display years for very old comments', () => {
      const yearsAgo = new Date(
        Date.now() - 2 * 365 * 24 * 60 * 60 * 1000
      ).toISOString(); // 2 years ago
      const veryOldComment = {
        ...mockComment,
        createdAt: yearsAgo,
      };

      render(
        <CommentItem
          comment={veryOldComment}
          currentUserId="user-1"
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText(/years? ago/i)).toBeInTheDocument();
    });
  });

  describe('Username initials', () => {
    it('should handle single word username', () => {
      const singleWordComment = {
        ...mockComment,
        userId: {
          ...mockComment.userId,
          username: 'John',
        },
      };

      render(
        <CommentItem
          comment={singleWordComment}
          currentUserId="user-1"
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText('J')).toBeInTheDocument();
    });

    it('should handle username with hyphens', () => {
      const hyphenComment = {
        ...mockComment,
        userId: {
          ...mockComment.userId,
          username: 'mary-jane',
        },
      };

      render(
        <CommentItem
          comment={hyphenComment}
          currentUserId="user-1"
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText('MJ')).toBeInTheDocument();
    });

    it('should handle username with dots', () => {
      const dotComment = {
        ...mockComment,
        userId: {
          ...mockComment.userId,
          username: 'bob.smith',
        },
      };

      render(
        <CommentItem
          comment={dotComment}
          currentUserId="user-1"
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText('BS')).toBeInTheDocument();
    });

    it('should handle empty username', () => {
      const emptyUsernameComment = {
        ...mockComment,
        userId: {
          ...mockComment.userId,
          username: '',
        },
      };

      render(
        <CommentItem
          comment={emptyUsernameComment}
          currentUserId="user-1"
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText('?')).toBeInTheDocument();
    });
  });
});
