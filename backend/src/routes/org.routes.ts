import express from 'express';
import asyncHandler from 'express-async-handler';
import {
  createOrganization,
  getOrganizations,
  getOrganization,
  updateOrganization,
  deleteOrganization,
  addOrgMember,
  removeOrgMember,
  listOrgMembers,
  exportCompliancePackage
} from '../controllers/org.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import path from 'path';

const router = express.Router();

router.use(authMiddleware);

/**
 * @openapi
 * /orgs:
 *   post:
 *     tags:
 *       - Organizations
 *     summary: Create a new organization
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *             required:
 *               - name
 *     responses:
 *       201:
 *         description: Organization created
 */
router.post('/', asyncHandler(createOrganization));

/**
 * @openapi
 * /orgs:
 *   get:
 *     tags:
 *       - Organizations
 *     summary: Get all organizations for the authenticated user
 *     responses:
 *       200:
 *         description: List of organizations
 */
router.get('/', asyncHandler(getOrganizations));

/**
 * @openapi
 * /orgs/{orgId}:
 *   get:
 *     tags:
 *       - Organizations
 *     summary: Get an organization by ID
 *     parameters:
 *       - in: path
 *         name: orgId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Organization details
 *       404:
 *         description: Organization not found
 */
router.get('/:orgId', asyncHandler(getOrganization));

/**
 * @openapi
 * /orgs/{orgId}:
 *   put:
 *     tags:
 *       - Organizations
 *     summary: Update an organization
 *     parameters:
 *       - in: path
 *         name: orgId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Organization updated
 *       404:
 *         description: Organization not found
 */
router.put('/:orgId', asyncHandler(updateOrganization));

/**
 * @openapi
 * /orgs/{orgId}:
 *   delete:
 *     tags:
 *       - Organizations
 *     summary: Delete an organization
 *     parameters:
 *       - in: path
 *         name: orgId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Organization deleted
 *       404:
 *         description: Organization not found
 */
router.delete('/:orgId', asyncHandler(deleteOrganization));

/**
 * @openapi
 * /orgs/{orgId}/members:
 *   post:
 *     tags:
 *       - Organizations
 *     summary: Add a member to an organization
 *     parameters:
 *       - in: path
 *         name: orgId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *               role:
 *                 type: string
 *             required:
 *               - userId
 *               - role
 *     responses:
 *       201:
 *         description: Member added
 *       404:
 *         description: Organization or user not found
 */
router.post('/:orgId/members', asyncHandler(addOrgMember));

/**
 * @openapi
 * /orgs/{orgId}/members/{userId}:
 *   delete:
 *     tags:
 *       - Organizations
 *     summary: Remove a member from an organization
 *     parameters:
 *       - in: path
 *         name: orgId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Member removed
 *       404:
 *         description: Organization or user not found
 */
router.delete('/:orgId/members/:userId', asyncHandler(removeOrgMember));

/**
 * @openapi
 * /orgs/{orgId}/members:
 *   get:
 *     tags:
 *       - Organizations
 *     summary: List members of an organization
 *     parameters:
 *       - in: path
 *         name: orgId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of organization members
 *       404:
 *         description: Organization not found
 */
router.get('/:orgId/members', asyncHandler(listOrgMembers));

/**
 * @openapi
 * /orgs/compliance/export:
 *   get:
 *     tags:
 *       - Compliance
 *     summary: Export full compliance package (audit logs, org info, users, groups, integrations, workflows, etc.)
 *     parameters:
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [zip]
 *           default: zip
 *     responses:
 *       200:
 *         description: Compliance package ZIP file
 *         content:
 *           application/zip:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get('/compliance/export', asyncHandler(exportCompliancePackage));

// Serve SOC2 documentation
router.get('/compliance/soc2', (req, res) => {
  res.sendFile(path.resolve(__dirname, '../../compliance/soc2.pdf'));
});

// Serve HIPAA documentation
router.get('/compliance/hipaa', (req, res) => {
  res.sendFile(path.resolve(__dirname, '../../compliance/hipaa.pdf'));
});

// Serve Getting Started onboarding guide
router.get('/onboarding/getting-started', (req, res) => {
  res.sendFile(path.resolve(__dirname, '../../onboarding/getting-started.pdf'));
});

// Serve API Usage onboarding guide
router.get('/onboarding/api-usage', (req, res) => {
  res.sendFile(path.resolve(__dirname, '../../onboarding/api-usage.pdf'));
});

export default router; 