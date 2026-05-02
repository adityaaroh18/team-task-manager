import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectsApi } from '../utils/api';
import {
  useProject, useTasks, useMembers,
  useCreateTask, useDeleteProject, useUpdateTask,
  useDeleteTask, useAddMember, useRemoveMember,
} from '../hooks/useData';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Plus, Users, Trash2, ArrowLeft, Crown, Shield, User } from 'lucide-react';
import { format, parseISO, isValid, isPast } from 'date-fns';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import TaskDrawer from '../components/tasks/TaskDrawer';
import Avatar from '../components/Avatar';
import ConfirmDialog from '../components/ConfirmDialog';
import './ProjectDetailPage.css';

const COLUMNS = [
  { key: 'todo',        label: 'To Do',       color: 'var(--todo)' },
  { key: 'in_progress', label: 'In Progress',  color: 'var(--in-progress)' },
  { key: 'review',      label: 'Review',       color: 'var(--review)' },
  { key: 'done',        label: 'Done',         color: 'var(--done)' },
];

const PRIORITY_COLORS = {
  low: '#64748b', medium: '#38bdf8', high: '#f59e0b', critical: '#ef4444',
};

/* ── Task Card ──────────────────────────────────────────────────────────────── */

function TaskCard({ task, projectId, onClick }) {
  const updateTask = useUpdateTask(projectId);
  const deleteTask = useDeleteTask(projectId);

  const isOverdue =
    task.due_date &&
    isPast(parseISO(task.due_date)) &&
    task.status !== 'done';

  const dueDateStr =
    task.due_date && isValid(parseISO(task.due_date))
      ? format(parseISO(task.due_date), 'MMM d')
      : null;

  return (
    <div className="task-card" onClick={onClick}>
      <div className="task-card-top">
        <div
          className="priority-dot"
          style={{ background: PRIORITY_COLORS[task.priority] }}
          title={task.priority}
        />
        <span className="task-card-title">{task.title}</span>
        <button
          className="btn btn-ghost btn-icon task-delete-btn"
          onClick={(e) => {
            e.stopPropagation();
            if (window.confirm('Delete this task?')) deleteTask.mutate(task.id);
          }}
        >
          <Trash2 size={12} style={{ color: 'var(--danger)' }} />
        </button>
      </div>

      {task.description && (
        <p className="task-card-desc">{task.description}</p>
      )}

      <div className="task-card-footer">
        {task.assignee_name ? (
          <div className="task-assignee">
            <Avatar name={task.assignee_name} color={task.assignee_color} size="sm" />
            <span>{task.assignee_name.split(' ')[0]}</span>
          </div>
        ) : <div />}
        {dueDateStr && (
          <span className={`task-due ${isOverdue ? 'overdue' : ''}`}>{dueDateStr}</span>
        )}
      </div>

      <select
        className="form-select"
        style={{ fontSize: '12px', padding: '4px 8px', marginTop: '8px' }}
        value={task.status}
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => updateTask.mutate({ taskId: task.id, status: e.target.value })}
      >
        {COLUMNS.map((c) => (
          <option key={c.key} value={c.key}>{c.label}</option>
        ))}
      </select>
    </div>
  );
}

/* ── Create Task Modal ──────────────────────────────────────────────────────── */

