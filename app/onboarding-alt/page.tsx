'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

type Etapa = 1 | 2 | 3

const EMOJIS_PET = ['🐕', '🐈', '🐇', '🐹', '🦜', '🐠', '🐢', '🦎']

export default function OnboardingPage() {
  const [etapa, setEtapa] = useState<Etapa>(1)
  const [modoFamilia, setModoFamilia] = useState<'criar' | 'entrar'>('criar')
  const [nomeFamilia, setNomeFamilia] = useState('')
  const [codigoConvite, setCodigoConvite] = useState('')
  const [nomePet, setNomePet] = useState('')
  const [especiePet, setEspeciePet] = useState('')
  const [emojiPet, setEmojiPet] = useState('🐕')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleFamilia(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/familia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          modoFamilia === 'criar'
            ? { acao: 'criar', nomeFamilia }
            : { acao: 'entrar', codigo: codigoConvite }
        ),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Erro') }
      setEtapa(3)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao configurar família')
    } finally {
      setLoading(false)
    }
  }

  async function handlePet(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/pet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nomePet,
          especie: especiePet,
          emoji: emojiPet,
        }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Erro') }
      
      toast.success('Tudo pronto! Bem-vindo ao PataFamília! 🎉')
      setTimeout(() => router.push('/dashboard'), 1500)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao criar pet')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface)', padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: '500px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🐾</div>
          <h1 style={{ fontFamily: 'var(--font-syne)', fontSize: '24px', fontWeight: 800, color: 'var(--ink)', marginBottom: '8px' }}>PataFamília</h1>
          <p style={{ color: 'var(--ink4)', fontSize: '13px' }}>
            Etapa {etapa} de 3 - {etapa === 1 ? 'Família' : etapa === 2 ? 'Pet' : 'Pronto!'}
          </p>
        </div>

        <div style={{ background: 'var(--card)', borderRadius: 'var(--r-lg)', border: '1px solid var(--border)', padding: '28px' }}>
          {/* Etapa 1: Família */}
          {etapa === 1 && (
            <form onSubmit={handleFamilia} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '12px' }}>Vamos criar sua família!</h2>
              
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                <button
                  type="button"
                  onClick={() => setModoFamilia('criar')}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: 'var(--r)',
                    border: `1px solid ${modoFamilia === 'criar' ? 'var(--amber)' : 'var(--border2)'}`,
                    background: modoFamilia === 'criar' ? 'var(--amber)' : 'var(--surface)',
                    color: modoFamilia === 'criar' ? '#412402' : 'var(--ink)',
                    fontWeight: 600,
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  ➕ Criar nova
                </button>
                <button
                  type="button"
                  onClick={() => setModoFamilia('entrar')}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: 'var(--r)',
                    border: `1px solid ${modoFamilia === 'entrar' ? 'var(--amber)' : 'var(--border2)'}`,
                    background: modoFamilia === 'entrar' ? 'var(--amber)' : 'var(--surface)',
                    color: modoFamilia === 'entrar' ? '#412402' : 'var(--ink)',
                    fontWeight: 600,
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  🔗 Entrar com código
                </button>
              </div>

              {modoFamilia === 'criar' && (
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--ink4)', marginBottom: '5px' }}>NOME DA FAMÍLIA</label>
                  <input
                    type="text"
                    value={nomeFamilia}
                    onChange={e => setNomeFamilia(e.target.value)}
                    required
                    placeholder="Ex: Família Silva"
                    style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 'var(--r)', padding: '9px 12px', fontSize: '13px', color: 'var(--ink)', fontFamily: 'inherit', outline: 'none' }}
                  />
                </div>
              )}

              {modoFamilia === 'entrar' && (
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--ink4)', marginBottom: '5px' }}>CÓDIGO DE CONVITE</label>
                  <input
                    type="text"
                    value={codigoConvite}
                    onChange={e => setCodigoConvite(e.target.value)}
                    required
                    placeholder="Ex: FAM-01-ABC123"
                    style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 'var(--r)', padding: '9px 12px', fontSize: '13px', color: 'var(--ink)', fontFamily: 'inherit', outline: 'none' }}
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  background: 'var(--amber)',
                  color: '#412402',
                  border: 'none',
                  borderRadius: 'var(--r)',
                  padding: '10px',
                  fontSize: '13px',
                  fontWeight: 700,
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                  opacity: loading ? 0.7 : 1
                }}
              >
                {loading ? 'Processando...' : 'Próximo'}
              </button>
            </form>
          )}

          {/* Etapa 2: Pet */}
          {etapa === 2 && (
            <form onSubmit={handlePet} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '12px' }}>Adicione seu primeiro pet!</h2>
              
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--ink4)', marginBottom: '5px' }}>NOME</label>
                <input
                  type="text"
                  value={nomePet}
                  onChange={e => setNomePet(e.target.value)}
                  required
                  placeholder="Ex: Rex"
                  style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 'var(--r)', padding: '9px 12px', fontSize: '13px', color: 'var(--ink)', fontFamily: 'inherit', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--ink4)', marginBottom: '5px' }}>ESPÉCIE</label>
                <input
                  type="text"
                  value={especiePet}
                  onChange={e => setEspeciePet(e.target.value)}
                  required
                  placeholder="Ex: Cachorro"
                  style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 'var(--r)', padding: '9px 12px', fontSize: '13px', color: 'var(--ink)', fontFamily: 'inherit', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--ink4)', marginBottom: '8px' }}>EMOJI</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                  {EMOJIS_PET.map(emoji => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setEmojiPet(emoji)}
                      style={{
                        padding: '10px',
                        fontSize: '24px',
                        borderRadius: 'var(--r)',
                        border: `2px solid ${emojiPet === emoji ? 'var(--amber)' : 'var(--border2)'}`,
                        background: emojiPet === emoji ? 'var(--amber) 10%' : 'transparent',
                        cursor: 'pointer'
                      }}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setEtapa(1)}
                  disabled={loading}
                  style={{
                    flex: 1,
                    background: 'var(--border)',
                    color: 'var(--ink)',
                    border: 'none',
                    borderRadius: 'var(--r)',
                    padding: '10px',
                    fontSize: '13px',
                    fontWeight: 700,
                    fontFamily: 'inherit',
                    cursor: 'pointer'
                  }}
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    flex: 1,
                    background: 'var(--amber)',
                    color: '#412402',
                    border: 'none',
                    borderRadius: 'var(--r)',
                    padding: '10px',
                    fontSize: '13px',
                    fontWeight: 700,
                    fontFamily: 'inherit',
                    cursor: 'pointer',
                    opacity: loading ? 0.7 : 1
                  }}
                >
                  {loading ? 'Salvando...' : 'Concluir'}
                </button>
              </div>
            </form>
          )}

          {/* Etapa 3: Sucesso */}
          {etapa === 3 && (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px' }}>Tudo pronto!</h2>
              <p style={{ color: 'var(--ink4)', fontSize: '13px', marginBottom: '20px' }}>
                Sua conta foi configurada com sucesso. Redirecionando para o dashboard...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
