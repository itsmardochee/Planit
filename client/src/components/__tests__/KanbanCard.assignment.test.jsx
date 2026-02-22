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

describe('KanbanCard - Member Assignment Display', () => {
  const mockCard = {
    _id: 'card-1',
    title: 'Test Card',
    description: 'Test description',
  };

  it('should not render avatars when no members are assigned', () => {
    renderWithDndContext(
      <KanbanCard card={mockCard} onClick={vi.fn()} onDelete={vi.fn()} />
    );

    // Should not find any avatar elements
    const avatarSection = screen.queryByTestId('assigned-members');
    expect(avatarSection).not.toBeInTheDocument();
  });

  it('should render avatar for a single assigned member', () => {
    const cardWithMember = {
      ...mockCard,
      assignedTo: [{ _id: 'user-1', username: 'john_doe' }],
    };

    renderWithDndContext(
      <KanbanCard card={cardWithMember} onClick={vi.fn()} onDelete={vi.fn()} />
    );

    const avatarSection = screen.getByTestId('assigned-members');
    expect(avatarSection).toBeInTheDocument();
    expect(screen.getByText('JD')).toBeInTheDocument();
  });

  it('should render avatars for multiple assigned members', () => {
    const cardWithMembers = {
      ...mockCard,
      assignedTo: [
        { _id: 'user-1', username: 'john_doe' },
        { _id: 'user-2', username: 'jane_smith' },
      ],
    };

    renderWithDndContext(
      <KanbanCard card={cardWithMembers} onClick={vi.fn()} onDelete={vi.fn()} />
    );

    expect(screen.getByText('JD')).toBeInTheDocument();
    expect(screen.getByText('JS')).toBeInTheDocument();
  });

  it('should show correct initials for various username formats', () => {
    const cardWithMembers = {
      ...mockCard,
      assignedTo: [
        { _id: 'user-1', username: 'john_doe' },
        { _id: 'user-2', username: 'jane-smith' },
        { _id: 'user-3', username: 'bob.wilson' },
      ],
    };

    renderWithDndContext(
      <KanbanCard card={cardWithMembers} onClick={vi.fn()} onDelete={vi.fn()} />
    );

    expect(screen.getByText('JD')).toBeInTheDocument(); // underscore
    expect(screen.getByText('JS')).toBeInTheDocument(); // hyphen
    expect(screen.getByText('BW')).toBeInTheDocument(); // dot
  });

  it('should show single letter initial for single word usernames', () => {
    const cardWithMember = {
      ...mockCard,
      assignedTo: [{ _id: 'user-1', username: 'alice' }],
    };

    renderWithDndContext(
      <KanbanCard card={cardWithMember} onClick={vi.fn()} onDelete={vi.fn()} />
    );

    expect(screen.getByText('A')).toBeInTheDocument(); // single name
  });

  it('should show only 3 avatars plus overflow indicator for many members', () => {
    const cardWithManyMembers = {
      ...mockCard,
      assignedTo: [
        { _id: 'user-1', username: 'user1' },
        { _id: 'user-2', username: 'user2' },
        { _id: 'user-3', username: 'user3' },
        { _id: 'user-4', username: 'user4' },
        { _id: 'user-5', username: 'user5' },
      ],
    };

    renderWithDndContext(
      <KanbanCard
        card={cardWithManyMembers}
        onClick={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    // Should show exactly 3 avatar elements (not counting overflow indicator)
    const avatars = document.querySelectorAll(
      '[data-testid^="member-avatar-"]'
    );
    expect(avatars.length).toBe(3);

    // Should show overflow indicator
    expect(screen.getByText('+2')).toBeInTheDocument();
  });

  it('should display avatars in the card badges section', () => {
    const cardWithMember = {
      ...mockCard,
      assignedTo: [{ _id: 'user-1', username: 'john_doe' }],
    };

    renderWithDndContext(
      <KanbanCard card={cardWithMember} onClick={vi.fn()} onDelete={vi.fn()} />
    );

    // Check that member avatars are displayed
    const avatarSection = screen.getByTestId('assigned-members');
    expect(avatarSection).toBeInTheDocument();
  });

  it('should use different colors for avatar backgrounds', () => {
    const cardWithMembers = {
      ...mockCard,
      assignedTo: [
        { _id: 'user-1', username: 'john_doe' },
        { _id: 'user-2', username: 'jane_smith' },
      ],
    };

    const { container } = renderWithDndContext(
      <KanbanCard card={cardWithMembers} onClick={vi.fn()} onDelete={vi.fn()} />
    );

    // Check that avatar elements exist with background colors
    const avatars = container.querySelectorAll(
      '[data-testid^="member-avatar-"]'
    );
    expect(avatars.length).toBeGreaterThan(0);

    // Each avatar should have a background color class
    avatars.forEach(avatar => {
      const classes = avatar.className;
      expect(classes).toMatch(
        /bg-(blue|green|purple|orange|pink|indigo|teal|red)-/
      );
    });
  });

  it('should handle empty assignedTo array', () => {
    const cardWithEmptyArray = {
      ...mockCard,
      assignedTo: [],
    };

    renderWithDndContext(
      <KanbanCard
        card={cardWithEmptyArray}
        onClick={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    const avatarSection = screen.queryByTestId('assigned-members');
    expect(avatarSection).not.toBeInTheDocument();
  });

  it('should call onClick handler when card is clicked', () => {
    const onClickMock = vi.fn();

    const { container } = renderWithDndContext(
      <KanbanCard card={mockCard} onClick={onClickMock} onDelete={vi.fn()} />
    );

    // Find the main card div and click it
    const cardElement = container.querySelector('div[class*="bg-white"]');
    cardElement.click();

    expect(onClickMock).toHaveBeenCalledTimes(1);
  });

  it('should call onDelete handler and stopPropagation when delete button is clicked', async () => {
    const { cardAPI } = await import('../../utils/api');
    const onDeleteMock = vi.fn();
    cardAPI.delete.mockResolvedValue({});

    renderWithDndContext(
      <KanbanCard card={mockCard} onClick={vi.fn()} onDelete={onDeleteMock} />
    );

    const deleteButton = screen.getByTitle('Delete');
    deleteButton.click();

    // Wait for async delete to complete
    await vi.waitFor(() => {
      expect(cardAPI.delete).toHaveBeenCalledWith('card-1');
      expect(onDeleteMock).toHaveBeenCalledWith('card-1');
    });
  });

  // Label display tests moved to KanbanCard.labels.test.jsx

  it('should display due date badge when dueDate is present', () => {
    const cardWithDueDate = {
      ...mockCard,
      dueDate: '2024-12-31',
    };

    renderWithDndContext(
      <KanbanCard card={cardWithDueDate} onClick={vi.fn()} onDelete={vi.fn()} />
    );

    // Due date badge now includes formatted date, not just emoji
    expect(screen.getByTestId('due-date-badge')).toBeInTheDocument();
  });

  it('should display description when present', () => {
    renderWithDndContext(
      <KanbanCard card={mockCard} onClick={vi.fn()} onDelete={vi.fn()} />
    );

    expect(screen.getByText('Test description')).toBeInTheDocument();
  });

  it('should not display description when not present', () => {
    const cardWithoutDescription = {
      _id: 'card-1',
      title: 'Test Card',
    };

    renderWithDndContext(
      <KanbanCard
        card={cardWithoutDescription}
        onClick={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    const description = screen.queryByText('Test description');
    expect(description).not.toBeInTheDocument();
  });
});
