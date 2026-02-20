import mongoose from 'mongoose';
import Workspace from '../models/Workspace.js';
import WorkspaceMember from '../models/WorkspaceMember.js';
import User from '../models/User.js';
import { canModifyRole, ROLES } from '../utils/permissions.js';

/**
 * @swagger
 * /api/workspaces/{id}/invite:
 *   post:
 *     summary: Invite a user to workspace
 *     description: Invite a user to join a workspace with a specific role. Only workspace owners can invite members.
 *     tags: [Workspace Members]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Workspace ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email of the user to invite
 *                 example: john@example.com
 *               username:
 *                 type: string
 *                 description: Username of the user to invite (alternative to email)
 *                 example: john_doe
 *               role:
 *                 type: string
 *                 enum: [owner, admin, member, viewer]
 *                 default: member
 *                 description: Role to assign to the invited user
 *                 example: member
 *             oneOf:
 *               - required: [email]
 *               - required: [username]
 *     responses:
 *       201:
 *         description: User invited successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     workspaceId:
 *                       type: string
 *                     userId:
 *                       type: string
 *                     role:
 *                       type: string
 *                     invitedBy:
 *                       type: string
 *                     invitedAt:
 *                       type: string
 *                       format: date-time
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Validation error or user already a member
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Not authorized (not workspace owner)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Workspace or user not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
/**
 * @desc    Invite a user to workspace
 * @route   POST /api/workspaces/:id/invite
 * @access  Private (workspace owner only)
 */
export const inviteMember = async (req, res) => {
  try {
    const { id: workspaceId } = req.params;
    const { email, username, role = 'member' } = req.body;

    // Validate workspaceId
    if (!mongoose.Types.ObjectId.isValid(workspaceId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid workspace ID format',
      });
    }

    // Validate that at least email or username is provided
    if (!email && !username) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email or username',
      });
    }

    // Validate role
    const validRoles = ['owner', 'admin', 'member', 'viewer'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be one of: owner, admin, member, viewer',
      });
    }

    // Check if workspace exists
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: 'Workspace not found',
      });
    }

    // Check permission: only owner/admin can invite
    // First check if user is workspace creator (legacy check for compatibility)
    const isWorkspaceOwner = workspace.userId.toString() === req.user.id;

    // Also check if user has admin or owner role
    const membership = await WorkspaceMember.findOne({
      workspaceId,
      userId: req.user.id,
    });

    const hasInvitePermission =
      isWorkspaceOwner ||
      (membership && ['owner', 'admin'].includes(membership.role));

    if (!hasInvitePermission) {
      return res.status(403).json({
        success: false,
        message:
          'You do not have permission to invite members to this workspace',
      });
    }

    // Find user by email or username
    const query = email ? { email } : { username };
    const invitedUser = await User.findOne(query);

    if (!invitedUser) {
      return res.status(404).json({
        success: false,
        message: `User not found with ${email ? 'email' : 'username'}: ${email || username}`,
      });
    }

    const userId = invitedUser._id;

    // Check if user is already a member
    const existingMember = await WorkspaceMember.findOne({
      workspaceId,
      userId,
    });

    if (existingMember) {
      return res.status(400).json({
        success: false,
        message: 'User is already a member of this workspace',
      });
    }

    // Create the workspace member
    const member = await WorkspaceMember.create({
      workspaceId,
      userId,
      role,
      invitedBy: req.user.id,
    });

    // Return the created member
    res.status(201).json({
      success: true,
      data: {
        _id: member._id,
        workspaceId: member.workspaceId.toString(),
        userId: member.userId.toString(),
        role: member.role,
        invitedBy: member.invitedBy.toString(),
        invitedAt: member.invitedAt,
        createdAt: member.createdAt,
        updatedAt: member.updatedAt,
      },
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
 * /api/workspaces/{id}/members:
 *   get:
 *     summary: Get all members of a workspace
 *     description: Retrieve a list of all members in a workspace with their roles and user information
 *     tags: [Workspace Members]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Workspace ID
 *     responses:
 *       200:
 *         description: List of workspace members
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       workspaceId:
 *                         type: string
 *                       userId:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           username:
 *                             type: string
 *                           email:
 *                             type: string
 *                       role:
 *                         type: string
 *                         enum: [owner, admin, member, viewer]
 *                       invitedBy:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           username:
 *                             type: string
 *                           email:
 *                             type: string
 *                       invitedAt:
 *                         type: string
 *                         format: date-time
 *                       joinedAt:
 *                         type: string
 *                         format: date-time
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *       400:
 *         description: Invalid workspace ID format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Workspace not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
/**
 * @desc    Get all members of a workspace
 * @route   GET /api/workspaces/:id/members
 * @access  Private
 */
export const getWorkspaceMembers = async (req, res) => {
  try {
    const { id: workspaceId } = req.params;

    // Validate workspaceId
    if (!mongoose.Types.ObjectId.isValid(workspaceId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid workspace ID format',
      });
    }

    // Check if workspace exists
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: 'Workspace not found',
      });
    }

    // Get all members and populate user information
    const members = await WorkspaceMember.find({ workspaceId })
      .populate('userId', 'username email')
      .populate('invitedBy', 'username email')
      .sort({ createdAt: -1 });

    // Add the workspace owner to the members list
    const owner = await User.findById(workspace.userId).select(
      'username email'
    );
    const ownerMember = {
      _id: workspace._id, // Use workspace ID as unique identifier
      workspaceId: workspace._id,
      userId: owner,
      role: 'owner',
      invitedBy: null,
      invitedAt: workspace.createdAt,
      createdAt: workspace.createdAt,
      updatedAt: workspace.updatedAt,
    };

    // Prepend owner to the members list
    const allMembers = [ownerMember, ...members];

    res.status(200).json({
      success: true,
      data: allMembers,
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
 * /api/workspaces/{id}/members/{userId}:
 *   delete:
 *     summary: Remove a member from workspace
 *     description: Remove a member from the workspace. Only workspace owners can remove members, or members can remove themselves.
 *     tags: [Workspace Members]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Workspace ID
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID to remove from workspace
 *     responses:
 *       200:
 *         description: Member removed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Member removed successfully
 *       400:
 *         description: Invalid workspace ID or user ID format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Not authorized (not workspace owner or trying to remove another member)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Workspace or member not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
/**
 * @desc    Remove a member from workspace
 * @route   DELETE /api/workspaces/:id/members/:userId
 * @access  Private (workspace owner or the member themselves)
 */
export const removeMember = async (req, res) => {
  try {
    const { id: workspaceId, userId } = req.params;

    // Validate workspaceId
    if (!mongoose.Types.ObjectId.isValid(workspaceId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid workspace ID format',
      });
    }

    // Validate userId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format',
      });
    }

    // Check if workspace exists
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: 'Workspace not found',
      });
    }

    // Check permission: owner/admin can remove anyone, members can remove themselves
    const isRemovingSelf = userId === req.user.id;
    const hasPermission =
      req.userRole &&
      (req.userRole === ROLES.OWNER ||
        req.userRole === ROLES.ADMIN ||
        isRemovingSelf);

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to remove members from this workspace',
      });
    }

    // Find and delete the member
    const member = await WorkspaceMember.findOneAndDelete({
      workspaceId,
      userId,
    });

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found in this workspace',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Member removed successfully',
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
 * /api/workspaces/{id}/members/{userId}/role:
 *   patch:
 *     summary: Update a member's role in workspace
 *     description: Change the role of a workspace member. Only owners can change any role. Admins can only change member/viewer roles.
 *     tags: [Workspace Members]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Workspace ID
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID of the member whose role to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [owner, admin, member, viewer]
 *                 description: New role for the member
 *     responses:
 *       200:
 *         description: Member role updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/WorkspaceMember'
 *       400:
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Workspace or member not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
/**
 * @desc    Update member role in workspace
 * @route   PATCH /api/workspaces/:id/members/:userId/role
 * @access  Private (owner can change any role, admin can change member/viewer)
 */
