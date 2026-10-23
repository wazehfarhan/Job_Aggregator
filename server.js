const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type']
}));
app.use(express.json());
app.use(express.static('public'));

// MongoDB Connection with retry logic
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/job-aggregator';
let mongoRetries = 0;
const MAX_RETRIES = 5;

const connectMongoDB = async () => {
  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log('MongoDB connected successfully');
    mongoRetries = 0;
  } catch (err) {
    mongoRetries++;
    console.error(`MongoDB connection failed (attempt ${mongoRetries}/${MAX_RETRIES}):`, err.message);
    if (mongoRetries < MAX_RETRIES) {
      console.log('Retrying connection in 5 seconds...');
      setTimeout(connectMongoDB, 5000);
    } else {
      console.error('Max retries reached. Exiting.');
      process.exit(1);
    }
  }
};

connectMongoDB();

// Handle MongoDB connection events
mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB disconnected. Attempting to reconnect...');
  setTimeout(connectMongoDB, 5000);
});

// Routes
app.use('/api/jobs', require('./routes/jobs'));

// Health check endpoint
app.get('/health', (req, res) => {
  const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.json({
    status: 'ok',
    mongodb: mongoStatus,
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// Start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(async () => {
    await mongoose.connection.close();
    console.log('Server and database closed');
    process.exit(0);
  });
});

module.exports = app;
