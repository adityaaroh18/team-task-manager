import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-primary)',
      textAlign: 'center',
      padding: '20px',
    }}>
      <div style={{
        fontFamily: "'Space Mono', monospace",
        fontSize: '120px',
        fontWeight: 700,
        lineHeight: 1,
        background: 'linear-gradient(135deg, var(--accent), #ec4899)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        marginBottom: '24px',
      }}>
        404
      </div>
      <h2 style={{ fontSize: '24px', marginBottom: '12px' }}>Page not found</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
        The page you're looking for doesn't exist or was moved.
      </p>
      <Link to="/dashboard" className="btn btn-primary">
        Go to Dashboard
      </Link>
    </div>
  );
}
