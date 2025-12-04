import express from 'express';
import prisma from '../lib/prisma.js';
import { authenticate, requireStudent } from '../middleware/auth.js';

const router = express.Router();

// Get all messages for a user (both sent and received) - requires authentication
router.get('/', authenticate, requireStudent, async (req, res) => {
  try {
    const userId = parseInt(req.query.userId);
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId },
          { receiverId: userId }
        ]
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        receiver: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Get conversation between two users
router.get('/conversation', async (req, res) => {
  try {
    const userId1 = parseInt(req.query.userId1);
    const userId2 = parseInt(req.query.userId2);

    if (!userId1 || !userId2) {
      return res.status(400).json({ error: 'Both user IDs are required' });
    }

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          {
            senderId: userId1,
            receiverId: userId2
          },
          {
            senderId: userId2,
            receiverId: userId1
          }
        ]
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        receiver: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    res.json(messages);
  } catch (error) {
    console.error('Error fetching conversation:', error);
    res.status(500).json({ error: 'Failed to fetch conversation' });
  }
});

// Get unread messages count for a user
router.get('/unread/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);

    const count = await prisma.message.count({
      where: {
        receiverId: userId,
        read: false
      }
    });

    res.json({ count });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ error: 'Failed to fetch unread count' });
  }
});

// Create a new message
router.post('/', async (req, res) => {
  try {
    const { senderId, receiverId, content } = req.body;

    if (!senderId || !receiverId || !content) {
      return res.status(400).json({ error: 'Sender ID, receiver ID, and content are required' });
    }

    const message = await prisma.message.create({
      data: {
        senderId: parseInt(senderId),
        receiverId: parseInt(receiverId),
        content: content.trim()
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        receiver: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    res.status(201).json(message);
  } catch (error) {
    console.error('Error creating message:', error);
    res.status(500).json({ error: 'Failed to create message' });
  }
});

// Mark message as read
router.put('/:id/read', async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const message = await prisma.message.update({
      where: { id },
      data: { read: true },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        receiver: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    res.json(message);
  } catch (error) {
    console.error('Error marking message as read:', error);
    res.status(500).json({ error: 'Failed to mark message as read' });
  }
});

// Delete a message
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    await prisma.message.delete({
      where: { id }
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

export default router;

