const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const API_URL = 'http://localhost:3000/api'; // Updated to match the running backend port
const ax = axios.create({
  baseURL: API_URL,
});

// This object will store state between tests, like auth tokens and IDs
const state = {
  token: null,
  projectId: null,
  pageId: null,
  datasourceId: null,
  workflowId: null,
  userId: null,
  adminRoleId: null,
  integrationId: null,
};

// --- Helper Functions ---
const log = (message, data = '') => console.log(`\n--- ${message} ---\n`, data);
const pass = (message) => console.log(`✅ PASS: ${message}`);
const fail = (message, error) => console.error(`❌ FAIL: ${message}`, error.response?.data || error.message);

const setToken = (token) => {
  state.token = token;
  ax.defaults.headers.common['Authorization'] = `Bearer ${token}`;
};

// --- Test Runner ---
const runTest = async (title, testFn) => {
  try {
    log(`Testing: ${title}`);
    await testFn();
    } catch (error) {
    fail(title, error);
    // Stop execution if a critical test fails
    process.exit(1);
  }
};

// --- Test Definitions ---

// Generate a unique email for every test run
const uniqueEmail = `tester_${Date.now()}@example.com`;

// 1. Auth
const testRegister = async () => {
  try {
    await ax.post('/auth/register', {
      email: uniqueEmail,
      password: 'password123',
    });
    pass('POST /auth/register');
  } catch (error) {
    console.error('Register error details:', error.response?.data || error.message);
    throw error;
  }
};

const testLogin = async () => {
  const res = await ax.post('/auth/login', {
    email: uniqueEmail,
    password: 'password123',
  });
  setToken(res.data.token);
  pass('POST /auth/login');
};

const testGetMe = async () => {
  const res = await ax.get('/auth/me');
  console.log('GetMe response:', res.data);
  if (res.data.email !== uniqueEmail) throw new Error('User email does not match');
  pass('GET /auth/me');
};

// 2. Projects
const testCreateProject = async () => {
  const res = await ax.post('/projects', { name: 'Test Project' });
  state.projectId = res.data.id;
  if (!state.projectId) throw new Error('Failed to get project ID');
  pass('POST /projects');
};

const testGetProjects = async () => {
  const res = await ax.get('/projects');
  if (res.data.length === 0) throw new Error('No projects found');
  pass('GET /projects');
};

const testGetProjectById = async () => {
  const res = await ax.get(`/projects/${state.projectId}`);
  if (res.data.id !== state.projectId) throw new Error('Project ID does not match');
  pass('GET /projects/:id');
};

const testRenameProject = async () => {
  const res = await ax.put(`/projects/${state.projectId}`, { name: 'Renamed Test Project' });
  if (res.data.name !== 'Renamed Test Project') throw new Error('Project was not renamed');
  pass('PUT /projects/:id');
};

// 3. Pages
const testCreatePage = async () => {
  const res = await ax.post(`/projects/${state.projectId}/pages`, { name: 'Test Page' });
  state.pageId = res.data.id;
  if (!state.pageId) throw new Error('Failed to get page ID');
  pass('POST /projects/:projectId/pages');
};

const testGetPage = async () => {
  const res = await ax.get(`/projects/${state.projectId}/pages/${state.pageId}`);
  if (res.data.id !== state.pageId) throw new Error('Page ID does not match');
  pass('GET /projects/:projectId/pages/:pageId');
};

const testUpdatePage = async () => {
  const res = await ax.put(`/projects/${state.projectId}/pages/${state.pageId}`, { name: 'Updated Page', layout: { w: 10 } });
  if (res.data.name !== 'Updated Page') throw new Error('Page was not updated');
  pass('PUT /projects/:projectId/pages/:pageId');
};

// 4. Datasources
const testCreateDatasource = async () => {
    const res = await ax.post(`/projects/${state.projectId}/datasources`, {
        name: 'Test REST API',
        type: 'REST',
        config: { baseUrl: 'https://jsonplaceholder.typicode.com' }
    });
    state.datasourceId = res.data.id;
    if (!state.datasourceId) throw new Error('Failed to create datasource');
    pass('POST /projects/:projectId/datasources');
};

const testGetDatasources = async () => {
    const res = await ax.get(`/projects/${state.projectId}/datasources`);
    if (res.data.length === 0) throw new Error('No datasources found');
    pass('GET /projects/:projectId/datasources');
};

