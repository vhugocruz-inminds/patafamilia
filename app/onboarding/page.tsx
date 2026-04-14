'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { gerarCodigoConvite } from '@/lib/utils'

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
  const supabase = createClient()

  // gerarCodigoConvite is imported but used server-side via the API; kept here for reference
  void gerarCodigoConvite

  async function handleFamilia(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Não autenticado')

      const res = await fetch('/api/familia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          modoFamilia === 'criar'
            ? { acao: 'criar', nomeFamilia, usuarioId: user.id }
            : { acao: 'entrar', codigo: codigoConvite, usuarioId: user.id }
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
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Não autenticado')

      const res = await fetch('/api/pets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: nomePet, especie: especiePet, emoji: emojiPet, usuarioId: user.id }),
      })
      if (!res.ok) throw new Error('Erro ao cadastrar pet')
      toast.success('Tudo pronto! Bem-vindo ao PataFamília 🎉')
      router.push('/dashboard')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao cadastrar pet')
    } finally {
      setLoading(false)
    }
  }

  const stepStyle = (step: number) => ({
    width: '26px', height: '26px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '11px', fontWeight: 700, flexShrink: 0,
    background: etapa > step ? 'var(--teal)' : etapa === step ? 'var(--amber)' : 'var(--border)',
    color: etapa > step ? '#fff' : etapa === step ? '#412402' : 'var(--ink4)',
  } as React.CSSProperties)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '500px' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ width: '48px', height: '48px', background: 'var(--amber)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', margin: '0 auto 12px' }}>🐾</div>
          <div style={{ fontFamily: 'var(--font-syne)', fontSize: '20px', fontWeight: 800, color: 'var(--ink)' }}>Vamos configurar tudo</div>
        </div>

        {/* Stepper */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0', marginBottom: '24px' }}>
          {[1, 2, 3].map((s, i) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={stepStyle(s)}>{etapa > s ? '✓' : s}</div>
                <span style={{ fontSize: '12px', fontWeight: 600, color: etapa === s ? 'var(--amber-800)' : etapa > s ? 'var(--teal-800)' : 'var(--ink4)' }}>
                  {['Conta', 'Família', 'Pet'][i]}
                </span>
              </div>
              {i < 2 && <div style={{ flex: 1, height: '1.5px', background: etapa > s ? 'var(--teal)' : 'var(--border)', margin: '0 8px' }} />}
            </div>
          ))}
        </div>

        <div style={{ background: 'var(--card)', borderRadius: 'var(--r-lg)', border: '1px solid var(--border)', padding: '28px' }}>
          {/* Etapa 1 - automática */}
          {etapa === 1 && (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>✅</div>
              <div style={{ fontWeight: 700, color: 'var(--ink)', marginBottom: '6px' }}>Conta criada com sucesso!</div>
              <div style={{ color: 'var(--ink3)', fontSize: '13px', marginBottom: '20px' }}>Agora vamos configurar a sua família.</div>
              <button onClick={() => setEtapa(2)} style={{ background: 'var(--amber)', color: '#412402', border: 'none', borderRadius: 'var(--r)', padding: '10px 24px', fontSize: '13px', fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' }}>
                Continuar →
              </button>
            </div>
          )}

          {/* Etapa 2 - Família */}
          {etapa === 2 && (
            <div>
              <div style={{ fontFamily: 'var(--font-syne)', fontSize: '16px', fontWeight: 700, color: 'var(--ink)', marginBottom: '16px' }}>Configure sua família</div>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                {(['criar', 'entrar'] as const).map(modo => (
                  <button key={modo} onClick={() => setModoFamilia(modo)} style={{ flex: 1, padding: '8px', borderRadius: 'var(--r)', border: `1px solid ${modoFamilia === modo ? 'var(--amber)' : 'var(--border)'}`, background: modoFamilia === modo ? 'var(--amber-50)' : 'var(--card)', color: modoFamilia === modo ? 'var(--amber-800)' : 'var(--ink3)', fontFamily: 'inherit', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>
                    {modo === 'criar' ? '🏠 Criar família' : '🔑 Entrar por código'}
                  </button>
                ))}
              </div>
              <form onSubmit={handleFamilia} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {modoFamilia === 'criar' ? (
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--ink4)', marginBottom: '5px', letterSpacing: '.3px' }}>NOME DA FAMÍLIA</label>
                    <input value={nomeFamilia} onChange={e => setNomeFamilia(e.target.value)} required placeholder="Ex: Família Costa" style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 'var(--r)', padding: '9px 12px', fontSize: '13px', fontFamily: 'inherit', color: 'var(--ink)', outline: 'none' }} />
                  </div>
                ) : (
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--ink4)', marginBottom: '5px', letterSpacing: '.3px' }}>CÓDIGO DE CONVITE</label>
                    <input value={codigoConvite} onChange={e => setCodigoConvite(e.target.value.toUpperCase())} required placeholder="Ex: COSTA-26" style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 'var(--r)', padding: '9px 12px', fontSize: '13px', fontFamily: 'inherit', color: 'var(--ink)', outline: 'none', letterSpacing: '2px', fontWeight: 700 }} />
                  </div>
                )}
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  <button type="button" onClick={() => setEtapa(1)} style={{ padding: '8px 16px', border: '1px solid var(--border2)', borderRadius: 'var(--r)', background: 'transparent', fontFamily: 'inherit', fontWeight: 600, fontSize: '13px', cursor: 'pointer', color: 'var(--ink2)' }}>Voltar</button>
                  <button type="submit" disabled={loading} style={{ background: 'var(--amber)', color: '#412402', border: 'none', borderRadius: 'var(--r)', padding: '8px 20px', fontSize: '13px', fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>
                    {loading ? 'Aguarde...' : 'Continuar →'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Etapa 3 - Pet */}
          {etapa === 3 && (
            <div>
              <div style={{ fontFamily: 'var(--font-syne)', fontSize: '16px', fontWeight: 700, color: 'var(--ink)', marginBottom: '16px' }}>Cadastre seu primeiro pet</div>
              <form onSubmit={handlePet} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--ink4)', marginBottom: '8px', letterSpacing: '.3px' }}>EMOJI DO PET</label>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {EMOJIS_PET.map(e => (
                      <button key={e} type="button" onClick={() => setEmojiPet(e)} style={{ width: '40px', height: '40px', borderRadius: '8px', border: `2px solid ${emojiPet === e ? 'var(--amber)' : 'var(--border)'}`, background: emojiPet === e ? 'var(--amber-50)' : 'var(--surface)', fontSize: '20px', cursor: 'pointer' }}>{e}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--ink4)', marginBottom: '5px', letterSpacing: '.3px' }}>NOME DO PET</label>
                  <input value={nomePet} onChange={e => setNomePet(e.target.value)} required placeholder="Ex: Bolinha" style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 'var(--r)', padding: '9px 12px', fontSize: '13px', fontFamily: 'inherit', color: 'var(--ink)', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--ink4)', marginBottom: '5px', letterSpacing: '.3px' }}>ESPÉCIE</label>
                  <select value={especiePet} onChange={e => setEspeciePet(e.target.value)} required style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 'var(--r)', padding: '9px 12px', fontSize: '13px', fontFamily: 'inherit', color: 'var(--ink)', outline: 'none' }}>
                    <option value="">Selecione...</option>
                    {['Cachorro', 'Gato', 'Coelho', 'Hamster', 'Pássaro', 'Peixe', 'Réptil', 'Outro'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  <button type="button" onClick={() => router.push('/dashboard')} style={{ padding: '8px 16px', border: '1px solid var(--border2)', borderRadius: 'var(--r)', background: 'transparent', fontFamily: 'inherit', fontWeight: 600, fontSize: '13px', cursor: 'pointer', color: 'var(--ink2)' }}>Pular por agora</button>
                  <button type="submit" disabled={loading} style={{ background: 'var(--amber)', color: '#412402', border: 'none', borderRadius: 'var(--r)', padding: '8px 20px', fontSize: '13px', fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>
                    {loading ? 'Salvando...' : 'Concluir ✓'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
