const { body } = require('express-validator');
const pool = require('../config/database');
const { validateRequest } = require('../middleware/errorHandler');

const taskValidation = [
  body('title').trim().isLength({ min: 2, max: 300 }).withMessage('Title must be 2-300 characters'),
  body('description').optional().trim().isLength({ max: 2000 }),
  body('status').optional().isIn(['todo', 'in_progress', 'review', 'done']),
  body('priority').optional().isIn(['low', 'medium', 'high', 'critical']),
  body('due_date').optional().isISO8601(),
  body('assignee_id').optional().isUUID(),
];

// GET /projects/:projectId/tasks
const listTasks = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { status, priority, assignee_id } = req.query;

    let query = `
      SELECT 
        t.*,
        u.name as assignee_name, u.avatar_color as assignee_color,
        creator.name as created_by_name
      FROM tasks t
      LEFT JOIN users u ON u.id = t.assignee_id
      LEFT JOIN users creator ON creator.id = t.created_by
      WHERE t.project_id = $1
    `;
    const params = [projectId];
    let idx = 2;

    if (status) { query += ` AND t.status = $${idx++}`; params.push(status); }
    if (priority) { query += ` AND t.priority = $${idx++}`; params.push(priority); }
    if (assignee_id) { query += ` AND t.assignee_id = $${idx++}`; params.push(assignee_id); }

    query += ' ORDER BY t.created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

// POST /projects/:projectId/tasks
const createTask = [
  ...taskValidation,
  validateRequest,
  async (req, res, next) => {
    try {
      const { projectId } = req.params;
      const { title, description, status, priority, assignee_id, due_date } = req.body;

      const result = await pool.query(
        `INSERT INTO tasks (title, description, status, priority, project_id, assignee_id, created_by, due_date)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [title, description, status || 'todo', priority || 'medium', projectId, assignee_id || null, req.user.id, due_date || null]
      );

      const task = result.rows[0];

      // Fetch with joins
      const full = await pool.query(
        `SELECT t.*, u.name as assignee_name, u.avatar_color as assignee_color,
           c.name as created_by_name
         FROM tasks t
         LEFT JOIN users u ON u.id = t.assignee_id
         LEFT JOIN users c ON c.id = t.created_by
         WHERE t.id = $1`,
        [task.id]
      );

      res.status(201).json(full.rows[0]);
    } catch (err) {
      next(err);
    }
  },
];

// GET /projects/:projectId/tasks/:taskId
const getTask = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const result = await pool.query(
      `SELECT t.*, 
        u.name as assignee_name, u.avatar_color as assignee_color,
        c.name as created_by_name
       FROM tasks t
       LEFT JOIN users u ON u.id = t.assignee_id
       LEFT JOIN users c ON c.id = t.created_by
       WHERE t.id = $1`,
      [taskId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Task not found' });
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

// PUT /projects/:projectId/tasks/:taskId
const updateTask = [
  body('title').optional().trim().isLength({ min: 2, max: 300 }),
  body('status').optional().isIn(['todo', 'in_progress', 'review', 'done']),
  body('priority').optional().isIn(['low', 'medium', 'high', 'critical']),
  body('assignee_id').optional(),
  validateRequest,
  async (req, res, next) => {
    try {
      const { taskId } = req.params;
      const { title, description, status, priority, assignee_id, due_date } = req.body;

      const result = await pool.query(
        `UPDATE tasks SET
          title = COALESCE($1, title),
          description = COALESCE($2, description),
          status = COALESCE($3, status),
          priority = COALESCE($4, priority),
          assignee_id = CASE WHEN $5::text = 'null' THEN NULL ELSE COALESCE($5::uuid, assignee_id) END,
          due_date = COALESCE($6, due_date),
          updated_at = NOW()
         WHERE id = $7 RETURNING *`,
        [title, description, status, priority, assignee_id?.toString(), due_date, taskId]
      );

      if (result.rows.length === 0) return res.status(404).json({ error: 'Task not found' });

      const full = await pool.query(
        `SELECT t.*, u.name as assignee_name, u.avatar_color as assignee_color,
           c.name as created_by_name
         FROM tasks t
         LEFT JOIN users u ON u.id = t.assignee_id
         LEFT JOIN users c ON c.id = t.created_by
         WHERE t.id = $1`,
        [taskId]
      );

      res.json(full.rows[0]);
    } catch (err) {
      next(err);
    }
  },
];

// DELETE /projects/:projectId/tasks/:taskId
const deleteTask = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    await pool.query('DELETE FROM tasks WHERE id = $1', [taskId]);
    res.json({ message: 'Task deleted' });
  } catch (err) {
    next(err);
  }
};

// GET /projects/:projectId/tasks/:taskId/comments
const getComments = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const result = await pool.query(
      `SELECT tc.*, u.name, u.avatar_color
       FROM task_comments tc
       JOIN users u ON u.id = tc.user_id
       WHERE tc.task_id = $1
       ORDER BY tc.created_at ASC`,
      [taskId]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

// POST /projects/:projectId/tasks/:taskId/comments
const addComment = [
  body('content').trim().isLength({ min: 1, max: 2000 }).withMessage('Comment content required'),
  validateRequest,
  async (req, res, next) => {
    try {
      const { taskId } = req.params;
      const { content } = req.body;

      const result = await pool.query(
        `INSERT INTO task_comments (task_id, user_id, content) VALUES ($1, $2, $3) RETURNING *`,
        [taskId, req.user.id, content]
      );

      const full = await pool.query(
        `SELECT tc.*, u.name, u.avatar_color FROM task_comments tc
         JOIN users u ON u.id = tc.user_id WHERE tc.id = $1`,
        [result.rows[0].id]
      );

      res.status(201).json(full.rows[0]);
    } catch (err) {
      next(err);
    }
  },
];

module.exports = {
  listTasks, createTask, getTask, updateTask, deleteTask,
  getComments, addComment,
};
