import express from 'express';
import asyncHandler from 'express-async-handler';
import { 
  getAuditEvents,
  getAuditStats,
  exportAuditEvents,
  cleanupOldEvents,
  getAuditEvent,
  getRecentEvents,
  getUserAuditEvents
} from '../controllers/audit.controller';
import { authMiddleware, rbacMiddleware } from '../middlewares/auth.middleware';

const router = express.Router();

// Apply auth middleware to all audit routes
router.use(authMiddleware);

/**
 * @openapi
 * /audit/events:
 *   get:
 *     tags:
 *       - Audit
 *     summary: Get audit events with filtering
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *       - in: query
 *         name: resource
 *         schema:
 *           type: string
 *       - in: query
 *         name: severity
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of audit events
 */
router.get('/events', asyncHandler(getAuditEvents));

/**
 * @openapi
 * /audit/stats:
 *   get:
 *     tags:
 *       - Audit
 *     summary: Get audit statistics
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *     responses:
 *       200:
 *         description: Audit statistics
 */
router.get('/stats', asyncHandler(getAuditStats));

/**
 * @openapi
 * /audit/export:
 *   get:
 *     tags:
 *       - Audit
 *     summary: Export audit events to CSV or JSON
 *     parameters:
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [csv, json]
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *       - in: query
 *         name: resource
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *     responses:
 *       200:
 *         description: Exported audit events
 */
router.get('/export', asyncHandler(exportAuditEvents));

/**
 * @openapi
 * /audit/cleanup:
 *   post:
 *     tags:
 *       - Audit
 *     summary: Clean up old audit events
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               retentionDays:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Cleanup result
 */
router.post('/cleanup', rbacMiddleware(['system:admin']), asyncHandler(cleanupOldEvents));

/**
 * @openapi
 * /audit/events/{id}:
 *   get:
 *     tags:
 *       - Audit
 *     summary: Get audit event by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Audit event details
 *       404:
 *         description: Audit event not found
 */
router.get('/events/:id', asyncHandler(getAuditEvent));

/**
 * @openapi
 * /audit/recent:
 *   get:
 *     tags:
 *       - Audit
 *     summary: Get recent audit events for dashboard
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of recent audit events
 */
router.get('/recent', asyncHandler(getRecentEvents));

/**
 * @openapi
 * /audit/users/{userId}/events:
 *   get:
 *     tags:
 *       - Audit
 *     summary: Get audit events for a user
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of audit events for user
 */
router.get('/users/:userId/events', asyncHandler(getUserAuditEvents));

export default router; 