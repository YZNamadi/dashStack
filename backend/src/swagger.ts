import swaggerJSDoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'DashStack API',
      version: '1.0.0',
      description: 'API documentation for DashStack backend',
    },
    servers: [
      {
        url: 'http://localhost:3000/api',
        description: 'Local server',
      },
    ],
    components: {},
    paths: {
      '/auth/login': {
        post: {
          summary: 'User login',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    email: { type: 'string' },
                    password: { type: 'string' },
                  },
                  required: ['email', 'password'],
                },
              },
            },
          },
          responses: {
            200: {
              description: 'Login successful',
            },
            401: {
              description: 'Invalid credentials',
            },
          },
        },
      },
    },
  },
  apis: [
    './src/routes/*.ts',
  ], // Scan all route files for OpenAPI JSDoc
};

const swaggerSpec = swaggerJSDoc(options);
export default swaggerSpec; 