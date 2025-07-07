const jwt = require('jsonwebtoken');
const User = require('../models/User');
const crypto = require('crypto');
const { sendMail } = require('../config/mailer');

const generateToken = (userId, role) => {
  return jwt.sign({ userId, role }, process.env.JWT_SECRET, { expiresIn: '24h' });
};

const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    // Generate verification token
    const verification_token = crypto.randomBytes(32).toString('hex');

    // Create new user (role defaults to 'user')
    const userId = await User.create({ username, email, password, verification_token });
    const user = await User.findById(userId);
    const token = generateToken(userId, 'user');

    // Send verification email
    const verifyUrl = `http://localhost:5173/verify-email?token=${verification_token}`;
    await sendMail({
      to: email,
      subject: 'Verify your email address',
      html: `<h2>Welcome to Security Awareness, ${username}!</h2>
        <p>To complete your registration, please verify your email address by clicking the link below:</p>
        <a href="${verifyUrl}" style="color: #2563eb;">Verify Email</a>
        <p>If you did not register, you can ignore this email.</p>`
    });

    res.status(201).json({
      message: 'User registered successfully. Please check your email to verify your account.',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: 'user'
      },
      token,
      role: 'user'
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password, twofa_code } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Check users table for user or admin
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await User.validatePassword(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if 2FA is enabled
    if (user.twofa_enabled) {
      if (!twofa_code) {
        // 2FA required, but no code provided
        return res.status(206).json({
          error: '2FA code required',
          twofa_required: true
        });
      }
      // Verify 2FA code
      const speakeasy = require('speakeasy');
      const verified = speakeasy.totp.verify({
        secret: user.twofa_secret,
        encoding: 'base32',
        token: twofa_code,
        window: 1
      });
      if (!verified) {
        return res.status(401).json({ error: 'Invalid 2FA code', twofa_required: true });
      }
    }

    // Update last login
    await User.updateLastLogin(user.id);

    // Generate token with role
    const token = generateToken(user.id, user.role);

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      },
      token,
      role: user.role
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const verifyEmail = async (req, res) => {
  try {
    console.log('Token received:', req.query.token);
    const user = await User.findByVerificationToken(req.query.token);
    console.log('User found:', user);
    if (!user) {
      // Optionally, you could try to find by email if you want to be more user-friendly
      return res.status(400).json({ error: 'Invalid or expired verification token.' });
    }
    if (user.verified) {
      return res.json({ message: 'Email already verified. You can now log in.' });
    }
    await User.verifyUser(user.id);
    res.json({ message: 'Email verified successfully. You can now log in.' });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  verifyEmail,
  enable2FA,
  verify2FA
}; 