const router = require('express').Router();
const { authenticate, requireProjectAdmin, requireProjectMember } = require('../middleware/auth');
const {
  listProjects, createProject, getProject, updateProject, deleteProject,
  getMembers, addMember, updateMemberRole, removeMember,
} = require('../controllers/projectController');
const taskRoutes = require('./tasks');

router.use(authenticate);

router.get('/', listProjects);
router.post('/', createProject);
router.get('/:projectId', requireProjectMember, getProject);
router.put('/:projectId', requireProjectAdmin, updateProject);
router.delete('/:projectId', requireProjectAdmin, deleteProject);

// Members
router.get('/:projectId/members', requireProjectMember, getMembers);
router.post('/:projectId/members', requireProjectAdmin, addMember);
router.put('/:projectId/members/:userId', requireProjectAdmin, updateMemberRole);
router.delete('/:projectId/members/:userId', requireProjectAdmin, removeMember);

// Nest tasks under projects
router.use('/:projectId/tasks', requireProjectMember, taskRoutes);

module.exports = router;
