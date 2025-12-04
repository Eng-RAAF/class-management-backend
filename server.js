import express from 'express';
import cors from 'cors';
import studentsRoutes from './routes/students.js';
import classesRoutes from './routes/classes.js';
import teachersRoutes from './routes/teachers.js';
import enrollmentsRoutes from './routes/enrollments.js';
import authRoutes from './routes/auth.js';
import usersRoutes from './routes/users.js';
import messagesRoutes from './routes/messages.js';
import analyticsRoutes from './routes/analytics.js';
import schoolsRoutes from './routes/schools.js';
import branchesRoutes from './routes/branches.js';
import testTokenRoutes from './routes/test-token.js';
import superadminRoutes from './routes/superadmin.js';

const app = express();
const PORT = process.env.PORT || 3000;



// Middleware
// CORS configuration - allow frontend domain
//waxaan rabaa updat
//hello world wide four
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, Postman, or curl)
    if (!origin) return callback(null, true);
    
    // List of allowed origins
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:3000',
      process.env.FRONTEND_URL,
      process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
      'https://macaalin.com',
      'https://www.macaalin.com',
      'http://macaalin.com',
      'http://www.macaalin.com'
    ].filter(Boolean);
    
    // Allow if origin is in allowed list or if in development
    if (allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      // In production, be more strict but still allow if FRONTEND_URL is set
      if (process.env.FRONTEND_URL && origin.includes(process.env.FRONTEND_URL)) {
        callback(null, true);
      } else {
        callback(null, true); // Allow all for now - you can restrict this later
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
// maxamuud
//sahaln
//superadmin

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/students', studentsRoutes);
app.use('/api/classes', classesRoutes);
app.use('/api/teachers', teachersRoutes);
app.use('/api/enrollments', enrollmentsRoutes);
app.use('/api/schools', schoolsRoutes);
app.use('/api/branches', branchesRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Class Management System API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      messages: '/api/messages',
      analytics: '/api/analytics',
      students: '/api/students',
      classes: '/api/classes',
      teachers: '/api/teachers',
      enrollments: '/api/enrollments',
      schools: '/api/schools',
      branches: '/api/branches'
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler - must be after all routes
app.use((err, req, res, next) => {
  console.error('=== GLOBAL ERROR HANDLER ===');
  console.error('Error stack:', err.stack);
  console.error('Error message:', err.message);
  console.error('Error code:', err.code);
  console.error('Request URL:', req.url);
  console.error('Request method:', req.method);
  
  // Ensure we always send JSON
  if (!res.headersSent) {
    const statusCode = err.status || err.statusCode || 500;
    res.status(statusCode).json({ 
      error: err.message || 'Something went wrong!',
      ...(process.env.NODE_ENV === 'development' && { 
        stack: err.stack,
        code: err.code,
        details: err.details
      })
    });
  }
});

// Export app for Vercel serverless functions
export default app;

// Start server only if not in Vercel environment
if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}
