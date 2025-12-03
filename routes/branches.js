import express from 'express';
import {
  getBranches,
  getBranchById,
  getBranchesBySchool,
  addBranch,
  updateBranch,
  deleteBranch
} from '../data/storage.js';

const router = express.Router();

// Get all branches
//branchesadda
//schooladda
//branchupdate
router.get('/', async (req, res) => {
  try {
    const branches = await getBranches();
    res.json(branches);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get branches by school
router.get('/school/:schoolId', async (req, res) => {
  try {
    const schoolId = parseInt(req.params.schoolId);
    const branches = await getBranchesBySchool(schoolId);
    res.json(branches);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get branch by ID
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const branch = await getBranchById(id);
    if (!branch) {
      return res.status(404).json({ error: 'Branch not found' });
    }
    res.json(branch);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new branch
router.post('/', async (req, res) => {
  try {
    const { name, code, schoolId, address, phone, email, manager, description } = req.body;
    
    // Validation
    if (!name || !code || !schoolId) {
      return res.status(400).json({ error: 'Name, code, and school are required' });
    }
    
    const branchData = {
      name: String(name).trim(),
      code: String(code).trim(),
      schoolId: parseInt(schoolId),
    };
    
    if (address) branchData.address = String(address).trim();
    if (phone) branchData.phone = String(phone).trim();
    if (email) branchData.email = String(email).trim();
    if (manager) branchData.manager = String(manager).trim();
    if (description) branchData.description = String(description).trim();
    
    const branch = await addBranch(branchData);
    res.status(201).json(branch);
  } catch (error) {
    console.error('Error creating branch:', error);
    
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Branch code already exists' });
    }
    if (error.code === 'P2003') {
      return res.status(400).json({ error: 'Invalid data provided' });
    }
    if (error.code === 'P1001') {
      return res.status(500).json({ error: 'Cannot reach database server. Please check your database connection.' });
    }
    
    res.status(500).json({ 
      error: error.message || 'Failed to create branch',
      ...(process.env.NODE_ENV === 'development' && { details: error.stack })
    });
  }
});

// Update branch
router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const branch = await getBranchById(id);
    
    if (!branch) {
      return res.status(404).json({ error: 'Branch not found' });
    }
    
    const { name, code, schoolId, address, phone, email, manager, description } = req.body;
    
    const branchData = {};
    if (name) branchData.name = String(name).trim();
    if (code) branchData.code = String(code).trim();
    if (schoolId) branchData.schoolId = parseInt(schoolId);
    if (address !== undefined) branchData.address = address ? String(address).trim() : null;
    if (phone !== undefined) branchData.phone = phone ? String(phone).trim() : null;
    if (email !== undefined) branchData.email = email ? String(email).trim() : null;
    if (manager !== undefined) branchData.manager = manager ? String(manager).trim() : null;
    if (description !== undefined) branchData.description = description ? String(description).trim() : null;
    
    const updatedBranch = await updateBranch(id, branchData);
    res.json(updatedBranch);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Branch code already exists' });
    }
    if (error.code === 'P2003') {
      return res.status(400).json({ error: 'Invalid data provided' });
    }
    res.status(500).json({ error: error.message });
  }
});

// Delete branch
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const branch = await getBranchById(id);
    
    if (!branch) {
      return res.status(404).json({ error: 'Branch not found' });
    }
    
    await deleteBranch(id);
    res.json({ message: 'Branch deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

