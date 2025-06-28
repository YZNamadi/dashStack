const axios = require('axios');

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


// --- Main Execution ---
const main = async () => {
  log('Starting Endpoint Test Suite');

  await runTest('Register User', testRegister);
  await runTest('Login User', testLogin);
  await runTest('Get Me', testGetMe);

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

  log('✅ All tests passed successfully!');
};

main().catch(e => {
  console.error('A critical error occurred.', e.message);
  process.exit(1);
}); 