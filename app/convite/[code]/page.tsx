'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import Link from 'next/link'

export default function ConvitePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params)
  const [loading, setLoading] = useState(false)
  const [familia, setFamilia] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetch(`/api/familia/convite?codigo=${code}`)
      .then(r => r.json())
      .then(d => setFamilia(d.nome || null))
  }, [code])

  async function handleAceitar() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push(`/login?redirect=/convite/${code}`)
      return
    }
    const res = await fetch('/api/familia', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ acao: 'entrar', codigo: code, usuarioId: user.id }),
    })
    setLoading(false)
    if (!res.ok) { toast.error('Código inválido ou expirado.'); return }
    toast.success('Você entrou na família!')
    router.push('/dashboard')
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
        <div style={{ width: '64px', height: '64px', background: 'var(--amber)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', margin: '0 auto 20px' }}>🐾</div>
        <div style={{ fontFamily: 'var(--font-syne)', fontSize: '22px', fontWeight: 800, color: 'var(--ink)', marginBottom: '8px' }}>Você foi convidado!</div>
        {familia ? (
          <p style={{ color: 'var(--ink3)', marginBottom: '24px' }}>Para entrar na <strong style={{ color: 'var(--ink)' }}>{familia}</strong> no PataFamília.</p>
        ) : (
          <p style={{ color: 'var(--ink4)', marginBottom: '24px' }}>Verificando convite...</p>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button onClick={handleAceitar} disabled={loading || !familia} style={{ background: 'var(--amber)', color: '#412402', border: 'none', borderRadius: 'var(--r)', padding: '12px', fontSize: '14px', fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', opacity: loading || !familia ? 0.6 : 1 }}>
            {loading ? 'Entrando...' : 'Aceitar convite'}
          </button>
          <Link href="/" style={{ color: 'var(--ink4)', fontSize: '13px', textDecoration: 'none' }}>Não, obrigado</Link>
        </div>
      </div>
    </div>
  )
}