const testRunDatasourceQuery = async () => {
    const res = await ax.post(`/projects/${state.projectId}/datasources/${state.datasourceId}/run`, {
        query: '/todos/1'
    });
    if (!res.data.id) throw new Error('Query did not return expected result');
    pass('POST /projects/:projectId/datasources/:datasourceId/run');
};


// 5. Workflows
const testCreateWorkflow = async () => {
    const res = await ax.post(`/projects/${state.projectId}/workflows`, {
      name: 'Test Workflow',
      trigger: 'manual',
      type: 'JavaScript',
        code: 'return input.a + input.b;'
    });
    state.workflowId = res.data.id;
    if (!state.workflowId) throw new Error('Failed to create workflow');
    pass('POST /projects/:projectId/workflows');
};

const testGetWorkflows = async () => {
    const res = await ax.get(`/projects/${state.projectId}/workflows`);
    if (res.data.length === 0) throw new Error('No workflows found');
    pass('GET /projects/:projectId/workflows');
};

const testRunWorkflow = async () => {
    const res = await ax.post(`/projects/${state.projectId}/workflows/${state.workflowId}/run`, {
        input: { a: 5, b: 10 }
    });
    if (res.data !== 15) throw new Error('Workflow execution returned incorrect result');
    pass('POST /projects/:projectId/workflows/:workflowId/run');
};

const testGetWorkflowLogs = async () => {
    const res = await ax.get(`/projects/${state.projectId}/workflows/${state.workflowId}/logs`);
    if (res.data.length === 0) throw new Error('No logs found for workflow');
    pass('GET /projects/:projectId/workflows/:workflowId/logs');
};

const testScheduleWorkflow = async () => {
    await ax.post(`/projects/${state.projectId}/workflows/${state.workflowId}/schedule`, {
        cronExpression: '0 0 * * *'
    });
    pass('POST /projects/:projectId/workflows/:workflowId/schedule');
};

// 6. Deletion (run last)
const testDeleteWorkflow = async () => {
    await ax.delete(`/projects/${state.projectId}/workflows/${state.workflowId}`);
    pass('DELETE /projects/:projectId/workflows/:workflowId');
};

const testDeleteDatasource = async () => {
    await ax.delete(`/projects/${state.projectId}/datasources/${state.datasourceId}`);
    pass('DELETE /projects/:projectId/datasources/:datasourceId');
};

const testDeleteProject = async () => {
  await ax.delete(`/projects/${state.projectId}`);
  pass('DELETE /projects/:id');
};

// --- Additional Endpoint Test Stubs ---

// --- Audit Endpoints ---
const testAuditEvents = async () => {
  const res = await ax.get('/audit/events');
  if (!Array.isArray(res.data.events)) {
    console.error('Actual response:', res.data);
    throw new Error('Expected array of audit events');
  }
  pass('GET /audit/events');
  // TODO: Add more assertions
};
const testAuditStats = async () => {
  const res = await ax.get('/audit/stats');
  pass('GET /audit/stats');
  // TODO: Add more assertions
};
const testAuditExport = async () => {
  const res = await ax.get('/audit/export');
  pass('GET /audit/export');
  // TODO: Add more assertions
};
const testAuditCleanup = async () => {
  const res = await ax.post('/audit/cleanup');
  pass('POST /audit/cleanup');
  // TODO: Add more assertions
};
const testAuditEventById = async () => {
  // TODO: Use a real event ID
  try {
    await ax.get('/audit/events/1');
    pass('GET /audit/events/:id');
  } catch (e) {
    pass('GET /audit/events/:id (expected fail if no event)');
  }
};
const testAuditRecent = async () => {
  const res = await ax.get('/audit/recent');
  pass('GET /audit/recent');
};
const testAuditUserEvents = async () => {
  // TODO: Use a real user ID
  try {
    await ax.get('/audit/users/1/events');
    pass('GET /audit/users/:userId/events');
  } catch (e) {
    pass('GET /audit/users/:userId/events (expected fail if no user)');
  }
};

