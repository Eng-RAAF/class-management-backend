import express from 'express';
import prisma from '../lib/prisma.js';
import bcrypt from 'bcryptjs';
import { authenticate, requireSuperAdmin, authorize } from '../middleware/auth.js';

const router = express.Router();

// Get all users - Role-based access
// Super Admin: All users
// Admin: Teachers and Students only
// Teacher: Students only
// Student: No access
router.get('/users/all', authenticate, authorize('superadmin', 'admin', 'teacher'), async (req, res) => {
  try {
    const requesterRole = req.userRole;
    const requesterId = req.userId;
    
    // Build query based on requester's role
    let whereClause = {};
    
    // Super Admin: Can see all users
    if (requesterRole === 'superadmin') {
      // No filter - show all users
      whereClause = {};
    } else if (requesterRole === 'admin') {
      // Admin: Can see teachers and students only (not other admins/superadmins)
      whereClause = {
        role: {
          in: ['teacher', 'student']
        }
      };
    } else if (requesterRole === 'teacher') {
      // Teacher: Can see students only
      whereClause = {
        role: 'student'
      };
    } else {
      // Student: Can see nothing (empty result)
      whereClause = {
        id: -1 // Impossible condition
      };
    }
    
    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phoneNumber: true,
        phoneVerified: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Change user role - Super Admin only
router.put('/users/:id/role', authenticate, requireSuperAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { role } = req.body;

    // Validate role
    const validRoles = ['superadmin', 'admin', 'teacher', 'student'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ 
        error: 'Invalid role',
        validRoles: validRoles
      });
    }

    // Prevent super admin from demoting themselves (but allow managing others)
    if (userId === req.userId && role !== 'superadmin') {
      return res.status(400).json({ 
        error: 'Cannot change your own role',
        message: 'Super admins cannot demote themselves'
      });
    }
    
    // Allow changing other superadmin roles (removed restriction)

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.json({
      message: 'Role updated successfully',
      user: updatedUser
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(500).json({ error: error.message });
  }
});

// Promote user to admin - Super Admin only
router.post('/users/:id/promote-admin', authenticate, requireSuperAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role: 'admin' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true
      }
    });

    res.json({
      message: 'User promoted to admin successfully',
      user: updatedUser
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(500).json({ error: error.message });
  }
});

// Demote admin to regular user - Super Admin only
router.post('/users/:id/demote', authenticate, requireSuperAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { role } = req.body;

    // Default to student if no role specified
    const newRole = role || 'student';
    const validRoles = ['teacher', 'student'];
    
    if (!validRoles.includes(newRole)) {
      return res.status(400).json({ 
        error: 'Invalid role for demotion',
        validRoles: validRoles
      });
    }

    // Prevent demoting yourself
    if (userId === req.userId) {
      return res.status(400).json({ 
        error: 'Cannot demote yourself',
        message: 'Super admins cannot demote themselves'
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role: newRole },
      select: {
        id: true,
        email: true,
        name: true,
        role: true
      }
    });

    res.json({
      message: `User demoted to ${newRole} successfully`,
      user: updatedUser
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(500).json({ error: error.message });
  }
});

// Delete any user - Super Admin only
router.delete('/users/:id', authenticate, requireSuperAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    // Prevent deleting yourself (but allow deleting other superadmins)
    if (userId === req.userId) {
      return res.status(400).json({ 
        error: 'Cannot delete yourself',
        message: 'Super admins cannot delete their own account'
      });
    }
    
    // Allow deleting other superadmins (removed restriction)

    await prisma.user.delete({
      where: { id: userId }
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(500).json({ error: error.message });
  }
});

// Get system statistics - Super Admin only
router.get('/system/stats', authenticate, requireSuperAdmin, async (req, res) => {
  try {
    const stats = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'superadmin' } }),
      prisma.user.count({ where: { role: 'admin' } }),
      prisma.user.count({ where: { role: 'teacher' } }),
      prisma.user.count({ where: { role: 'student' } }),
      prisma.student.count(),
      prisma.teacher.count(),
      prisma.class.count(),
      prisma.enrollment.count(),
      prisma.school.count(),
      prisma.branch.count(),
      prisma.message.count()
    ]);

    res.json({
      totalUsers: stats[0],
      superAdmins: stats[1],
      admins: stats[2],
      teachers: stats[3],
      students: stats[4],
      totalStudents: stats[5],
      totalTeachers: stats[6],
      totalClasses: stats[7],
      totalEnrollments: stats[8],
      totalSchools: stats[9],
      totalBranches: stats[10],
      totalMessages: stats[11],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all admins - Super Admin only
router.get('/admins', authenticate, requireSuperAdmin, async (req, res) => {
  try {
    const admins = await prisma.user.findMany({
      where: {
        role: {
          in: ['superadmin', 'admin']
        }
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(admins);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

