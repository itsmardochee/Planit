import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LabelPicker from '../LabelPicker';
import { labelAPI } from '../../utils/api';

vi.mock('../../utils/api', () => ({
  labelAPI: {
    getByBoard: vi.fn(),
  },
}));

describe('LabelPicker', () => {
  const mockBoardId = 'board123';
  const mockLabels = [
    { _id: 'label1', name: 'Bug', color: '#FF0000', boardId: mockBoardId },
    { _id: 'label2', name: 'Feature', color: '#00FF00', boardId: mockBoardId },
    {
      _id: 'label3',
      name: 'Documentation',
      color: '#0000FF',
      boardId: mockBoardId,
    },
  ];
  // Bug and Documentation are assigned initially
  const assignedLabels = [mockLabels[0], mockLabels[2]];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Display labels', () => {
    it('should fetch and display all available labels', async () => {
      labelAPI.getByBoard.mockResolvedValue({
        data: { success: true, data: mockLabels },
      });

      render(
        <LabelPicker
          boardId={mockBoardId}
          assignedLabels={assignedLabels}
          onChange={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(labelAPI.getByBoard).toHaveBeenCalledWith(mockBoardId);
      });

      expect(screen.getByText('Bug')).toBeInTheDocument();
      expect(screen.getByText('Feature')).toBeInTheDocument();
      expect(screen.getByText('Documentation')).toBeInTheDocument();
    });

    it('should show a check icon on assigned labels', async () => {
      labelAPI.getByBoard.mockResolvedValue({
        data: { success: true, data: mockLabels },
      });

      render(
        <LabelPicker
          boardId={mockBoardId}
          assignedLabels={assignedLabels}
          onChange={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Bug')).toBeInTheDocument();
      });

      const bugBtn = screen.getByTestId('label-label1');
      const featureBtn = screen.getByTestId('label-label2');

      // Bug is assigned → has check icon
      expect(
        bugBtn.querySelector('[data-testid="check-icon"]')
      ).toBeInTheDocument();
      // Feature is not assigned → no check icon
      expect(
        featureBtn.querySelector('[data-testid="check-icon"]')
      ).not.toBeInTheDocument();
    });
  });

  describe('Toggle label', () => {
    it('should call onChange with label added when clicking an unassigned label', async () => {
      labelAPI.getByBoard.mockResolvedValue({
        data: { success: true, data: mockLabels },
      });

      const onChange = vi.fn();
      const user = userEvent.setup();

      render(
        <LabelPicker
          boardId={mockBoardId}
          assignedLabels={assignedLabels}
          onChange={onChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Feature')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Feature'));

      expect(onChange).toHaveBeenCalledWith([...assignedLabels, mockLabels[1]]);
    });

    it('should call onChange with label removed when clicking an assigned label', async () => {
      labelAPI.getByBoard.mockResolvedValue({
        data: { success: true, data: mockLabels },
      });

      const onChange = vi.fn();
      const user = userEvent.setup();

      render(
        <LabelPicker
          boardId={mockBoardId}
          assignedLabels={assignedLabels}
          onChange={onChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Bug')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Bug'));

      // Bug (label1) should be removed
      expect(onChange).toHaveBeenCalledWith([mockLabels[2]]);
    });

    it('should not call onChange when readOnly', async () => {
      labelAPI.getByBoard.mockResolvedValue({
        data: { success: true, data: mockLabels },
      });

      const onChange = vi.fn();
      const user = userEvent.setup();

      render(
        <LabelPicker
          boardId={mockBoardId}
          assignedLabels={assignedLabels}
          onChange={onChange}
          readOnly
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Feature')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Feature'));

      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe('Empty states', () => {
    it('should show message when no labels exist', async () => {
      labelAPI.getByBoard.mockResolvedValue({
        data: { success: true, data: [] },
      });

      render(
        <LabelPicker
          boardId={mockBoardId}
          assignedLabels={[]}
          onChange={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/no labels available/i)).toBeInTheDocument();
      });
    });
  });

  describe('Loading state', () => {
    it('should show loading indicator while fetching labels', () => {
      labelAPI.getByBoard.mockImplementation(() => new Promise(() => {}));

      render(
        <LabelPicker
          boardId={mockBoardId}
          assignedLabels={[]}
          onChange={vi.fn()}
        />
      );

      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });
});
