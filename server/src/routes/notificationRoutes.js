import express from 'express';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from '../controllers/notificationController.js';

const notificationRouter = express.Router();

// GET /api/notifications - Get all notifications for the authenticated user
notificationRouter.get('/', getNotifications);

// PATCH /api/notifications/read-all - Mark all notifications as read
notificationRouter.patch('/read-all', markAllAsRead);

// PATCH /api/notifications/:id/read - Mark a notification as read
notificationRouter.patch('/:id/read', markAsRead);

// DELETE /api/notifications/:id - Delete a notification
notificationRouter.delete('/:id', deleteNotification);

export default notificationRouter;
