import express from 'express';
import {
  getClasses,
  getClassById,
  addClass,
  updateClass,
  deleteClass
} from '../data/storage.js';

const router = express.Router();

// Get all classes
//
//ali nuux
router.get('/', async (req, res) => {
  try {
    const classes = await getClasses();
    res.json(classes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get class by ID
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const classItem = await getClassById(id);
    if (!classItem) {
      return res.status(404).json({ error: 'Class not found' });
    }
    res.json(classItem);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new class
router.post('/', async (req, res) => {
  try {
    const { name, code, description, teacherId, schedule, capacity } = req.body;
    
    if (!name || !code) {
      return res.status(400).json({ error: 'Name and code are required' });
    }
    
    // Prepare data for Prisma - convert empty strings to null and parse integers
    const classData = {
      name: name.trim(),
      code: code.trim(),
      description: description && description.trim() !== '' ? description.trim() : null,
      teacherId: teacherId && teacherId !== '' && !isNaN(teacherId) ? parseInt(teacherId) : null,
      schedule: schedule && schedule.trim() !== '' ? schedule.trim() : null,
      capacity: capacity && capacity !== '' && !isNaN(capacity) ? parseInt(capacity) : null,
    };
    
    const newClass = await addClass(classData);
    res.status(201).json(newClass);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Class code already exists' });
    }
    if (error.code === 'P2003') {
      return res.status(400).json({ error: 'Invalid teacher ID provided' });
    }
    res.status(500).json({ error: error.message });
  }
});

// Update class
router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const classItem = await getClassById(id);
    
    if (!classItem) {
      return res.status(404).json({ error: 'Class not found' });
    }
    
    const { name, code, description, teacherId, schedule, capacity } = req.body;
    
    // Prepare data for Prisma - convert empty strings to null and parse integers
    const classData = {
      name: name ? name.trim() : classItem.name,
      code: code ? code.trim() : classItem.code,
      description: description !== undefined ? (description && description.trim() !== '' ? description.trim() : null) : classItem.description,
      teacherId: teacherId !== undefined ? (teacherId && teacherId !== '' && !isNaN(teacherId) ? parseInt(teacherId) : null) : classItem.teacherId,
      schedule: schedule !== undefined ? (schedule && schedule.trim() !== '' ? schedule.trim() : null) : classItem.schedule,
      capacity: capacity !== undefined ? (capacity && capacity !== '' && !isNaN(capacity) ? parseInt(capacity) : null) : classItem.capacity,
    };
    
    const updatedClass = await updateClass(id, classData);
    res.json(updatedClass);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Class code already exists' });
    }
    if (error.code === 'P2003') {
      return res.status(400).json({ error: 'Invalid teacher ID provided' });
    }
    res.status(500).json({ error: error.message });
  }
});

// Delete class
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const classItem = await getClassById(id);
    
    if (!classItem) {
      return res.status(404).json({ error: 'Class not found' });
    }
    
    await deleteClass(id);
    res.json({ message: 'Class deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
