import express from 'express';
import {
  getSchools,
  getSchoolById,
  addSchool,
  updateSchool,
  deleteSchool
} from '../data/storage.js';
import { authenticate, requireAdmin, requireTeacher } from '../middleware/auth.js';

const router = express.Router();

// Get all schools - requires teacher or admin role
router.get('/', authenticate, requireTeacher, async (req, res) => {
  try {
    const schools = await getSchools();
    res.json(schools);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get school by ID
router.get('/:id', authenticate, requireTeacher, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const school = await getSchoolById(id);
    if (!school) {
      return res.status(404).json({ error: 'School not found' });
    }
    res.json(school);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new school
router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, code, address, phone, email, principal, description } = req.body;
    
    // Validation
    if (!name || !code) {
      return res.status(400).json({ error: 'Name and code are required' });
    }
    
    const schoolData = {
      name: String(name).trim(),
      code: String(code).trim(),
    };
    
    if (address) schoolData.address = String(address).trim();
    if (phone) schoolData.phone = String(phone).trim();
    if (email) schoolData.email = String(email).trim();
    if (principal) schoolData.principal = String(principal).trim();
    if (description) schoolData.description = String(description).trim();
    
    const school = await addSchool(schoolData);
    res.status(201).json(school);
  } catch (error) {
    console.error('Error creating school:', error);
    
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'School code already exists' });
    }
    if (error.code === 'P2003') {
      return res.status(400).json({ error: 'Invalid data provided' });
    }
    if (error.code === 'P1001') {
      return res.status(500).json({ error: 'Cannot reach database server. Please check your database connection.' });
    }
    
    res.status(500).json({ 
      error: error.message || 'Failed to create school',
      ...(process.env.NODE_ENV === 'development' && { details: error.stack })
    });
  }
});

// Update school
router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const school = await getSchoolById(id);
    
    if (!school) {
      return res.status(404).json({ error: 'School not found' });
    }
    
    const { name, code, address, phone, email, principal, description } = req.body;
    
    const schoolData = {};
    if (name) schoolData.name = String(name).trim();
    if (code) schoolData.code = String(code).trim();
    if (address !== undefined) schoolData.address = address ? String(address).trim() : null;
    if (phone !== undefined) schoolData.phone = phone ? String(phone).trim() : null;
    if (email !== undefined) schoolData.email = email ? String(email).trim() : null;
    if (principal !== undefined) schoolData.principal = principal ? String(principal).trim() : null;
    if (description !== undefined) schoolData.description = description ? String(description).trim() : null;
    
    const updatedSchool = await updateSchool(id, schoolData);
    res.json(updatedSchool);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'School code already exists' });
    }
    if (error.code === 'P2003') {
      return res.status(400).json({ error: 'Invalid data provided' });
    }
    res.status(500).json({ error: error.message });
  }
});

// Delete school
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const school = await getSchoolById(id);
    
    if (!school) {
      return res.status(404).json({ error: 'School not found' });
    }
    
    await deleteSchool(id);
    res.json({ message: 'School deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

