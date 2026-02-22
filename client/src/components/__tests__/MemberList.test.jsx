import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../i18n';
import MemberList from '../MemberList';
import * as apiModule from '../../utils/api';

// Mock usePermissions hook
vi.mock('../../hooks/usePermissions', () => ({
  default: vi.fn(() => ({
    role: 'owner',
    loading: false,
    error: null,
    can: vi.fn(() => true),
    isAtLeast: vi.fn(() => true),
    canModifyUserRole: vi.fn(() => true),
    roleInfo: {
      owner: { label: 'Owner', color: 'purple' },
      admin: { label: 'Admin', color: 'blue' },
      member: { label: 'Member', color: 'green' },
      viewer: { label: 'Viewer', color: 'grey' },
    },
  })),
  ROLE_INFO: {
    owner: { label: 'Owner', color: 'purple' },
    admin: { label: 'Admin', color: 'blue' },
    member: { label: 'Member', color: 'green' },
    viewer: { label: 'Viewer', color: 'grey' },
  },
}));

// TDD Red Phase: Tests for MemberList component

describe('MemberList Component', () => {
  const mockMembers = [
    {
      _id: 'member1',
      userId: {
        _id: 'user1',
        username: 'john_doe',
        email: 'john@example.com',
      },
      role: 'owner',
      joinedAt: '2026-01-01T00:00:00.000Z',
    },
    {
      _id: 'member2',
      userId: {
        _id: 'user2',
        username: 'jane_smith',
        email: 'jane@example.com',
      },
      role: 'member',
      joinedAt: '2026-01-02T00:00:00.000Z',
    },
    {
      _id: 'member3',
      userId: {
        _id: 'user3',
        username: 'bob_wilson',
        email: 'bob@example.com',
      },
      role: 'admin',
      joinedAt: '2026-01-03T00:00:00.000Z',
    },
  ];

  const mockWorkspaceId = '123';
  const mockCurrentUserId = 'user1';
  const mockOnMemberRemoved = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders list of members', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <MemberList
          members={mockMembers}
          workspaceId={mockWorkspaceId}
          currentUserId={mockCurrentUserId}
          onMemberRemoved={mockOnMemberRemoved}
        />
      </I18nextProvider>
    );

    expect(screen.getByText('john_doe')).toBeInTheDocument();
    expect(screen.getByText('jane_smith')).toBeInTheDocument();
    expect(screen.getByText('bob_wilson')).toBeInTheDocument();
  });

  it('displays member roles', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <MemberList
          members={mockMembers}
          workspaceId={mockWorkspaceId}
          currentUserId={mockCurrentUserId}
          onMemberRemoved={mockOnMemberRemoved}
        />
      </I18nextProvider>
    );

    expect(screen.getByText(/owner/i)).toBeInTheDocument();
    expect(screen.getByText(/member/i)).toBeInTheDocument();
    expect(screen.getByText(/admin/i)).toBeInTheDocument();
  });

  it('displays member avatars with initials', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <MemberList
          members={mockMembers}
          workspaceId={mockWorkspaceId}
          currentUserId={mockCurrentUserId}
          onMemberRemoved={mockOnMemberRemoved}
        />
      </I18nextProvider>
    );

    // Avatars should show initials (JD for john_doe)
    expect(screen.getByText('JD')).toBeInTheDocument();
  });

  it('renders empty state when no members', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <MemberList
          members={[]}
          workspaceId={mockWorkspaceId}
          currentUserId={mockCurrentUserId}
          onMemberRemoved={mockOnMemberRemoved}
        />
      </I18nextProvider>
    );

    expect(screen.getByText(/no members|no.*users/i)).toBeInTheDocument();
  });

  it('shows remove button for non-owner members when current user is owner', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <MemberList
          members={mockMembers}
          workspaceId={mockWorkspaceId}
          currentUserId={mockCurrentUserId} // user1 is owner
          onMemberRemoved={mockOnMemberRemoved}
        />
      </I18nextProvider>
    );

    const removeButtons = screen.getAllByRole('button', {
      name: /remove|delete/i,
    });
    // Should have remove buttons for jane_smith and bob_wilson (not for owner himself)
    expect(removeButtons.length).toBeGreaterThan(0);
  });

  it('hides remove button for current user', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <MemberList
          members={mockMembers}
          workspaceId={mockWorkspaceId}
          currentUserId={mockCurrentUserId} // user1
          onMemberRemoved={mockOnMemberRemoved}
        />
      </I18nextProvider>
    );

    // Find john_doe's row (current user)
    const johnRow = screen.getByText('john_doe').closest('div');
    // Should not have remove button for current user
    expect(johnRow?.querySelector('[aria-label*="remove"]')).toBeNull();
  });

  it('calls remove API when remove button is clicked', async () => {
    const mockRemove = vi
      .spyOn(apiModule.memberAPI, 'remove')
      .mockResolvedValueOnce({
        data: { success: true },
      });

    render(
      <I18nextProvider i18n={i18n}>
        <MemberList
          members={mockMembers}
          workspaceId={mockWorkspaceId}
          currentUserId={mockCurrentUserId}
          onMemberRemoved={mockOnMemberRemoved}
        />
      </I18nextProvider>
    );

    const removeButtons = screen.getAllByRole('button', {
      name: /remove|delete/i,
    });
    fireEvent.click(removeButtons[0]);

    // Wait for confirmation dialog and click confirm
    await waitFor(() => {
      expect(
        screen.getByText(/are you sure you want to remove/i)
      ).toBeInTheDocument();
    });

    const confirmButton = screen.getByRole('button', { name: /remove/i });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockRemove).toHaveBeenCalled();
      expect(mockOnMemberRemoved).toHaveBeenCalled();
    });
  });

  it('shows confirmation dialog before removing member', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <MemberList
          members={mockMembers}
          workspaceId={mockWorkspaceId}
          currentUserId={mockCurrentUserId}
          onMemberRemoved={mockOnMemberRemoved}
        />
      </I18nextProvider>
    );

    const removeButtons = screen.getAllByRole('button', {
      name: /remove|delete/i,
    });
    fireEvent.click(removeButtons[0]);

    expect(screen.getByText(/are you sure|confirm/i)).toBeInTheDocument();
  });

  it('displays member email addresses', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <MemberList
          members={mockMembers}
          workspaceId={mockWorkspaceId}
          currentUserId={mockCurrentUserId}
          onMemberRemoved={mockOnMemberRemoved}
        />
      </I18nextProvider>
    );

    expect(screen.getByText('john@example.com')).toBeInTheDocument();
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
  });

  it('displays joined date for members', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <MemberList
          members={mockMembers}
          workspaceId={mockWorkspaceId}
          currentUserId={mockCurrentUserId}
          onMemberRemoved={mockOnMemberRemoved}
        />
      </I18nextProvider>
    );

    // Should show relative dates like "Joined 2 months ago" or formatted dates
    expect(screen.getAllByText(/joined/i).length).toBeGreaterThan(0);
  });

  it('shows error message when remove fails', async () => {
    vi.spyOn(apiModule.memberAPI, 'remove').mockRejectedValueOnce({
      response: { data: { message: 'Cannot remove member' } },
    });

    render(
      <I18nextProvider i18n={i18n}>
        <MemberList
          members={mockMembers}
          workspaceId={mockWorkspaceId}
          currentUserId={mockCurrentUserId}
          onMemberRemoved={mockOnMemberRemoved}
        />
      </I18nextProvider>
    );

    const removeButtons = screen.getAllByRole('button', {
      name: /remove|delete/i,
    });
    fireEvent.click(removeButtons[0]);

    // Wait for confirmation dialog and click confirm
    await waitFor(() => {
      expect(
        screen.getByText(/are you sure you want to remove/i)
      ).toBeInTheDocument();
    });

    const confirmButton = screen.getByRole('button', { name: /remove/i });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(screen.getByText(/cannot remove|error/i)).toBeInTheDocument();
    });
  });

  it('cancels removal when cancel button is clicked', async () => {
    const mockRemove = vi.spyOn(apiModule.memberAPI, 'remove');

    render(
      <I18nextProvider i18n={i18n}>
        <MemberList
          members={mockMembers}
          workspaceId={mockWorkspaceId}
          currentUserId={mockCurrentUserId}
          onMemberRemoved={mockOnMemberRemoved}
        />
      </I18nextProvider>
    );

    const removeButtons = screen.getAllByRole('button', {
      name: /remove|delete/i,
    });
    fireEvent.click(removeButtons[0]);

    await waitFor(() => {
      expect(
        screen.getByText(/are you sure you want to remove/i)
      ).toBeInTheDocument();
    });

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(
        screen.queryByText(/are you sure you want to remove/i)
      ).not.toBeInTheDocument();
    });

    expect(mockRemove).not.toHaveBeenCalled();
  });

  it('handles member with single word username initials', () => {
    const singleNameMember = [
      {
        _id: 'member4',
        userId: {
          _id: 'user4',
          username: 'Alice',
          email: 'alice@example.com',
        },
        role: 'member',
        joinedAt: '2026-01-04T00:00:00.000Z',
      },
    ];

    render(
      <I18nextProvider i18n={i18n}>
        <MemberList
          members={singleNameMember}
          workspaceId={mockWorkspaceId}
          currentUserId={mockCurrentUserId}
          onMemberRemoved={mockOnMemberRemoved}
        />
      </I18nextProvider>
    );

    expect(screen.getByText('A')).toBeInTheDocument();
  });

  it('handles member with no username', () => {
    const noUsernameMember = [
      {
        _id: 'member5',
        userId: {
          _id: 'user5',
          username: null,
          email: 'noname@example.com',
        },
        role: 'member',
        joinedAt: '2026-01-05T00:00:00.000Z',
      },
    ];

    render(
      <I18nextProvider i18n={i18n}>
        <MemberList
          members={noUsernameMember}
          workspaceId={mockWorkspaceId}
          currentUserId={mockCurrentUserId}
          onMemberRemoved={mockOnMemberRemoved}
        />
      </I18nextProvider>
    );

    expect(screen.getByText('?')).toBeInTheDocument();
    expect(screen.getByText(/unknown user/i)).toBeInTheDocument();
  });

  it('formats joined date for members joined more than 30 days ago', () => {
    const oldMember = [
      {
        _id: 'member6',
        userId: {
          _id: 'user6',
          username: 'old_user',
          email: 'old@example.com',
        },
        role: 'member',
        joinedAt: '2025-01-01T00:00:00.000Z', // More than 30 days ago
      },
    ];

    render(
      <I18nextProvider i18n={i18n}>
        <MemberList
          members={oldMember}
          workspaceId={mockWorkspaceId}
          currentUserId={mockCurrentUserId}
          onMemberRemoved={mockOnMemberRemoved}
        />
      </I18nextProvider>
    );

    // Should show formatted date like "Joined 1/1/2025"
    expect(screen.getByText(/joined.*2025/i)).toBeInTheDocument();
  });

  it('handles role colors correctly for owner', () => {
    const ownerMember = mockMembers.filter(m => m.role === 'owner');

    render(
      <I18nextProvider i18n={i18n}>
        <MemberList
          members={ownerMember}
          workspaceId={mockWorkspaceId}
          currentUserId={mockCurrentUserId}
          onMemberRemoved={mockOnMemberRemoved}
        />
      </I18nextProvider>
    );

    // Owner role badge should be rendered
    expect(screen.getByText('Owner')).toBeInTheDocument();
  });

  it('handles role colors correctly for admin', () => {
    const adminMember = mockMembers.filter(m => m.role === 'admin');

    render(
      <I18nextProvider i18n={i18n}>
        <MemberList
          members={adminMember}
          workspaceId={mockWorkspaceId}
          currentUserId={mockCurrentUserId}
          onMemberRemoved={mockOnMemberRemoved}
        />
      </I18nextProvider>
    );

    // Admin role badge should be rendered
    expect(screen.getByText('Admin')).toBeInTheDocument();
  });

  it('handles unknown role color default', () => {
    const unknownRoleMember = [
      {
        _id: 'member7',
        userId: {
          _id: 'user7',
          username: 'unknown_role',
          email: 'unknown@example.com',
        },
        role: 'unknown',
        joinedAt: '2026-01-01T00:00:00.000Z',
      },
    ];

    render(
      <I18nextProvider i18n={i18n}>
        <MemberList
          members={unknownRoleMember}
          workspaceId={mockWorkspaceId}
          currentUserId={mockCurrentUserId}
          onMemberRemoved={mockOnMemberRemoved}
        />
      </I18nextProvider>
    );

    // Should display the username
    expect(screen.getByText('unknown_role')).toBeInTheDocument();
    // Should display the unknown role chip
    expect(screen.getByText('Unknown')).toBeInTheDocument();
  });

  it('does not call onMemberRemoved when callback is not provided', async () => {
    vi.spyOn(apiModule.memberAPI, 'remove').mockResolvedValueOnce({
      data: { success: true },
    });

    render(
      <I18nextProvider i18n={i18n}>
        <MemberList
          members={mockMembers}
          workspaceId={mockWorkspaceId}
          currentUserId={mockCurrentUserId}
          onMemberRemoved={undefined}
        />
      </I18nextProvider>
    );

    const removeButtons = screen.getAllByRole('button', {
      name: /remove|delete/i,
    });
    fireEvent.click(removeButtons[0]);

    await waitFor(() => {
      expect(
        screen.getByText(/are you sure you want to remove/i)
      ).toBeInTheDocument();
    });

    const confirmButton = screen.getByRole('button', { name: /remove/i });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(
        screen.queryByText(/are you sure you want to remove/i)
      ).not.toBeInTheDocument();
    });
  });

  it('handles members with invitedAt instead of joinedAt', () => {
    const invitedMember = [
      {
        _id: 'member8',
        userId: {
          _id: 'user8',
          username: 'invited_user',
          email: 'invited@example.com',
        },
        role: 'member',
        invitedAt: '2026-02-15T00:00:00.000Z', // Yesterday
      },
    ];

    render(
      <I18nextProvider i18n={i18n}>
        <MemberList
          members={invitedMember}
          workspaceId={mockWorkspaceId}
          currentUserId={mockCurrentUserId}
          onMemberRemoved={mockOnMemberRemoved}
        />
      </I18nextProvider>
    );

    expect(screen.getByText(/joined/i)).toBeInTheDocument();
  });
});