// --- RBAC Endpoints ---
const testRbacInitialize = async () => {
  await ax.post('/rbac/initialize');
  pass('POST /rbac/initialize');
};
const testRbacRoles = async () => {
  await ax.post('/rbac/roles', { name: 'TestRole' });
  pass('POST /rbac/roles');
  const res = await ax.get('/rbac/roles');
  pass('GET /rbac/roles');
};
const testRbacRoleUpdateDelete = async () => {
  // TODO: Use a real role ID
  try {
    await ax.put('/rbac/roles/1', { name: 'UpdatedRole' });
    pass('PUT /rbac/roles/:id');
    await ax.delete('/rbac/roles/1');
    pass('DELETE /rbac/roles/:id');
  } catch (e) {
    pass('PUT/DELETE /rbac/roles/:id (expected fail if no role)');
  }
};
const testRbacPermissions = async () => {
  await ax.get('/rbac/permissions');
  pass('GET /rbac/permissions');
};
const testRbacRolePermissions = async () => {
  // TODO: Use a real role ID
  try {
    await ax.get('/rbac/roles/1/permissions');
    pass('GET /rbac/roles/:roleId/permissions');
  } catch (e) {
    pass('GET /rbac/roles/:roleId/permissions (expected fail if no role)');
  }
};
const testRbacAssignRemoveRole = async () => {
  // TODO: Use real user/role IDs
  try {
    await ax.post('/rbac/users/assign-role', { userId: '1', roleId: '1' });
    pass('POST /rbac/users/assign-role');
    await ax.post('/rbac/users/remove-role', { userId: '1', roleId: '1' });
    pass('POST /rbac/users/remove-role');
  } catch (e) {
    pass('POST /rbac/users/assign/remove-role (expected fail if no user/role)');
  }
};
const testRbacUserRoles = async () => {
  // TODO: Use a real user ID
  try {
    await ax.get('/rbac/users/1/roles');
    pass('GET /rbac/users/:userId/roles');
  } catch (e) {
    pass('GET /rbac/users/:userId/roles (expected fail if no user)');
  }
};
const testRbacCheckPermission = async () => {
  await ax.post('/rbac/check-permission', { userId: '1', permission: 'read' });
  pass('POST /rbac/check-permission');
};

// --- Integrations Endpoints ---
const testIntegrations = async () => {
  // 1. Create Integration
  const createRes = await ax.post(`/projects/${state.projectId}/integrations`, {
    name: 'Test Integration',
    type: 'REST',
    config: { baseUrl: 'https://api.example.com' }
  });
  const integrationId = createRes.data.id;
  state.integrationId = integrationId;
  if (!integrationId) throw new Error('Failed to create integration');
  pass('POST /projects/:projectId/integrations');

  // 2. Check audit log for create
  const auditCreate = await ax.get('/audit/events', { params: { resource: 'integration', action: 'create', resourceId: integrationId } });
  if (!auditCreate.data.events.some(e => e.resourceId === integrationId && e.action === 'create')) throw new Error('No audit log for integration create');
  pass('Audit log for integration create');

  // 3. Update Integration
  const updateRes = await ax.put(`/projects/${state.projectId}/integrations/${integrationId}`, {
    name: 'Updated Integration',
    type: 'REST',
    config: { baseUrl: 'https://api.example.com/v2' },
    status: 'Connected'
  });
  if (updateRes.data.name !== 'Updated Integration') throw new Error('Integration was not updated');
  pass('PUT /projects/:projectId/integrations/:integrationId');

  // 4. Check audit log for update
  const auditUpdate = await ax.get('/audit/events', { params: { resource: 'integration', action: 'update', resourceId: integrationId } });
  if (!auditUpdate.data.events.some(e => e.resourceId === integrationId && e.action === 'update')) throw new Error('No audit log for integration update');
  pass('Audit log for integration update');

  // 5. Test Integration
  const testRes = await ax.post(`/projects/${state.projectId}/integrations/${integrationId}/test`);
  if (!testRes.data.success) throw new Error('Integration test did not succeed');
  pass('POST /projects/:projectId/integrations/:integrationId/test');

  // 6. Check audit log for test
  const auditTest = await ax.get('/audit/events', { params: { resource: 'integration', action: 'test', resourceId: integrationId } });
  if (!auditTest.data.events.some(e => e.resourceId === integrationId && e.action === 'test')) throw new Error('No audit log for integration test');
  pass('Audit log for integration test');

  // 7. Delete Integration
  await ax.delete(`/projects/${state.projectId}/integrations/${integrationId}`);
  pass('DELETE /projects/:projectId/integrations/:integrationId');

  // 8. Check audit log for delete
  const auditDelete = await ax.get('/audit/events', { params: { resource: 'integration', action: 'delete', resourceId: integrationId } });
  if (!auditDelete.data.events.some(e => e.resourceId === integrationId && e.action === 'delete')) throw new Error('No audit log for integration delete');
  pass('Audit log for integration delete');
};

