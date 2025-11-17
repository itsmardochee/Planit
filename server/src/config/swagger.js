import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Planit API',
      version: '1.0.0',
      description: 'Trello-like Kanban board application API documentation',
      contact: {
        name: 'Planit Team',
        url: 'https://github.com/itsmardochee/Planit',
      },
      license: {
        name: 'ISC',
        url: 'https://opensource.org/licenses/ISC',
      },
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 5000}`,
        description: 'Development server',
      },
      // {
      //   url: 'https://api.planit.com',
      //   description: 'Production server',
      // },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token in format: Bearer <token>',
        },
      },
      schemas: {
        User: {
          type: 'object',
          required: ['username', 'email', 'password'],
          properties: {
            _id: {
              type: 'string',
              description: 'User ID (auto-generated)',
              example: '507f1f77bcf86cd799439011',
            },
            username: {
              type: 'string',
              maxLength: 50,
              description: 'Unique username',
              example: 'johndoe',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Unique email address',
              example: 'john.doe@example.com',
            },
            password: {
              type: 'string',
              minLength: 6,
              description: 'User password (hashed with bcrypt)',
              example: 'password123',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Account creation timestamp',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp',
            },
          },
        },
        UserResponse: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '507f1f77bcf86cd799439011',
            },
            username: {
              type: 'string',
              example: 'johndoe',
            },
            email: {
              type: 'string',
              example: 'john.doe@example.com',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            data: {
              type: 'object',
              properties: {
                user: {
                  $ref: '#/components/schemas/UserResponse',
                },
                token: {
                  type: 'string',
                  description: 'JWT token (expires in 7 days)',
                  example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                },
              },
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            message: {
              type: 'string',
              example: 'Error message',
            },
          },
        },
        Workspace: {
          type: 'object',
          required: ['name', 'userId'],
          properties: {
            _id: {
              type: 'string',
              description: 'Workspace ID (auto-generated)',
              example: '507f1f77bcf86cd799439011',
            },
            name: {
              type: 'string',
              maxLength: 100,
              description: 'Workspace name',
              example: 'My Workspace',
            },
            description: {
              type: 'string',
              maxLength: 500,
              description: 'Workspace description (optional)',
              example: 'A workspace for managing projects',
            },
            userId: {
              type: 'string',
              description: 'ID of the user who owns this workspace',
              example: '507f1f77bcf86cd799439011',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Workspace creation timestamp',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp',
            },
          },
        },
        WorkspaceResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            data: {
              $ref: '#/components/schemas/Workspace',
            },
          },
        },
        WorkspacesResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            data: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Workspace',
              },
            },
          },
        },
      },
    },
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and registration endpoints',
      },
      {
        name: 'Workspaces',
        description: 'Workspace management (coming soon)',
      },
      {
        name: 'Boards',
        description: 'Board management (coming soon)',
      },
      {
        name: 'Lists',
        description: 'List management (coming soon)',
      },
      {
        name: 'Cards',
        description: 'Card management (coming soon)',
      },
    ],
  },
  apis: ['./src/routes/*.js', './src/controllers/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
