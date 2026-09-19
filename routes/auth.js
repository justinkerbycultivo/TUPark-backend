const express = require('express');
const bcrypt = require('bcryptjs');

const router = express.Router();
const User = require('../models/User');
const { generateCaptcha, verifyCaptcha } = require('../utils/captcha');

const MAX_ATTEMPTS = 3;
const LOCK_DURATION_MS = 60 * 1000; // 1 minute

function publicUser(user) {
  return {
    id: user._id,
    surname: user.surname,
    givenName: user.givenName,
    middleName: user.middleName,
    fullName: [user.givenName, user.middleName, user.surname]
      .filter(Boolean)
      .join(' '),
    studentId: user.studentId,
    email: user.email,
    contactNumber: user.contactNumber,
    vehicle: user.vehicle,
    role: user.role,
    isAdmin: user.isAdmin,
    qrToken: user.qrToken,
  };
}

// GET /api/auth/captcha -> Week 1.4: get a CAPTCHA challenge before logging in
router.get('/captcha', (req, res) => {
  res.json(generateCaptcha());
});

// Register
router.post('/register', async (req, res) => {
  console.log('[auth] POST /register body:', {
    ...req.body,
    password: '(hidden)',
  });

  try {
    const {
      surname,
      givenName,
      middleName,
      studentId,
      email,
      contactNumber,
      password,
      plateNumber,
      vehicleType,
    } = req.body;

    console.log('[auth] registration validation:', {
      surname: !!surname,
      givenName: !!givenName,
      studentId: !!studentId,
      email: !!email,
      contactNumber: !!contactNumber,
      password: !!password,
      plateNumber: !!plateNumber,
      vehicleType: !!vehicleType,
    });

    if (
      !surname ||
      !givenName ||
      !studentId ||
      !email ||
      !contactNumber ||
      !password ||
      !plateNumber ||
      !vehicleType
    ) {
      return res.status(400).json({
        message: 'Please fill in all required fields, including vehicle info',
      });
    }

    if (!['car', 'motorcycle'].includes(vehicleType)) {
      return res.status(400).json({
        message: 'Vehicle type must be car or motorcycle',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const normalizedPlate = plateNumber.trim().toUpperCase();

    const existingEmail = await User.findOne({
      email: normalizedEmail,
    });

    if (existingEmail) {
      return res.status(400).json({
        message: 'Email is already registered',
      });
    }

    const existingStudentId = await User.findOne({
      studentId,
    });

    if (existingStudentId) {
      return res.status(400).json({
        message: 'Student ID is already registered',
      });
    }

    const existingPlate = await User.findOne({
      'vehicle.plateNumber': normalizedPlate,
    });

    if (existingPlate) {
      return res.status(400).json({
        message: 'This vehicle plate number is already registered',
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      surname,
      givenName,
      middleName: middleName || '',
      studentId,
      email: normalizedEmail,
      contactNumber,
      passwordHash,
      vehicle: {
        plateNumber: normalizedPlate,
        vehicleType,
      },
    });

    res.status(201).json({
      message: 'Account created successfully',
      user: publicUser(user),
    });
  } catch (error) {
    console.error('Registration error:', error);

    if (error.code === 11000) {
      return res.status(400).json({
        message: 'This account, Student ID, or vehicle plate is already registered',
      });
    }

    res.status(500).json({
      message: 'Server error',
    });
  }
});

// Login (Week 1)
router.post('/login', async (req, res) => {
  console.log('[auth] POST /login body:', { ...req.body, password: '(hidden)' });
  try {
    const { email, password, captchaId, captchaAnswer } = req.body;

    // 1.3 - shall not proceed if a field is empty
    if (!email || !password) {
      return res.status(400).json({ message: 'Please enter email and password' });
    }

    // 1.5 - require successful CAPTCHA verification before authenticating
    if (!captchaId || captchaAnswer === undefined || captchaAnswer === null) {
      return res.status(400).json({ message: 'Please complete the CAPTCHA' });
    }
    if (!verifyCaptcha(captchaId, captchaAnswer)) {
      return res.status(400).json({ message: 'Incorrect CAPTCHA answer', captchaFailed: true });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // 1.9 - account temporarily locked
    if (user.lockUntil && user.lockUntil > new Date()) {
      const secondsLeft = Math.ceil((user.lockUntil.getTime() - Date.now()) / 1000);
      return res.status(423).json({
        message: `Too many failed attempts. Try again in ${secondsLeft}s.`,
        lockedForSeconds: secondsLeft,
      });
    }

    // 1.6 - validate credentials
    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      // 1.8 - limit login attempts to 3 consecutive failures
      user.failedLoginAttempts += 1;

      if (user.failedLoginAttempts >= MAX_ATTEMPTS) {
        user.lockUntil = new Date(Date.now() + LOCK_DURATION_MS);
        user.failedLoginAttempts = 0;
        await user.save();
        return res.status(423).json({
          message: 'Too many failed attempts. Account locked for 1 minute.',
          lockedForSeconds: LOCK_DURATION_MS / 1000,
        });
      }

      await user.save();
      // 1.7 - display an error message when incorrect credentials are entered
      return res.status(401).json({
        message: `Invalid email or password. ${MAX_ATTEMPTS - user.failedLoginAttempts} attempt(s) left before lockout.`,
      });
    }

    // Successful login: reset attempt counter
    user.failedLoginAttempts = 0;
    user.lockUntil = null;
    await user.save();

    res.status(200).json({
      message: 'Login successful',
      user: publicUser(user),
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


module.exports = router;
