import express from 'express';
import prisma from '../lib/prisma.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { generateOTP, sendOTP, verifyOTP, formatPhoneNumber, validatePhoneNumber } from '../lib/phoneVerification.js';

const router = express.Router();

// Send OTP endpoint
router.post('/send-otp', async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber || phoneNumber.trim() === '') {
      return res.status(400).json({ error: 'Phone number is required to send OTP' });
    }

    // Format and validate phone number
    const formattedPhone = formatPhoneNumber(phoneNumber);
    if (!validatePhoneNumber(formattedPhone)) {
      return res.status(400).json({ error: 'Invalid phone number format' });
    }

    // Check if phone number is already registered
    const existingUser = await prisma.user.findUnique({
      where: { phoneNumber: formattedPhone }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Phone number is already registered' });
    }

    // Generate and send OTP
    const otp = generateOTP();
    await sendOTP(formattedPhone, otp);

    // Always include OTP in development mode for testing
    // In production, remove this and only send via SMS
    const isDevelopment = !process.env.NODE_ENV || process.env.NODE_ENV === 'development';
    
    console.log(`\n📱 ===== OTP GENERATED =====`);
    console.log(`Phone: ${formattedPhone}`);
    console.log(`OTP: ${otp}`);
    console.log(`Valid for: 5 minutes`);
    console.log(`=============================\n`);
    
    res.json({
      message: isDevelopment 
        ? 'OTP generated successfully (development mode)' 
        : 'OTP sent successfully to your phone',
      // Always include OTP in development for testing
      ...(isDevelopment && { otp, developmentMode: true })
    });
  } catch (error) {
    console.error('Error sending OTP:', error);
    console.error('Error stack:', error.stack);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    res.status(500).json({ 
      error: 'Failed to send OTP',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Verify OTP endpoint
router.post('/verify-otp', async (req, res) => {
  try {
    const { phoneNumber, otp } = req.body;

    if (!phoneNumber || !otp) {
      return res.status(400).json({ error: 'Phone number and OTP are required' });
    }

    const formattedPhone = formatPhoneNumber(phoneNumber);
    const verification = verifyOTP(formattedPhone, otp);

    if (!verification.valid) {
      return res.status(400).json({ error: verification.error });
    }

    res.json({
      message: 'OTP verified successfully',
      verified: true
    });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({ error: 'Failed to verify OTP' });
  }
});

// Register endpoint
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, role, phoneNumber, otp } = req.body;

    console.log('Registration request:', { email, name, hasPhone: !!phoneNumber, hasOtp: !!otp });

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    // Check if user already exists (email)
    const normalizedEmail = email.toLowerCase().trim();
    const existingUserByEmail = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (existingUserByEmail) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Phone number is optional - only process if provided and not empty
    let formattedPhone = null;
    let phoneVerified = false;

    // Check if phoneNumber is provided and not empty
    // Handle both string and non-string values
    const hasPhoneNumber = phoneNumber !== null && 
                          phoneNumber !== undefined && 
                          phoneNumber !== '' && 
                          String(phoneNumber).trim() !== '';

    if (hasPhoneNumber) {
      // Format and validate phone number
      formattedPhone = formatPhoneNumber(String(phoneNumber));
      if (!validatePhoneNumber(formattedPhone)) {
        return res.status(400).json({ error: 'Invalid phone number format' });
      }

      // Verify OTP if provided (for registration) - OTP is optional
      // If OTP is provided but invalid, we still allow registration (phoneVerified = false)
      if (otp && otp !== '' && String(otp).trim() !== '') {
        const verification = verifyOTP(formattedPhone, String(otp));
        if (verification.valid) {
          phoneVerified = true;
          console.log('Phone number verified with OTP');
        } else {
          // OTP verification failed, but since verification is optional, we continue
          // User will be registered with phoneVerified = false
          console.log(`OTP verification failed for ${formattedPhone}: ${verification.error}`);
          console.log('Continuing registration without phone verification (optional)');
        }
      } else {
        // No OTP provided - registration continues without verification
        console.log('No OTP provided, registering without phone verification');
      }

      // Check if phone number is already registered
      const existingUserByPhone = await prisma.user.findUnique({
        where: { phoneNumber: formattedPhone }
      });

      if (existingUserByPhone) {
        return res.status(400).json({ error: 'Phone number is already registered' });
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user (store email in lowercase)
    const userData = {
      email: normalizedEmail,
      password: hashedPassword,
      name,
      role: role || 'student'
    };

    // Only add phone number if provided
    if (formattedPhone) {
      userData.phoneNumber = formattedPhone;
      userData.phoneVerified = phoneVerified;
    }

    const user = await prisma.user.create({
      data: userData,
      select: {
        id: true,
        email: true,
        name: true,
        phoneNumber: true,
        phoneVerified: true,
        role: true,
        createdAt: true
      }
    });

    // Generate JWT token
    //guul
    //guul two
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      user,
      token
    });
  } catch (error) {
    console.error('=== REGISTRATION ERROR ===');
    console.error('Timestamp:', new Date().toISOString());
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Error stack:', error.stack);
    console.error('Error meta:', JSON.stringify(error.meta, null, 2));
    console.error('Request body:', JSON.stringify({ 
      email: req.body?.email, 
      name: req.body?.name, 
      hasPassword: !!req.body?.password,
      hasPhone: !!req.body?.phoneNumber 
    }));
    console.error('Environment:', {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      hasJwtSecret: !!process.env.JWT_SECRET
    });
    
    // Handle Prisma unique constraint errors
    if (error.code === 'P2002') {
      const field = error.meta?.target?.[0];
      if (field === 'email') {
        return res.status(400).json({ error: 'Email already exists' });
      }
      if (field === 'phoneNumber') {
        return res.status(400).json({ error: 'Phone number already exists' });
      }
      return res.status(400).json({ 
        error: `This ${field} is already in use`,
        field: field
      });
    }
    
    // Handle database connection errors
    if (error.code === 'P1001' || 
        error.message?.includes("Can't reach database server") ||
        error.message?.includes('connection') ||
        error.message?.includes('prepared statement') ||
        error.message?.includes('WSAStartup')) {
      console.error('Database connection error detected');
      return res.status(500).json({ 
        error: 'Database connection failed. Please try again later.',
        details: process.env.NODE_ENV === 'development' || process.env.VERCEL ? error.message : undefined,
        code: error.code
      });
    }
    
    // Handle Supabase "Tenant or user not found" error
    if (error.message?.includes('Tenant or user not found') || 
        error.message?.includes('FATAL: Tenant or user not found')) {
      console.error('Supabase connection error: Invalid DATABASE_URL');
      return res.status(500).json({ 
        error: 'Database connection failed: Invalid credentials or project reference',
        details: 'The DATABASE_URL in Vercel environment variables is incorrect. Please check:',
        instructions: [
          '1. Go to Supabase Dashboard → Your Project → Settings → Database',
          '2. Copy the "Connection string" under "Connection pooling"',
          '3. OR use "Direct connection" (port 6543) for better reliability',
          '4. Make sure to replace [YOUR-PASSWORD] with your actual database password',
          '5. Update DATABASE_URL in Vercel Backend project → Settings → Environment Variables',
          '6. Format should be: postgresql://postgres.[PROJECT-REF]:[PASSWORD]@[HOST]:[PORT]/postgres',
          '7. Redeploy the backend after updating the variable'
        ],
        hint: 'This error usually means the project reference, password, or host in DATABASE_URL is incorrect'
      });
    }
    
    // Handle DATABASE_URL validation errors
    if (error.message?.includes('DATABASE_URL') || 
        error.message?.includes('must start with the protocol') ||
        error.message?.includes('postgresql://') ||
        error.message?.includes('postgres://')) {
      console.error('DATABASE_URL validation error detected');
      return res.status(500).json({ 
        error: 'Database configuration error: DATABASE_URL is missing or invalid',
        details: 'The DATABASE_URL environment variable is not set correctly in Vercel.',
        instructions: [
          '1. Go to Vercel Dashboard → Your Backend Project → Settings → Environment Variables',
          '2. Check if DATABASE_URL exists and has a valid value',
          '3. DATABASE_URL must start with "postgresql://" or "postgres://"',
          '4. Get the connection string from Supabase Dashboard → Settings → Database',
          '5. Use "Direct connection" (port 6543) for better reliability',
          '6. Format: postgresql://postgres.[PROJECT-REF]:[PASSWORD]@[HOST]:6543/postgres',
          '7. Replace [YOUR-PASSWORD] with your actual database password',
          '8. Make sure it\'s set for Production, Preview, and Development',
          '9. Redeploy the backend after updating'
        ],
        hint: 'This error means DATABASE_URL is either missing, empty, or has an invalid format in Vercel environment variables.'
      });
    }
    
    // Handle Prisma client errors
    if (error.message?.includes('Prisma Client') || 
        error.message?.includes('not initialized') ||
        (error.message?.includes('not found') && !error.message?.includes('Tenant'))) {
      console.error('Prisma Client error detected');
      return res.status(500).json({ 
        error: 'Database service error. Please contact support.',
        details: process.env.NODE_ENV === 'development' || process.env.VERCEL ? error.message : undefined
      });
    }
    
    // Handle validation errors
    if (error.name === 'ValidationError' || error.code === 'P2003') {
      return res.status(400).json({ 
        error: error.message || 'Validation error',
        details: process.env.NODE_ENV === 'development' || process.env.VERCEL ? error.message : undefined
      });
    }
    
    // Generic error response - include more details in Vercel for debugging
    const isVercel = process.env.VERCEL === '1';
    res.status(500).json({ 
      error: 'Failed to register user',
      details: (process.env.NODE_ENV === 'development' || isVercel) ? error.message : undefined,
      code: error.code,
      ...(isVercel && { 
        errorName: error.name,
        hint: 'Check Vercel function logs for more details'
      })
    });
  }
});

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('=== LOGIN ATTEMPT ===');
    console.log('Email:', email);
    console.log('Password provided:', !!password);
    console.log('Request body:', JSON.stringify({ email, passwordProvided: !!password }));

    if (!email || !password) {
      console.log('Missing email or password');
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user (normalize email for lookup)
    const normalizedEmail = email.toLowerCase().trim();
    console.log('Normalized email:', normalizedEmail);
    
    let user;
    try {
      user = await prisma.user.findUnique({
        where: { email: normalizedEmail }
      });
      console.log('Database query successful');
    } catch (dbError) {
      console.error('Database error during user lookup:', dbError);
      console.error('Error code:', dbError.code);
      console.error('Error message:', dbError.message);
      return res.status(500).json({ 
        error: 'Database error occurred',
        details: process.env.NODE_ENV === 'development' ? dbError.message : undefined
      });
    }

    console.log('User found:', user ? 'Yes' : 'No');
    if (user) {
      console.log('User ID:', user.id);
      console.log('User email:', user.email);
      console.log('User name:', user.name);
    }

    if (!user) {
      console.log('User not found for email:', normalizedEmail);
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Verify password
    let isValidPassword;
    try {
      isValidPassword = await bcrypt.compare(password, user.password);
      console.log('Password comparison result:', isValidPassword);
    } catch (bcryptError) {
      console.error('Bcrypt error:', bcryptError);
      return res.status(500).json({ error: 'Error verifying password' });
    }

    if (!isValidPassword) {
      console.log('Invalid password for user:', normalizedEmail);
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    console.log('✅ Login successful for:', normalizedEmail);

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      token
    });
  } catch (error) {
    console.error('=== LOGIN ERROR ===');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Error stack:', error.stack);
    
    // Check for database connection errors
    if (error.code === 'P1001' || error.message?.includes("Can't reach database server")) {
      return res.status(500).json({ 
        error: 'Database connection failed. Please try again.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
    
    // Check for prepared statement errors
    if (error.message?.includes('prepared statement') || error.code === '42P05') {
      console.error('Prepared statement error detected - this should be handled by Prisma wrapper');
      return res.status(500).json({ 
        error: 'Database error occurred. Please try again.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to login',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Verify token endpoint
router.get('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'your-secret-key-change-in-production'
    );

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true
      }
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

export default router;

