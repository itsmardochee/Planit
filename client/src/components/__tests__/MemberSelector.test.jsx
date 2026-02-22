import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MemberSelector from '../MemberSelector';

describe('MemberSelector', () => {
  // Mock members structure matches API response from workspace members
  const mockMembers = [
    {
      _id: 'member-1',
      userId: { _id: '1', username: 'john_doe', email: 'john@example.com' },
      role: 'member',
    },
    {
      _id: 'member-2',
      userId: { _id: '2', username: 'jane_smith', email: 'jane@example.com' },
      role: 'member',
    },
    {
      _id: 'member-3',
      userId: { _id: '3', username: 'bob_wilson', email: 'bob@example.com' },
      role: 'member',
    },
  ];

  // Assigned members have direct user structure (from card.assignedTo)
  const mockAssignedMembers = [
    { _id: '1', username: 'john_doe', email: 'john@example.com' },
  ];

  it('renders member selector with label', () => {
    render(
      <MemberSelector
        members={mockMembers}
        assignedMembers={[]}
        onAssign={vi.fn()}
        onUnassign={vi.fn()}
      />
    );

    expect(screen.getByText(/assign members/i)).toBeInTheDocument();
  });

  it('displays all available members in dropdown', () => {
    render(
      <MemberSelector
        members={mockMembers}
        assignedMembers={[]}
        onAssign={vi.fn()}
        onUnassign={vi.fn()}
      />
    );

    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();

    // Check that options include all members
    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(mockMembers.length + 1); // +1 for placeholder
  });

  it('displays assigned members with avatars/initials', () => {
    render(
      <MemberSelector
        members={mockMembers}
        assignedMembers={mockAssignedMembers}
        onAssign={vi.fn()}
        onUnassign={vi.fn()}
      />
    );

    // Should display assigned member's name or initials
    expect(screen.getByText(/john_doe/i)).toBeInTheDocument();
  });

  it('calls onAssign when member is selected', async () => {
    const mockOnAssign = vi.fn();
    render(
      <MemberSelector
        members={mockMembers}
        assignedMembers={[]}
        onAssign={mockOnAssign}
        onUnassign={vi.fn()}
      />
    );

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: '2' } });

    await waitFor(() => {
      expect(mockOnAssign).toHaveBeenCalledWith('2');
    });
  });

  it('calls onUnassign when remove button is clicked', async () => {
    const mockOnUnassign = vi.fn();
    render(
      <MemberSelector
        members={mockMembers}
        assignedMembers={mockAssignedMembers}
        onAssign={vi.fn()}
        onUnassign={mockOnUnassign}
      />
    );

    const removeButton = screen.getByRole('button', { name: /remove/i });
    fireEvent.click(removeButton);

    await waitFor(() => {
      expect(mockOnUnassign).toHaveBeenCalledWith('1');
    });
  });

  it('does not show already assigned members in dropdown', () => {
    render(
      <MemberSelector
        members={mockMembers}
        assignedMembers={mockAssignedMembers}
        onAssign={vi.fn()}
        onUnassign={vi.fn()}
      />
    );

    const options = screen.getAllByRole('option');

    // Should only show unassigned members + placeholder
    expect(options).toHaveLength(3); // 2 unassigned + 1 placeholder
  });

  it('displays member initials correctly', () => {
    const members = [
      {
        _id: 'member-1',
        userId: { _id: '1', username: 'john_doe', email: 'john@example.com' },
        role: 'member',
      },
    ];
    const assignedMembers = [
      { _id: '1', username: 'john_doe', email: 'john@example.com' },
    ];

    render(
      <MemberSelector
        members={members}
        assignedMembers={assignedMembers}
        onAssign={vi.fn()}
        onUnassign={vi.fn()}
      />
    );

    // Should show initials "JD" for john_doe
    expect(screen.getByText('JD')).toBeInTheDocument();
  });

  it('handles empty members list gracefully', () => {
    render(
      <MemberSelector
        members={[]}
        assignedMembers={[]}
        onAssign={vi.fn()}
        onUnassign={vi.fn()}
      />
    );

    const select = screen.getByRole('combobox');
    expect(select).toBeDisabled();
  });

  it('resets select value after assignment', async () => {
    const mockOnAssign = vi.fn();
    render(
      <MemberSelector
        members={mockMembers}
        assignedMembers={[]}
        onAssign={mockOnAssign}
        onUnassign={vi.fn()}
      />
    );

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: '2' } });

    await waitFor(() => {
      expect(select.value).toBe('');
    });
  });

  it('displays multiple assigned members', () => {
    const multipleAssigned = [
      { _id: '1', username: 'john_doe', email: 'john@example.com' },
      { _id: '2', username: 'jane_smith', email: 'jane@example.com' },
    ];

    render(
      <MemberSelector
        members={mockMembers}
        assignedMembers={multipleAssigned}
        onAssign={vi.fn()}
        onUnassign={vi.fn()}
      />
    );

    expect(screen.getByText(/john_doe/i)).toBeInTheDocument();
    expect(screen.getByText(/jane_smith/i)).toBeInTheDocument();
  });

  it('displays correct initials for different username formats', () => {
    const membersWithDifferentFormats = [
      {
        _id: 'member-1',
        userId: { _id: '1', username: 'john', email: 'john@example.com' },
        role: 'member',
      },
      {
        _id: 'member-2',
        userId: { _id: '2', username: 'jane-smith', email: 'jane@example.com' },
        role: 'member',
      },
      {
        _id: 'member-3',
        userId: { _id: '3', username: 'bob.wilson', email: 'bob@example.com' },
        role: 'member',
      },
    ];
    const assignedMembers = [
      { _id: '1', username: 'john', email: 'john@example.com' },
      { _id: '2', username: 'jane-smith', email: 'jane@example.com' },
      { _id: '3', username: 'bob.wilson', email: 'bob@example.com' },
    ];

    render(
      <MemberSelector
        members={membersWithDifferentFormats}
        assignedMembers={assignedMembers}
        onAssign={vi.fn()}
        onUnassign={vi.fn()}
      />
    );

    // Should show appropriate initials
    expect(screen.getByText('J')).toBeInTheDocument(); // john -> J
    expect(screen.getByText('JS')).toBeInTheDocument(); // jane-smith -> JS
    expect(screen.getByText('BW')).toBeInTheDocument(); // bob.wilson -> BW
  });
});
