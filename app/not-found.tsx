import Link from 'next/link'

export default function NotFound() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '24px' }}>
      <div style={{ fontSize: '64px', marginBottom: '16px' }}>🐾</div>
      <div style={{ fontFamily: 'var(--font-syne)', fontSize: '24px', fontWeight: 800, color: 'var(--ink)', marginBottom: '8px' }}>Página não encontrada</div>
      <div style={{ color: 'var(--ink3)', marginBottom: '24px', fontSize: '14px' }}>Esta página sumiu como um pet fugitivo.</div>
      <Link href="/dashboard" style={{ background: 'var(--amber)', color: '#412402', textDecoration: 'none', borderRadius: '10px', padding: '10px 24px', fontSize: '13px', fontWeight: 700 }}>
        Voltar ao início
      </Link>
    </div>
  )
}
