'use client'

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--surface)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px'
    }}>
      <div style={{ textAlign: 'center', maxWidth: '400px' }}>
        <div style={{
          width: '64px',
          height: '64px',
          background: 'var(--coral)',
          borderRadius: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '32px',
          margin: '0 auto 24px'
        }}>
          ⚠️
        </div>
        <h2 style={{ fontFamily: 'var(--font-syne)', fontSize: '20px', fontWeight: 800, color: 'var(--ink)', marginBottom: '8px' }}>
          Algo deu errado
        </h2>
        <p style={{ color: 'var(--ink4)', fontSize: '14px', marginBottom: '24px' }}>
          {error.message || 'Erro ao carregar. Verifique sua conexão com o banco de dados.'}
        </p>
        <button
          onClick={() => reset()}
          style={{
            background: 'var(--amber)',
            color: '#412402',
            border: 'none',
            borderRadius: 'var(--r)',
            padding: '10px 20px',
            fontSize: '13px',
            fontWeight: 700,
            fontFamily: 'inherit',
            cursor: 'pointer'
          }}
        >
          Tentar novamente
        </button>
      </div>
    </div>
  )
}
