import express from 'express';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Test endpoint to verify JWT_SECRET is set
router.get('/test-auth', (req, res) => {
  const jwtSecret = process.env.JWT_SECRET;
  
  res.json({
    message: 'Auth Configuration Test',
    jwtSecretSet: !!jwtSecret,
    jwtSecretLength: jwtSecret ? jwtSecret.length : 0,
    environment: process.env.NODE_ENV || 'development',
    isProduction: process.env.NODE_ENV === 'production',
    timestamp: new Date().toISOString()
  });
});

// Test token generation and verification
router.post('/test-token', (req, res) => {
  try {
    const secret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    
    // Create test token
    const testPayload = { userId: 1, email: 'test@example.com', role: 'admin' };
    const token = jwt.sign(testPayload, secret, { expiresIn: '7d' });
    
    // Verify it immediately
    const decoded = jwt.verify(token, secret);
    
    res.json({
      success: true,
      message: 'Token generation and verification working',
      jwtSecretSet: !!process.env.JWT_SECRET,
      tokenGenerated: !!token,
      tokenVerified: !!decoded,
      decoded: decoded
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      jwtSecretSet: !!process.env.JWT_SECRET
    });
  }
});

export default router;

