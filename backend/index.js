const express = require('express');
const cors = require('cors');
const { initializeDatabase } = require('./database');
const api = require('./api');
const config = require('./config');

const app = express();
const PORT = config.port;

// Middleware
app.use(express.json());
app.use(cors());

// Initialize database
initializeDatabase();

// API routes
app.use('/api', api);

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Price Counter Backend API',
    documentation: 'http://localhost:' + PORT + '/api/info',
    workflow: [
      'Step 1: POST /api/setup-structure - Parse and save categories/subcategories from website',
      'Step 2: POST /api/update-prices - Update tasks/prices from existing categories structure',
      'Step 3: GET /api/categories - Retrieve all data'
    ]
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Catch unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Catch uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`GET  http://localhost:${PORT}/api/categories`);
  console.log(`POST http://localhost:${PORT}/api/update-prices-demo`);
});

console.log('Server object created, keeping process alive...');

// Keep the process alive
setInterval(() => {}, 10000);
