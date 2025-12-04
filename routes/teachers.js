import express from 'express';
import {
  getTeachers,
  getTeacherById,
  addTeacher,
  updateTeacher,
  deleteTeacher
} from '../data/storage.js';
import { authenticate, requireAdmin, requireTeacher } from '../middleware/auth.js';

const router = express.Router();

// Get all teachers - requires teacher or admin role
router.get('/', authenticate, requireTeacher, async (req, res) => {
  try {
    const teachers = await getTeachers();
    res.json(teachers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get teacher by ID - requires teacher or admin role
router.get('/:id', authenticate, requireTeacher, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const teacher = await getTeacherById(id);
    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }
    res.json(teacher);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new teacher - requires admin role
router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, email, subject, department } = req.body;
    
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }
    
    // Prepare data for Prisma - convert empty strings to null
    const teacherData = {
      name: name.trim(),
      email: email.trim(),
      subject: subject && subject.trim() !== '' ? subject.trim() : null,
      department: department && department.trim() !== '' ? department.trim() : null,
    };
    
    const teacher = await addTeacher(teacherData);
    res.status(201).json(teacher);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: error.message });
  }
});

// Update teacher - requires admin role
router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const teacher = await getTeacherById(id);
    
    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }
    
    const { name, email, subject, department } = req.body;
    
    // Prepare data for Prisma - convert empty strings to null
    const teacherData = {
      name: name ? name.trim() : teacher.name,
      email: email ? email.trim() : teacher.email,
      subject: subject !== undefined ? (subject && subject.trim() !== '' ? subject.trim() : null) : teacher.subject,
      department: department !== undefined ? (department && department.trim() !== '' ? department.trim() : null) : teacher.department,
    };
    
    const updatedTeacher = await updateTeacher(id, teacherData);
    res.json(updatedTeacher);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: error.message });
  }
});

// Delete teacher - requires admin role
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const teacher = await getTeacherById(id);
    
    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }
    
    await deleteTeacher(id);
    res.json({ message: 'Teacher deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
