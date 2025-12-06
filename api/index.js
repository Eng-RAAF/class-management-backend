import express from 'express';
import cors from 'cors';
import studentsRoutes from '../routes/students.js';
import classesRoutes from '../routes/classes.js';
import teachersRoutes from '../routes/teachers.js';
import enrollmentsRoutes from '../routes/enrollments.js';
import authRoutes from '../routes/auth.js';
import usersRoutes from '../routes/users.js';
import messagesRoutes from '../routes/messages.js';
import analyticsRoutes from '../routes/analytics.js';
import schoolsRoutes from '../routes/schools.js';
import branchesRoutes from '../routes/branches.js';
import testTokenRoutes from '../routes/test-token.js';
import superadminRoutes from '../routes/superadmin.js';
import lessonPlansRoutes from '../routes/lessonPlans.js';

const app = express();

// Middleware
// CORS configuration - allow frontend domain
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, Postman, or curl)
    if (!origin) return callback(null, true);
    
    // List of allowed origins
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://127.0.0.1:5173',
      process.env.FRONTEND_URL,
      'https://class-management-frontend.vercel.app',
      'https://macaalin.com',
      'https://www.macaalin.com',
      'http://macaalin.com',
      'http://www.macaalin.com'
    ].filter(Boolean); // Remove undefined values

    // For development, also allow any localhost
    if (process.env.NODE_ENV !== 'production' && origin?.includes('localhost')) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('CORS: Blocked origin:', origin);
      console.log('CORS: Allowed origins:', allowedOrigins);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Class Management System API',
    status: 'running',
    version: '1.0.0',
    endpoints: {
      students: '/api/students',
      classes: '/api/classes',
      teachers: '/api/teachers',
      enrollments: '/api/enrollments',
      auth: '/api/auth',
      users: '/api/users',
      messages: '/api/messages',
      analytics: '/api/analytics',
      schools: '/api/schools',
      branches: '/api/branches'
    }
  });
});

// Routes - all under /api prefix
app.use('/api/students', studentsRoutes);
app.use('/api/classes', classesRoutes);
app.use('/api/teachers', teachersRoutes);
app.use('/api/enrollments', enrollmentsRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/schools', schoolsRoutes);
app.use('/api/branches', branchesRoutes);
app.use('/api/test', testTokenRoutes);
app.use('/api/superadmin', superadminRoutes);
app.use('/api/lesson-plans', lessonPlansRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not Found',
    path: req.path,
    message: 'The requested endpoint does not exist'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Export the Express app for Vercel serverless
export default app;

