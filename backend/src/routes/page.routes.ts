import express from 'express';
import asyncHandler from 'express-async-handler';
import {
  createPage,
  getPage,
  updatePage,
  getPageVersions,
  revertPageVersion
} from '../controllers/page.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = express.Router();

/**
 * @openapi
 * /projects/{projectId}/pages:
 *   post:
 *     tags:
 *       - Pages
 *     summary: Create a new page
 *     parameters:
 *       - in: path
 *         name: projectId
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
 *               layout:
 *                 type: object
 *             required:
 *               - name
 *               - layout
 *     responses:
 *       201:
 *         description: Page created
 *       400:
 *         description: Invalid input
 */
router.post('/', authMiddleware, asyncHandler(createPage));

/**
 * @openapi
 * /projects/{projectId}/pages/{pageId}:
 *   get:
 *     tags:
 *       - Pages
 *     summary: Get a page by ID
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: pageId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Page details
 *       404:
 *         description: Page not found
 */
router.get('/:pageId', authMiddleware, asyncHandler(getPage));

/**
 * @openapi
 * /projects/{projectId}/pages/{pageId}:
 *   put:
 *     tags:
 *       - Pages
 *     summary: Update a page
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: pageId
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
 *               layout:
 *                 type: object
 *     responses:
 *       200:
 *         description: Page updated
 *       404:
 *         description: Page not found
 */
router.put('/:pageId', authMiddleware, asyncHandler(updatePage));

/**
 * @openapi
 * /projects/{projectId}/pages/{pageId}/versions:
 *   get:
 *     tags:
 *       - Pages
 *     summary: Get all versions of a page
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: pageId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of page versions
 *       404:
 *         description: Page not found
 */
router.get('/:pageId/versions', authMiddleware, asyncHandler(getPageVersions));

/**
 * @openapi
 * /projects/{projectId}/pages/{pageId}/versions/{versionId}/revert:
 *   post:
 *     tags:
 *       - Pages
 *     summary: Revert a page to a previous version
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: pageId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: versionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Page reverted
 *       404:
 *         description: Page or version not found
 */
router.post('/:pageId/versions/:versionId/revert', authMiddleware, asyncHandler(revertPageVersion));

export default router; 