export const updateMemberRole = async (req, res) => {
  try {
    const { id: workspaceId, userId } = req.params;
    const { role: newRole } = req.body;

    // Validate workspaceId
    if (!mongoose.Types.ObjectId.isValid(workspaceId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid workspace ID format',
      });
    }

    // Validate userId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format',
      });
    }

    // Validate new role
    const validRoles = Object.values(ROLES);
    if (!newRole || !validRoles.includes(newRole)) {
      return res.status(400).json({
        success: false,
        message: `Invalid role. Must be one of: ${validRoles.join(', ')}`,
      });
    }

    // Check if workspace exists
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: 'Workspace not found',
      });
    }

    // Find the target member
    const targetMember = await WorkspaceMember.findOne({
      workspaceId,
      userId,
    });

    if (!targetMember) {
      return res.status(404).json({
        success: false,
        message: 'Member not found in this workspace',
      });
    }

    // Find current user's membership and role
    const currentUserMember = await WorkspaceMember.findOne({
      workspaceId,
      userId: req.user.id,
    });

    if (!currentUserMember) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this workspace',
      });
    }

    // Check if current user has permission to modify this role
    const hasPermission = canModifyRole(
      currentUserMember.role,
      targetMember.role,
      newRole
    );

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: `You do not have permission to change this member's role`,
      });
    }

    // Prevent demoting the last owner
    if (targetMember.role === ROLES.OWNER && newRole !== ROLES.OWNER) {
      const ownerCount = await WorkspaceMember.countDocuments({
        workspaceId,
        role: ROLES.OWNER,
      });

      if (ownerCount === 1) {
        return res.status(400).json({
          success: false,
          message:
            'Cannot demote the last owner. Promote another member to owner first.',
        });
      }
    }

    // Update the role
    targetMember.role = newRole;
    await targetMember.save();

    // Populate user info for response
    await targetMember.populate('userId', 'username email');

    res.status(200).json({
      success: true,
      message: `Member role updated to ${newRole}`,
      data: targetMember,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
