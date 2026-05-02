const pool = require('../config/database');

// GET /dashboard — user's overview stats
const getDashboard = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Stats
    const [projectStats, taskStats, overdueStats, recentActivity] = await Promise.all([
      pool.query(
        `SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE p.status = 'active') as active,
          COUNT(*) FILTER (WHERE p.status = 'completed') as completed
         FROM projects p
         LEFT JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = $1
         WHERE p.owner_id = $1 OR pm.user_id = $1`,
        [userId]
      ),
      pool.query(
        `SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE t.status = 'todo') as todo,
          COUNT(*) FILTER (WHERE t.status = 'in_progress') as in_progress,
          COUNT(*) FILTER (WHERE t.status = 'review') as review,
          COUNT(*) FILTER (WHERE t.status = 'done') as done
         FROM tasks t
         WHERE t.assignee_id = $1`,
        [userId]
      ),
      pool.query(
        `SELECT t.id, t.title, t.priority, t.due_date, t.status,
           p.name as project_name, p.id as project_id
         FROM tasks t
         JOIN projects p ON p.id = t.project_id
         WHERE t.assignee_id = $1
           AND t.due_date < CURRENT_DATE
           AND t.status != 'done'
         ORDER BY t.due_date ASC
         LIMIT 5`,
        [userId]
      ),
      pool.query(
        `SELECT t.id, t.title, t.status, t.priority, t.updated_at,
           p.name as project_name, p.id as project_id,
           u.name as assignee_name
         FROM tasks t
         JOIN projects p ON p.id = t.project_id
         LEFT JOIN users u ON u.id = t.assignee_id
         LEFT JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = $1
         WHERE (p.owner_id = $1 OR pm.user_id = $1)
         ORDER BY t.updated_at DESC
         LIMIT 10`,
        [userId]
      ),
    ]);

    // Tasks due soon (next 7 days)
    const dueSoon = await pool.query(
      `SELECT t.id, t.title, t.priority, t.due_date, t.status,
         p.name as project_name, p.id as project_id
       FROM tasks t
       JOIN projects p ON p.id = t.project_id
       WHERE t.assignee_id = $1
         AND t.due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
         AND t.status != 'done'
       ORDER BY t.due_date ASC
       LIMIT 5`,
      [userId]
    );

    res.json({
      projects: projectStats.rows[0],
      tasks: taskStats.rows[0],
      overdue: overdueStats.rows,
      due_soon: dueSoon.rows,
      recent_activity: recentActivity.rows,
    });
  } catch (err) {
    next(err);
  }
};

// GET /dashboard/my-tasks
const getMyTasks = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT t.*, p.name as project_name, p.id as project_id,
         u.name as assignee_name, u.avatar_color as assignee_color
       FROM tasks t
       JOIN projects p ON p.id = t.project_id
       LEFT JOIN users u ON u.id = t.assignee_id
       WHERE t.assignee_id = $1
       ORDER BY 
         CASE t.priority WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END,
         t.due_date ASC NULLS LAST`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

module.exports = { getDashboard, getMyTasks };
