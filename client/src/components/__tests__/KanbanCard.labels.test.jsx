import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DndContext } from '@dnd-kit/core';
import KanbanCard from '../KanbanCard';

// Mock the API
vi.mock('../../utils/api', () => ({
  cardAPI: {
    delete: vi.fn(),
  },
}));

// Wrapper for drag and drop context
const DndWrapper = ({ children }) => {
  return <DndContext>{children}</DndContext>;
};

describe('KanbanCard - Labels and Status', () => {
  describe('Label display', () => {
    it('should display label badges with correct colors', () => {
      const cardWithLabels = {
        _id: 'card1',
        title: 'Test Card',
        labels: [
          { _id: 'label1', name: 'Bug', color: '#FF0000' },
          { _id: 'label2', name: 'Feature', color: '#00FF00' },
        ],
      };

      render(
        <DndWrapper>
          <KanbanCard card={cardWithLabels} />
        </DndWrapper>
      );

      expect(screen.getByText('Bug')).toBeInTheDocument();
      expect(screen.getByText('Feature')).toBeInTheDocument();

      const bugBadge = screen.getByText('Bug');
      const featureBadge = screen.getByText('Feature');

      expect(bugBadge).toHaveStyle({ backgroundColor: '#FF0000' });
      expect(featureBadge).toHaveStyle({ backgroundColor: '#00FF00' });
    });

    it('should display up to 3 labels before showing "+X more"', () => {
      const cardWithManyLabels = {
        _id: 'card1',
        title: 'Test Card',
        labels: [
          { _id: 'label1', name: 'Bug', color: '#FF0000' },
          { _id: 'label2', name: 'Feature', color: '#00FF00' },
          { _id: 'label3', name: 'UI', color: '#0000FF' },
          { _id: 'label4', name: 'Backend', color: '#FFFF00' },
        ],
      };

      render(
        <DndWrapper>
          <KanbanCard card={cardWithManyLabels} />
        </DndWrapper>
      );

      expect(screen.getByText('Bug')).toBeInTheDocument();
      expect(screen.getByText('Feature')).toBeInTheDocument();
      expect(screen.getByText('UI')).toBeInTheDocument();
      expect(screen.getByText('+1')).toBeInTheDocument();
    });

    it('should not display label section when no labels', () => {
      const cardWithoutLabels = {
        _id: 'card1',
        title: 'Test Card',
        labels: [],
      };

      const { container } = render(
        <DndWrapper>
          <KanbanCard card={cardWithoutLabels} />
        </DndWrapper>
      );

      const labelBadges = container.querySelector(
        '[data-testid="card-labels"]'
      );
      expect(labelBadges?.children.length || 0).toBe(0);
    });
  });

  describe('Status display', () => {
    it('should display "To Do" status indicator', () => {
      const cardWithStatus = {
        _id: 'card1',
        title: 'Test Card',
        status: 'todo',
      };

      render(
        <DndWrapper>
          <KanbanCard card={cardWithStatus} />
        </DndWrapper>
      );

      const statusBadge = screen.getByTestId('card-status');
      expect(statusBadge).toHaveTextContent(/to do/i);
    });

    it('should display "In Progress" status indicator', () => {
      const cardWithStatus = {
        _id: 'card1',
        title: 'Test Card',
        status: 'in-progress',
      };

      render(
        <DndWrapper>
          <KanbanCard card={cardWithStatus} />
        </DndWrapper>
      );

      const statusBadge = screen.getByTestId('card-status');
      expect(statusBadge).toHaveTextContent(/in progress/i);
    });

    it('should display "Done" status indicator', () => {
      const cardWithStatus = {
        _id: 'card1',
        title: 'Test Card',
        status: 'done',
      };

      render(
        <DndWrapper>
          <KanbanCard card={cardWithStatus} />
        </DndWrapper>
      );

      const statusBadge = screen.getByTestId('card-status');
      expect(statusBadge).toHaveTextContent(/done/i);
    });

    it('should display "Blocked" status indicator', () => {
      const cardWithStatus = {
        _id: 'card1',
        title: 'Test Card',
        status: 'blocked',
      };

      render(
        <DndWrapper>
          <KanbanCard card={cardWithStatus} />
        </DndWrapper>
      );

      const statusBadge = screen.getByTestId('card-status');
      expect(statusBadge).toHaveTextContent(/blocked/i);
    });

    it('should not display status when status is null', () => {
      const cardWithoutStatus = {
        _id: 'card1',
        title: 'Test Card',
        status: null,
      };

      render(
        <DndWrapper>
          <KanbanCard card={cardWithoutStatus} />
        </DndWrapper>
      );

      const statusBadge = screen.queryByTestId('card-status');
      expect(statusBadge).not.toBeInTheDocument();
    });
  });

  describe('Combined display', () => {
    it('should display both labels and status together', () => {
      const cardWithBoth = {
        _id: 'card1',
        title: 'Test Card',
        labels: [{ _id: 'label1', name: 'Bug', color: '#FF0000' }],
        status: 'in-progress',
      };

      render(
        <DndWrapper>
          <KanbanCard card={cardWithBoth} />
        </DndWrapper>
      );

      expect(screen.getByText('Bug')).toBeInTheDocument();
      expect(screen.getByTestId('card-status')).toHaveTextContent(
        /in progress/i
      );
    });

    it('should display labels, status, and assigned members together', () => {
      const cardWithAll = {
        _id: 'card1',
        title: 'Test Card',
        labels: [{ _id: 'label1', name: 'Bug', color: '#FF0000' }],
        status: 'done',
        assignedTo: [{ _id: 'user1', username: 'john_doe' }],
      };

      render(
        <DndWrapper>
          <KanbanCard card={cardWithAll} />
        </DndWrapper>
      );

      expect(screen.getByText('Bug')).toBeInTheDocument();
      expect(screen.getByTestId('card-status')).toHaveTextContent(/done/i);
      expect(screen.getByTestId('assigned-members')).toBeInTheDocument();
    });
  });
});
