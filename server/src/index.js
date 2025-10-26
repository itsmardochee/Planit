const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const errorHandler = require('./middlewares/errorHandler');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection
if (process.env.MONGO_URI && process.env.MONGO_URI !== 'mongodb+srv://username:password@cluster.mongodb.net/planit?retryWrites=true&w=majority') {
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

// Routes (to be added)
// app.use('/api/auth', require('./routes/authRoutes'));
// app.use('/api/workspaces', require('./routes/workspaceRoutes'));
// app.use('/api/boards', require('./routes/boardRoutes'));
// app.use('/api/lists', require('./routes/listRoutes'));
// app.use('/api/cards', require('./routes/cardRoutes'));

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

module.exports = app;
