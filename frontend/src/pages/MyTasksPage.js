import { Link } from 'react-router-dom';
import { format, parseISO, isValid, isPast } from 'date-fns';
import { CheckSquare } from 'lucide-react';
import { useMyTasks } from '../hooks/useData';
import { PriorityBadge, StatusBadge } from '../components/Badge';
import EmptyState from '../components/EmptyState';
import './MyTasksPage.css';

const STATUS_ORDER = ['todo', 'in_progress', 'review', 'done'];

const PRIORITY_COLORS = {
  low: '#64748b', medium: '#38bdf8', high: '#f59e0b', critical: '#ef4444',
};

export default function MyTasksPage() {
  const { data: tasks = [], isLoading } = useMyTasks();

  if (isLoading) {
    return <div className="loading-screen"><div className="loading-spinner" /></div>;
  }

  const grouped = STATUS_ORDER.reduce((acc, status) => {
    acc[status] = tasks.filter((t) => t.status === status);
    return acc;
  }, {});

  return (
    <div className="my-tasks-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Tasks</h1>
          <p className="page-subtitle">
            {tasks.length} task{tasks.length !== 1 ? 's' : ''} assigned to you
          </p>
        </div>
      </div>

      {tasks.length === 0 ? (
        <EmptyState
          icon={<CheckSquare size={48} />}
          title="No tasks assigned"
          description="You're all caught up! Tasks assigned to you will appear here."
        />
      ) : (
        <div className="tasks-sections">
          {STATUS_ORDER.map((status) => {
            const group = grouped[status];
            if (!group || group.length === 0) return null;

            return (
              <div key={status} className="tasks-section">
                <div className="tasks-section-header">
                  <StatusBadge status={status} />
                  <span className="tasks-count mono">{group.length}</span>
                </div>

                <div className="tasks-table card">
                  {group.map((task) => {
                    const isOverdue =
                      task.due_date &&
                      isPast(parseISO(task.due_date)) &&
                      task.status !== 'done';

                    const dueDateStr =
                      task.due_date && isValid(parseISO(task.due_date))
                        ? format(parseISO(task.due_date), 'MMM d, yyyy')
                        : '—';

                    return (
                      <Link
                        key={task.id}
                        to={`/projects/${task.project_id}`}
                        className="task-row-full"
                      >
                        <div
                          className="task-priority-indicator"
                          style={{ background: PRIORITY_COLORS[task.priority] }}
                        />
                        <div className="task-row-main">
                          <div className="task-row-title">{task.title}</div>
                          <div className="task-row-project">{task.project_name}</div>
                        </div>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                          <PriorityBadge priority={task.priority} />
                          <span className={`task-row-date ${isOverdue ? 'overdue' : ''}`}>
                            {dueDateStr}
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
