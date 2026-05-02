const { body, param } = require('express-validator');
const pool = require('../config/database');
const { validateRequest } = require('../middleware/errorHandler');

const projectValidation = [
  body('name').trim().isLength({ min: 2, max: 200 }).withMessage('Project name must be 2-200 characters'),
  body('description').optional().trim().isLength({ max: 1000 }),
  body('due_date').optional().isISO8601().withMessage('Valid date required'),
];

// GET /projects — list all projects user is part of
const listProjects = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT 
        p.id, p.name, p.description, p.status, p.due_date, p.created_at,
        u.name as owner_name, u.avatar_color as owner_color,
        pm.role as my_role,
        COUNT(DISTINCT pm2.user_id) as member_count,
        COUNT(DISTINCT t.id) as task_count,
        COUNT(DISTINCT t2.id) as done_count
       FROM projects p
       JOIN users u ON u.id = p.owner_id
       LEFT JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = $1
       LEFT JOIN project_members pm2 ON pm2.project_id = p.id
       LEFT JOIN tasks t ON t.project_id = p.id
       LEFT JOIN tasks t2 ON t2.project_id = p.id AND t2.status = 'done'
       WHERE p.owner_id = $1 OR pm.user_id = $1
       GROUP BY p.id, u.name, u.avatar_color, pm.role
       ORDER BY p.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

// POST /projects
const createProject = [
  ...projectValidation,
  validateRequest,
  async (req, res, next) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { name, description, due_date } = req.body;

      const result = await client.query(
        `INSERT INTO projects (name, description, due_date, owner_id)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [name, description, due_date || null, req.user.id]
      );

      const project = result.rows[0];

      // Add owner as admin member
      await client.query(
        `INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, 'admin')`,
        [project.id, req.user.id]
      );

      await client.query('COMMIT');
      res.status(201).json({ ...project, my_role: 'owner', member_count: 1 });
    } catch (err) {
      await client.query('ROLLBACK');
      next(err);
    } finally {
      client.release();
    }
  },
];

// GET /projects/:projectId
const getProject = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const result = await pool.query(
      `SELECT 
        p.*, 
        u.name as owner_name, u.avatar_color as owner_color,
        pm.role as my_role
       FROM projects p
       JOIN users u ON u.id = p.owner_id
       LEFT JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = $2
       WHERE p.id = $1`,
      [projectId, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Project not found' });
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

// PUT /projects/:projectId
const updateProject = [
  ...projectValidation,
  validateRequest,
  async (req, res, next) => {
    try {
      const { projectId } = req.params;
      const { name, description, status, due_date } = req.body;

      const result = await pool.query(
        `UPDATE projects SET
          name = COALESCE($1, name),
          description = COALESCE($2, description),
          status = COALESCE($3, status),
          due_date = COALESCE($4, due_date),
          updated_at = NOW()
         WHERE id = $5 RETURNING *`,
        [name, description, status, due_date, projectId]
      );

      if (result.rows.length === 0) return res.status(404).json({ error: 'Project not found' });
      res.json(result.rows[0]);
    } catch (err) {
      next(err);
    }
  },
];

// DELETE /projects/:projectId
const deleteProject = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    await pool.query('DELETE FROM projects WHERE id = $1', [projectId]);
    res.json({ message: 'Project deleted' });
  } catch (err) {
    next(err);
  }
};

// GET /projects/:projectId/members
const getMembers = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const result = await pool.query(
      `SELECT u.id, u.name, u.email, u.avatar_color, pm.role, pm.joined_at
       FROM project_members pm
       JOIN users u ON u.id = pm.user_id
       WHERE pm.project_id = $1
       ORDER BY pm.role DESC, u.name`,
      [projectId]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

// POST /projects/:projectId/members
const addMember = [
  body('email').isEmail().normalizeEmail(),
  body('role').optional().isIn(['admin', 'member']),
  validateRequest,
  async (req, res, next) => {
    try {
      const { projectId } = req.params;
      const { email, role = 'member' } = req.body;

      const userResult = await pool.query('SELECT id, name, email, avatar_color FROM users WHERE email = $1', [email]);
      if (userResult.rows.length === 0) {
        return res.status(404).json({ error: 'User not found with that email' });
      }

      const user = userResult.rows[0];

      const existing = await pool.query(
        'SELECT id FROM project_members WHERE project_id = $1 AND user_id = $2',
        [projectId, user.id]
      );
      if (existing.rows.length > 0) {
        return res.status(409).json({ error: 'User is already a member' });
      }

      await pool.query(
        'INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, $3)',
        [projectId, user.id, role]
      );

      res.status(201).json({ ...user, role });
    } catch (err) {
      next(err);
    }
  },
];

// PUT /projects/:projectId/members/:userId
const updateMemberRole = [
  body('role').isIn(['admin', 'member']).withMessage('Role must be admin or member'),
  validateRequest,
  async (req, res, next) => {
    try {
      const { projectId, userId } = req.params;
      const { role } = req.body;

      const result = await pool.query(
        `UPDATE project_members SET role = $1 WHERE project_id = $2 AND user_id = $3 RETURNING *`,
        [role, projectId, userId]
      );

      if (result.rows.length === 0) return res.status(404).json({ error: 'Member not found' });
      res.json(result.rows[0]);
    } catch (err) {
      next(err);
    }
  },
];

// DELETE /projects/:projectId/members/:userId
const removeMember = async (req, res, next) => {
  try {
    const { projectId, userId } = req.params;
    await pool.query(
      'DELETE FROM project_members WHERE project_id = $1 AND user_id = $2',
      [projectId, userId]
    );
    res.json({ message: 'Member removed' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listProjects, createProject, getProject, updateProject, deleteProject,
  getMembers, addMember, updateMemberRole, removeMember,
};
