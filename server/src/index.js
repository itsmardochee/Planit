import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './config/swagger.js';
import authRoutes from './routes/authRoutes.js';
import workspaceRoutes from './routes/workspaceRoutes.js';
import { workspaceBoardRouter, boardRouter } from './routes/boardRoutes.js';
import { boardListRouter, listRouter } from './routes/listRoutes.js';
import { listCardRouter, cardRouter } from './routes/cardRoutes.js';
import auth from './middlewares/auth.js';
import errorHandler from './middlewares/errorHandler.js';

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection
if (
  process.env.MONGO_URI &&
  process.env.MONGO_URI !==
    'mongodb+srv://username:password@cluster.mongodb.net/planit?retryWrites=true&w=majority'
) {
  mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connected successfully'))
    .catch(err => {
      console.error('MongoDB connection error:', err);
      console.warn('Server will continue without database connection');
    });
} else {
  console.warn('⚠️  MongoDB URI not configured - running without database');
  console.log('💡 Update MONGO_URI in .env file to connect to MongoDB');
}

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Planit API' });
});

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Swagger documentation
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Planit API Documentation',
  })
);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/workspaces', auth, workspaceRoutes);
app.use('/api/workspaces/:workspaceId/boards', auth, workspaceBoardRouter);
app.use('/api/boards', auth, boardRouter);
app.use('/api/boards/:boardId/lists', auth, boardListRouter);
app.use('/api/lists', auth, listRouter);
app.use('/api/lists/:listId/cards', auth, listCardRouter);
app.use('/api/cards', auth, cardRouter);

// 404 handler - must be before error handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Global error handling middleware - must be last
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
