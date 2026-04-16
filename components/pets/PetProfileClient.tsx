'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { calcularStatusRemedio, calcularStatusCuidado } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

type Administracao = {
  id: string
  administradoEm: string
  membro: { usuario: { nome: string } }
}

type Remedio = {
  id: string
  nome: string
  dose: string
  frequencia: string
  dataInicio: string
  dataFim: string | null
  ativo: boolean
  administracoes: Administracao[]
}

type Execucao = {
  id: string
  executadoEm: string
  membro: { usuario: { nome: string } }
}

type Cuidado = {
  id: string
  tipo: string
  frequenciaDias: number
  ultimaExecucao: string | null
  proximaExecucao: string | null
  ativo: boolean
  execucoes: Execucao[]
}

type Passeio = {
  id: string
  tipo: 'REALIZADO' | 'AGENDADO'
  duracaoMin: number | null
  local: string | null
  observacoes: string | null
  realizadoEm: string | null
  agendadoEm: string | null
  membro: { usuario: { nome: string } }
}

type Pet = {
  id: string
  nome: string
  emoji: string
  especie: string
  raca: string | null
  sexo: string | null
  dataNascimento: string | null
  peso: number | null
}

interface Props {
  pet: Pet
  remedios: Remedio[]
  cuidados: Cuidado[]
  passeios: Passeio[]
  membroId: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

type StatusBadge = 'EM_DIA' | 'EM_BREVE' | 'ATRASADO'

const STATUS_LABEL: Record<StatusBadge, string> = {
  EM_DIA: 'Em dia',
  EM_BREVE: 'Em breve',
  ATRASADO: 'Atrasado',
}
const STATUS_COLOR: Record<StatusBadge, { bg: string; text: string }> = {
  EM_DIA:    { bg: 'var(--teal-50)',   text: 'var(--teal-800)' },
  EM_BREVE:  { bg: '#FEF3C7',          text: '#92400E' },
  ATRASADO:  { bg: 'var(--coral-50)',  text: 'var(--coral)' },
}

function fmt(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('pt-BR')
}

function fmtHora(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

const FREQ_OPTIONS = [
  { value: 'DIARIO',       label: 'Diário' },
  { value: 'SEMANAL',      label: 'Semanal' },
  { value: 'QUINZENAL',    label: 'Quinzenal' },
  { value: 'MENSAL',       label: 'Mensal' },
  { value: 'PERSONALIZADO',label: 'Personalizado' },
]

// ─── Styles ───────────────────────────────────────────────────────────────────

const card: React.CSSProperties = {
  background: 'var(--card)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--r-lg)',
  padding: '20px',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: '10px',
  padding: '9px 12px',
  fontSize: '13px',
  fontFamily: 'inherit',
  color: 'var(--ink)',
  outline: 'none',
  boxSizing: 'border-box',
}

const btnPrimary: React.CSSProperties = {
  background: 'var(--amber)',
  color: '#412402',
  border: 'none',
  borderRadius: '10px',
  padding: '8px 16px',
  fontSize: '13px',
  fontWeight: 700,
  fontFamily: 'inherit',
  cursor: 'pointer',
}

const btnGhost: React.CSSProperties = {
  background: 'transparent',
  border: '1px solid var(--border)',
  borderRadius: '8px',
  padding: '5px 12px',
  fontSize: '12px',
  fontWeight: 600,
  fontFamily: 'inherit',
  cursor: 'pointer',
  color: 'var(--ink3)',
}

const btnDanger: React.CSSProperties = {
  background: 'var(--coral-50)',
  border: '1px solid var(--coral-50)',
  borderRadius: '8px',
  padding: '5px 10px',
  fontSize: '12px',
  fontWeight: 600,
  fontFamily: 'inherit',
  cursor: 'pointer',
  color: 'var(--coral)',
}

// ─── Status Badge ────────────────────────────────────────────────────────────

function Badge({ status }: { status: StatusBadge }) {
  const c = STATUS_COLOR[status]
  return (
    <span style={{
      padding: '3px 9px', borderRadius: '20px',
      fontSize: '11px', fontWeight: 700,
      background: c.bg, color: c.text,
    }}>
      {STATUS_LABEL[status]}
    </span>
  )
}

// ─── Edit Pet Modal ───────────────────────────────────────────────────────────

function EditPetModal({
  pet, onClose, onSaved,
}: {
  pet: Pet
  onClose: () => void
  onSaved: (updated: Pet) => void
}) {
  const [nome, setNome] = useState(pet.nome)
  const [emoji, setEmoji] = useState(pet.emoji)
  const [especie, setEspecie] = useState(pet.especie)
  const [raca, setRaca] = useState(pet.raca ?? '')
  const [sexo, setSexo] = useState(pet.sexo ?? '')
  const [dataNascimento, setDataNascimento] = useState(
    pet.dataNascimento ? new Date(pet.dataNascimento).toISOString().split('T')[0] : ''
  )
  const [peso, setPeso] = useState(pet.peso?.toString() ?? '')
  const [loading, setLoading] = useState(false)

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const res = await fetch(`/api/pets/${pet.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, emoji, especie, raca, sexo, dataNascimento, peso: peso ? Number(peso) : null }),
    })
    setLoading(false)
    if (!res.ok) { toast.error('Erro ao salvar.'); return }
    toast.success('Pet atualizado!')
    const updated = await res.json()
    onSaved({ ...pet, ...updated, dataNascimento: updated.dataNascimento })
    onClose()
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
    }} onClick={onClose}>
      <div style={{ ...card, width: '420px', maxWidth: '95vw', padding: '28px' }} onClick={e => e.stopPropagation()}>
        <div style={{ fontFamily: 'var(--font-syne)', fontSize: '17px', fontWeight: 800, color: 'var(--ink)', marginBottom: '20px' }}>
          Editar pet
        </div>
        <form onSubmit={salvar} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ink4)', letterSpacing: '.3px', display: 'block', marginBottom: '4px' }}>EMOJI</label>
              <input value={emoji} onChange={e => setEmoji(e.target.value)} maxLength={2} style={{ ...inputStyle, textAlign: 'center', fontSize: '22px' }} />
            </div>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ink4)', letterSpacing: '.3px', display: 'block', marginBottom: '4px' }}>NOME</label>
              <input required value={nome} onChange={e => setNome(e.target.value)} style={inputStyle} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ink4)', letterSpacing: '.3px', display: 'block', marginBottom: '4px' }}>ESPÉCIE</label>
              <input required value={especie} onChange={e => setEspecie(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ink4)', letterSpacing: '.3px', display: 'block', marginBottom: '4px' }}>RAÇA</label>
              <input value={raca} onChange={e => setRaca(e.target.value)} placeholder="Opcional" style={inputStyle} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ink4)', letterSpacing: '.3px', display: 'block', marginBottom: '4px' }}>SEXO</label>
              <select value={sexo} onChange={e => setSexo(e.target.value)} style={{ ...inputStyle }}>
                <option value="">—</option>
                <option value="Macho">Macho</option>
                <option value="Fêmea">Fêmea</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ink4)', letterSpacing: '.3px', display: 'block', marginBottom: '4px' }}>PESO (kg)</label>
              <input type="number" step="0.1" min="0" value={peso} onChange={e => setPeso(e.target.value)} placeholder="Ex: 8.5" style={inputStyle} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ink4)', letterSpacing: '.3px', display: 'block', marginBottom: '4px' }}>DATA DE NASCIMENTO</label>
            <input type="date" value={dataNascimento} onChange={e => setDataNascimento(e.target.value)} style={inputStyle} />
          </div>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '4px' }}>
            <button type="button" onClick={onClose} style={btnGhost}>Cancelar</button>
            <button type="submit" disabled={loading} style={{ ...btnPrimary, opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Salvando…' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Add Remédio Form ─────────────────────────────────────────────────────────

function AddRemedioForm({
  petId, membroId, onAdded, onCancel,
}: {
  petId: string; membroId: string
  onAdded: (r: Remedio) => void; onCancel: () => void
}) {
  const [nome, setNome] = useState('')
  const [dose, setDose] = useState('')
  const [frequencia, setFrequencia] = useState('DIARIO')
  const [dataInicio, setDataInicio] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const res = await fetch(`/api/pets/${petId}/remedios`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, dose, frequencia, dataInicio, membroId }),
    })
    setLoading(false)
    if (!res.ok) { toast.error('Erro ao salvar remédio.'); return }
    const r = await res.json()
    toast.success('Remédio adicionado!')
    onAdded({ ...r, administracoes: [], dataFim: null })
  }

  return (
    <form onSubmit={salvar} style={{ ...card, background: 'var(--surface)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink)', marginBottom: '2px' }}>Novo remédio</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <div>
          <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ink4)', display: 'block', marginBottom: '4px' }}>NOME</label>
          <input required value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Vermífugo" style={inputStyle} />
        </div>
        <div>
          <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ink4)', display: 'block', marginBottom: '4px' }}>DOSE</label>
          <input required value={dose} onChange={e => setDose(e.target.value)} placeholder="Ex: 1 comprimido" style={inputStyle} />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <div>
          <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ink4)', display: 'block', marginBottom: '4px' }}>FREQUÊNCIA</label>
          <select required value={frequencia} onChange={e => setFrequencia(e.target.value)} style={inputStyle}>
            {FREQ_OPTIONS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ink4)', display: 'block', marginBottom: '4px' }}>INÍCIO</label>
          <input required type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} style={inputStyle} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
        <button type="button" onClick={onCancel} style={btnGhost}>Cancelar</button>
        <button type="submit" disabled={loading} style={{ ...btnPrimary, opacity: loading ? 0.7 : 1 }}>
          {loading ? 'Salvando…' : 'Adicionar'}
        </button>
      </div>
    </form>
  )
}

// ─── Add Cuidado Form ─────────────────────────────────────────────────────────

const TIPOS_CUIDADO = [
  'Banho', 'Tosa', 'Escovação de dentes', 'Vacina', 'Consulta veterinária',
  'Antiparasitário', 'Corte de unhas', 'Limpeza de ouvidos', 'Outro',
]

function AddCuidadoForm({
  petId, membroId, onAdded, onCancel,
}: {
  petId: string; membroId: string
  onAdded: (c: Cuidado) => void; onCancel: () => void
}) {
  const [tipo, setTipo] = useState('')
  const [tipoCustom, setTipoCustom] = useState('')
  const [frequenciaDias, setFrequenciaDias] = useState('30')
  const [loading, setLoading] = useState(false)

  const tipoFinal = tipo === 'Outro' ? tipoCustom : tipo

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    if (!tipoFinal.trim()) { toast.error('Informe o tipo de cuidado.'); return }
    setLoading(true)
    const res = await fetch(`/api/pets/${petId}/cuidados`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tipo: tipoFinal, frequenciaDias: Number(frequenciaDias), membroId }),
    })
    setLoading(false)
    if (!res.ok) { toast.error('Erro ao salvar cuidado.'); return }
    const c = await res.json()
    toast.success('Cuidado adicionado!')
    onAdded({ ...c, execucoes: [] })
  }

  return (
    <form onSubmit={salvar} style={{ ...card, background: 'var(--surface)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink)', marginBottom: '2px' }}>Novo cuidado</div>
      <div>
        <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ink4)', display: 'block', marginBottom: '4px' }}>TIPO</label>
        <select required value={tipo} onChange={e => setTipo(e.target.value)} style={inputStyle}>
          <option value="">Selecione…</option>
          {TIPOS_CUIDADO.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      {tipo === 'Outro' && (
        <div>
          <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ink4)', display: 'block', marginBottom: '4px' }}>DESCREVA</label>
          <input required value={tipoCustom} onChange={e => setTipoCustom(e.target.value)} placeholder="Ex: Hidratação do pelo" style={inputStyle} />
        </div>
      )}
      <div>
        <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ink4)', display: 'block', marginBottom: '4px' }}>FREQUÊNCIA (dias)</label>
        <input required type="number" min="1" value={frequenciaDias} onChange={e => setFrequenciaDias(e.target.value)} style={inputStyle} />
      </div>
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
        <button type="button" onClick={onCancel} style={btnGhost}>Cancelar</button>
        <button type="submit" disabled={loading} style={{ ...btnPrimary, opacity: loading ? 0.7 : 1 }}>
          {loading ? 'Salvando…' : 'Adicionar'}
        </button>
      </div>
    </form>
  )
}

// ─── Add Passeio Form ─────────────────────────────────────────────────────────

function AddPasseioForm({
  petId, membroId, onAdded, onCancel,
}: {
  petId: string; membroId: string
  onAdded: (p: Passeio) => void; onCancel: () => void
}) {
  const [tipo, setTipo] = useState<'REALIZADO' | 'AGENDADO'>('REALIZADO')
  const [duracaoMin, setDuracaoMin] = useState('')
  const [local, setLocal] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [data, setData] = useState(new Date().toISOString().slice(0, 16))
  const [loading, setLoading] = useState(false)

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const body = {
      tipo, membroId,
      duracaoMin: duracaoMin ? Number(duracaoMin) : null,
      local: local || null,
      observacoes: observacoes || null,
      realizadoEm: tipo === 'REALIZADO' ? new Date(data).toISOString() : null,
      agendadoEm:  tipo === 'AGENDADO'  ? new Date(data).toISOString() : null,
    }
    const res = await fetch(`/api/pets/${petId}/passeios`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    setLoading(false)
    if (!res.ok) { toast.error('Erro ao registrar passeio.'); return }
    const p = await res.json()
    toast.success(tipo === 'REALIZADO' ? 'Passeio registrado!' : 'Passeio agendado!')
    onAdded(p)
  }

  return (
    <form onSubmit={salvar} style={{ ...card, background: 'var(--surface)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink)', marginBottom: '2px' }}>Registrar passeio</div>
      <div style={{ display: 'flex', gap: '8px' }}>
        {(['REALIZADO', 'AGENDADO'] as const).map(t => (
          <button key={t} type="button" onClick={() => setTipo(t)} style={{
            ...btnGhost,
            background: tipo === t ? 'var(--amber)' : 'transparent',
            color: tipo === t ? '#412402' : 'var(--ink3)',
            border: tipo === t ? 'none' : '1px solid var(--border)',
          }}>
            {t === 'REALIZADO' ? '✅ Realizado' : '📅 Agendar'}
          </button>
        ))}
      </div>
      <div>
        <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ink4)', display: 'block', marginBottom: '4px' }}>
          {tipo === 'REALIZADO' ? 'DATA/HORA' : 'DATA/HORA AGENDADA'}
        </label>
        <input required type="datetime-local" value={data} onChange={e => setData(e.target.value)} style={inputStyle} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <div>
          <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ink4)', display: 'block', marginBottom: '4px' }}>DURAÇÃO (min)</label>
          <input type="number" min="1" value={duracaoMin} onChange={e => setDuracaoMin(e.target.value)} placeholder="Opcional" style={inputStyle} />
        </div>
        <div>
          <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ink4)', display: 'block', marginBottom: '4px' }}>LOCAL</label>
          <input value={local} onChange={e => setLocal(e.target.value)} placeholder="Opcional" style={inputStyle} />
        </div>
      </div>
      <div>
        <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ink4)', display: 'block', marginBottom: '4px' }}>OBSERVAÇÕES</label>
        <input value={observacoes} onChange={e => setObservacoes(e.target.value)} placeholder="Opcional" style={inputStyle} />
      </div>
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
        <button type="button" onClick={onCancel} style={btnGhost}>Cancelar</button>
        <button type="submit" disabled={loading} style={{ ...btnPrimary, opacity: loading ? 0.7 : 1 }}>
          {loading ? 'Salvando…' : tipo === 'REALIZADO' ? 'Registrar' : 'Agendar'}
        </button>
      </div>
    </form>
  )
}

// ─── Remédios Tab ─────────────────────────────────────────────────────────────

function RemediosTab({
  remedios: initial, petId, membroId, onReload,
}: {
  remedios: Remedio[]; petId: string; membroId: string; onReload: () => void
}) {
  const [remedios, setRemedios] = useState(initial)
  const [showAdd, setShowAdd] = useState(false)
  const [loadingAdm, setLoadingAdm] = useState<string | null>(null)
  const [expandido, setExpandido] = useState<string | null>(null)

  async function administrar(r: Remedio) {
    setLoadingAdm(r.id)
    const res = await fetch(`/api/pets/${petId}/remedios/${r.id}/administrar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ membroId }),
    })
    setLoadingAdm(null)
    if (res.status === 409) {
      toast.error('Remédio já foi administrado recentemente.')
      return
    }
    if (!res.ok) { toast.error('Erro ao registrar.'); return }
    const adm = await res.json()
    toast.success(`${r.nome} administrado!`)
    setRemedios(prev => prev.map(x =>
      x.id === r.id ? { ...x, administracoes: [adm, ...x.administracoes] } : x
    ))
  }

  async function desativar(r: Remedio) {
    if (!confirm(`Desativar "${r.nome}"? Ele sairá da lista ativa.`)) return
    const res = await fetch(`/api/pets/${petId}/remedios/${r.id}`, { method: 'DELETE' })
    if (!res.ok) { toast.error('Erro ao desativar.'); return }
    toast.success('Remédio desativado.')
    setRemedios(prev => prev.filter(x => x.id !== r.id))
    onReload()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontFamily: 'var(--font-syne)', fontSize: '15px', fontWeight: 700, color: 'var(--ink)' }}>
          💊 Medicamentos ativos
        </div>
        <button onClick={() => setShowAdd(v => !v)} style={btnPrimary}>
          + Adicionar
        </button>
      </div>

      {showAdd && (
        <AddRemedioForm
          petId={petId} membroId={membroId}
          onAdded={r => { setRemedios(prev => [...prev, r]); setShowAdd(false); onReload() }}
          onCancel={() => setShowAdd(false)}
        />
      )}

      {remedios.length === 0 && !showAdd && (
        <div style={{ fontSize: '13px', color: 'var(--ink4)', padding: '20px 0' }}>
          Nenhum medicamento ativo. Clique em "+ Adicionar" para cadastrar.
        </div>
      )}

      {remedios.map(r => {
        const ultima = r.administracoes[0]?.administradoEm ?? null
        const status = calcularStatusRemedio(r.frequencia, ultima ? new Date(ultima) : null, new Date(r.dataInicio)) as StatusBadge
        const isExpanded = expandido === r.id

        return (
          <div key={r.id} style={card}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink)' }}>{r.nome}</span>
                  <Badge status={status} />
                </div>
                <div style={{ fontSize: '12px', color: 'var(--ink3)' }}>
                  {r.dose} · {FREQ_OPTIONS.find(f => f.value === r.frequencia)?.label ?? r.frequencia}
                  {r.dataFim ? ` · até ${fmt(r.dataFim)}` : ''}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--ink4)', marginTop: '2px' }}>
                  Última: {ultima ? fmtHora(ultima) : 'nunca'}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '6px', flexShrink: 0, alignItems: 'center' }}>
                <button
                  onClick={() => administrar(r)}
                  disabled={loadingAdm === r.id}
                  style={{ ...btnPrimary, fontSize: '12px', padding: '6px 12px', opacity: loadingAdm === r.id ? 0.7 : 1 }}
                >
                  {loadingAdm === r.id ? '…' : '💉 Administrar'}
                </button>
                <button onClick={() => setExpandido(isExpanded ? null : r.id)} style={btnGhost} title="Histórico">
                  {isExpanded ? '▲' : '▼'}
                </button>
                <button onClick={() => desativar(r)} style={btnDanger} title="Desativar">✕</button>
              </div>
            </div>

            {isExpanded && (
              <div style={{ marginTop: '14px', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ink4)', letterSpacing: '.3px', marginBottom: '8px' }}>
                  HISTÓRICO DE ADMINISTRAÇÕES
                </div>
                {r.administracoes.length === 0 ? (
                  <div style={{ fontSize: '12px', color: 'var(--ink4)' }}>Nenhum registro ainda.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {r.administracoes.slice(0, 8).map(a => (
                      <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--ink3)' }}>
                        <span>💊 {fmtHora(a.administradoEm)}</span>
                        <span>{a.membro.usuario.nome}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Cuidados Tab ─────────────────────────────────────────────────────────────

function CuidadosTab({
  cuidados: initial, petId, membroId, onReload,
}: {
  cuidados: Cuidado[]; petId: string; membroId: string; onReload: () => void
}) {
  const [cuidados, setCuidados] = useState(initial)
  const [showAdd, setShowAdd] = useState(false)
  const [loadingExec, setLoadingExec] = useState<string | null>(null)
  const [expandido, setExpandido] = useState<string | null>(null)

  async function executar(c: Cuidado) {
    setLoadingExec(c.id)
    const res = await fetch(`/api/pets/${petId}/cuidados/${c.id}/executar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ membroId }),
    })
    setLoadingExec(null)
    if (!res.ok) { toast.error('Erro ao registrar.'); return }
    const exec = await res.json()
    toast.success(`${c.tipo} registrado!`)
    const agora = new Date().toISOString()
    const proxima = new Date(Date.now() + c.frequenciaDias * 86_400_000).toISOString()
    setCuidados(prev => prev.map(x =>
      x.id === c.id
        ? { ...x, ultimaExecucao: agora, proximaExecucao: proxima, execucoes: [exec, ...x.execucoes] }
        : x
    ))
    onReload()
  }

  async function remover(c: Cuidado) {
    if (!confirm(`Remover o cuidado "${c.tipo}"?`)) return
    const res = await fetch(`/api/pets/${petId}/cuidados/${c.id}`, { method: 'DELETE' })
    if (!res.ok) { toast.error('Erro ao remover.'); return }
    toast.success('Cuidado removido.')
    setCuidados(prev => prev.filter(x => x.id !== c.id))
    onReload()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontFamily: 'var(--font-syne)', fontSize: '15px', fontWeight: 700, color: 'var(--ink)' }}>
          🩺 Cuidados ativos
        </div>
        <button onClick={() => setShowAdd(v => !v)} style={btnPrimary}>
          + Adicionar
        </button>
      </div>

      {showAdd && (
        <AddCuidadoForm
          petId={petId} membroId={membroId}
          onAdded={c => { setCuidados(prev => [...prev, c]); setShowAdd(false); onReload() }}
          onCancel={() => setShowAdd(false)}
        />
      )}

      {cuidados.length === 0 && !showAdd && (
        <div style={{ fontSize: '13px', color: 'var(--ink4)', padding: '20px 0' }}>
          Nenhum cuidado cadastrado. Clique em "+ Adicionar" para começar.
        </div>
      )}

      {cuidados.map(c => {
        const status = calcularStatusCuidado(c.proximaExecucao ? new Date(c.proximaExecucao) : null) as StatusBadge
        const isExpanded = expandido === c.id

        return (
          <div key={c.id} style={card}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink)' }}>{c.tipo}</span>
                  <Badge status={status} />
                </div>
                <div style={{ fontSize: '12px', color: 'var(--ink3)' }}>
                  A cada {c.frequenciaDias} dias
                </div>
                <div style={{ fontSize: '12px', color: 'var(--ink4)', marginTop: '2px' }}>
                  Última: {c.ultimaExecucao ? fmt(c.ultimaExecucao) : 'nunca'}
                  {c.proximaExecucao ? ` · Próxima: ${fmt(c.proximaExecucao)}` : ''}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '6px', flexShrink: 0, alignItems: 'center' }}>
                <button
                  onClick={() => executar(c)}
                  disabled={loadingExec === c.id}
                  style={{ ...btnPrimary, fontSize: '12px', padding: '6px 12px', background: 'var(--teal)', color: '#fff', opacity: loadingExec === c.id ? 0.7 : 1 }}
                >
                  {loadingExec === c.id ? '…' : '✅ Feito'}
                </button>
                <button onClick={() => setExpandido(isExpanded ? null : c.id)} style={btnGhost} title="Histórico">
                  {isExpanded ? '▲' : '▼'}
                </button>
                <button onClick={() => remover(c)} style={btnDanger} title="Remover">✕</button>
              </div>
            </div>

            {isExpanded && (
              <div style={{ marginTop: '14px', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ink4)', letterSpacing: '.3px', marginBottom: '8px' }}>
                  HISTÓRICO DE EXECUÇÕES
                </div>
                {c.execucoes.length === 0 ? (
                  <div style={{ fontSize: '12px', color: 'var(--ink4)' }}>Nenhum registro ainda.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {c.execucoes.slice(0, 8).map(x => (
                      <div key={x.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--ink3)' }}>
                        <span>✅ {fmtHora(x.executadoEm)}</span>
                        <span>{x.membro.usuario.nome}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Passeios Tab ─────────────────────────────────────────────────────────────

function PasseiosTab({
  passeios: initial, petId, membroId, onReload,
}: {
  passeios: Passeio[]; petId: string; membroId: string; onReload: () => void
}) {
  const [passeios, setPasseios] = useState(initial)
  const [showAdd, setShowAdd] = useState(false)
  const [loadingMark, setLoadingMark] = useState<string | null>(null)

  async function marcarRealizado(p: Passeio) {
    setLoadingMark(p.id)
    const res = await fetch(`/api/pets/${petId}/passeios/${p.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ realizadoEm: new Date().toISOString() }),
    })
    setLoadingMark(null)
    if (!res.ok) { toast.error('Erro ao atualizar.'); return }
    toast.success('Passeio marcado como realizado!')
    setPasseios(prev => prev.map(x =>
      x.id === p.id ? { ...x, tipo: 'REALIZADO', realizadoEm: new Date().toISOString() } : x
    ))
    onReload()
  }

  const agendados = passeios.filter(p => p.tipo === 'AGENDADO')
  const realizados = passeios.filter(p => p.tipo === 'REALIZADO')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontFamily: 'var(--font-syne)', fontSize: '15px', fontWeight: 700, color: 'var(--ink)' }}>
          🚶 Passeios
        </div>
        <button onClick={() => setShowAdd(v => !v)} style={btnPrimary}>
          + Registrar
        </button>
      </div>

      {showAdd && (
        <AddPasseioForm
          petId={petId} membroId={membroId}
          onAdded={p => { setPasseios(prev => [p, ...prev]); setShowAdd(false); onReload() }}
          onCancel={() => setShowAdd(false)}
        />
      )}

      {agendados.length > 0 && (
        <>
          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ink4)', letterSpacing: '.3px' }}>AGENDADOS</div>
          {agendados.map(p => (
            <div key={p.id} style={{ ...card, borderLeft: '3px solid var(--amber)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink)' }}>
                    📅 {p.agendadoEm ? fmtHora(p.agendadoEm) : '—'}
                    {p.local ? ` — ${p.local}` : ''}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--ink3)', marginTop: '2px' }}>
                    {p.membro.usuario.nome}
                    {p.duracaoMin ? ` · ${p.duracaoMin} min` : ''}
                  </div>
                </div>
                <button
                  onClick={() => marcarRealizado(p)}
                  disabled={loadingMark === p.id}
                  style={{ ...btnPrimary, fontSize: '12px', padding: '6px 12px', background: 'var(--teal)', color: '#fff' }}
                >
                  {loadingMark === p.id ? '…' : '✅ Realizado'}
                </button>
              </div>
            </div>
          ))}
        </>
      )}

      {realizados.length === 0 && agendados.length === 0 && !showAdd && (
        <div style={{ fontSize: '13px', color: 'var(--ink4)', padding: '20px 0' }}>
          Nenhum passeio registrado. Clique em "+ Registrar" para começar.
        </div>
      )}

      {realizados.length > 0 && (
        <>
          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ink4)', letterSpacing: '.3px', marginTop: '4px' }}>REALIZADOS</div>
          {realizados.map(p => (
            <div key={p.id} style={{ ...card, borderLeft: '3px solid var(--teal)' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink)' }}>
                ✅ {p.realizadoEm ? fmtHora(p.realizadoEm) : '—'}
                {p.local ? ` — ${p.local}` : ''}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--ink3)', marginTop: '2px' }}>
                {p.membro.usuario.nome}
                {p.duracaoMin ? ` · ${p.duracaoMin} min` : ''}
                {p.observacoes ? ` · ${p.observacoes}` : ''}
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  )
}

// ─── Agenda Tab ───────────────────────────────────────────────────────────────

type EventoAgenda = {
  tipo: 'remedio' | 'cuidado' | 'passeio'
  label: string
  color: string
}

function AgendaTab({
  remedios, cuidados, passeios,
}: {
  remedios: Remedio[]
  cuidados: Cuidado[]
  passeios: Passeio[]
}) {
  const hoje = new Date()
  const [ano, setAno] = useState(hoje.getFullYear())
  const [mes, setMes] = useState(hoje.getMonth()) // 0-based

  const nomesMes = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
                    'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

  function navMes(delta: number) {
    setMes(m => {
      let nm = m + delta
      let na = ano
      if (nm < 0) { nm = 11; na = ano - 1 }
      if (nm > 11) { nm = 0; na = ano + 1 }
      setAno(na)
      return nm
    })
  }

  // Construir mapa dia → eventos
  const eventosPorDia: Record<number, EventoAgenda[]> = {}

  function addEvento(dia: number, ev: EventoAgenda) {
    if (!eventosPorDia[dia]) eventosPorDia[dia] = []
    eventosPorDia[dia].push(ev)
  }

  // Administrações de remédios
  for (const r of remedios) {
    for (const a of r.administracoes) {
      const d = new Date(a.administradoEm)
      if (d.getFullYear() === ano && d.getMonth() === mes) {
        addEvento(d.getDate(), { tipo: 'remedio', label: r.nome, color: '#7F77DD' })
      }
    }
  }

  // Execuções de cuidados
  for (const c of cuidados) {
    for (const e of c.execucoes) {
      const d = new Date(e.executadoEm)
      if (d.getFullYear() === ano && d.getMonth() === mes) {
        addEvento(d.getDate(), { tipo: 'cuidado', label: c.tipo, color: '#1D9E75' })
      }
    }
  }

  // Passeios realizados
  for (const p of passeios) {
    const dataRef = p.tipo === 'REALIZADO' ? p.realizadoEm : p.agendadoEm
    if (!dataRef) continue
    const d = new Date(dataRef)
    if (d.getFullYear() === ano && d.getMonth() === mes) {
      addEvento(d.getDate(), {
        tipo: 'passeio',
        label: p.local ? `Passeio — ${p.local}` : 'Passeio',
        color: p.tipo === 'REALIZADO' ? '#EF9F27' : '#A0AEC0',
      })
    }
  }

  // Dias do mês
  const primeiroDiaSemana = new Date(ano, mes, 1).getDay() // 0=domingo
  const diasNoMes = new Date(ano, mes + 1, 0).getDate()
  const hoje_d = hoje.getDate()
  const isHojeMes = hoje.getFullYear() === ano && hoje.getMonth() === mes

  const dias: (number | null)[] = [
    ...Array(primeiroDiaSemana).fill(null),
    ...Array.from({ length: diasNoMes }, (_, i) => i + 1),
  ]

  return (
    <div>
      {/* Navegação */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <button onClick={() => navMes(-1)} style={btnGhost}>←</button>
        <div style={{ fontFamily: 'var(--font-syne)', fontSize: '16px', fontWeight: 700, color: 'var(--ink)', flex: 1, textAlign: 'center' }}>
          {nomesMes[mes]} {ano}
        </div>
        <button onClick={() => navMes(1)} style={btnGhost}>→</button>
      </div>

      {/* Legenda */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {[
          { color: '#7F77DD', label: 'Remédio' },
          { color: '#1D9E75', label: 'Cuidado' },
          { color: '#EF9F27', label: 'Passeio' },
        ].map(l => (
          <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: 'var(--ink3)' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: l.color }} />
            {l.label}
          </div>
        ))}
      </div>

      {/* Dias da semana */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '4px' }}>
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: '11px', fontWeight: 700, color: 'var(--ink4)', padding: '4px 0' }}>
            {d}
          </div>
        ))}
      </div>

      {/* Grid de dias */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
        {dias.map((dia, i) => {
          if (!dia) return <div key={`empty-${i}`} />
          const eventos = eventosPorDia[dia] ?? []
          const isHoje = isHojeMes && dia === hoje_d
          const isFuturo = !isHojeMes ? ano > hoje.getFullYear() || (ano === hoje.getFullYear() && mes > hoje.getMonth()) : dia > hoje_d

          return (
            <div key={`day-${dia}`} style={{
              minHeight: '52px',
              borderRadius: '8px',
              border: isHoje ? '2px solid var(--amber)' : '1px solid var(--border)',
              background: isHoje ? '#FFFBEB' : 'var(--card)',
              padding: '4px 6px',
              position: 'relative',
            }}>
              <div style={{
                fontSize: '12px',
                fontWeight: isHoje ? 800 : 600,
                color: isHoje ? 'var(--amber)' : isFuturo ? 'var(--ink4)' : 'var(--ink)',
                marginBottom: '3px',
              }}>
                {dia}
              </div>
              {/* Dots por tipo */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px' }}>
                {eventos.slice(0, 6).map((ev, j) => (
                  <div key={j} title={ev.label} style={{
                    width: '7px', height: '7px', borderRadius: '50%',
                    background: ev.color, flexShrink: 0,
                  }} />
                ))}
                {eventos.length > 6 && (
                  <div style={{ fontSize: '9px', color: 'var(--ink4)', lineHeight: '7px' }}>+{eventos.length - 6}</div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Resumo do mês */}
      <div style={{ ...card, marginTop: '20px' }}>
        <div style={{ fontFamily: 'var(--font-syne)', fontSize: '14px', fontWeight: 700, color: 'var(--ink)', marginBottom: '12px' }}>
          Resumo de {nomesMes[mes]}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          {[
            {
              label: 'Remédios admin.',
              value: remedios.flatMap(r => r.administracoes).filter(a => {
                const d = new Date(a.administradoEm)
                return d.getFullYear() === ano && d.getMonth() === mes
              }).length,
              color: '#7F77DD',
              emoji: '💊',
            },
            {
              label: 'Cuidados feitos',
              value: cuidados.flatMap(c => c.execucoes).filter(e => {
                const d = new Date(e.executadoEm)
                return d.getFullYear() === ano && d.getMonth() === mes
              }).length,
              color: '#1D9E75',
              emoji: '✅',
            },
            {
              label: 'Passeios',
              value: passeios.filter(p => {
                const dataRef = p.tipo === 'REALIZADO' ? p.realizadoEm : p.agendadoEm
                if (!dataRef) return false
                const d = new Date(dataRef)
                return d.getFullYear() === ano && d.getMonth() === mes
              }).length,
              color: '#EF9F27',
              emoji: '🚶',
            },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '28px', fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: '11px', color: 'var(--ink4)', marginTop: '2px' }}>{s.emoji} {s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

type Tab = 'remedios' | 'cuidados' | 'passeios' | 'agenda'

const TABS: { id: Tab; label: string; emoji: string }[] = [
  { id: 'remedios',  label: 'Remédios',  emoji: '💊' },
  { id: 'cuidados',  label: 'Cuidados',  emoji: '🩺' },
  { id: 'passeios',  label: 'Passeios',  emoji: '🚶' },
  { id: 'agenda',    label: 'Agenda',    emoji: '📅' },
]

function calcularIdadeDisplay(dataNascimento: string | null): string {
  if (!dataNascimento) return '—'
  const hoje = new Date()
  const nasc = new Date(dataNascimento)
  const anos = hoje.getFullYear() - nasc.getFullYear()
  const meses = hoje.getMonth() - nasc.getMonth()
  const anosAjustados = meses < 0 ? anos - 1 : anos
  if (anosAjustados === 0) return `${Math.max(0, meses)} meses`
  return `${anosAjustados} ano${anosAjustados !== 1 ? 's' : ''}`
}

export default function PetProfileClient({
  pet: initialPet,
  remedios,
  cuidados,
  passeios,
  membroId,
}: Props) {
  const [pet, setPet] = useState(initialPet)
  const [activeTab, setActiveTab] = useState<Tab>('remedios')
  const [showEditPet, setShowEditPet] = useState(false)
  const router = useRouter()

  const label: React.CSSProperties = { fontSize: '11px', fontWeight: 700, color: 'var(--ink4)', letterSpacing: '.3px', marginBottom: '4px' }
  const value: React.CSSProperties = { fontSize: '14px', fontWeight: 600, color: 'var(--ink)' }

  return (
    <div style={{ padding: '24px', maxWidth: '780px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px' }}>
        <a href="/dashboard" style={{ color: 'var(--ink3)', textDecoration: 'none', fontSize: '20px', flexShrink: 0 }}>←</a>
        <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '30px', flexShrink: 0 }}>
          {pet.emoji}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'var(--font-syne)', fontSize: '22px', fontWeight: 800, color: 'var(--ink)' }}>{pet.nome}</div>
          <div style={{ fontSize: '13px', color: 'var(--ink3)' }}>
            {pet.especie}{pet.raca ? ` · ${pet.raca}` : ''}
          </div>
        </div>
        <button onClick={() => setShowEditPet(true)} style={{ ...btnGhost, padding: '7px 14px' }}>
          ✏️ Editar
        </button>
      </div>

      {/* Info cards */}
      <div style={{ ...card, marginBottom: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '20px' }}>
          <div>
            <div style={label}>SEXO</div>
            <div style={value}>{pet.sexo || '—'}</div>
          </div>
          <div>
            <div style={label}>IDADE</div>
            <div style={value}>{calcularIdadeDisplay(pet.dataNascimento)}</div>
          </div>
          <div>
            <div style={label}>NASCIMENTO</div>
            <div style={value}>{pet.dataNascimento ? fmt(pet.dataNascimento) : '—'}</div>
          </div>
          <div>
            <div style={label}>PESO</div>
            <div style={value}>{pet.peso ? `${pet.peso} kg` : '—'}</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '2px', marginBottom: '20px', background: 'var(--surface)', borderRadius: '12px', padding: '4px', border: '1px solid var(--border)' }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              flex: 1,
              padding: '8px 10px',
              border: 'none',
              borderRadius: '9px',
              fontSize: '13px',
              fontWeight: 600,
              fontFamily: 'inherit',
              cursor: 'pointer',
              background: activeTab === t.id ? 'var(--card)' : 'transparent',
              color: activeTab === t.id ? 'var(--ink)' : 'var(--ink4)',
              boxShadow: activeTab === t.id ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
              transition: 'all .15s',
            }}
          >
            <span style={{ display: 'none' }}>{t.emoji} </span>{t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'remedios' && (
        <RemediosTab remedios={remedios} petId={pet.id} membroId={membroId} onReload={() => router.refresh()} />
      )}
      {activeTab === 'cuidados' && (
        <CuidadosTab cuidados={cuidados} petId={pet.id} membroId={membroId} onReload={() => router.refresh()} />
      )}
      {activeTab === 'passeios' && (
        <PasseiosTab passeios={passeios} petId={pet.id} membroId={membroId} onReload={() => router.refresh()} />
      )}
      {activeTab === 'agenda' && (
        <AgendaTab remedios={remedios} cuidados={cuidados} passeios={passeios} />
      )}

      {/* Edit pet modal */}
      {showEditPet && (
        <EditPetModal
          pet={pet}
          onClose={() => setShowEditPet(false)}
          onSaved={updated => { setPet(updated); router.refresh() }}
        />
      )}
    </div>
  )
}
