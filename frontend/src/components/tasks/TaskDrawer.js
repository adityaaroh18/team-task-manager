import { useState } from 'react';
import { format, parseISO, isValid } from 'date-fns';
import { X, Send, Trash2, Calendar, Flag, User } from 'lucide-react';
import { useUpdateTask, useDeleteTask, useComments, useAddComment } from '../../hooks/useData';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../Avatar';
import { StatusBadge, PriorityBadge } from '../Badge';

const STATUSES = ['todo', 'in_progress', 'review', 'done'];
const PRIORITIES = ['low', 'medium', 'high', 'critical'];
const STATUS_LABELS = { todo: 'To Do', in_progress: 'In Progress', review: 'Review', done: 'Done' };

export default function TaskDrawer({ task, projectId, members, onClose }) {
  const { user } = useAuth();
  const [comment, setComment] = useState('');
  const [editingTitle, setEditingTitle] = useState(false);
  const [title, setTitle] = useState(task.title);

  const updateTask = useUpdateTask(projectId);
  const deleteTask = useDeleteTask(projectId);
  const { data: comments = [] } = useComments(projectId, task.id);
  const addComment = useAddComment(projectId, task.id);

  const handleUpdate = (fields) => {
    updateTask.mutate({ taskId: task.id, ...fields });
  };

  const handleTitleBlur = () => {
    setEditingTitle(false);
    if (title.trim() && title !== task.title) {
      handleUpdate({ title: title.trim() });
    }
  };

  const handleDelete = () => {
    if (window.confirm('Delete this task?')) {
      deleteTask.mutate(task.id);
      onClose();
    }
  };

  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    addComment.mutate({ content: comment.trim() });
    setComment('');
  };

  const dueDateStr = task.due_date && isValid(parseISO(task.due_date))
    ? format(parseISO(task.due_date), 'MMM d, yyyy')
    : null;

  const createdAtStr = task.created_at && isValid(parseISO(task.created_at))
    ? format(parseISO(task.created_at), 'MMM d, yyyy')
    : null;

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(2px)',
          zIndex: 900,
        }}
        onClick={onClose}
      />

      {/* Drawer */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: '480px', maxWidth: '95vw',
        background: 'var(--bg-card)',
        borderLeft: '1px solid var(--border)',
        zIndex: 901,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '-8px 0 40px rgba(0,0,0,0.4)',
        animation: 'slideInRight 0.2s ease',
      }}>
        <style>{`
          @keyframes slideInRight {
            from { transform: translateX(40px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
        `}</style>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 24px', borderBottom: '1px solid var(--border)', flexShrink: 0,
        }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <StatusBadge status={task.status} />
            <PriorityBadge priority={task.priority} />
          </div>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button className="btn btn-danger btn-icon" onClick={handleDelete} title="Delete task">
              <Trash2 size={15} />
            </button>
            <button className="btn btn-ghost btn-icon" onClick={onClose}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {/* Title */}
          {editingTitle ? (
            <input
              autoFocus
              className="form-input"
              style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px' }}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleBlur}
              onKeyDown={(e) => e.key === 'Enter' && handleTitleBlur()}
            />
          ) : (
            <h2
              style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px', cursor: 'pointer', lineHeight: 1.4 }}
              onClick={() => setEditingTitle(true)}
              title="Click to edit"
            >
              {task.title}
            </h2>
          )}

          {/* Meta fields */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
            {/* Status */}
            <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>Status</span>
              <select
                className="form-select"
                style={{ fontSize: '13px', padding: '6px 10px' }}
                value={task.status}
                onChange={(e) => handleUpdate({ status: e.target.value })}
              >
                {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
              </select>
            </div>

            {/* Priority */}
            <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                <Flag size={13} style={{ display: 'inline', marginRight: 4 }} />Priority
              </span>
              <select
                className="form-select"
                style={{ fontSize: '13px', padding: '6px 10px' }}
                value={task.priority}
                onChange={(e) => handleUpdate({ priority: e.target.value })}
              >
                {PRIORITIES.map((p) => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
              </select>
            </div>

            {/* Assignee */}
            <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                <User size={13} style={{ display: 'inline', marginRight: 4 }} />Assignee
              </span>
              <select
                className="form-select"
                style={{ fontSize: '13px', padding: '6px 10px' }}
                value={task.assignee_id || ''}
                onChange={(e) => handleUpdate({ assignee_id: e.target.value || 'null' })}
              >
                <option value="">Unassigned</option>
                {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>

            {/* Due Date */}
            <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                <Calendar size={13} style={{ display: 'inline', marginRight: 4 }} />Due Date
              </span>
              <input
                type="date"
                className="form-input"
                style={{ fontSize: '13px', padding: '6px 10px' }}
                value={task.due_date ? task.due_date.split('T')[0] : ''}
                onChange={(e) => handleUpdate({ due_date: e.target.value })}
              />
            </div>
          </div>

          {/* Description */}
          <div style={{ marginBottom: '24px' }}>
            <label className="form-label">Description</label>
            <DescriptionEditor
              initial={task.description}
              onSave={(desc) => handleUpdate({ description: desc })}
            />
          </div>

          <div className="divider" />

          {/* Meta info */}
          <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
            {task.created_by_name && (
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Created by <strong style={{ color: 'var(--text-primary)' }}>{task.created_by_name}</strong>
              </div>
            )}
            {createdAtStr && (
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                on <strong style={{ color: 'var(--text-primary)' }}>{createdAtStr}</strong>
              </div>
            )}
          </div>

          <div className="divider" />

          {/* Comments */}
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px' }}>
              Comments ({comments.length})
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
              {comments.length === 0 && (
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                  No comments yet. Be the first!
                </p>
              )}
              {comments.map((c) => (
                <div key={c.id} style={{ display: 'flex', gap: '10px' }}>
                  <Avatar name={c.name} color={c.avatar_color} size="sm" />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'baseline', marginBottom: '4px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600 }}>{c.name}</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'Space Mono, monospace' }}>
                        {isValid(parseISO(c.created_at)) ? format(parseISO(c.created_at), 'MMM d, h:mm a') : ''}
                      </span>
                    </div>
                    <p style={{
                      fontSize: '13px', color: 'var(--text-secondary)',
                      background: 'var(--bg-secondary)', borderRadius: '8px',
                      padding: '10px 12px', lineHeight: 1.5,
                      border: '1px solid var(--border)',
                    }}>{c.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Comment input — pinned to bottom */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
          <form onSubmit={handleCommentSubmit} style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
            <Avatar name={user?.name} color={user?.avatar_color} size="sm" />
            <input
              className="form-input"
              style={{ flex: 1, fontSize: '13px' }}
              placeholder="Add a comment..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            <button
              type="submit"
              className="btn btn-primary btn-icon"
              disabled={!comment.trim() || addComment.isPending}
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

function DescriptionEditor({ initial, onSave }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(initial || '');

  const handleSave = () => {
    setEditing(false);
    if (value !== initial) onSave(value);
  };

  if (editing) {
    return (
      <div>
        <textarea
          autoFocus
          className="form-textarea"
          style={{ minHeight: '100px', fontSize: '13px' }}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Add a description..."
        />
        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
          <button className="btn btn-primary btn-sm" onClick={handleSave}>Save</button>
          <button className="btn btn-ghost btn-sm" onClick={() => { setEditing(false); setValue(initial || ''); }}>Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => setEditing(true)}
      style={{
        minHeight: '60px', padding: '10px 12px',
        background: 'var(--bg-secondary)', borderRadius: '8px',
        border: '1px solid var(--border)', cursor: 'text',
        fontSize: '13px', color: value ? 'var(--text-primary)' : 'var(--text-secondary)',
        lineHeight: 1.6,
      }}
    >
      {value || 'Click to add a description...'}
    </div>
  );
}
