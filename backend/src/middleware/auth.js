const jwt = require('jsonwebtoken');
const pool = require('../config/database');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const result = await pool.query(
      'SELECT id, name, email, avatar_color FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = result.rows[0];
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Check if user is admin of a project
const requireProjectAdmin = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT role FROM project_members 
       WHERE project_id = $1 AND user_id = $2`,
      [projectId, userId]
    );

    // Also allow project owner
    const projectResult = await pool.query(
      'SELECT owner_id FROM projects WHERE id = $1',
      [projectId]
    );

    if (projectResult.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const isOwner = projectResult.rows[0].owner_id === userId;
    const isAdmin = result.rows.length > 0 && result.rows[0].role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    req.projectRole = isOwner ? 'owner' : 'admin';
    next();
  } catch (err) {
    next(err);
  }
};

// Check if user is a member of a project
const requireProjectMember = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT pm.role, p.owner_id 
       FROM projects p
       LEFT JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = $2
       WHERE p.id = $1`,
      [projectId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const row = result.rows[0];
    const isOwner = row.owner_id === userId;
    const isMember = row.role !== null;

    if (!isOwner && !isMember) {
      return res.status(403).json({ error: 'Project access required' });
    }

    req.projectRole = isOwner ? 'owner' : row.role;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { authenticate, requireProjectAdmin, requireProjectMember };
