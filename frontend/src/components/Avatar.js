export default function Avatar({ name, color, size = 'md', className = '' }) {
  const initials = name
    ? name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <div
      className={`avatar avatar-${size} ${className}`}
      style={{ background: color || '#6366f1' }}
      title={name}
    >
      {initials}
    </div>
  );
}