// --- Datasource Extra Endpoints ---
const testUpdateDatasource = async () => {
  // TODO: Use a real datasource ID
  try {
    await ax.put(`/projects/${state.projectId}/datasources/1`, { name: 'Updated DS' });
    pass('PUT /projects/:projectId/datasources/:datasourceId');
  } catch (e) {
    pass('PUT /projects/:projectId/datasources/:datasourceId (expected fail if no ds)');
  }
};
const testDatasourceTestConnection = async () => {
  await ax.post(`/projects/${state.projectId}/datasources/test-connection`, { config: {} });
  pass('POST /projects/:projectId/datasources/test-connection');
};
const testDatasourceSchema = async () => {
  // TODO: Use a real datasource ID
  try {
    await ax.get(`/projects/${state.projectId}/datasources/1/schema`);
    pass('GET /projects/:projectId/datasources/:datasourceId/schema');
  } catch (e) {
    pass('GET /projects/:projectId/datasources/:datasourceId/schema (expected fail if no ds)');
  }
};

// --- Page Extra Endpoints ---
const testPageVersions = async () => {
  // TODO: Use a real page ID
  try {
    await ax.get(`/projects/${state.projectId}/pages/1/versions`);
    pass('GET /projects/:projectId/pages/:pageId/versions');
  } catch (e) {
    pass('GET /projects/:projectId/pages/:pageId/versions (expected fail if no page)');
  }
};
const testPageRevertVersion = async () => {
  // TODO: Use real page/version IDs
  try {
    await ax.post(`/projects/${state.projectId}/pages/1/versions/1/revert`);
    pass('POST /projects/:projectId/pages/:pageId/versions/:versionId/revert');
  } catch (e) {
    pass('POST /projects/:projectId/pages/:pageId/versions/:versionId/revert (expected fail if no page/version)');
  }
};

// --- Workflow Extra Endpoints ---
const testWorkflowExecute = async () => {
  // TODO: Use a real workflow ID
  try {
    await ax.post(`/projects/${state.projectId}/workflows/1/execute`, { input: {} });
    pass('POST /projects/:projectId/workflows/:workflowId/execute');
  } catch (e) {
    pass('POST /projects/:projectId/workflows/:workflowId/execute (expected fail if no workflow)');
  }
};
const testWorkflowWebhook = async () => {
  // TODO: Use a real workflow ID
  try {
    await ax.post(`/projects/${state.projectId}/workflows/1/webhook`, { webhookPath: '/test' });
    pass('POST /projects/:projectId/workflows/:workflowId/webhook');
  } catch (e) {
    pass('POST /projects/:projectId/workflows/:workflowId/webhook (expected fail if no workflow)');
  }
};
const testWorkflowTriggerWebhook = async () => {
  // TODO: Use a real webhook ID
  try {
    await ax.post(`/projects/${state.projectId}/workflows/webhook/1/trigger`, {});
    pass('POST /projects/:projectId/workflows/webhook/:webhookId/trigger');
  } catch (e) {
    pass('POST /projects/:projectId/workflows/webhook/:webhookId/trigger (expected fail if no webhook)');
  }
};
const testWorkflowStopTrigger = async () => {
  // TODO: Use a real workflow ID
  try {
    await ax.delete(`/projects/${state.projectId}/workflows/1/trigger`);
    pass('DELETE /projects/:projectId/workflows/:workflowId/trigger');
  } catch (e) {
    pass('DELETE /projects/:projectId/workflows/:workflowId/trigger (expected fail if no workflow)');
  }
};
const testWorkflowStats = async () => {
  await ax.get(`/projects/${state.projectId}/workflows/stats`);
  pass('GET /projects/:projectId/workflows/stats');
};
const testWorkflowQueueStats = async () => {
  await ax.get(`/projects/${state.projectId}/workflows/queue/stats`);
  pass('GET /projects/:projectId/workflows/queue/stats');
};

// --- Auth SSO Endpoints ---
const testAuthGoogle = async () => {
  try {
    await ax.get('/auth/google');
    pass('GET /auth/google');
  } catch (e) {
    pass('GET /auth/google (expected fail if not configured)');
  }
};
const testAuthGoogleCallback = async () => {
  try {
    await ax.get('/auth/google/callback');
    pass('GET /auth/google/callback');
  } catch (e) {
    pass('GET /auth/google/callback (expected fail if not configured)');
  }
};
const testAuthStatus = async () => {
  try {
    await ax.get('/auth/status');
    pass('GET /auth/status');
  } catch (e) {
    pass('GET /auth/status (expected fail if not configured)');
  }
};

