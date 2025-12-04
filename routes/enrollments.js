import express from 'express';
import {
  getEnrollments,
  getEnrollmentById,
  getEnrollmentsByStudent,
  getEnrollmentsByClass,
  addEnrollment,
  deleteEnrollment,
  deleteEnrollmentByStudentAndClass,
  getStudentById,
  getClassById
} from '../data/storage.js';
import { authenticate, requireAdmin, requireTeacher, requireStudent } from '../middleware/auth.js';

const router = express.Router();

// Get all enrollments - requires teacher or admin role
router.get('/', authenticate, requireTeacher, async (req, res) => {
  try {
    const enrollments = await getEnrollments();
    res.json(enrollments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get enrollment by ID - requires authentication
router.get('/:id', authenticate, requireStudent, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const enrollment = await getEnrollmentById(id);
    if (!enrollment) {
      return res.status(404).json({ error: 'Enrollment not found' });
    }
    res.json(enrollment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get enrollments by student ID
router.get('/student/:studentId', async (req, res) => {
  try {
    const studentId = parseInt(req.params.studentId);
    const student = await getStudentById(studentId);
    
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    const enrollments = await getEnrollmentsByStudent(studentId);
    res.json({
      student: { id: student.id, name: student.name, email: student.email },
      enrollments: enrollments
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get enrollments by class ID
router.get('/class/:classId', async (req, res) => {
  try {
    const classId = parseInt(req.params.classId);
    const classItem = await getClassById(classId);
    
    if (!classItem) {
      return res.status(404).json({ error: 'Class not found' });
    }
    
    const enrollments = await getEnrollmentsByClass(classId);
    res.json({
      class: { id: classItem.id, name: classItem.name, code: classItem.code },
      enrollments: enrollments
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Enroll student in class
router.post('/', async (req, res) => {
  try {
    const { studentId, classId } = req.body;
    
    if (!studentId || !classId) {
      return res.status(400).json({ error: 'Student ID and Class ID are required' });
    }
    
    const enrollment = await addEnrollment({ studentId, classId });
    res.status(201).json(enrollment);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete enrollment by ID
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const enrollment = await getEnrollmentById(id);
    
    if (!enrollment) {
      return res.status(404).json({ error: 'Enrollment not found' });
    }
    
    await deleteEnrollment(id);
    res.json({ message: 'Enrollment deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Unenroll student from class - requires teacher or admin role
router.delete('/student/:studentId/class/:classId', authenticate, requireTeacher, async (req, res) => {
  try {
    const studentId = parseInt(req.params.studentId);
    const classId = parseInt(req.params.classId);
    
    const enrollment = await deleteEnrollmentByStudentAndClass(studentId, classId);
    if (!enrollment) {
      return res.status(404).json({ error: 'Enrollment not found' });
    }
    
    res.json({ message: 'Student unenrolled successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
