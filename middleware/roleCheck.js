// Role definitions and permissions
export const ROLES = {
  SUPERADMIN: 'superadmin',
  ADMIN: 'admin',
  TEACHER: 'teacher',
  STUDENT: 'student'
};

// Permission definitions
export const PERMISSIONS = {
  // Students
  VIEW_STUDENTS: ['superadmin', 'admin', 'teacher'],
  CREATE_STUDENTS: ['superadmin', 'admin'],
  UPDATE_STUDENTS: ['superadmin', 'admin'],
  DELETE_STUDENTS: ['superadmin', 'admin'],

  // Teachers
  VIEW_TEACHERS: ['superadmin', 'admin', 'teacher'],
  CREATE_TEACHERS: ['superadmin', 'admin'],
  UPDATE_TEACHERS: ['superadmin', 'admin'],
  DELETE_TEACHERS: ['superadmin', 'admin'],

  // Classes
  VIEW_CLASSES: ['superadmin', 'admin', 'teacher', 'student'],
  CREATE_CLASSES: ['superadmin', 'admin'],
  UPDATE_CLASSES: ['superadmin', 'admin', 'teacher'], // Teachers can update their own classes
  DELETE_CLASSES: ['superadmin', 'admin'],

  // Enrollments
  VIEW_ENROLLMENTS: ['superadmin', 'admin', 'teacher', 'student'], // Students can see their own
  CREATE_ENROLLMENTS: ['superadmin', 'admin', 'teacher'],
  UPDATE_ENROLLMENTS: ['superadmin', 'admin'],
  DELETE_ENROLLMENTS: ['superadmin', 'admin', 'teacher'],

  // Users - Super Admin can manage admins, admins cannot
  VIEW_USERS: ['superadmin', 'admin'],
  CREATE_USERS: ['superadmin', 'admin'],
  UPDATE_USERS: ['superadmin', 'admin'], // Users can update their own profile
  DELETE_USERS: ['superadmin'], // Only superadmin can delete users
  MANAGE_ADMINS: ['superadmin'], // Only superadmin can create/edit/delete admins
  CHANGE_ROLES: ['superadmin'], // Only superadmin can change user roles

  // Messages
  VIEW_MESSAGES: ['superadmin', 'admin', 'teacher', 'student'], // Users can see their own messages
  CREATE_MESSAGES: ['superadmin', 'admin', 'teacher', 'student'],
  DELETE_MESSAGES: ['superadmin', 'admin'], // And message owner

  // Analytics
  VIEW_ANALYTICS: ['superadmin', 'admin', 'teacher'],

  // Schools & Branches
  VIEW_SCHOOLS: ['superadmin', 'admin', 'teacher'],
  MANAGE_SCHOOLS: ['superadmin', 'admin'],
  VIEW_BRANCHES: ['superadmin', 'admin', 'teacher'],
  MANAGE_BRANCHES: ['superadmin', 'admin'],

  // System Settings (Super Admin Only)
  SYSTEM_SETTINGS: ['superadmin'],
  VIEW_LOGS: ['superadmin'],
  MANAGE_SYSTEM: ['superadmin']
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

// Check if user is super admin
export const isSuperAdmin = (userRole) => userRole === ROLES.SUPERADMIN;

// Check if user is admin (includes super admin)
export const isAdmin = (userRole) => 
  userRole === ROLES.ADMIN || userRole === ROLES.SUPERADMIN;

// Check if user is teacher or admin
export const isTeacherOrAdmin = (userRole) => 
  userRole === ROLES.TEACHER || userRole === ROLES.ADMIN || userRole === ROLES.SUPERADMIN;

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

