const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const pool = require('../config/database');

// GET /users/search?q=email — search users by email (for adding to projects)
router.get('/search', authenticate, async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) {
      return res.json([]);
    }

    const result = await pool.query(
      `SELECT id, name, email, avatar_color
       FROM users
       WHERE (email ILIKE $1 OR name ILIKE $1)
         AND id != $2
       LIMIT 10`,
      [`%${q}%`, req.user.id]
    );

    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
