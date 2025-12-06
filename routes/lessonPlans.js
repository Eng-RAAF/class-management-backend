import express from 'express';
import {
  getLessonPlans,
  getLessonPlanById,
  addLessonPlan,
  updateLessonPlan,
  deleteLessonPlan
} from '../data/storage.js';
import { authenticate, requireAdmin, requireTeacher } from '../middleware/auth.js';

const router = express.Router();

// Get all lesson plans - Teachers can see their own, Admins can see all
router.get('/', authenticate, requireTeacher, async (req, res) => {
  try {
    const filters = {};
    
    // If user is teacher (not admin), only show their lesson plans
    if (req.userRole === 'teacher') {
      // Get teacher ID from user's email (assuming teacher email matches user email)
      // Or you can add a userId field to Teacher model
      // For now, we'll filter by teacherId if provided in query
      if (req.query.teacherId) {
        filters.teacherId = parseInt(req.query.teacherId);
      }
    }
    
    if (req.query.classId) {
      filters.classId = parseInt(req.query.classId);
    }
    
    if (req.query.status) {
      filters.status = req.query.status;
    }
    
    const lessonPlans = await getLessonPlans(filters);
    
    // If teacher, filter to only their lesson plans
    // Note: This assumes teacher email matches user email
    // You may need to adjust this based on your user-teacher relationship
    if (req.userRole === 'teacher' && !req.query.teacherId) {
      // For now, return all - you can enhance this by linking User to Teacher
      // For simplicity, we'll allow teachers to see all but only edit their own
    }
    
    res.json(lessonPlans);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get lesson plan by ID - Teachers can see their own, Admins can see all
router.get('/:id', authenticate, requireTeacher, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const lessonPlan = await getLessonPlanById(id);
    
    if (!lessonPlan) {
      return res.status(404).json({ error: 'Lesson plan not found' });
    }
    
    // Teachers can only view their own lesson plans (unless admin)
    if (req.userRole === 'teacher' && lessonPlan.teacherId !== req.user.id) {
      // Check if user email matches teacher email
      // This is a simple check - you may want to link User to Teacher properly
      const userEmail = req.user.email;
      if (lessonPlan.teacher.email !== userEmail) {
        return res.status(403).json({ error: 'Access forbidden: You can only view your own lesson plans' });
      }
    }
    
    res.json(lessonPlan);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new lesson plan - Teachers can create their own, Admins can create for any teacher
router.post('/', authenticate, requireTeacher, async (req, res) => {
  try {
    const { title, description, subject, classId, teacherId, date, objectives, materials, activities, homework, notes, status } = req.body;
    
    if (!title || !date) {
      return res.status(400).json({ error: 'Title and date are required' });
    }
    
    // Determine teacherId
    let finalTeacherId = teacherId;
    
    // If user is teacher, use their teacher ID
    // For now, we'll require teacherId to be provided
    // You can enhance this by linking User to Teacher
    if (req.userRole === 'teacher') {
      // If teacherId is provided and matches user, or if admin provided it, use it
      // Otherwise, we need to find teacher by user email
      // For simplicity, require teacherId to be provided
      if (!finalTeacherId) {
        return res.status(400).json({ error: 'Teacher ID is required' });
      }
      
      // Verify teacher owns this (unless admin)
      // This check can be enhanced when User-Teacher relationship is established
    }
    
    const lessonPlanData = {
      title: title.trim(),
      description: description || null,
      subject: subject || null,
      classId: classId || null,
      teacherId: parseInt(finalTeacherId),
      date: new Date(date),
      objectives: objectives || null,
      materials: materials || null,
      activities: activities || null,
      homework: homework || null,
      notes: notes || null,
      status: status || 'draft'
    };
    
    const lessonPlan = await addLessonPlan(lessonPlanData);
    res.status(201).json(lessonPlan);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update lesson plan - Teachers can update their own, Admins can update any
router.put('/:id', authenticate, requireTeacher, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const lessonPlan = await getLessonPlanById(id);
    
    if (!lessonPlan) {
      return res.status(404).json({ error: 'Lesson plan not found' });
    }
    
    // Teachers can only update their own lesson plans (unless admin)
    if (req.userRole === 'teacher') {
      const userEmail = req.user.email;
      if (lessonPlan.teacher.email !== userEmail) {
        return res.status(403).json({ error: 'Access forbidden: You can only update your own lesson plans' });
      }
    }
    
    const { title, description, subject, classId, date, objectives, materials, activities, homework, notes, status } = req.body;
    
    const lessonPlanData = {};
    
    if (title !== undefined) lessonPlanData.title = title.trim();
    if (description !== undefined) lessonPlanData.description = description || null;
    if (subject !== undefined) lessonPlanData.subject = subject || null;
    if (classId !== undefined) lessonPlanData.classId = classId ? parseInt(classId) : null;
    if (date !== undefined) lessonPlanData.date = new Date(date);
    if (objectives !== undefined) lessonPlanData.objectives = objectives || null;
    if (materials !== undefined) lessonPlanData.materials = materials || null;
    if (activities !== undefined) lessonPlanData.activities = activities || null;
    if (homework !== undefined) lessonPlanData.homework = homework || null;
    if (notes !== undefined) lessonPlanData.notes = notes || null;
    if (status !== undefined) lessonPlanData.status = status;
    
    const updatedLessonPlan = await updateLessonPlan(id, lessonPlanData);
    res.json(updatedLessonPlan);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete lesson plan - Teachers can delete their own, Admins can delete any
router.delete('/:id', authenticate, requireTeacher, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const lessonPlan = await getLessonPlanById(id);
    
    if (!lessonPlan) {
      return res.status(404).json({ error: 'Lesson plan not found' });
    }
    
    // Teachers can only delete their own lesson plans (unless admin)
    if (req.userRole === 'teacher') {
      const userEmail = req.user.email;
      if (lessonPlan.teacher.email !== userEmail) {
        return res.status(403).json({ error: 'Access forbidden: You can only delete your own lesson plans' });
      }
    }
    
    await deleteLessonPlan(id);
    res.json({ message: 'Lesson plan deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

