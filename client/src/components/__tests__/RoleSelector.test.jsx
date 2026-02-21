import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RoleSelector from "../RoleSelector";
import { ROLES } from "../../utils/permissions";

describe("RoleSelector Component", () => {
  const mockOnClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render the current role label", () => {
      render(
        <RoleSelector
          currentRole={ROLES.MEMBER}
          onClick={mockOnClick}
        />
      );
      expect(screen.getByText("Member")).toBeInTheDocument();
    });

    it("should render a button element", () => {
      render(
        <RoleSelector
          currentRole={ROLES.ADMIN}
          onClick={mockOnClick}
        />
      );
      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("should display an accessible aria-label with the current role", () => {
      render(
        <RoleSelector
          currentRole={ROLES.MEMBER}
          onClick={mockOnClick}
        />
      );
      expect(
        screen.getByRole("button", { name: /change role.*member/i })
      ).toBeInTheDocument();
    });

    it("should render Owner label for owner role", () => {
      render(
        <RoleSelector
          currentRole={ROLES.OWNER}
          onClick={mockOnClick}
        />
      );
      expect(screen.getByText("Owner")).toBeInTheDocument();
    });

    it("should render Viewer label for viewer role", () => {
      render(
        <RoleSelector
          currentRole={ROLES.VIEWER}
          onClick={mockOnClick}
        />
      );
      expect(screen.getByText("Viewer")).toBeInTheDocument();
    });

    it("should capitalise unknown role labels", () => {
      render(
        <RoleSelector
          currentRole="superadmin"
          onClick={mockOnClick}
        />
      );
      expect(screen.getByText("Superadmin")).toBeInTheDocument();
    });
  });

  describe("Click Handling", () => {
    it("should call onClick when the button is clicked", async () => {
      const user = userEvent.setup();
      render(
        <RoleSelector
          currentRole={ROLES.MEMBER}
          onClick={mockOnClick}
        />
      );
      await user.click(screen.getByRole("button"));
      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it("should not call onClick when disabled (loading)", async () => {
      const user = userEvent.setup();
      render(
        <RoleSelector
          currentRole={ROLES.MEMBER}
          onClick={mockOnClick}
          loading={true}
        />
      );
      const btn = screen.getByRole("button");
      expect(btn).toBeDisabled();
      await user.click(btn);
      expect(mockOnClick).not.toHaveBeenCalled();
    });
  });

  describe("Loading State", () => {
    it("should disable the button when loading is true", () => {
      render(
        <RoleSelector
          currentRole={ROLES.MEMBER}
          onClick={mockOnClick}
          loading={true}
        />
      );
      expect(screen.getByRole("button")).toBeDisabled();
    });

    it("should still show the role label while loading", () => {
      render(
        <RoleSelector
          currentRole={ROLES.MEMBER}
          onClick={mockOnClick}
          loading={true}
        />
      );
      expect(screen.getByText("Member")).toBeInTheDocument();
    });

    it("should not be disabled when loading is false", () => {
      render(
        <RoleSelector
          currentRole={ROLES.MEMBER}
          onClick={mockOnClick}
          loading={false}
        />
      );
      expect(screen.getByRole("button")).not.toBeDisabled();
    });
  });

  describe("Visual Styling", () => {
    it("should apply different styles for different roles", () => {
      const { rerender } = render(
        <RoleSelector
          currentRole={ROLES.OWNER}
          onClick={mockOnClick}
        />
      );
      expect(screen.getByText("Owner")).toBeInTheDocument();

      rerender(
        <RoleSelector
          currentRole={ROLES.VIEWER}
          onClick={mockOnClick}
        />
      );
      expect(screen.getByText("Viewer")).toBeInTheDocument();
    });
  });
});
