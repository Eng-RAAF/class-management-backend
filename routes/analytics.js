import express from 'express';
import prisma from '../lib/prisma.js';
import { authenticate, requireTeacher } from '../middleware/auth.js';

const router = express.Router();

// Get overall statistics - requires teacher or admin role
router.get('/stats', authenticate, requireTeacher, async (req, res) => {
  try {
    // Check if Prisma is initialized
    if (!prisma) {
      console.error('Prisma client is not initialized');
      return res.status(500).json({ error: 'Database connection not available' });
    }

    const [studentsCount, classesCount, teachersCount, enrollmentsCount, usersCount] = await Promise.all([
      prisma.student.count().catch(err => {
        console.error('Error counting students:', err);
        return 0;
      }),
      prisma.class.count().catch(err => {
        console.error('Error counting classes:', err);
        return 0;
      }),
      prisma.teacher.count().catch(err => {
        console.error('Error counting teachers:', err);
        return 0;
      }),
      prisma.enrollment.count().catch(err => {
        console.error('Error counting enrollments:', err);
        return 0;
      }),
      prisma.user.count().catch(err => {
        console.error('Error counting users:', err);
        return 0;
      })
    ]);

    res.json({
      students: studentsCount,
      classes: classesCount,
      teachers: teachersCount,
      enrollments: enrollmentsCount,
      users: usersCount
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      name: error.name
    });
    
    // Check for database connection errors
    if (error.code === 'P1001' || error.message?.includes("Can't reach database server")) {
      return res.status(503).json({ 
        error: 'Database connection failed',
        message: 'Unable to connect to the database server. Please check your database connection settings.'
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to fetch statistics',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get enrollment statistics by class
router.get('/enrollments-by-class', authenticate, requireTeacher, async (req, res) => {
  try {
    const enrollments = await prisma.enrollment.groupBy({
      by: ['classId'],
      _count: {
        id: true
      }
    });

    const classIds = enrollments.map(e => e.classId);
    const classes = await prisma.class.findMany({
      where: {
        id: { in: classIds }
      },
      select: {
        id: true,
        name: true,
        code: true
      }
    });

    const result = enrollments.map(e => {
      const classInfo = classes.find(c => c.id === e.classId);
      return {
        classId: e.classId,
        className: classInfo?.name || 'Unknown',
        classCode: classInfo?.code || '',
        enrollmentCount: e._count.id
      };
    });

    res.json(result);
  } catch (error) {
    console.error('Error fetching enrollments by class:', error);
    res.status(500).json({ error: 'Failed to fetch enrollment statistics' });
  }
});

// Get students by grade
router.get('/students-by-grade', authenticate, requireTeacher, async (req, res) => {
  try {
    const students = await prisma.student.findMany({
      where: {
        grade: { not: null }
      },
      select: {
        grade: true
      }
    });

    const gradeCounts = students.reduce((acc, student) => {
      const grade = student.grade || 'Unknown';
      acc[grade] = (acc[grade] || 0) + 1;
      return acc;
    }, {});

    const result = Object.entries(gradeCounts).map(([grade, count]) => ({
      grade,
      count
    }));

    res.json(result);
  } catch (error) {
    console.error('Error fetching students by grade:', error);
    res.status(500).json({ error: 'Failed to fetch grade statistics' });
  }
});

// Get recent enrollments
router.get('/recent-enrollments', authenticate, requireTeacher, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    const enrollments = await prisma.enrollment.findMany({
      take: limit,
      orderBy: {
        enrolledAt: 'desc'
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        class: {
          select: {
            id: true,
            name: true,
            code: true
          }
        }
      }
    });

    res.json(enrollments);
  } catch (error) {
    console.error('Error fetching recent enrollments:', error);
    res.status(500).json({ error: 'Failed to fetch recent enrollments' });
  }
});

// Get class capacity utilization
router.get('/class-capacity', authenticate, requireTeacher, async (req, res) => {
  try {
    const classes = await prisma.class.findMany({
      select: {
        id: true,
        name: true,
        code: true,
        capacity: true
      }
    });

    const enrollments = await prisma.enrollment.groupBy({
      by: ['classId'],
      _count: {
        id: true
      }
    });

    const result = classes.map(cls => {
      const enrollment = enrollments.find(e => e.classId === cls.id);
      const enrolled = enrollment?._count.id || 0;
      const capacity = cls.capacity || 0;
      const utilization = capacity > 0 ? (enrolled / capacity) * 100 : 0;

      return {
        classId: cls.id,
        className: cls.name,
        classCode: cls.code,
        capacity,
        enrolled,
        available: capacity - enrolled,
        utilization: Math.round(utilization * 100) / 100
      };
    });

    res.json(result);
  } catch (error) {
    console.error('Error fetching class capacity:', error);
    res.status(500).json({ error: 'Failed to fetch class capacity data' });
  }
});

// Get activity timeline (recent activities)
router.get('/activity-timeline', authenticate, requireTeacher, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;

    const [recentStudents, recentClasses, recentTeachers, recentEnrollments] = await Promise.all([
      prisma.student.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true
        }
      }),
      prisma.class.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          code: true,
          createdAt: true
        }
      }),
      prisma.teacher.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true
        }
      }),
      prisma.enrollment.findMany({
        take: limit,
        orderBy: { enrolledAt: 'desc' },
        select: {
          id: true,
          enrolledAt: true
        }
      })
    ]);

    // Combine and sort by date, adding type field
    const activities = [
      ...recentStudents.map(s => ({ ...s, date: s.createdAt, action: 'Created', type: 'student' })),
      ...recentClasses.map(c => ({ ...c, date: c.createdAt, action: 'Created', type: 'class' })),
      ...recentTeachers.map(t => ({ ...t, date: t.createdAt, action: 'Created', type: 'teacher' })),
      ...recentEnrollments.map(e => ({ ...e, date: e.enrolledAt, action: 'Enrolled', type: 'enrollment' }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, limit);

    res.json(activities);
  } catch (error) {
    console.error('Error fetching activity timeline:', error);
    res.status(500).json({ error: 'Failed to fetch activity timeline' });
  }
});

export default router;