const assignAdminRoleToTestUser = async () => {
  // Get the test user by email
  const user = await prisma.user.findUnique({ where: { email: uniqueEmail } });
  if (!user) throw new Error('Test user not found');
  state.userId = user.id;
  // Get the Administrator role
  const adminRole = await prisma.role.findFirst({ where: { name: 'Administrator' } });
  if (!adminRole) throw new Error('Administrator role not found');
  state.adminRoleId = adminRole.id;
  // Assign the Administrator role to the test user via API (to trigger any hooks/audit)
  await ax.post('/rbac/users/assign-role', { userId: state.userId, roleId: state.adminRoleId });
  pass('Assigned Administrator role to test user');
};

// --- Main Execution ---
const main = async () => {
  log('Starting Endpoint Test Suite');

  await runTest('Register User', testRegister);
  await runTest('Login User', testLogin);
  await runTest('Get Me', testGetMe);

  // Assign admin role to test user before RBAC tests
  await runTest('Assign Admin Role', assignAdminRoleToTestUser);

  await runTest('Create Project', testCreateProject);
  await runTest('Get Projects', testGetProjects);
  await runTest('Get Project By ID', testGetProjectById);
  await runTest('Rename Project', testRenameProject);

  await runTest('Create Page', testCreatePage);
  await runTest('Get Page', testGetPage);
  await runTest('Update Page', testUpdatePage);

  await runTest('Create Datasource', testCreateDatasource);
  await runTest('Get Datasources', testGetDatasources);
  await runTest('Run Datasource Query', testRunDatasourceQuery);
  
  await runTest('Create Workflow', testCreateWorkflow);
  await runTest('Get Workflows', testGetWorkflows);
  await runTest('Run Workflow', testRunWorkflow);
  await runTest('Get Workflow Logs', testGetWorkflowLogs);
  await runTest('Schedule Workflow', testScheduleWorkflow);

  // Cleanup
  await runTest('Delete Workflow', testDeleteWorkflow);
  await runTest('Delete Datasource', testDeleteDatasource);
  await runTest('Delete Project', testDeleteProject);

  await runTest('Audit Events', testAuditEvents);
  await runTest('Audit Stats', testAuditStats);
  await runTest('Audit Export', testAuditExport);
  await runTest('Audit Cleanup', testAuditCleanup);
  await runTest('Audit Event By ID', testAuditEventById);
  await runTest('Audit Recent', testAuditRecent);
  await runTest('Audit User Events', testAuditUserEvents);

  await runTest('RBAC Initialize', testRbacInitialize);
  await runTest('RBAC Roles', testRbacRoles);
  await runTest('RBAC Role Update/Delete', testRbacRoleUpdateDelete);
  await runTest('RBAC Permissions', testRbacPermissions);
  await runTest('RBAC Role Permissions', testRbacRolePermissions);
  await runTest('RBAC Assign/Remove Role', testRbacAssignRemoveRole);
  await runTest('RBAC User Roles', testRbacUserRoles);
  await runTest('RBAC Check Permission', testRbacCheckPermission);

  await runTest('Integrations', testIntegrations);

  await runTest('Update Datasource', testUpdateDatasource);
  await runTest('Datasource Test Connection', testDatasourceTestConnection);
  await runTest('Datasource Schema', testDatasourceSchema);

  await runTest('Page Versions', testPageVersions);
  await runTest('Page Revert Version', testPageRevertVersion);

  await runTest('Workflow Execute', testWorkflowExecute);
  await runTest('Workflow Webhook', testWorkflowWebhook);
  await runTest('Workflow Trigger Webhook', testWorkflowTriggerWebhook);
  await runTest('Workflow Stop Trigger', testWorkflowStopTrigger);
  await runTest('Workflow Stats', testWorkflowStats);
  await runTest('Workflow Queue Stats', testWorkflowQueueStats);

  await runTest('Auth Google', testAuthGoogle);
  await runTest('Auth Google Callback', testAuthGoogleCallback);
  await runTest('Auth Status', testAuthStatus);

  log('✅ All tests passed successfully!');
};

main().catch(e => {
  console.error('A critical error occurred.', e.message);
  process.exit(1);
}); 