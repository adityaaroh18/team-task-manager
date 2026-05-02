const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { getDashboard, getMyTasks } = require('../controllers/dashboardController');

router.use(authenticate);
router.get('/', getDashboard);
router.get('/my-tasks', getMyTasks);

module.exports = router;
