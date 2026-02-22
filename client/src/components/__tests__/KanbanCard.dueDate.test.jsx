import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import KanbanCard from '../KanbanCard';
import { DndContext } from '@dnd-kit/core';

// Mock the dnd-kit/sortable
vi.mock('@dnd-kit/sortable', () => ({
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: null,
    isDragging: false,
    isOver: false,
  }),
}));

describe('KanbanCard - Due Date Display', () => {
  const mockCard = {
    _id: 'card-1',
    title: 'Test Card',
    description: 'Test description',
    listId: 'list-1',
  };

  const renderWithDndContext = component => {
    return render(<DndContext>{component}</DndContext>);
  };

  describe('No due date', () => {
    it('should not display due date badge when dueDate is not set', () => {
      renderWithDndContext(
        <KanbanCard card={mockCard} onClick={vi.fn()} onDelete={vi.fn()} />
      );

      expect(screen.queryByTestId('due-date-badge')).not.toBeInTheDocument();
    });
  });

  describe('Due date in the future (more than 2 days)', () => {
    it('should display due date with calendar icon', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5); // 5 days from now

      const cardWithDueDate = {
        ...mockCard,
        dueDate: futureDate.toISOString(),
      };

      renderWithDndContext(
        <KanbanCard
          card={cardWithDueDate}
          onClick={vi.fn()}
          onDelete={vi.fn()}
        />
      );

      const badge = screen.getByTestId('due-date-badge');
      expect(badge).toBeInTheDocument();
      expect(badge.querySelector('svg')).toBeInTheDocument();
      expect(badge).toHaveTextContent(/\w+ \d+/); // Format: "Feb 26" ou similaire
    });

    it('should display formatted date (MMM D)', () => {
      const futureDate = new Date('2026-03-15');

      const cardWithDueDate = {
        ...mockCard,
        dueDate: futureDate.toISOString(),
      };

      renderWithDndContext(
        <KanbanCard
          card={cardWithDueDate}
          onClick={vi.fn()}
          onDelete={vi.fn()}
        />
      );

      const badge = screen.getByTestId('due-date-badge');
      expect(badge).toHaveTextContent(/Mar 15/i);
    });

    it('should have green background for future dates', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5);

      const cardWithDueDate = {
        ...mockCard,
        dueDate: futureDate.toISOString(),
      };

      renderWithDndContext(
        <KanbanCard
          card={cardWithDueDate}
          onClick={vi.fn()}
          onDelete={vi.fn()}
        />
      );

      const badge = screen.getByTestId('due-date-badge');
      expect(badge).toHaveClass('bg-green-100');
      expect(badge).toHaveClass('text-green-700');
    });
  });

  describe('Due date soon (within 2 days)', () => {
    it('should have yellow/orange background for dates within 2 days', () => {
      const soonDate = new Date();
      soonDate.setDate(soonDate.getDate() + 1); // Tomorrow

      const cardWithDueDate = {
        ...mockCard,
        dueDate: soonDate.toISOString(),
      };

      renderWithDndContext(
        <KanbanCard
          card={cardWithDueDate}
          onClick={vi.fn()}
          onDelete={vi.fn()}
        />
      );

      const badge = screen.getByTestId('due-date-badge');
      expect(badge).toHaveClass('bg-yellow-100');
      expect(badge).toHaveClass('text-yellow-700');
    });

    it('should display date for due soon cards', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const cardWithDueDate = {
        ...mockCard,
        dueDate: tomorrow.toISOString(),
      };

      renderWithDndContext(
        <KanbanCard
          card={cardWithDueDate}
          onClick={vi.fn()}
          onDelete={vi.fn()}
        />
      );

      const badge = screen.getByTestId('due-date-badge');
      expect(badge).toBeInTheDocument();
      // Should show the date
      expect(badge.textContent).toMatch(/\d+/);
    });
  });

  describe('Overdue date (past)', () => {
    it('should have red background for overdue dates', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1); // Yesterday

      const cardWithDueDate = {
        ...mockCard,
        dueDate: pastDate.toISOString(),
      };

      renderWithDndContext(
        <KanbanCard
          card={cardWithDueDate}
          onClick={vi.fn()}
          onDelete={vi.fn()}
        />
      );

      const badge = screen.getByTestId('due-date-badge');
      expect(badge).toHaveClass('bg-red-100');
      expect(badge).toHaveClass('text-red-700');
    });

    it('should display date for overdue cards', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const cardWithDueDate = {
        ...mockCard,
        dueDate: yesterday.toISOString(),
      };

      renderWithDndContext(
        <KanbanCard
          card={cardWithDueDate}
          onClick={vi.fn()}
          onDelete={vi.fn()}
        />
      );

      const badge = screen.getByTestId('due-date-badge');
      expect(badge).toBeInTheDocument();
      expect(badge.textContent).toMatch(/\d+/);
    });
  });

  describe('Due date positioning', () => {
    it('should display due date badge alongside other badges', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5);

      const cardWithMultipleBadges = {
        ...mockCard,
        dueDate: futureDate.toISOString(),
        status: 'in-progress',
        commentCount: 3,
      };

      renderWithDndContext(
        <KanbanCard
          card={cardWithMultipleBadges}
          onClick={vi.fn()}
          onDelete={vi.fn()}
        />
      );

      expect(screen.getByTestId('due-date-badge')).toBeInTheDocument();
      expect(screen.getByTestId('card-status')).toBeInTheDocument();
      expect(screen.getByTestId('comment-count')).toBeInTheDocument();
    });
  });
});
