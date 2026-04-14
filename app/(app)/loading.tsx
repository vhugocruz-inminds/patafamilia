export default function AppLoading() {
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
          width: '64px',
          height: '64px',
          background: 'var(--amber)',
          borderRadius: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '32px',
          margin: '0 auto 24px',
          animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
        }}>
          🐾
        </div>
        <h2 style={{ fontFamily: 'var(--font-syne)', fontSize: '20px', fontWeight: 800, color: 'var(--ink)', marginBottom: '8px' }}>
          PataFamília
        </h2>
        <p style={{ color: 'var(--ink4)', fontSize: '14px' }}>
          Carregando sua família...
        </p>
      </div>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  )
}
