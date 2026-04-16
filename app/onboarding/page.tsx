'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

type Etapa = 1 | 2 | 3 | 4

const EMOJIS_PET = ['🐕', '🐈', '🐇', '🐹', '🦜', '🐠', '🐢', '🦎']
const ESPECIES = ['Cachorro', 'Gato', 'Coelho', 'Hamster', 'Pássaro', 'Peixe', 'Réptil', 'Outro']
const FREQUENCIAS = [
  { value: 'DIARIO', label: 'Diário' },
  { value: 'SEMANAL', label: 'Semanal' },
  { value: 'QUINZENAL', label: 'Quinzenal' },
  { value: 'MENSAL', label: 'Mensal' },
  { value: 'PERSONALIZADO', label: 'Personalizado' },
]
const CUIDADOS_SUGERIDOS = ['Banho', 'Tosa', 'Vacina', 'Vermifugação', 'Antipulgas', 'Consulta veterinária']

const hoje = new Date().toISOString().split('T')[0]

interface MedicamentoItem {
  nome: string
  dose: string
  frequencia: string
  dataInicio: string
}

interface CuidadoItem {
  tipo: string
  frequenciaDias: string
}

const inputStyle = {
  width: '100%',
  background: 'var(--surface)',
  border: '1px solid var(--border2)',
  borderRadius: 'var(--r)',
  padding: '9px 12px',
  fontSize: '13px',
  fontFamily: 'inherit',
  color: 'var(--ink)',
  outline: 'none',
} as React.CSSProperties

const labelStyle = {
  display: 'block',
  fontSize: '11px',
  fontWeight: 700,
  color: 'var(--ink4)',
  marginBottom: '5px',
  letterSpacing: '.3px',
} as React.CSSProperties

