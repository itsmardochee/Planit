import Activity from '../models/Activity.js';

/**
 * @swagger
 * /api/workspaces/{workspaceId}/activity:
 *   get:
 *     summary: Get activity log for a workspace
 *     tags: [Activities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: workspaceId
 *         required: true
 *         schema:
 *           type: string
 *         description: Workspace ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Maximum number of activities to return
 *       - in: query
 *         name: skip
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of activities to skip (pagination)
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *           enum: [created, updated, moved, deleted, commented, assigned, archived]
 *         description: Filter by action type
 *       - in: query
 *         name: entityType
 *         schema:
 *           type: string
 *           enum: [workspace, board, list, card, comment, member, label]
 *         description: Filter by entity type
 *     responses:
 *       200:
 *         description: Activity log retrieved successfully
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Access denied to this workspace
 *       404:
 *         description: Workspace not found
 */
/**
 * @desc    Get workspace activity log
 * @route   GET /api/workspaces/:workspaceId/activity
 * @access  Private (workspace member)
 */
export const getWorkspaceActivity = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { limit = 50, skip = 0, action, entityType } = req.query;

    // checkWorkspaceAccess middleware already verified access and workspace existence

    // Build query
    const query = { workspaceId };
    if (action) query.action = action;
    if (entityType) query.entityType = entityType;

    // Get activities with pagination
    const activities = await Activity.find(query)
      .sort({ createdAt: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit))
      .populate('userId', 'username email')
      .lean();

    res.status(200).json({
      success: true,
      data: activities,
      count: activities.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @swagger
 * /api/boards/{id}/activity:
 *   get:
 *     summary: Get activity log for a board
 *     tags: [Activities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Board ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Maximum number of activities to return
 *       - in: query
 *         name: skip
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of activities to skip (pagination)
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *           enum: [created, updated, moved, deleted, commented, assigned, archived]
 *         description: Filter by action type
 *       - in: query
 *         name: entityType
 *         schema:
 *           type: string
 *           enum: [board, list, card, comment, label]
 *         description: Filter by entity type
 *     responses:
 *       200:
 *         description: Activity log retrieved successfully
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Access denied to this board
 *       404:
 *         description: Board not found
 */
/**
 * @desc    Get board activity log
 * @route   GET /api/boards/:id/activity
 * @access  Private (workspace member)
 */
export const getBoardActivity = async (req, res) => {
  try {
    const { id: boardId } = req.params;
    const { limit = 50, skip = 0, action, entityType } = req.query;

    // checkWorkspaceAccess middleware already verified access and board existence

    // Build query
    const query = { boardId };
    if (action) query.action = action;
    if (entityType) query.entityType = entityType;

    // Get activities with pagination
    const activities = await Activity.find(query)
      .sort({ createdAt: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit))
      .populate('userId', 'username email')
      .lean();

    res.status(200).json({
      success: true,
      data: activities,
      count: activities.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @swagger
 * /api/cards/{id}/activity:
 *   get:
 *     summary: Get activity log for a card
 *     tags: [Activities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Card ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Maximum number of activities to return
 *       - in: query
 *         name: skip
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of activities to skip (pagination)
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *           enum: [created, updated, moved, deleted, commented, assigned]
 *         description: Filter by action type
 *     responses:
 *       200:
 *         description: Activity log retrieved successfully
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Access denied to this card
 *       404:
 *         description: Card not found
 */
/**
 * @desc    Get card activity log
 * @route   GET /api/cards/:id/activity
 * @access  Private (workspace member)
 */
export const getCardActivity = async (req, res) => {
  try {
    const { id: cardId } = req.params;
    const { limit = 50, skip = 0, action } = req.query;

    // checkWorkspaceAccess middleware already verified access and card existence

    // Build query
    const query = { cardId };
    if (action) query.action = action;

    // Get activities with pagination
    const activities = await Activity.find(query)
      .sort({ createdAt: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit))
      .populate('userId', 'username email')
      .lean();

    res.status(200).json({
      success: true,
      data: activities,
      count: activities.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
