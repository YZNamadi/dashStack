import { Router } from 'express';
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
router.get('/events', getAuditEvents);

// Get audit statistics
router.get('/stats', getAuditStats);

// Export audit events to CSV
router.get('/export', exportAuditEvents);

// Clean up old audit events
router.post('/cleanup', cleanupOldEvents);

// Get specific audit event
router.get('/events/:id', getAuditEvent);

// Get recent audit events for dashboard
router.get('/recent', getRecentEvents);

// Get audit events by user
router.get('/users/:userId/events', getUserAuditEvents);

export default router; 