export default function OnboardingPage() {
  const [etapa, setEtapa] = useState<Etapa>(1)

  // Etapa 2 — Família
  const [modoFamilia, setModoFamilia] = useState<'criar' | 'entrar'>('criar')
  const [nomeFamilia, setNomeFamilia] = useState('')
  const [codigoConvite, setCodigoConvite] = useState('')

  // Etapa 3 — Pet
  const [nomePet, setNomePet] = useState('')
  const [especiePet, setEspeciePet] = useState('')
  const [racaPet, setRacaPet] = useState('')
  const [sexoPet, setSexoPet] = useState('')
  const [dataNascimentoPet, setDataNascimentoPet] = useState('')
  const [pesoPet, setPesoPet] = useState('')
  const [emojiPet, setEmojiPet] = useState('🐕')
  const [petId, setPetId] = useState<string | null>(null)

  // Etapa 4 — Medicamentos
  const [medicamentos, setMedicamentos] = useState<MedicamentoItem[]>([])
  const [showAddMed, setShowAddMed] = useState(false)
  const [medAtual, setMedAtual] = useState<MedicamentoItem>({
    nome: '', dose: '', frequencia: 'DIARIO', dataInicio: hoje,
  })

  // Etapa 4 — Cuidados
  const [cuidados, setCuidados] = useState<CuidadoItem[]>([])
  const [showAddCuidado, setShowAddCuidado] = useState(false)
  const [cuidadoAtual, setCuidadoAtual] = useState<CuidadoItem>({ tipo: '', frequenciaDias: '7' })

  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  // ── Handlers ──────────────────────────────────────────────────────────────

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

      const res = await fetch('/api/pet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: nomePet,
          especie: especiePet,
          raca: racaPet || null,
          sexo: sexoPet || null,
          dataNascimento: dataNascimentoPet || null,
          peso: pesoPet ? parseFloat(pesoPet) : null,
          emoji: emojiPet,
          usuarioId: user.id,
        }),
      })
      if (!res.ok) throw new Error('Erro ao cadastrar pet')
      const data = await res.json()
      setPetId(data.id)
      setEtapa(4)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao cadastrar pet')
    } finally {
      setLoading(false)
    }
  }

  async function handleSaude() {
    if (!petId) { router.push('/dashboard'); return }
    setLoading(true)
    try {
      for (const med of medicamentos) {
        const medRes = await fetch(`/api/pets/${petId}/remedios`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(med),
        })
        if (!medRes.ok) {
          const err = await medRes.json().catch(() => ({}))
          toast.error(`Erro ao salvar remédio "${med.nome}": ${err.error ?? 'tente novamente'}`)
          setLoading(false)
          return
        }
      }
      for (const cuidado of cuidados) {
        const cuidadoRes = await fetch(`/api/pets/${petId}/cuidados`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(cuidado),
        })
        if (!cuidadoRes.ok) {
          const err = await cuidadoRes.json().catch(() => ({}))
          toast.error(`Erro ao salvar cuidado "${cuidado.tipo}": ${err.error ?? 'tente novamente'}`)
          setLoading(false)
          return
        }
      }
      toast.success('Tudo pronto! Bem-vindo ao PataFamília 🎉')
      router.push('/dashboard')
    } catch {
      toast.error('Erro ao salvar dados de saúde')
      setLoading(false)
    }
  }

  function adicionarMed() {
    if (!medAtual.nome.trim() || !medAtual.dose.trim()) {
      toast.error('Nome e dose são obrigatórios')
      return
    }
    setMedicamentos(prev => [...prev, { ...medAtual }])
    setMedAtual({ nome: '', dose: '', frequencia: 'DIARIO', dataInicio: hoje })
    setShowAddMed(false)
  }

  function adicionarCuidado() {
    if (!cuidadoAtual.tipo.trim()) {
      toast.error('Tipo de cuidado é obrigatório')
      return
    }
    setCuidados(prev => [...prev, { ...cuidadoAtual }])
    setCuidadoAtual({ tipo: '', frequenciaDias: '7' })
    setShowAddCuidado(false)
  }

  // ── Stepper ────────────────────────────────────────────────────────────────

  const STEPS = ['Conta', 'Família', 'Pet', 'Saúde']

  const stepStyle = (step: number) => ({
    width: '26px', height: '26px', borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '11px', fontWeight: 700, flexShrink: 0,
    background: etapa > step ? 'var(--teal)' : etapa === step ? 'var(--amber)' : 'var(--border)',
    color: etapa > step ? '#fff' : etapa === step ? '#412402' : 'var(--ink4)',
  } as React.CSSProperties)

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '520px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ width: '48px', height: '48px', background: 'var(--amber)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', margin: '0 auto 12px' }}>🐾</div>
          <div style={{ fontFamily: 'var(--font-syne)', fontSize: '20px', fontWeight: 800, color: 'var(--ink)' }}>Vamos configurar tudo</div>
        </div>

        {/* Stepper */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
          {STEPS.map((label, i) => {
            const step = i + 1
            return (
              <div key={step} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={stepStyle(step)}>{etapa > step ? '✓' : step}</div>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: etapa === step ? 'var(--amber-800)' : etapa > step ? 'var(--teal-800)' : 'var(--ink4)', whiteSpace: 'nowrap' }}>{label}</span>
                </div>
                {i < STEPS.length - 1 && <div style={{ flex: 1, height: '1.5px', background: etapa > step ? 'var(--teal)' : 'var(--border)', margin: '0 6px' }} />}
              </div>
            )
          })}
        </div>

        <div style={{ background: 'var(--card)', borderRadius: 'var(--r-lg)', border: '1px solid var(--border)', padding: '28px' }}>

          {/* ── Etapa 1 — Conta ────────────────────────────────────────── */}
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

          {/* ── Etapa 2 — Família ──────────────────────────────────────── */}
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
                    <label style={labelStyle}>NOME DA FAMÍLIA</label>
                    <input value={nomeFamilia} onChange={e => setNomeFamilia(e.target.value)} required placeholder="Ex: Família Costa" style={inputStyle} />
                  </div>
                ) : (
                  <div>
                    <label style={labelStyle}>CÓDIGO DE CONVITE</label>
                    <input value={codigoConvite} onChange={e => setCodigoConvite(e.target.value.toUpperCase())} required placeholder="Ex: COSTA-26" style={{ ...inputStyle, letterSpacing: '2px', fontWeight: 700 }} />
                  </div>
                )}
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  <button type="button" onClick={() => setEtapa(1)} style={{ padding: '8px 16px', border: '1px solid var(--border2)', borderRadius: 'var(--r)', background: 'transparent', fontFamily: 'inherit', fontWeight: 600, fontSize: '13px', cursor: 'pointer', color: 'var(--ink3)' }}>Voltar</button>
                  <button type="submit" disabled={loading} style={{ background: 'var(--amber)', color: '#412402', border: 'none', borderRadius: 'var(--r)', padding: '8px 20px', fontSize: '13px', fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>
                    {loading ? 'Aguarde...' : 'Continuar →'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ── Etapa 3 — Pet ─────────────────────────────────────────── */}
          {etapa === 3 && (
            <div>
              <div style={{ fontFamily: 'var(--font-syne)', fontSize: '16px', fontWeight: 700, color: 'var(--ink)', marginBottom: '16px' }}>Cadastre seu primeiro pet</div>
              <form onSubmit={handlePet} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* Emoji */}
                <div>
                  <label style={labelStyle}>EMOJI DO PET</label>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {EMOJIS_PET.map(e => (
                      <button key={e} type="button" onClick={() => setEmojiPet(e)} style={{ width: '42px', height: '42px', borderRadius: '8px', border: `2px solid ${emojiPet === e ? 'var(--amber)' : 'var(--border)'}`, background: emojiPet === e ? 'var(--amber-50)' : 'var(--surface)', fontSize: '20px', cursor: 'pointer' }}>{e}</button>
                    ))}
                  </div>
                </div>

                {/* Nome */}
                <div>
                  <label style={labelStyle}>NOME *</label>
                  <input value={nomePet} onChange={e => setNomePet(e.target.value)} required placeholder="Ex: Bolinha" style={inputStyle} />
                </div>

                {/* Espécie + Raça */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>ESPÉCIE *</label>
                    <select value={especiePet} onChange={e => setEspeciePet(e.target.value)} required style={inputStyle}>
                      <option value="">Selecione...</option>
                      {ESPECIES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>RAÇA</label>
                    <input value={racaPet} onChange={e => setRacaPet(e.target.value)} placeholder="Ex: Golden Retriever" style={inputStyle} />
                  </div>
                </div>

                {/* Sexo + Nascimento */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>SEXO</label>
                    <select value={sexoPet} onChange={e => setSexoPet(e.target.value)} style={inputStyle}>
                      <option value="">Selecione...</option>
                      <option value="Macho">Macho</option>
                      <option value="Fêmea">Fêmea</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>DATA DE NASCIMENTO</label>
                    <input type="date" value={dataNascimentoPet} onChange={e => setDataNascimentoPet(e.target.value)} style={inputStyle} />
                  </div>
                </div>

                {/* Peso */}
                <div>
                  <label style={labelStyle}>PESO (kg)</label>
                  <input type="number" step="0.1" min="0" value={pesoPet} onChange={e => setPesoPet(e.target.value)} placeholder="Ex: 12.5" style={{ ...inputStyle, maxWidth: '160px' }} />
                </div>

                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  <button type="button" onClick={() => router.push('/dashboard')} style={{ padding: '8px 16px', border: '1px solid var(--border2)', borderRadius: 'var(--r)', background: 'transparent', fontFamily: 'inherit', fontWeight: 600, fontSize: '13px', cursor: 'pointer', color: 'var(--ink3)' }}>Pular por agora</button>
                  <button type="submit" disabled={loading} style={{ background: 'var(--amber)', color: '#412402', border: 'none', borderRadius: 'var(--r)', padding: '8px 20px', fontSize: '13px', fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>
                    {loading ? 'Salvando...' : 'Continuar →'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ── Etapa 4 — Saúde ───────────────────────────────────────── */}
          {etapa === 4 && (
            <div>
              <div style={{ fontFamily: 'var(--font-syne)', fontSize: '16px', fontWeight: 700, color: 'var(--ink)', marginBottom: '4px' }}>
                Medicamentos e cuidados
              </div>
              <div style={{ fontSize: '13px', color: 'var(--ink3)', marginBottom: '20px' }}>
                Configure os cuidados de {emojiPet} {nomePet}. Você pode pular e fazer isso depois no perfil do pet.
              </div>

              {/* ── Medicamentos ── */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink)' }}>💊 Medicamentos</div>
                  {!showAddMed && (
                    <button type="button" onClick={() => setShowAddMed(true)} style={{ fontSize: '12px', fontWeight: 700, color: 'var(--amber-800)', background: 'var(--amber-50)', border: '1px solid var(--amber)', borderRadius: 'var(--r)', padding: '4px 10px', fontFamily: 'inherit', cursor: 'pointer' }}>+ Adicionar</button>
                  )}
                </div>

                {medicamentos.map((m, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'var(--surface)', borderRadius: 'var(--r)', border: '1px solid var(--border)', marginBottom: '6px' }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink)' }}>{m.nome}</div>
                      <div style={{ fontSize: '12px', color: 'var(--ink3)' }}>{m.dose} · {FREQUENCIAS.find(f => f.value === m.frequencia)?.label}</div>
                    </div>
                    <button onClick={() => setMedicamentos(prev => prev.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', color: 'var(--ink4)', fontSize: '18px', cursor: 'pointer', padding: '0 4px', lineHeight: 1 }}>×</button>
                  </div>
                ))}

                {medicamentos.length === 0 && !showAddMed && (
                  <div style={{ fontSize: '13px', color: 'var(--ink4)', padding: '10px 12px', background: 'var(--surface)', borderRadius: 'var(--r)', border: '1px dashed var(--border)' }}>
                    Nenhum medicamento adicionado
                  </div>
                )}

                {showAddMed && (
                  <div style={{ padding: '14px', background: 'var(--surface)', borderRadius: 'var(--r)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div>
                        <label style={labelStyle}>NOME DO REMÉDIO *</label>
                        <input value={medAtual.nome} onChange={e => setMedAtual(p => ({ ...p, nome: e.target.value }))} placeholder="Ex: Drontal" style={inputStyle} />
                      </div>
                      <div>
                        <label style={labelStyle}>DOSE *</label>
                        <input value={medAtual.dose} onChange={e => setMedAtual(p => ({ ...p, dose: e.target.value }))} placeholder="Ex: 1 comprimido" style={inputStyle} />
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div>
                        <label style={labelStyle}>FREQUÊNCIA</label>
                        <select value={medAtual.frequencia} onChange={e => setMedAtual(p => ({ ...p, frequencia: e.target.value }))} style={inputStyle}>
                          {FREQUENCIAS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={labelStyle}>DATA DE INÍCIO</label>
                        <input type="date" value={medAtual.dataInicio} onChange={e => setMedAtual(p => ({ ...p, dataInicio: e.target.value }))} style={inputStyle} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button type="button" onClick={() => setShowAddMed(false)} style={{ padding: '6px 12px', border: '1px solid var(--border2)', borderRadius: 'var(--r)', background: 'transparent', fontFamily: 'inherit', fontWeight: 600, fontSize: '12px', cursor: 'pointer', color: 'var(--ink3)' }}>Cancelar</button>
                      <button type="button" onClick={adicionarMed} style={{ background: 'var(--teal)', color: '#fff', border: 'none', borderRadius: 'var(--r)', padding: '6px 16px', fontSize: '12px', fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' }}>Adicionar</button>
                    </div>
                  </div>
                )}
              </div>

              {/* ── Cuidados ── */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink)' }}>🩺 Cuidados</div>
                  {!showAddCuidado && (
                    <button type="button" onClick={() => setShowAddCuidado(true)} style={{ fontSize: '12px', fontWeight: 700, color: 'var(--amber-800)', background: 'var(--amber-50)', border: '1px solid var(--amber)', borderRadius: 'var(--r)', padding: '4px 10px', fontFamily: 'inherit', cursor: 'pointer' }}>+ Adicionar</button>
                  )}
                </div>

                {cuidados.map((c, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'var(--surface)', borderRadius: 'var(--r)', border: '1px solid var(--border)', marginBottom: '6px' }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink)' }}>{c.tipo}</div>
                      <div style={{ fontSize: '12px', color: 'var(--ink3)' }}>A cada {c.frequenciaDias} dias</div>
                    </div>
                    <button onClick={() => setCuidados(prev => prev.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', color: 'var(--ink4)', fontSize: '18px', cursor: 'pointer', padding: '0 4px', lineHeight: 1 }}>×</button>
                  </div>
                ))}

                {cuidados.length === 0 && !showAddCuidado && (
                  <div style={{ fontSize: '13px', color: 'var(--ink4)', padding: '10px 12px', background: 'var(--surface)', borderRadius: 'var(--r)', border: '1px dashed var(--border)' }}>
                    Nenhum cuidado adicionado
                  </div>
                )}

                {showAddCuidado && (
                  <div style={{ padding: '14px', background: 'var(--surface)', borderRadius: 'var(--r)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div>
                      <label style={labelStyle}>TIPO DE CUIDADO *</label>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                        {CUIDADOS_SUGERIDOS.map(s => (
                          <button key={s} type="button" onClick={() => setCuidadoAtual(p => ({ ...p, tipo: s }))} style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '20px', border: `1px solid ${cuidadoAtual.tipo === s ? 'var(--amber)' : 'var(--border)'}`, background: cuidadoAtual.tipo === s ? 'var(--amber-50)' : 'var(--surface)', color: cuidadoAtual.tipo === s ? 'var(--amber-800)' : 'var(--ink3)', fontFamily: 'inherit', fontWeight: 600, cursor: 'pointer' }}>{s}</button>
                        ))}
                      </div>
                      <input value={cuidadoAtual.tipo} onChange={e => setCuidadoAtual(p => ({ ...p, tipo: e.target.value }))} placeholder="Ou escreva o tipo..." style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>FREQUÊNCIA (dias)</label>
                      <input type="number" min="1" value={cuidadoAtual.frequenciaDias} onChange={e => setCuidadoAtual(p => ({ ...p, frequenciaDias: e.target.value }))} placeholder="Ex: 7" style={{ ...inputStyle, maxWidth: '120px' }} />
                    </div>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button type="button" onClick={() => setShowAddCuidado(false)} style={{ padding: '6px 12px', border: '1px solid var(--border2)', borderRadius: 'var(--r)', background: 'transparent', fontFamily: 'inherit', fontWeight: 600, fontSize: '12px', cursor: 'pointer', color: 'var(--ink3)' }}>Cancelar</button>
                      <button type="button" onClick={adicionarCuidado} style={{ background: 'var(--teal)', color: '#fff', border: 'none', borderRadius: 'var(--r)', padding: '6px 16px', fontSize: '12px', fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' }}>Adicionar</button>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => router.push('/dashboard')} style={{ padding: '8px 16px', border: '1px solid var(--border2)', borderRadius: 'var(--r)', background: 'transparent', fontFamily: 'inherit', fontWeight: 600, fontSize: '13px', cursor: 'pointer', color: 'var(--ink3)' }}>Pular</button>
                <button type="button" onClick={handleSaude} disabled={loading} style={{ background: 'var(--amber)', color: '#412402', border: 'none', borderRadius: 'var(--r)', padding: '8px 20px', fontSize: '13px', fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>
                  {loading ? 'Salvando...' : 'Concluir ✓'}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
