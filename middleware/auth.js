import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';

// Authentication middleware - verifies JWT token
export const authenticate = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'Please provide a valid token in the Authorization header'
      });
    }

    // Extract token
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-production');

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phoneNumber: true,
        phoneVerified: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(401).json({ 
        error: 'User not found',
        message: 'The user associated with this token no longer exists'
      });
    }

    // Attach user to request object
    req.user = user;
    req.userId = user.id;
    req.userRole = user.role;

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Invalid token',
        message: 'The provided token is invalid'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expired',
        message: 'Your session has expired. Please login again'
      });
    }

    console.error('Authentication error:', error);
    return res.status(500).json({ 
      error: 'Authentication failed',
      message: 'An error occurred during authentication'
    });
  }
};

// Role-based authorization middleware
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    // Ensure user is authenticated first
    if (!req.user || !req.userRole) {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'You must be logged in to access this resource'
      });
    }

    // Check if user's role is in the allowed roles
    if (!allowedRoles.includes(req.userRole)) {
      return res.status(403).json({ 
        error: 'Access forbidden',
        message: `This action requires one of these roles: ${allowedRoles.join(', ')}. Your role: ${req.userRole}`,
        requiredRoles: allowedRoles,
        currentRole: req.userRole
      });
    }

    // User has required role, proceed
    next();
  };
};

// Specific role checks (convenience functions)
export const requireAdmin = authorize('admin');
export const requireTeacher = authorize('admin', 'teacher');
export const requireStudent = authorize('admin', 'teacher', 'student');

// Owner or admin check - allows resource owner or admin
export const authorizeOwnerOrAdmin = (userIdField = 'userId') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'You must be logged in'
      });
    }

    const resourceUserId = req.params[userIdField] || req.body[userIdField];
    const isOwner = resourceUserId && parseInt(resourceUserId) === req.userId;
    const isAdmin = req.userRole === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ 
        error: 'Access forbidden',
        message: 'You can only access your own resources or you must be an admin'
      });
    }

    next();
  };
};

// Check if user can manage specific resource
export const canManageResource = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  // Admins can manage everything
  if (req.userRole === 'admin') {
    return next();
  }

  // Teachers can manage their own classes and related enrollments
  if (req.userRole === 'teacher') {
    const resourceId = req.params.id;
    const resourceType = req.baseUrl.split('/').pop(); // students, classes, etc.

    if (resourceType === 'classes') {
      // Check if teacher owns this class
      const classItem = await prisma.class.findUnique({
        where: { id: parseInt(resourceId) },
        select: { teacherId: true }
      });

      if (classItem && classItem.teacherId === req.userId) {
        return next();
      }
    }

    return res.status(403).json({ 
      error: 'Access forbidden',
      message: 'Teachers can only manage their own classes'
    });
  }

  // Students can only view, not manage
  return res.status(403).json({ 
    error: 'Access forbidden',
    message: 'Students do not have permission to manage this resource'
  });
};

export default {
  authenticate,
  authorize,
  requireAdmin,
  requireTeacher,
  requireStudent,
  authorizeOwnerOrAdmin,
  canManageResource
};

