'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export default function ResetSenhaPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const supabase = createClient()

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${location.origin}/api/auth/callback?next=/nova-senha`,
    })
    setLoading(false)
    if (error) { toast.error(error.message); return }
    setEnviado(true)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ width: '48px', height: '48px', background: 'var(--amber)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', margin: '0 auto 12px' }}>🐾</div>
          <div style={{ fontFamily: 'var(--font-syne)', fontSize: '24px', fontWeight: 800, color: 'var(--ink)' }}>Recuperar senha</div>
          <div style={{ color: 'var(--ink4)', fontSize: '13px', marginTop: '4px' }}>Enviaremos um link para seu e-mail</div>
        </div>

        <div style={{ background: 'var(--card)', borderRadius: 'var(--r-lg)', border: '1px solid var(--border)', padding: '28px' }}>
          {enviado ? (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>📬</div>
              <div style={{ fontWeight: 700, color: 'var(--ink)', marginBottom: '6px' }}>E-mail enviado!</div>
              <div style={{ color: 'var(--ink3)', fontSize: '13px' }}>Verifique sua caixa de entrada e siga as instruções.</div>
            </div>
          ) : (
            <form onSubmit={handleReset} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--ink4)', marginBottom: '5px', letterSpacing: '.3px' }}>E-MAIL</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="seu@email.com"
                  style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 'var(--r)', padding: '9px 12px', fontSize: '13px', fontFamily: 'inherit', color: 'var(--ink)', outline: 'none' }}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                style={{ background: 'var(--amber)', color: '#412402', border: 'none', borderRadius: 'var(--r)', padding: '10px', fontSize: '13px', fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', opacity: loading ? 0.7 : 1 }}
              >
                {loading ? 'Enviando...' : 'Enviar link de recuperação'}
              </button>
            </form>
          )}
        </div>

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: 'var(--ink3)' }}>
          <Link href="/login" style={{ color: 'var(--amber)', fontWeight: 700, textDecoration: 'none' }}>← Voltar para o login</Link>
        </p>
      </div>
    </div>
  )
}