function CreateTaskModal({ projectId, members, onClose }) {
  const createTask = useCreateTask(projectId);
  const [form, setForm] = useState({
    title: '', description: '', priority: 'medium',
    status: 'todo', assignee_id: '', due_date: '',
  });

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = () => {
    if (!form.title.trim()) return toast.error('Title is required');
    createTask.mutate(
      { ...form, assignee_id: form.assignee_id || undefined },
      { onSuccess: onClose },
    );
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">New Task</span>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Title *</label>
            <input
              autoFocus className="form-input"
              placeholder="What needs to be done?"
              value={form.title} onChange={set('title')}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-textarea" placeholder="Add more details…"
              style={{ minHeight: '80px' }}
              value={form.description} onChange={set('description')}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select className="form-select" value={form.priority} onChange={set('priority')}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-select" value={form.status} onChange={set('status')}>
                {COLUMNS.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Assign To</label>
              <select className="form-select" value={form.assignee_id} onChange={set('assignee_id')}>
                <option value="">Unassigned</option>
                {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Due Date</label>
              <input type="date" className="form-input" value={form.due_date} onChange={set('due_date')} />
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-primary"
            disabled={!form.title.trim() || createTask.isPending}
            onClick={handleSubmit}
          >
            {createTask.isPending ? 'Creating…' : 'Create Task'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Add Member Modal ───────────────────────────────────────────────────────── */

function AddMemberModal({ projectId, onClose }) {
  const addMember = useAddMember(projectId);
  const [form, setForm] = useState({ email: '', role: 'member' });

  const handleSubmit = () => {
    if (!form.email) return toast.error('Email is required');
    addMember.mutate(form, { onSuccess: onClose });
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">Add Team Member</span>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              autoFocus type="email" className="form-input"
              placeholder="member@example.com"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            />
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px' }}>
              The user must already have a TaskFlow account.
            </p>
          </div>
          <div className="form-group">
            <label className="form-label">Role</label>
            <select className="form-select" value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}>
              <option value="member">Member — can view and manage tasks</option>
              <option value="admin">Admin — can also manage team and settings</option>
            </select>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-primary"
            disabled={!form.email || addMember.isPending}
            onClick={handleSubmit}
          >
            {addMember.isPending ? 'Adding…' : 'Add Member'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Members Tab ────────────────────────────────────────────────────────────── */

function MembersTab({ projectId, members, isAdminOrOwner, currentUserId }) {
  const qc = useQueryClient();
  const removeMember = useRemoveMember(projectId);

  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }) =>
      projectsApi.updateMemberRole(projectId, userId, { role }),
    onSuccess: () => {
      qc.invalidateQueries(['members', projectId]);
      toast.success('Role updated');
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed'),
  });

  const roleIcon = (role) => {
    if (role === 'admin')  return <Shield size={13} style={{ color: 'var(--accent)' }} />;
    if (role === 'owner')  return <Crown  size={13} style={{ color: 'var(--warning)' }} />;
    return <User size={13} style={{ color: 'var(--text-secondary)' }} />;
  };

  return (
    <div className="card" style={{ maxWidth: '640px' }}>
      <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px' }}>
        Team Members ({members.length})
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {members.map((member) => (
          <div key={member.id} className="member-row">
            <Avatar name={member.name} color={member.avatar_color} size="md" />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                {member.name} {roleIcon(member.role)}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{member.email}</div>
            </div>

            {isAdminOrOwner && member.id !== currentUserId ? (
              <select
                className="form-select"
                style={{ fontSize: '12px', padding: '4px 8px', width: 'auto' }}
                value={member.role}
                onChange={(e) => updateRoleMutation.mutate({ userId: member.id, role: e.target.value })}
              >
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
            ) : (
              <span className={`badge ${member.role === 'admin' ? 'badge-in_progress' : 'badge-todo'}`}>
                {member.role}
              </span>
            )}

            {isAdminOrOwner && member.id !== currentUserId && (
              <button
                className="btn btn-danger btn-sm"
                onClick={() => removeMember.mutate(member.id)}
              >
                Remove
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Main Page ──────────────────────────────────────────────────────────────── */

export default function ProjectDetailPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [showCreateTask,   setShowCreateTask]   = useState(false);
  const [showAddMember,    setShowAddMember]    = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedTask,     setSelectedTask]     = useState(null);
  const [activeTab,        setActiveTab]        = useState('board');

  const { data: project }    = useProject(projectId);
  const { data: tasks = [] } = useTasks(projectId);
  const { data: members = [] } = useMembers(projectId);
  const deleteProject = useDeleteProject();

  const isAdminOrOwner =
    project?.my_role === 'admin' ||
    project?.my_role === 'owner' ||
    project?.owner_id === user?.id;

  const tasksByStatus = COLUMNS.reduce((acc, col) => {
    acc[col.key] = tasks.filter((t) => t.status === col.key);
    return acc;
  }, {});

  const handleDeleteProject = () =>
    deleteProject.mutate(projectId, {
      onSuccess: () => navigate('/projects'),
    });

  // Keep drawer task fresh after updates
  const freshTask = selectedTask
    ? (tasks.find((t) => t.id === selectedTask.id) ?? selectedTask)
    : null;

  return (
    <div className="project-detail">
      <button
        className="btn btn-ghost btn-sm"
        style={{ marginBottom: '12px' }}
        onClick={() => navigate('/projects')}
      >
        <ArrowLeft size={14} /> All Projects
      </button>

      {/* Header */}
      <div className="project-detail-header">
        <div className="project-header-main">
          <div>
            <h1 className="page-title">{project?.name || '…'}</h1>
            {project?.description && (
              <p className="page-subtitle">{project.description}</p>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setShowAddMember(true)}>
              <Users size={14} /> Add Member
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => setShowCreateTask(true)}>
              <Plus size={14} /> New Task
            </button>
            {isAdminOrOwner && (
              <button className="btn btn-danger btn-sm" onClick={() => setShowDeleteConfirm(true)}>
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>

        <div className="project-tabs">
          <button
            className={`tab ${activeTab === 'board' ? 'active' : ''}`}
            onClick={() => setActiveTab('board')}
          >
            Board ({tasks.length})
          </button>
          <button
            className={`tab ${activeTab === 'members' ? 'active' : ''}`}
            onClick={() => setActiveTab('members')}
          >
            Members ({members.length})
          </button>
        </div>
      </div>

      {/* Board */}
      {activeTab === 'board' && (
        <div className="kanban-board">
          {COLUMNS.map((col) => (
            <div key={col.key} className="kanban-column">
              <div className="kanban-column-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: col.color }} />
                  <span className="kanban-column-title">{col.label}</span>
                </div>
                <span className="kanban-column-count">{tasksByStatus[col.key]?.length || 0}</span>
              </div>

              <div className="kanban-cards">
                {tasksByStatus[col.key]?.length === 0
                  ? <div className="kanban-empty">No tasks</div>
                  : tasksByStatus[col.key].map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      projectId={projectId}
                      onClick={() => setSelectedTask(task)}
                    />
                  ))
                }
              </div>

              <button
                className="btn btn-ghost btn-sm"
                style={{ margin: '8px', fontSize: '12px' }}
                onClick={() => setShowCreateTask(true)}
              >
                <Plus size={13} /> Add task
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Members */}
      {activeTab === 'members' && (
        <MembersTab
          projectId={projectId}
          members={members}
          isAdminOrOwner={isAdminOrOwner}
          currentUserId={user?.id}
        />
      )}

      {/* Overlays */}
      {showCreateTask && (
        <CreateTaskModal
          projectId={projectId}
          members={members}
          onClose={() => setShowCreateTask(false)}
        />
      )}
      {showAddMember && (
        <AddMemberModal projectId={projectId} onClose={() => setShowAddMember(false)} />
      )}
      {showDeleteConfirm && (
        <ConfirmDialog
          title="Delete Project"
          message={`Delete "${project?.name}"? All tasks will be permanently removed.`}
          confirmLabel="Delete Project"
          onConfirm={handleDeleteProject}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
      {freshTask && (
        <TaskDrawer
          task={freshTask}
          projectId={projectId}
          members={members}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </div>
  );
}
