import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DndContext } from '@dnd-kit/core';
import KanbanCard from '../KanbanCard';

// Mock the API
vi.mock('../../utils/api', () => ({
  cardAPI: {
    delete: vi.fn(),
  },
}));

const renderWithDndContext = ui => {
  return render(<DndContext>{ui}</DndContext>);
};

describe('KanbanCard - Comment Count Display', () => {
  const mockCard = {
    _id: 'card-1',
    title: 'Test Card',
    description: 'Test description',
  };

  it('should not display comment count when commentCount is 0', () => {
    const cardWithoutComments = {
      ...mockCard,
      commentCount: 0,
    };

    renderWithDndContext(
      <KanbanCard
        card={cardWithoutComments}
        onClick={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    expect(screen.queryByTestId('comment-count')).not.toBeInTheDocument();
  });

  it('should not display comment count when commentCount is undefined', () => {
    renderWithDndContext(
      <KanbanCard card={mockCard} onClick={vi.fn()} onDelete={vi.fn()} />
    );

    expect(screen.queryByTestId('comment-count')).not.toBeInTheDocument();
  });

  it('should display comment count when commentCount is greater than 0', () => {
    const cardWithComments = {
      ...mockCard,
      commentCount: 3,
    };

    renderWithDndContext(
      <KanbanCard
        card={cardWithComments}
        onClick={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    const commentBadge = screen.getByTestId('comment-count');
    expect(commentBadge).toBeInTheDocument();
    expect(commentBadge).toHaveTextContent('3');
  });

  it('should display comment icon with count', () => {
    const cardWithComments = {
      ...mockCard,
      commentCount: 5,
    };

    renderWithDndContext(
      <KanbanCard
        card={cardWithComments}
        onClick={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    // Should have a comment icon (💬 or similar)
    const commentBadge = screen.getByTestId('comment-count');
    expect(commentBadge).toHaveTextContent(/💬|comment/i);
  });

  it('should display correct count for single comment', () => {
    const cardWithOneComment = {
      ...mockCard,
      commentCount: 1,
    };

    renderWithDndContext(
      <KanbanCard
        card={cardWithOneComment}
        onClick={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    const commentBadge = screen.getByTestId('comment-count');
    expect(commentBadge).toHaveTextContent('1');
  });

  it('should display correct count for multiple comments', () => {
    const cardWithManyComments = {
      ...mockCard,
      commentCount: 42,
    };

    renderWithDndContext(
      <KanbanCard
        card={cardWithManyComments}
        onClick={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    const commentBadge = screen.getByTestId('comment-count');
    expect(commentBadge).toHaveTextContent('42');
  });

  it('should display comment count alongside other badges', () => {
    const cardWithMultipleBadges = {
      ...mockCard,
      labels: [{ _id: 'label-1', name: 'Bug', color: '#ff0000' }],
      status: 'in-progress',
      assignedTo: [{ _id: 'user-1', username: 'john_doe' }],
      commentCount: 7,
    };

    renderWithDndContext(
      <KanbanCard
        card={cardWithMultipleBadges}
        onClick={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    // Should have all badges
    expect(screen.getByTestId('card-labels')).toBeInTheDocument();
    expect(screen.getByTestId('comment-count')).toBeInTheDocument();
    expect(screen.getByTestId('assigned-members')).toBeInTheDocument();
  });
});
