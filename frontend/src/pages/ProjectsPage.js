import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { projectsApi } from '../utils/api';
import toast from 'react-hot-toast';
import { Plus, FolderKanban, Users, CheckSquare, Calendar, ArrowRight } from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';
import './ProjectsPage.css';

const STATUS_COLORS = { active: 'var(--success)', completed: 'var(--accent)', archived: 'var(--text-secondary)' };

function CreateProjectModal({ onClose }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: '', description: '', due_date: '' });
  const mutation = useMutation({
    mutationFn: (data) => projectsApi.create(data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries(['projects']);
      toast.success('Project created!');
      onClose();
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to create project'),
  });

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">New Project</span>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Project Name *</label>
            <input className="form-input" placeholder="e.g. Website Redesign" value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-textarea" placeholder="What is this project about?" value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Due Date</label>
            <input type="date" className="form-input" value={form.due_date}
              onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={!form.name || mutation.isPending}
            onClick={() => mutation.mutate(form)}>
            {mutation.isPending ? 'Creating...' : 'Create Project'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProjectsPage() {
  const [showCreate, setShowCreate] = useState(false);
  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsApi.list().then(r => r.data),
  });

  if (isLoading) return <div className="loading-screen"><div className="loading-spinner" /></div>;

  return (
    <div className="projects-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="page-subtitle">{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          <Plus size={16} /> New Project
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="empty-state card">
          <div className="empty-state-icon"><FolderKanban size={48} /></div>
          <h3>No projects yet</h3>
          <p>Create your first project to start managing tasks</p>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            <Plus size={16} /> Create Project
          </button>
        </div>
      ) : (
        <div className="projects-grid">
          {projects.map(project => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}

      {showCreate && <CreateProjectModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}

function ProjectCard({ project }) {
  const progress = project.task_count > 0
    ? Math.round((project.done_count / project.task_count) * 100)
    : 0;

  const dueDate = project.due_date
    ? (isValid(parseISO(project.due_date)) ? format(parseISO(project.due_date), 'MMM d, yyyy') : null)
    : null;

  return (
    <Link to={`/projects/${project.id}`} className="project-card card card-hover">
      <div className="project-card-header">
        <div className="project-status-dot" style={{ background: STATUS_COLORS[project.status] }} />
        <span className="project-role">{project.my_role || 'owner'}</span>
      </div>
      <h3 className="project-name">{project.name}</h3>
      {project.description && <p className="project-description">{project.description}</p>}

      <div className="project-progress">
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <span className="progress-label">{progress}%</span>
      </div>

      <div className="project-stats">
        <span><CheckSquare size={13} /> {project.task_count || 0} tasks</span>
        <span><Users size={13} /> {project.member_count || 0} members</span>
        {dueDate && <span><Calendar size={13} /> {dueDate}</span>}
      </div>

      <div className="project-footer">
        <div className="project-owner">
          <div className="avatar avatar-sm" style={{ background: project.owner_color }}>
            {project.owner_name?.charAt(0).toUpperCase()}
          </div>
          <span>{project.owner_name}</span>
        </div>
        <ArrowRight size={14} style={{ color: 'var(--text-secondary)' }} />
      </div>
    </Link>
  );
}
