import express from 'express';
import asyncHandler from 'express-async-handler';
import {
  createDatasource,
  getDatasources,
  updateDatasource,
  runDatasourceQuery,
  deleteDatasource,
  testDatasourceConnection,
  getDatasourceSchema
} from '../controllers/datasource.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = express.Router();

/**
 * @openapi
 * /projects/{projectId}/datasources:
 *   post:
 *     tags:
 *       - Datasources
 *     summary: Create a new datasource
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
 *               type:
 *                 type: string
 *               config:
 *                 type: object
 *             required:
 *               - name
 *               - type
 *               - config
 *     responses:
 *       201:
 *         description: Datasource created
 *       400:
 *         description: Invalid input
 */
router.post('/', authMiddleware, asyncHandler(createDatasource));

/**
 * @openapi
 * /projects/{projectId}/datasources:
 *   get:
 *     tags:
 *       - Datasources
 *     summary: Get all datasources for a project
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of datasources
 */
router.get('/', authMiddleware, asyncHandler(getDatasources));

/**
 * @openapi
 * /projects/{projectId}/datasources/{datasourceId}:
 *   put:
 *     tags:
 *       - Datasources
 *     summary: Update a datasource
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: datasourceId
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
 *               type:
 *                 type: string
 *               config:
 *                 type: object
 *     responses:
 *       200:
 *         description: Datasource updated
 *       404:
 *         description: Datasource not found
 */
router.put('/:datasourceId', authMiddleware, asyncHandler(updateDatasource));

/**
 * @openapi
 * /projects/{projectId}/datasources/{datasourceId}/run:
 *   post:
 *     tags:
 *       - Datasources
 *     summary: Run a query on a datasource
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: datasourceId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Query result
 *       404:
 *         description: Datasource not found
 */
router.post('/:datasourceId/run', authMiddleware, asyncHandler(runDatasourceQuery));

/**
 * @openapi
 * /projects/{projectId}/datasources/{datasourceId}:
 *   delete:
 *     tags:
 *       - Datasources
 *     summary: Delete a datasource
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: datasourceId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Datasource deleted
 *       404:
 *         description: Datasource not found
 */
router.delete('/:datasourceId', authMiddleware, asyncHandler(deleteDatasource));

/**
 * @openapi
 * /projects/{projectId}/datasources/test-connection:
 *   post:
 *     tags:
 *       - Datasources
 *     summary: Test datasource connection
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
 *     responses:
 *       200:
 *         description: Connection test result
 *       400:
 *         description: Invalid input
 */
router.post('/test-connection', authMiddleware, asyncHandler(testDatasourceConnection));

/**
 * @openapi
 * /projects/{projectId}/datasources/{datasourceId}/schema:
 *   get:
 *     tags:
 *       - Datasources
 *     summary: Get datasource schema
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: datasourceId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Datasource schema
 *       404:
 *         description: Datasource not found
 */
router.get('/:datasourceId/schema', authMiddleware, asyncHandler(getDatasourceSchema));

export default router; 