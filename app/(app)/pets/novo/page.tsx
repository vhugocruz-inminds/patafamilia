'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import Link from 'next/link'

const EMOJIS = ['🐕', '🐈', '🐇', '🐹', '🦜', '🐠', '🐢', '🦎', '🐓', '🐾']
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

export default function NovoPetPage() {
  // Pet fields
  const [nome, setNome] = useState('')
  const [especie, setEspecie] = useState('')
  const [raca, setRaca] = useState('')
  const [sexo, setSexo] = useState('')
  const [dataNascimento, setDataNascimento] = useState('')
  const [peso, setPeso] = useState('')
  const [emoji, setEmoji] = useState('🐕')

  // Medicamentos
  const [medicamentos, setMedicamentos] = useState<MedicamentoItem[]>([])
  const [showAddMed, setShowAddMed] = useState(false)
  const [medAtual, setMedAtual] = useState<MedicamentoItem>({
    nome: '', dose: '', frequencia: 'DIARIO', dataInicio: hoje,
  })

  // Cuidados
  const [cuidados, setCuidados] = useState<CuidadoItem[]>([])
  const [showAddCuidado, setShowAddCuidado] = useState(false)
  const [cuidadoAtual, setCuidadoAtual] = useState<CuidadoItem>({ tipo: '', frequenciaDias: '7' })

  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error('Não autenticado'); setLoading(false); return }

    // 1. Create pet
    const res = await fetch('/api/pet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome, especie, raca, sexo,
        dataNascimento: dataNascimento || null,
        peso: peso ? parseFloat(peso) : null,
        emoji,
        usuarioId: user.id,
      }),
    })
    if (!res.ok) { toast.error('Erro ao cadastrar pet'); setLoading(false); return }
    const pet = await res.json()

    // 2. Create medications
    for (const med of medicamentos) {
      await fetch(`/api/pets/${pet.id}/remedios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(med),
      })
    }

    // 3. Create care routines
    for (const cuidado of cuidados) {
      await fetch(`/api/pets/${pet.id}/cuidados`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cuidado),
      })
    }

    toast.success(`${emoji} ${nome} cadastrado com sucesso!`)
    router.push(`/pets/${pet.id}`)
  }

  const inputStyle = { width: '100%', background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: '10px', padding: '9px 12px', fontSize: '13px', fontFamily: 'inherit', color: 'var(--ink)', outline: 'none' }
  const labelStyle: React.CSSProperties = { display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--ink4)', marginBottom: '5px', letterSpacing: '.3px' }
  const sectionCard: React.CSSProperties = { background: 'var(--card)', borderRadius: 'var(--r-lg)', border: '1px solid var(--border)', padding: '20px', marginBottom: '12px' }

  return (
    <div style={{ padding: '24px', maxWidth: '560px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <Link href="/dashboard" style={{ color: 'var(--ink3)', textDecoration: 'none', fontSize: '20px' }}>←</Link>
        <div>
          <div style={{ fontFamily: 'var(--font-syne)', fontSize: '20px', fontWeight: 800, color: 'var(--ink)' }}>Novo pet</div>
          <div style={{ fontSize: '13px', color: 'var(--ink3)' }}>Cadastre um novo integrante da família</div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>

        {/* ── Dados do Pet ── */}
        <div style={sectionCard}>
          <div style={{ fontFamily: 'var(--font-syne)', fontSize: '14px', fontWeight: 700, color: 'var(--ink)', marginBottom: '16px' }}>Dados do pet</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Emoji */}
            <div>
              <label style={labelStyle}>EMOJI DO PET</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {EMOJIS.map(e => (
                  <button key={e} type="button" onClick={() => setEmoji(e)} style={{ width: '44px', height: '44px', borderRadius: '10px', border: `2px solid ${emoji === e ? 'var(--amber)' : 'var(--border)'}`, background: emoji === e ? 'var(--amber-50)' : 'var(--surface)', fontSize: '22px', cursor: 'pointer', transition: 'all .15s' }}>{e}</button>
                ))}
              </div>
            </div>

            {/* Nome */}
            <div>
              <label style={labelStyle}>NOME *</label>
              <input value={nome} onChange={e => setNome(e.target.value)} required placeholder="Ex: Bolinha" style={inputStyle} />
            </div>

            {/* Espécie + Raça */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={labelStyle}>ESPÉCIE *</label>
                <select value={especie} onChange={e => setEspecie(e.target.value)} required style={{ ...inputStyle }}>
                  <option value="">Selecione...</option>
                  {ESPECIES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>RAÇA</label>
                <input value={raca} onChange={e => setRaca(e.target.value)} placeholder="Ex: Golden Retriever" style={inputStyle} />
              </div>
            </div>

            {/* Sexo + Data nascimento */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={labelStyle}>SEXO</label>
                <select value={sexo} onChange={e => setSexo(e.target.value)} style={{ ...inputStyle }}>
                  <option value="">Selecione...</option>
                  <option value="Macho">Macho</option>
                  <option value="Fêmea">Fêmea</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>DATA DE NASCIMENTO</label>
                <input type="date" value={dataNascimento} onChange={e => setDataNascimento(e.target.value)} style={inputStyle} />
              </div>
            </div>

            {/* Peso */}
            <div style={{ maxWidth: '200px' }}>
              <label style={labelStyle}>PESO (kg)</label>
              <input type="number" step="0.1" min="0" value={peso} onChange={e => setPeso(e.target.value)} placeholder="Ex: 12.5" style={inputStyle} />
            </div>
          </div>
        </div>

        {/* ── Medicamentos ── */}
        <div style={sectionCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ fontFamily: 'var(--font-syne)', fontSize: '14px', fontWeight: 700, color: 'var(--ink)' }}>💊 Medicamentos</div>
            {!showAddMed && (
              <button type="button" onClick={() => setShowAddMed(true)} style={{ fontSize: '12px', fontWeight: 700, color: 'var(--amber-800)', background: 'var(--amber-50)', border: '1px solid var(--amber)', borderRadius: '8px', padding: '4px 10px', fontFamily: 'inherit', cursor: 'pointer' }}>+ Adicionar</button>
            )}
          </div>

          {medicamentos.map((m, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'var(--surface)', borderRadius: '8px', border: '1px solid var(--border)', marginBottom: '6px' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink)' }}>{m.nome}</div>
                <div style={{ fontSize: '12px', color: 'var(--ink3)' }}>{m.dose} · {FREQUENCIAS.find(f => f.value === m.frequencia)?.label}</div>
              </div>
              <button type="button" onClick={() => setMedicamentos(prev => prev.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', color: 'var(--ink4)', fontSize: '18px', cursor: 'pointer', padding: '0 4px', lineHeight: 1 }}>×</button>
            </div>
          ))}

          {medicamentos.length === 0 && !showAddMed && (
            <div style={{ fontSize: '13px', color: 'var(--ink4)', padding: '10px 12px', background: 'var(--surface)', borderRadius: '8px', border: '1px dashed var(--border)' }}>
              Nenhum medicamento — adicione se o pet toma remédio regularmente
            </div>
          )}

          {showAddMed && (
            <div style={{ padding: '14px', background: 'var(--surface)', borderRadius: '8px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
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
                <button type="button" onClick={() => setShowAddMed(false)} style={{ padding: '6px 12px', border: '1px solid var(--border2)', borderRadius: '8px', background: 'transparent', fontFamily: 'inherit', fontWeight: 600, fontSize: '12px', cursor: 'pointer', color: 'var(--ink3)' }}>Cancelar</button>
                <button type="button" onClick={adicionarMed} style={{ background: 'var(--teal)', color: '#fff', border: 'none', borderRadius: '8px', padding: '6px 16px', fontSize: '12px', fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' }}>Adicionar</button>
              </div>
            </div>
          )}
        </div>

        {/* ── Cuidados ── */}
        <div style={sectionCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ fontFamily: 'var(--font-syne)', fontSize: '14px', fontWeight: 700, color: 'var(--ink)' }}>🩺 Cuidados</div>
            {!showAddCuidado && (
              <button type="button" onClick={() => setShowAddCuidado(true)} style={{ fontSize: '12px', fontWeight: 700, color: 'var(--amber-800)', background: 'var(--amber-50)', border: '1px solid var(--amber)', borderRadius: '8px', padding: '4px 10px', fontFamily: 'inherit', cursor: 'pointer' }}>+ Adicionar</button>
            )}
          </div>

          {cuidados.map((c, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'var(--surface)', borderRadius: '8px', border: '1px solid var(--border)', marginBottom: '6px' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink)' }}>{c.tipo}</div>
                <div style={{ fontSize: '12px', color: 'var(--ink3)' }}>A cada {c.frequenciaDias} dias</div>
              </div>
              <button type="button" onClick={() => setCuidados(prev => prev.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', color: 'var(--ink4)', fontSize: '18px', cursor: 'pointer', padding: '0 4px', lineHeight: 1 }}>×</button>
            </div>
          ))}

          {cuidados.length === 0 && !showAddCuidado && (
            <div style={{ fontSize: '13px', color: 'var(--ink4)', padding: '10px 12px', background: 'var(--surface)', borderRadius: '8px', border: '1px dashed var(--border)' }}>
              Nenhum cuidado — adicione rotinas como banho, tosa ou vacinas
            </div>
          )}

          {showAddCuidado && (
            <div style={{ padding: '14px', background: 'var(--surface)', borderRadius: '8px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
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
                <button type="button" onClick={() => setShowAddCuidado(false)} style={{ padding: '6px 12px', border: '1px solid var(--border2)', borderRadius: '8px', background: 'transparent', fontFamily: 'inherit', fontWeight: 600, fontSize: '12px', cursor: 'pointer', color: 'var(--ink3)' }}>Cancelar</button>
                <button type="button" onClick={adicionarCuidado} style={{ background: 'var(--teal)', color: '#fff', border: 'none', borderRadius: '8px', padding: '6px 16px', fontSize: '12px', fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' }}>Adicionar</button>
              </div>
            </div>
          )}
        </div>

        {/* ── Ações ── */}
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' }}>
          <Link href="/dashboard" style={{ padding: '8px 16px', border: '1px solid var(--border2)', borderRadius: '10px', fontFamily: 'inherit', fontWeight: 600, fontSize: '13px', cursor: 'pointer', color: 'var(--ink2)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>Cancelar</Link>
          <button type="submit" disabled={loading} style={{ background: 'var(--amber)', color: '#412402', border: 'none', borderRadius: '10px', padding: '8px 24px', fontSize: '13px', fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Salvando...' : 'Cadastrar pet'}
          </button>
        </div>
      </form>
    </div>
  )
}
