import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CardModal from '../CardModal';
import { cardAPI } from '../../utils/api';

// Mock the API
vi.mock('../../utils/api', () => ({
  cardAPI: {
    update: vi.fn(),
    delete: vi.fn(),
    assign: vi.fn(),
    unassign: vi.fn(),
  },
}));

describe('CardModal - Member Assignment', () => {
  const mockCard = {
    _id: 'card123',
    title: 'Test Card',
    description: 'Test description',
    assignedTo: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Mock members structure matches API response from workspace members
  const mockMembers = [
    {
      _id: 'member-1',
      userId: { _id: 'user1', username: 'john_doe', email: 'john@example.com' },
      role: 'member',
    },
    {
      _id: 'member-2',
      userId: {
        _id: 'user2',
        username: 'jane_smith',
        email: 'jane@example.com',
      },
      role: 'member',
    },
  ];

  const mockOnClose = vi.fn();
  const mockOnCardUpdate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders member selector when members are provided', () => {
    render(
      <CardModal
        card={mockCard}
        members={mockMembers}
        onClose={mockOnClose}
        onCardUpdate={mockOnCardUpdate}
      />
    );

    expect(screen.getByText(/assign members/i)).toBeInTheDocument();
  });

  it('does not render member selector when members prop is not provided', () => {
    render(
      <CardModal
        card={mockCard}
        onClose={mockOnClose}
        onCardUpdate={mockOnCardUpdate}
      />
    );

    expect(screen.queryByText(/assign members/i)).not.toBeInTheDocument();
  });

  it('displays assigned members from card data', () => {
    const cardWithAssignees = {
      ...mockCard,
      assignedTo: [
        { _id: 'user1', username: 'john_doe', email: 'john@example.com' },
      ],
    };

    render(
      <CardModal
        card={cardWithAssignees}
        members={mockMembers}
        onClose={mockOnClose}
        onCardUpdate={mockOnCardUpdate}
      />
    );

    expect(screen.getByText(/john_doe/i)).toBeInTheDocument();
  });

  it('adds member to local state when selected (pending save)', async () => {
    render(
      <CardModal
        card={mockCard}
        members={mockMembers}
        onClose={mockOnClose}
        onCardUpdate={mockOnCardUpdate}
      />
    );

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'user1' } });

    // Should show member in UI immediately (local state only)
    await waitFor(() => {
      expect(screen.getByText(/john_doe/i)).toBeInTheDocument();
    });

    // Should NOT call API until Save is clicked
    expect(cardAPI.assign).not.toHaveBeenCalled();
    expect(mockOnCardUpdate).not.toHaveBeenCalled();
  });

  it('removes member from local state when remove button is clicked (pending save)', async () => {
    const cardWithAssignees = {
      ...mockCard,
      assignedTo: [
        { _id: 'user1', username: 'john_doe', email: 'john@example.com' },
      ],
    };

    render(
      <CardModal
        card={cardWithAssignees}
        members={mockMembers}
        onClose={mockOnClose}
        onCardUpdate={mockOnCardUpdate}
      />
    );

    // Verify member badge is initially shown
    expect(screen.getByRole('button', { name: /remove/i })).toBeInTheDocument();

    const removeButton = screen.getByRole('button', { name: /remove/i });
    fireEvent.click(removeButton);

    // Should remove member badge from UI immediately (local state only)
    await waitFor(() => {
      expect(
        screen.queryByRole('button', { name: /remove/i })
      ).not.toBeInTheDocument();
    });

    // Should NOT call API until Save is clicked
    expect(cardAPI.unassign).not.toHaveBeenCalled();
    expect(mockOnCardUpdate).not.toHaveBeenCalled();
  });

  it('handles assignment API errors gracefully on save', async () => {
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    cardAPI.update.mockResolvedValue({ data: { success: true } });
    cardAPI.assign.mockRejectedValue(new Error('API Error'));

    render(
      <CardModal
        card={mockCard}
        members={mockMembers}
        onClose={mockOnClose}
        onCardUpdate={mockOnCardUpdate}
      />
    );

    // Select a member
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'user1' } });

    // Click Save button
    const saveButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    consoleErrorSpy.mockRestore();
  });

  it('saves all member changes when Save button is clicked', async () => {
    cardAPI.update.mockResolvedValue({ data: { success: true } });
    cardAPI.assign.mockResolvedValue({ data: { success: true } });

    render(
      <CardModal
        card={mockCard}
        members={mockMembers}
        onClose={mockOnClose}
        onCardUpdate={mockOnCardUpdate}
      />
    );

    // Select a member
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'user1' } });

    // Click Save button
    const saveButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(cardAPI.update).toHaveBeenCalledWith('card123', {
        title: 'Test Card',
        description: 'Test description',
      });
      expect(cardAPI.assign).toHaveBeenCalledWith('card123', 'user1');
      expect(mockOnCardUpdate).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('saves both additions and removals when Save button is clicked', async () => {
    cardAPI.update.mockResolvedValue({ data: { success: true } });
    cardAPI.assign.mockResolvedValue({ data: { success: true } });
    cardAPI.unassign.mockResolvedValue({ data: { success: true } });

    const cardWithAssignees = {
      ...mockCard,
      assignedTo: [
        { _id: 'user1', username: 'john_doe', email: 'john@example.com' },
      ],
    };

    render(
      <CardModal
        card={cardWithAssignees}
        members={mockMembers}
        onClose={mockOnClose}
        onCardUpdate={mockOnCardUpdate}
      />
    );

    // Remove existing member
    const removeButton = screen.getByRole('button', { name: /remove/i });
    fireEvent.click(removeButton);

    // Add new member
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'user2' } });

    // Click Save button
    const saveButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(cardAPI.update).toHaveBeenCalled();
      expect(cardAPI.unassign).toHaveBeenCalledWith('card123', 'user1');
      expect(cardAPI.assign).toHaveBeenCalledWith('card123', 'user2');
      expect(mockOnCardUpdate).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });
  });
});
