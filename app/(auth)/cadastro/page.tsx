'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export default function CadastroPage() {
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleCadastro(e: React.FormEvent) {
    e.preventDefault()
    if (senha.length < 6) { toast.error('A senha deve ter pelo menos 6 caracteres.'); return }
    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: { data: { nome } },
    })
    setLoading(false)
    if (error) { toast.error(error.message); return }
    toast.success('Conta criada! Verifique seu e-mail.')
    router.push('/onboarding')
  }

  async function handleGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${location.origin}/api/auth/callback` },
    })
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ width: '48px', height: '48px', background: 'var(--amber)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', margin: '0 auto 12px' }}>🐾</div>
          <div style={{ fontFamily: 'var(--font-syne)', fontSize: '24px', fontWeight: 800, color: 'var(--ink)' }}>PataFamília</div>
          <div style={{ color: 'var(--ink4)', fontSize: '13px', marginTop: '4px' }}>Crie sua conta gratuita</div>
        </div>

        <div style={{ background: 'var(--card)', borderRadius: 'var(--r-lg)', border: '1px solid var(--border)', padding: '28px' }}>
          <form onSubmit={handleCadastro} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {[
              { label: 'NOME', type: 'text', value: nome, setter: setNome, placeholder: 'Seu nome completo' },
              { label: 'E-MAIL', type: 'email', value: email, setter: setEmail, placeholder: 'seu@email.com' },
              { label: 'SENHA', type: 'password', value: senha, setter: setSenha, placeholder: '••••••••' },
            ].map(({ label, type, value, setter, placeholder }) => (
              <div key={label}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--ink4)', marginBottom: '5px', letterSpacing: '.3px' }}>{label}</label>
                <input
                  type={type}
                  value={value}
                  onChange={e => setter(e.target.value)}
                  required
                  placeholder={placeholder}
                  style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 'var(--r)', padding: '9px 12px', fontSize: '13px', fontFamily: 'inherit', color: 'var(--ink)', outline: 'none' }}
                />
              </div>
            ))}
            <button
              type="submit"
              disabled={loading}
              style={{ background: 'var(--amber)', color: '#412402', border: 'none', borderRadius: 'var(--r)', padding: '10px', fontSize: '13px', fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Criando conta...' : 'Criar conta'}
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '16px 0' }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
            <span style={{ fontSize: '11px', color: 'var(--ink4)', fontWeight: 600 }}>ou</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
          </div>

          <button
            onClick={handleGoogle}
            style={{ width: '100%', background: 'var(--card)', border: '1px solid var(--border2)', borderRadius: 'var(--r)', padding: '10px', fontSize: '13px', fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--ink2)' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Cadastrar com Google
          </button>
        </div>

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: 'var(--ink3)' }}>
          Já tem conta?{' '}
          <Link href="/login" style={{ color: 'var(--amber)', fontWeight: 700, textDecoration: 'none' }}>Entrar</Link>
        </p>
      </div>
    </div>
  )
}
