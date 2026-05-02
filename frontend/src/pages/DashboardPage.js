import { Link } from 'react-router-dom';
import { format, parseISO, isValid } from 'date-fns';
import { AlertTriangle, Clock, FolderKanban, CheckSquare, TrendingUp, ArrowRight } from 'lucide-react';
import { useDashboard } from '../hooks/useData';
import { useAuth } from '../context/AuthContext';
import { StatusBadge, PriorityBadge } from '../components/Badge';
import './DashboardPage.css';

const fmtDate = (d) => {
  if (!d) return '';
  const p = typeof d === 'string' ? parseISO(d) : d;
  return isValid(p) ? format(p, 'MMM d') : '';
};

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
};

function StatCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ background: `${color}22`, color }}>
        <Icon size={22} />
      </div>
      <div className="stat-info">
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
        {sub && <div className="stat-sub">{sub}</div>}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { data, isLoading } = useDashboard();

  if (isLoading) {
    return <div className="loading-screen"><div className="loading-spinner" /></div>;
  }

  const tasks    = data?.tasks    || {};
  const projects = data?.projects || {};
  const overdue  = data?.overdue  || [];
  const dueSoon  = data?.due_soon || [];
  const recent   = data?.recent_activity || [];

  const firstName = user?.name?.split(' ')[0] || 'there';

  return (
    <div className="dashboard">
      <div className="page-header">
        <div>
          <h1 className="page-title">Good {greeting()}, {firstName} 👋</h1>
          <p className="page-subtitle">Here's what's happening across your projects</p>
        </div>
        <div className="dashboard-date mono">{format(new Date(), 'EEEE, MMM d')}</div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <StatCard
          icon={FolderKanban} label="Active Projects"
          value={projects.active  || 0} sub={`${projects.total || 0} total`}
          color="var(--accent)"
        />
        <StatCard
          icon={CheckSquare} label="My Tasks"
          value={tasks.total || 0} sub={`${tasks.done || 0} completed`}
          color="var(--success)"
        />
        <StatCard
          icon={Clock} label="In Progress"
          value={tasks.in_progress || 0} sub={`${tasks.review || 0} in review`}
          color="var(--info)"
        />
        <StatCard
          icon={AlertTriangle} label="Overdue"
          value={overdue.length}  sub="need attention"
          color={overdue.length > 0 ? 'var(--danger)' : 'var(--text-secondary)'}
        />
      </div>

      {/* Grid */}
      <div className="dashboard-grid">
        {/* Overdue */}
        <div className="card">
          <div className="card-head">
            <h2 className="card-title">
              <AlertTriangle size={15} style={{ color: 'var(--danger)' }} /> Overdue Tasks
            </h2>
          </div>
          {overdue.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', padding: '12px 0' }}>
              No overdue tasks 🎉
            </p>
          ) : (
            <div className="task-list">
              {overdue.map((task) => (
                <Link key={task.id} to={`/projects/${task.project_id}`} className="task-row">
                  <div>
                    <div className="task-title">{task.title}</div>
                    <div className="task-meta">{task.project_name}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <PriorityBadge priority={task.priority} />
                    <span className="task-date overdue">{fmtDate(task.due_date)}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Due Soon */}
        <div className="card">
          <div className="card-head">
            <h2 className="card-title">
              <Clock size={15} style={{ color: 'var(--warning)' }} /> Due This Week
            </h2>
          </div>
          {dueSoon.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', padding: '12px 0' }}>
              Nothing due in the next 7 days
            </p>
          ) : (
            <div className="task-list">
              {dueSoon.map((task) => (
                <Link key={task.id} to={`/projects/${task.project_id}`} className="task-row">
                  <div>
                    <div className="task-title">{task.title}</div>
                    <div className="task-meta">{task.project_name}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <StatusBadge status={task.status} />
                    <span className="task-date">{fmtDate(task.due_date)}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent activity — full width */}
        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <div className="card-head">
            <h2 className="card-title">
              <TrendingUp size={15} /> Recent Activity
            </h2>
            <Link to="/my-tasks" className="btn btn-ghost btn-sm">
              My tasks <ArrowRight size={13} />
            </Link>
          </div>
          {recent.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', padding: '12px 0' }}>
              No recent activity
            </p>
          ) : (
            <div className="task-list">
              {recent.slice(0, 8).map((task) => (
                <Link key={task.id} to={`/projects/${task.project_id}`} className="task-row">
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <StatusBadge status={task.status} />
                    <div>
                      <div className="task-title">{task.title}</div>
                      <div className="task-meta">{task.project_name}</div>
                    </div>
                  </div>
                  <span className="task-date">{fmtDate(task.updated_at)}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
