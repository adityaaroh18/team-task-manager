const router = require('express').Router({ mergeParams: true });
const {
  listTasks, createTask, getTask, updateTask, deleteTask,
  getComments, addComment,
} = require('../controllers/taskController');

router.get('/', listTasks);
router.post('/', createTask);
router.get('/:taskId', getTask);
router.put('/:taskId', updateTask);
router.delete('/:taskId', deleteTask);

// Comments
router.get('/:taskId/comments', getComments);
router.post('/:taskId/comments', addComment);

module.exports = router;
