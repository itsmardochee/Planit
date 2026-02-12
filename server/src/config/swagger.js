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
        url:
          process.env.API_URL || `http://localhost:${process.env.PORT || 5000}`,
        description:
          process.env.NODE_ENV === 'production'
            ? 'Production server'
            : 'Development server',
      },
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
        Board: {
          type: 'object',
          required: ['name', 'workspaceId', 'userId'],
          properties: {
            _id: {
              type: 'string',
              description: 'Board ID (auto-generated)',
              example: '507f1f77bcf86cd799439011',
            },
            name: {
              type: 'string',
              maxLength: 100,
              description: 'Board name',
              example: 'Project Sprint 1',
            },
            description: {
              type: 'string',
              maxLength: 500,
              description: 'Board description (optional)',
              example: 'Sprint planning and tracking',
            },
            workspaceId: {
              type: 'string',
              description: 'ID of the workspace this board belongs to',
              example: '507f1f77bcf86cd799439011',
            },
            userId: {
              type: 'string',
              description: 'ID of the user who owns this board',
              example: '507f1f77bcf86cd799439011',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Board creation timestamp',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp',
            },
          },
        },
        BoardResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            data: {
              $ref: '#/components/schemas/Board',
            },
          },
        },
        BoardsResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            data: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Board',
              },
            },
          },
        },
        List: {
          type: 'object',
          required: ['name', 'workspaceId', 'boardId', 'userId'],
          properties: {
            _id: {
              type: 'string',
              description: 'List ID (auto-generated)',
              example: '507f1f77bcf86cd799439011',
            },
            name: {
              type: 'string',
              maxLength: 100,
              description: 'List name',
              example: 'To Do',
            },
            description: {
              type: 'string',
              maxLength: 500,
              description: 'List description (optional)',
              example: 'Tasks to complete',
            },
            position: {
              type: 'integer',
              minimum: 0,
              description: 'Position of list in board (for ordering)',
              example: 0,
            },
            workspaceId: {
              type: 'string',
              description: 'ID of the workspace this list belongs to',
              example: '507f1f77bcf86cd799439011',
            },
            boardId: {
              type: 'string',
              description: 'ID of the board this list belongs to',
              example: '507f1f77bcf86cd799439011',
            },
            userId: {
              type: 'string',
              description: 'ID of the user who owns this list',
              example: '507f1f77bcf86cd799439011',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'List creation timestamp',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp',
            },
          },
        },
        ListResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            data: {
              $ref: '#/components/schemas/List',
            },
          },
        },
        ListsResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            data: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/List',
              },
            },
          },
        },
        Card: {
          type: 'object',
          required: ['title', 'listId', 'boardId', 'userId'],
          properties: {
            _id: {
              type: 'string',
              description: 'Card ID (auto-generated)',
              example: '507f1f77bcf86cd799439011',
            },
            title: {
              type: 'string',
              maxLength: 200,
              description: 'Card title',
              example: 'Implement authentication',
            },
            description: {
              type: 'string',
              maxLength: 2000,
              description: 'Card description (optional)',
              example: 'Create JWT-based authentication system',
            },
            position: {
              type: 'integer',
              minimum: 0,
              description: 'Position of card in list (for ordering)',
              example: 0,
            },
            listId: {
              type: 'string',
              description: 'ID of the list this card belongs to',
              example: '507f1f77bcf86cd799439011',
            },
            boardId: {
              type: 'string',
              description: 'ID of the board this card belongs to',
              example: '507f1f77bcf86cd799439011',
            },
            userId: {
              type: 'string',
              description: 'ID of the user who owns this card',
              example: '507f1f77bcf86cd799439011',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Card creation timestamp',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp',
            },
          },
        },
        CardResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            data: {
              $ref: '#/components/schemas/Card',
            },
          },
        },
        CardsResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            data: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Card',
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
        description: 'Workspace management endpoints',
      },
      {
        name: 'Workspace Members',
        description: 'Workspace membership and collaboration endpoints',
      },
      {
        name: 'Boards',
        description: 'Board management endpoints',
      },
      {
        name: 'Lists',
        description: 'List management endpoints',
      },
      {
        name: 'Cards',
        description: 'Card management endpoints',
      },
    ],
  },
  apis: ['./src/routes/*.js', './src/controllers/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
