// Role definitions and permissions
export const ROLES = {
  ADMIN: 'admin',
  TEACHER: 'teacher',
  STUDENT: 'student'
};

// Permission definitions
export const PERMISSIONS = {
  // Students
  VIEW_STUDENTS: ['admin', 'teacher'],
  CREATE_STUDENTS: ['admin'],
  UPDATE_STUDENTS: ['admin'],
  DELETE_STUDENTS: ['admin'],

  // Teachers
  VIEW_TEACHERS: ['admin', 'teacher'],
  CREATE_TEACHERS: ['admin'],
  UPDATE_TEACHERS: ['admin'],
  DELETE_TEACHERS: ['admin'],

  // Classes
  VIEW_CLASSES: ['admin', 'teacher', 'student'],
  CREATE_CLASSES: ['admin'],
  UPDATE_CLASSES: ['admin', 'teacher'], // Teachers can update their own classes
  DELETE_CLASSES: ['admin'],

  // Enrollments
  VIEW_ENROLLMENTS: ['admin', 'teacher', 'student'], // Students can see their own
  CREATE_ENROLLMENTS: ['admin', 'teacher'],
  UPDATE_ENROLLMENTS: ['admin'],
  DELETE_ENROLLMENTS: ['admin', 'teacher'],

  // Users
  VIEW_USERS: ['admin'],
  CREATE_USERS: ['admin'],
  UPDATE_USERS: ['admin'], // Users can update their own profile
  DELETE_USERS: ['admin'],

  // Messages
  VIEW_MESSAGES: ['admin', 'teacher', 'student'], // Users can see their own messages
  CREATE_MESSAGES: ['admin', 'teacher', 'student'],
  DELETE_MESSAGES: ['admin'], // And message owner

  // Analytics
  VIEW_ANALYTICS: ['admin', 'teacher'],

  // Schools & Branches
  VIEW_SCHOOLS: ['admin', 'teacher'],
  MANAGE_SCHOOLS: ['admin'],
  VIEW_BRANCHES: ['admin', 'teacher'],
  MANAGE_BRANCHES: ['admin']
};

// Check if user has specific permission
export const hasPermission = (userRole, permission) => {
  const allowedRoles = PERMISSIONS[permission];
  if (!allowedRoles) {
    console.warn(`Unknown permission: ${permission}`);
    return false;
  }
  return allowedRoles.includes(userRole);
};

// Middleware to check specific permission
export const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user || !req.userRole) {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'You must be logged in to access this resource'
      });
    }

    if (!hasPermission(req.userRole, permission)) {
      return res.status(403).json({ 
        error: 'Access forbidden',
        message: `You do not have permission to perform this action`,
        permission: permission,
        currentRole: req.userRole
      });
    }

    next();
  };
};

// Check if user is admin
export const isAdmin = (userRole) => userRole === ROLES.ADMIN;

// Check if user is teacher or admin
export const isTeacherOrAdmin = (userRole) => 
  userRole === ROLES.TEACHER || userRole === ROLES.ADMIN;

// Check if user can access resource (owner or admin)
export const canAccessResource = (userId, resourceUserId, userRole) => {
  return userId === resourceUserId || userRole === ROLES.ADMIN;
};

export default {
  ROLES,
  PERMISSIONS,
  hasPermission,
  requirePermission,
  isAdmin,
  isTeacherOrAdmin,
  canAccessResource
};

