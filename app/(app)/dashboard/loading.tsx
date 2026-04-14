export default function DashboardLoading() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--surface)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: '56px',
          height: '56px',
          background: 'var(--amber)',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '28px',
          margin: '0 auto 16px',
          animation: 'spin 1s linear infinite'
        }}>
          🐕
        </div>
        <p style={{ color: 'var(--ink4)', fontSize: '13px' }}>
          Carregando dashboard...
        </p>
      </div>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
