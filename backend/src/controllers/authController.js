const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body } = require('express-validator');
const pool = require('../config/database');
const { validateRequest } = require('../middleware/errorHandler');

const AVATAR_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#14b8a6',
  '#f59e0b', '#ef4444', '#10b981', '#3b82f6',
];

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

// Validation rules
const signupValidation = [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password required'),
];

const signup = [
  ...signupValidation,
  validateRequest,
  async (req, res, next) => {
    try {
      const { name, email, password } = req.body;

      const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
      if (existing.rows.length > 0) {
        return res.status(409).json({ error: 'Email already registered' });
      }

      const hashedPassword = await bcrypt.hash(password, 12);
      const avatarColor = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];

      const result = await pool.query(
        `INSERT INTO users (name, email, password, avatar_color) 
         VALUES ($1, $2, $3, $4) 
         RETURNING id, name, email, avatar_color, created_at`,
        [name, email, hashedPassword, avatarColor]
      );

      const user = result.rows[0];
      const token = generateToken(user.id);

      res.status(201).json({ user, token });
    } catch (err) {
      next(err);
    }
  },
];

const login = [
  ...loginValidation,
  validateRequest,
  async (req, res, next) => {
    try {
      const { email, password } = req.body;

      const result = await pool.query(
        'SELECT id, name, email, password, avatar_color FROM users WHERE email = $1',
        [email]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const user = result.rows[0];
      const passwordMatch = await bcrypt.compare(password, user.password);

      if (!passwordMatch) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = generateToken(user.id);
      const { password: _, ...userWithoutPassword } = user;

      res.json({ user: userWithoutPassword, token });
    } catch (err) {
      next(err);
    }
  },
];

const getProfile = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.name, u.email, u.avatar_color, u.created_at,
        COUNT(DISTINCT pm.project_id) as project_count,
        COUNT(DISTINCT t.id) as task_count
       FROM users u
       LEFT JOIN project_members pm ON pm.user_id = u.id
       LEFT JOIN tasks t ON t.assignee_id = u.id AND t.status != 'done'
       WHERE u.id = $1
       GROUP BY u.id`,
      [req.user.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

const updateProfile = [
  body('name').optional().trim().isLength({ min: 2, max: 100 }),
  validateRequest,
  async (req, res, next) => {
    try {
      const { name } = req.body;
      const result = await pool.query(
        `UPDATE users SET name = COALESCE($1, name), updated_at = NOW()
         WHERE id = $2 RETURNING id, name, email, avatar_color`,
        [name, req.user.id]
      );
      res.json(result.rows[0]);
    } catch (err) {
      next(err);
    }
  },
];

module.exports = { signup, login, getProfile, updateProfile };
