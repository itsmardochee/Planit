import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
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

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: key => key,
  }),
}));

// Mock child components
vi.mock('../MemberSelector', () => ({
  default: () => <div data-testid="member-selector">MemberSelector</div>,
}));

vi.mock('../LabelPicker', () => ({
  default: () => <div data-testid="label-picker">LabelPicker</div>,
}));

vi.mock('../StatusSelector', () => ({
  default: () => <div data-testid="status-selector">StatusSelector</div>,
}));

vi.mock('../CommentSection', () => ({
  default: ({ cardId }) => (
    <div data-testid="comment-section">CommentSection for {cardId}</div>
  ),
}));

describe('CardModal - Comment Integration', () => {
  const mockCard = {
    _id: 'card123',
    title: 'Test Card',
    description: 'Test description',
    assignedTo: [],
    createdAt: '2023-01-01T00:00:00.000Z',
    updatedAt: '2023-01-02T00:00:00.000Z',
  };

  const mockOnClose = vi.fn();
  const mockOnCardUpdate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render CommentSection component', async () => {
    render(
      <CardModal
        card={mockCard}
        boardId="board123"
        members={[]}
        onClose={mockOnClose}
        onCardUpdate={mockOnCardUpdate}
      />
    );

    // Click on Comments tab to show CommentSection
    const commentsTab = screen.getByRole('button', { name: /comments/i });
    fireEvent.click(commentsTab);

    await waitFor(() => {
      expect(screen.getByTestId('comment-section')).toBeInTheDocument();
    });
  });

  it('should pass cardId to CommentSection', async () => {
    render(
      <CardModal
        card={mockCard}
        boardId="board123"
        members={[]}
        onClose={mockOnClose}
        onCardUpdate={mockOnCardUpdate}
      />
    );

    // Click on Comments tab
    const commentsTab = screen.getByRole('button', { name: /comments/i });
    fireEvent.click(commentsTab);

    await waitFor(() => {
      const commentSection = screen.getByTestId('comment-section');
      expect(commentSection).toHaveTextContent('CommentSection for card123');
    });
  });

  it('should display CommentSection after card details', async () => {
    render(
      <CardModal
        card={mockCard}
        boardId="board123"
        members={[]}
        onClose={mockOnClose}
        onCardUpdate={mockOnCardUpdate}
      />
    );

    // Click on Comments tab
    const commentsTab = screen.getByRole('button', { name: /comments/i });
    fireEvent.click(commentsTab);

    await waitFor(() => {
      const commentSection = screen.getByTestId('comment-section');
      expect(commentSection).toBeInTheDocument();
    });
  });
});
