import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { I18nextProvider } from "react-i18next";
import i18n from "../../i18n";
import RoleChangeModal from "../RoleChangeModal";

// Mock usePermissions so ROLE_INFO is available
vi.mock("../../hooks/usePermissions", () => ({
  default: vi.fn(() => ({
    can: vi.fn(() => true),
    role: "owner",
    loading: false,
    error: null,
  })),
  ROLE_INFO: {
    owner: { label: "Owner", description: "Full workspace control" },
    admin: { label: "Admin", description: "Manage workspace and members" },
    member: { label: "Member", description: "Create and edit content" },
    viewer: { label: "Viewer", description: "View only access" },
  },
}));

const mockMember = {
  _id: "member2",
  role: "member",
  userId: { _id: "user2", username: "jane_smith", email: "jane@example.com" },
};

const mockCanModifyUserRole = vi.fn(() => true);
const mockOnClose = vi.fn();
const mockOnSave = vi.fn();

const renderModal = (props = {}) =>
  render(
    <I18nextProvider i18n={i18n}>
      <RoleChangeModal
        open={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        member={mockMember}
        loading={false}
        canModifyUserRole={mockCanModifyUserRole}
        {...props}
      />
    </I18nextProvider>
  );

describe("RoleChangeModal Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCanModifyUserRole.mockReturnValue(true);
  });

  describe("Visibility", () => {
    it("should render nothing when open is false", () => {
      const { container } = renderModal({ open: false });
      expect(container).toBeEmptyDOMElement();
    });

    it("should render the modal when open is true", () => {
      renderModal();
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("should display the member username in the header", () => {
      renderModal();
      expect(screen.getByText(/jane_smith/)).toBeInTheDocument();
    });
  });

  describe("Role Options", () => {
    it("should display Admin, Member and Viewer options (not Owner)", () => {
      renderModal();
      expect(screen.getByTestId("role-option-admin")).toBeInTheDocument();
      expect(screen.getByTestId("role-option-member")).toBeInTheDocument();
      expect(screen.getByTestId("role-option-viewer")).toBeInTheDocument();
      expect(screen.queryByTestId("role-option-owner")).not.toBeInTheDocument();
    });

    it("should pre-select the current member role", () => {
      renderModal();
      // Member option should be aria-pressed=true
      const memberOption = screen.getByTestId("role-option-member");
      expect(memberOption).toHaveAttribute("aria-pressed", "true");
    });

    it("should allow selecting a different role", async () => {
      const user = userEvent.setup();
      renderModal();
      const adminOption = screen.getByTestId("role-option-admin");
      await user.click(adminOption);
      expect(adminOption).toHaveAttribute("aria-pressed", "true");
    });

    it("should disable options when canModifyUserRole returns false", () => {
      mockCanModifyUserRole.mockReturnValue(false);
      renderModal();
      expect(screen.getByTestId("role-option-admin")).toBeDisabled();
      expect(screen.getByTestId("role-option-viewer")).toBeDisabled();
    });
  });

  describe("Save Button", () => {
    it("should disable Save when no role change has been made", () => {
      renderModal();
      const saveBtn = screen.getByRole("button", { name: /save/i });
      expect(saveBtn).toBeDisabled();
    });

    it("should enable Save after selecting a different role", async () => {
      const user = userEvent.setup();
      renderModal();
      await user.click(screen.getByTestId("role-option-admin"));
      const saveBtn = screen.getByRole("button", { name: /save/i });
      expect(saveBtn).not.toBeDisabled();
    });

    it("should call onSave with the selected role when Save is clicked", async () => {
      const user = userEvent.setup();
      renderModal();
      await user.click(screen.getByTestId("role-option-admin"));
      await user.click(screen.getByRole("button", { name: /save/i }));
      expect(mockOnSave).toHaveBeenCalledWith("admin");
    });

    it("should not call onSave when Save is clicked without a change", async () => {
      const user = userEvent.setup();
      renderModal();
      await user.click(screen.getByRole("button", { name: /save/i }));
      expect(mockOnSave).not.toHaveBeenCalled();
    });
  });

  describe("Cancel / Close", () => {
    it("should call onClose when Cancel is clicked", async () => {
      const user = userEvent.setup();
      renderModal();
      await user.click(screen.getByRole("button", { name: /cancel/i }));
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it("should call onClose when the X button is clicked", async () => {
      const user = userEvent.setup();
      renderModal();
      await user.click(screen.getByRole("button", { name: /close/i }));
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it("should call onClose when the backdrop is clicked", async () => {
      const user = userEvent.setup();
      renderModal();
      // Click the backdrop (first div inside the dialog)
      const backdrop = screen.getByRole("dialog").querySelector(".absolute.inset-0");
      if (backdrop) {
        await user.click(backdrop);
        expect(mockOnClose).toHaveBeenCalledTimes(1);
      }
    });
  });

  describe("Loading State", () => {
    it("should show Saving... text when loading", () => {
      renderModal({ loading: true });
      expect(screen.getByRole("button", { name: /saving/i })).toBeInTheDocument();
    });

    it("should disable Save button when loading", () => {
      renderModal({ loading: true });
      const saveBtn = screen.getByText(/saving/i).closest("button");
      expect(saveBtn).toBeDisabled();
    });

    it("should disable Cancel button when loading", () => {
      renderModal({ loading: true });
      expect(screen.getByRole("button", { name: /cancel/i })).toBeDisabled();
    });
  });

  describe("Reset on Reopen", () => {
    it("should reset selected role to member role when reopened", async () => {
      const user = userEvent.setup();
      const { rerender } = renderModal();

      // Select admin
      await user.click(screen.getByTestId("role-option-admin"));
      expect(screen.getByTestId("role-option-admin")).toHaveAttribute("aria-pressed", "true");

      // Close and reopen
      rerender(
        <I18nextProvider i18n={i18n}>
          <RoleChangeModal
            open={false}
            onClose={mockOnClose}
            onSave={mockOnSave}
            member={mockMember}
            loading={false}
            canModifyUserRole={mockCanModifyUserRole}
          />
        </I18nextProvider>
      );
      rerender(
        <I18nextProvider i18n={i18n}>
          <RoleChangeModal
            open={true}
            onClose={mockOnClose}
            onSave={mockOnSave}
            member={mockMember}
            loading={false}
            canModifyUserRole={mockCanModifyUserRole}
          />
        </I18nextProvider>
      );

      // Should be back to member (the member.role)
      expect(screen.getByTestId("role-option-member")).toHaveAttribute("aria-pressed", "true");
      expect(screen.getByTestId("role-option-admin")).toHaveAttribute("aria-pressed", "false");
    });
  });
});
