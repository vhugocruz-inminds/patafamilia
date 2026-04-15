'use client'

export default function Error({ reset }: { reset: () => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', padding: '40px', textAlign: 'center' }}>
      <div style={{ fontSize: '48px', marginBottom: '12px' }}>⚠️</div>
      <div style={{ fontFamily: 'var(--font-syne)', fontSize: '18px', fontWeight: 800, color: 'var(--ink)', marginBottom: '8px' }}>Algo deu errado</div>
      <div style={{ color: 'var(--ink3)', marginBottom: '20px', fontSize: '13px' }}>Tente novamente ou atualize a página.</div>
      <button onClick={reset} style={{ background: 'var(--amber)', color: '#412402', border: 'none', borderRadius: '10px', padding: '8px 20px', fontSize: '13px', fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' }}>
        Tentar novamente
      </button>
    </div>
  )
}
