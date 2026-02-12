import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../i18n';
import InviteMembers from '../InviteMembers';
import * as apiModule from '../../utils/api';

// TDD Red Phase: Tests for InviteMembers modal

describe('InviteMembers Modal', () => {
  const mockWorkspaceId = '123';
  const mockOnClose = vi.fn();
  const mockOnMemberInvited = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders modal header', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <InviteMembers
          open={true}
          workspaceId={mockWorkspaceId}
          onClose={mockOnClose}
          onMemberInvited={mockOnMemberInvited}
        />
      </I18nextProvider>
    );

    expect(screen.getAllByText(/invite members/i)[0]).toBeInTheDocument();
  });

  it('does not render when open is false', () => {
    const { container } = render(
      <I18nextProvider i18n={i18n}>
        <InviteMembers
          open={false}
          workspaceId={mockWorkspaceId}
          onClose={mockOnClose}
          onMemberInvited={mockOnMemberInvited}
        />
      </I18nextProvider>
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders email input field', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <InviteMembers
          open={true}
          workspaceId={mockWorkspaceId}
          onClose={mockOnClose}
          onMemberInvited={mockOnMemberInvited}
        />
      </I18nextProvider>
    );

    const emailInput = screen.getByRole('textbox'); // screen.getByRole('textbox');
    expect(emailInput).toBeInTheDocument();
  });

  it('renders invite button', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <InviteMembers
          open={true}
          workspaceId={mockWorkspaceId}
          onClose={mockOnClose}
          onMemberInvited={mockOnMemberInvited}
        />
      </I18nextProvider>
    );

    expect(
      screen.getByRole('button', { name: /invite|send/i })
    ).toBeInTheDocument();
  });

  it('updates email input value', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <InviteMembers
          open={true}
          workspaceId={mockWorkspaceId}
          onClose={mockOnClose}
          onMemberInvited={mockOnMemberInvited}
        />
      </I18nextProvider>
    );

    const emailInput = screen.getByRole('textbox'); // screen.getByRole('textbox');
    fireEvent.change(emailInput, {
      target: { value: 'newmember@example.com' },
    });

    expect(emailInput.value).toBe('newmember@example.com');
  });

  it('calls invite API on form submit with valid email', async () => {
    const mockInvite = vi
      .spyOn(apiModule.memberAPI, 'invite')
      .mockResolvedValueOnce({
        data: { success: true, data: { email: 'newmember@example.com' } },
      });

    render(
      <I18nextProvider i18n={i18n}>
        <InviteMembers
          open={true}
          workspaceId={mockWorkspaceId}
          onClose={mockOnClose}
          onMemberInvited={mockOnMemberInvited}
        />
      </I18nextProvider>
    );

    const emailInput = screen.getByRole('textbox'); // screen.getByRole('textbox');
    const inviteButton = screen.getByRole('button', { name: /invite|send/i });

    fireEvent.change(emailInput, {
      target: { value: 'newmember@example.com' },
    });
    fireEvent.click(inviteButton);

    await waitFor(() => {
      expect(mockInvite).toHaveBeenCalledWith('123', {
        email: 'newmember@example.com',
      });
      expect(mockOnMemberInvited).toHaveBeenCalled();
    });
  });

  it('shows error message when email is invalid', async () => {
    render(
      <I18nextProvider i18n={i18n}>
        <InviteMembers
          open={true}
          workspaceId={mockWorkspaceId}
          onClose={mockOnClose}
          onMemberInvited={mockOnMemberInvited}
        />
      </I18nextProvider>
    );

    const emailInput = screen.getByRole('textbox'); // screen.getByRole('textbox');
    const inviteButton = screen.getByRole('button', { name: /invite|send/i });

    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.click(inviteButton);

    await waitFor(() => {
      expect(
        screen.getByText(/invalid.*email|email.*invalid/i)
      ).toBeInTheDocument();
    });
  });

  it('shows error message when invitation fails', async () => {
    vi.spyOn(apiModule.memberAPI, 'invite').mockRejectedValueOnce({
      response: { data: { message: 'User already invited' } },
    });

    render(
      <I18nextProvider i18n={i18n}>
        <InviteMembers
          open={true}
          workspaceId={mockWorkspaceId}
          onClose={mockOnClose}
          onMemberInvited={mockOnMemberInvited}
        />
      </I18nextProvider>
    );

    const emailInput = screen.getByRole('textbox'); // screen.getByRole('textbox');
    const inviteButton = screen.getByRole('button', { name: /invite|send/i });

    fireEvent.change(emailInput, {
      target: { value: 'existing@example.com' },
    });
    fireEvent.click(inviteButton);

    await waitFor(() => {
      expect(
        screen.getByText(/user already invited|already.*member/i)
      ).toBeInTheDocument();
    });
  });

  it('disables invite button when email is empty', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <InviteMembers
          open={true}
          workspaceId={mockWorkspaceId}
          onClose={mockOnClose}
          onMemberInvited={mockOnMemberInvited}
        />
      </I18nextProvider>
    );

    const inviteButton = screen.getByRole('button', { name: /invite|send/i });
    expect(inviteButton).toBeDisabled();
  });

  it('calls onClose when cancel button is clicked', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <InviteMembers
          open={true}
          workspaceId={mockWorkspaceId}
          onClose={mockOnClose}
          onMemberInvited={mockOnMemberInvited}
        />
      </I18nextProvider>
    );

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('clears email input after successful invitation', async () => {
    vi.spyOn(apiModule.memberAPI, 'invite').mockResolvedValueOnce({
      data: { success: true, data: { email: 'newmember@example.com' } },
    });

    render(
      <I18nextProvider i18n={i18n}>
        <InviteMembers
          open={true}
          workspaceId={mockWorkspaceId}
          onClose={mockOnClose}
          onMemberInvited={mockOnMemberInvited}
        />
      </I18nextProvider>
    );

    const emailInput = screen.getByRole('textbox'); // screen.getByRole('textbox');
    const inviteButton = screen.getByRole('button', { name: /invite|send/i });

    fireEvent.change(emailInput, {
      target: { value: 'newmember@example.com' },
    });
    fireEvent.click(inviteButton);

    await waitFor(() => {
      expect(emailInput.value).toBe('');
    });
  });
});
