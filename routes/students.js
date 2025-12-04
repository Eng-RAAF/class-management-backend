import express from 'express';
import {
  getStudents,
  getStudentById,
  addStudent,
  updateStudent,
  deleteStudent
} from '../data/storage.js';
import { authenticate, requireAdmin, requireTeacher } from '../middleware/auth.js';

const router = express.Router();

// Get all students - requires teacher or admin role
router.get('/', authenticate, requireTeacher, async (req, res) => {
  try {
    const students = await getStudents();
    res.json(students);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get student by ID - requires teacher or admin role
router.get('/:id', authenticate, requireTeacher, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const student = await getStudentById(id);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    res.json(student);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new student - requires admin role
router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, email, age, grade } = req.body;
    
    // Validation
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }
    
    // Prepare data for Prisma - only include fields that are provided
    const studentData = {
      name: String(name).trim(),
      email: String(email).trim(),
    };
    
    // Handle age - only add if it's a valid number
    if (age !== undefined && age !== null && age !== '') {
      const ageNum = parseInt(age);
      if (!isNaN(ageNum) && ageNum > 0) {
        studentData.age = ageNum;
      }
    }
    
    // Handle grade - only add if it's not empty
    if (grade !== undefined && grade !== null && String(grade).trim() !== '') {
      studentData.grade = String(grade).trim();
    }
    
    console.log('Creating student with data:', studentData);
    
    const student = await addStudent(studentData);
    res.status(201).json(student);
  } catch (error) {
    console.error('Error creating student:', error);
    console.error('Error code:', error.code);
    console.error('Error meta:', error.meta);
    console.error('Error stack:', error.stack);
    
    // Ensure we always send a JSON response
    if (res.headersSent) {
      return next(error);
    }
    
    // Handle Prisma-specific errors
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Email already exists' });
    }
    if (error.code === 'P2003') {
      return res.status(400).json({ error: 'Invalid data provided' });
    }
    if (error.code === 'P1001') {
      return res.status(500).json({ error: 'Cannot reach database server. Please check your database connection.' });
    }
    if (error.code === 'P1008') {
      return res.status(500).json({ error: 'Database operation timed out' });
    }
    
    // Return detailed error in development, generic in production
    const errorResponse = { 
      error: error.message || 'Failed to create student'
    };
    
    if (process.env.NODE_ENV === 'development') {
      errorResponse.details = error.stack;
      errorResponse.code = error.code;
      errorResponse.meta = error.meta;
    }
    
    return res.status(500).json(errorResponse);
  }
});

// Update student - requires admin role
router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const student = await getStudentById(id);
    
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    const { name, email, age, grade } = req.body;
    
    // Prepare data for Prisma - convert empty strings to null and parse age to integer
    const studentData = {
      name: name ? name.trim() : student.name,
      email: email ? email.trim() : student.email,
      age: age !== undefined && age !== '' && !isNaN(age) ? parseInt(age) : (age === '' ? null : student.age),
      grade: grade !== undefined ? (grade && grade.trim() !== '' ? grade.trim() : null) : student.grade,
    };
    
    const updatedStudent = await updateStudent(id, studentData);
    res.json(updatedStudent);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Email already exists' });
    }
    if (error.code === 'P2003') {
      return res.status(400).json({ error: 'Invalid data provided' });
    }
    res.status(500).json({ error: error.message });
  }
});

// Delete student - requires admin role
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const student = await getStudentById(id);
    
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    await deleteStudent(id);
    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
