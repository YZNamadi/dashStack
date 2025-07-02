import { Router } from 'express';
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
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// Apply auth middleware to all audit routes
router.use(authMiddleware);

// Get audit events with filtering
router.get('/events', asyncHandler(getAuditEvents));

// Get audit statistics
router.get('/stats', asyncHandler(getAuditStats));

// Export audit events to CSV
router.get('/export', asyncHandler(exportAuditEvents));

// Clean up old audit events
router.post('/cleanup', asyncHandler(cleanupOldEvents));

// Get specific audit event
router.get('/events/:id', asyncHandler(getAuditEvent));

// Get recent audit events for dashboard
router.get('/recent', asyncHandler(getRecentEvents));

// Get audit events by user
router.get('/users/:userId/events', asyncHandler(getUserAuditEvents));

export default router; 