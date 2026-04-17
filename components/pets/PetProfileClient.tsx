'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
// calcularStatusRemedio/Cuidado from utils used only in layout — local display functions used here

// ─── Types ────────────────────────────────────────────────────────────────────

type Administracao = {
  id: string
  administradoEm: string
  statusDose: string | null
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
  configuracao: string | null
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

type StatusBadge = 'EM_DIA' | 'EM_BREVE' | 'QUASE' | 'ATRASADO'

const STATUS_LABEL: Record<StatusBadge, string> = {
  EM_DIA:   'Em dia',
  EM_BREVE: 'Em breve',
  QUASE:    'Quase na hora',
  ATRASADO: 'Atrasado',
}
const STATUS_COLOR: Record<StatusBadge, { bg: string; text: string }> = {
  EM_DIA:   { bg: 'var(--teal-50)',  text: 'var(--teal-800)' },
  EM_BREVE: { bg: '#FEF3C7',         text: '#92400E' },
  QUASE:    { bg: '#FFF7ED',         text: '#C2410C' },
  ATRASADO: { bg: 'var(--coral-50)', text: 'var(--coral)' },
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

// ─── Dose helpers ──────────────────────────────────────────────────────────────

type DoseInfo = { quantidade: number; horarios: string[] }

function parseDose(dose: string): DoseInfo | null {
  try {
    const p = JSON.parse(dose)
    if (typeof p.quantidade === 'number' && Array.isArray(p.horarios)) return p
  } catch { /* legacy text */ }
  return null
}

function formatDoseLabel(dose: string): string {
  const info = parseDose(dose)
  if (!info) return dose // legacy text como "1 comprimido"
  const s = info.quantidade === 1 ? 'dose' : 'doses'
  return `${info.quantidade} ${s}/período · ${info.horarios.join(', ')}`
}

const INTERVALOS_DIAS_CLIENT: Record<string, number> = {
  DIARIO: 1, SEMANAL: 7, QUINZENAL: 15, MENSAL: 30, PERSONALIZADO: 1,
}

function calcularProximaDoseStr(r: Remedio): string {
  const agora = new Date()
  const doseInfo = parseDose(r.dose)
  const ultima = r.administracoes[0]?.administradoEm ?? null
  const dataInicio = new Date(r.dataInicio)

  // Com horários definidos + frequência DIÁRIA → tracking intradiário
  if (doseInfo && doseInfo.horarios.length > 0 && r.frequencia === 'DIARIO') {
    const hojeInicio = new Date(agora)
    hojeInicio.setHours(0, 0, 0, 0)
    const admHoje = r.administracoes.filter(a => new Date(a.administradoEm) >= hojeInicio).length
    const dosesRestantes = doseInfo.quantidade - admHoje

    if (dosesRestantes > 0) {
      for (const h of doseInfo.horarios) {
        const [hh, mm] = h.split(':').map(Number)
        const slot = new Date(agora)
        slot.setHours(hh, mm, 0, 0)
        if (slot > agora) return `Hoje às ${h}`
      }
    }
    // Todos os slots de hoje foram tomados ou passaram
    return `Amanhã, às ${doseInfo.horarios[0]}`
  }

  // Sem horários definidos → cálculo simples por intervalo
  const intervalo = INTERVALOS_DIAS_CLIENT[r.frequencia] ?? 1
  let proxima: Date
  if (!ultima) {
    proxima = dataInicio
  } else {
    proxima = new Date(new Date(ultima).getTime() + intervalo * 86_400_000)
  }

  const hoje = new Date(agora)
  hoje.setHours(0, 0, 0, 0)
  const amanha = new Date(hoje)
  amanha.setDate(amanha.getDate() + 1)
  const proximaNorm = new Date(proxima)
  proximaNorm.setHours(0, 0, 0, 0)

  if (proximaNorm < hoje) return 'Atrasado'
  if (proximaNorm.getTime() === hoje.getTime()) return 'Hoje'

  const hora = proxima.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  if (proximaNorm.getTime() === amanha.getTime()) return `Amanhã, às ${hora}`
  const dataParte = proxima.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  return `${dataParte}, às ${hora}`
}

function calcularDosesHoje(r: Remedio): { tomadas: number; total: number } | null {
  const info = parseDose(r.dose)
  if (!info || r.frequencia !== 'DIARIO') return null
  const hojeInicio = new Date()
  hojeInicio.setHours(0, 0, 0, 0)
  const tomadas = r.administracoes.filter(a => new Date(a.administradoEm) >= hojeInicio).length
  return { tomadas, total: info.quantidade }
}

type DetalheSlots = {
  atrasadas: number
  quase: number
  emBreve: number
  feitas: number
} | null

// Quebra os slots do dia em categorias para mostrar badges granulares
function calcularDetalheSlots(r: Remedio): DetalheSlots {
  const info = parseDose(r.dose)
  if (!info || info.horarios.length === 0 || r.frequencia !== 'DIARIO') return null

  const agora = new Date()
  const hojeInicio = new Date(agora)
  hojeInicio.setHours(0, 0, 0, 0)
  const admHoje = r.administracoes.filter(a => new Date(a.administradoEm) >= hojeInicio).length

  let slotsPassados = 0
  let slotsQuase = 0
  let slotsFuturos = 0

  for (const h of info.horarios) {
    const [hh, mm] = h.split(':').map(Number)
    const slot = new Date(agora)
    slot.setHours(hh, mm, 0, 0)
    const diffMin = (slot.getTime() - agora.getTime()) / 60_000
    if (slot.getTime() + 15 * 60_000 < agora.getTime()) {
      slotsPassados++
    } else if (diffMin >= 0 && diffMin <= 60) {
      slotsQuase++
    } else {
      slotsFuturos++
    }
  }

  // Administrações cobrem slots passados primeiro; excedente cobre slots futuros
  const feitas = Math.min(admHoje, info.quantidade)
  const atrasadas = Math.max(0, slotsPassados - admHoje)
  const sobra = Math.max(0, admHoje - slotsPassados) // adm antecipadas
  const quase = Math.max(0, slotsQuase - sobra)
  const emBreve = Math.max(0, slotsFuturos - Math.max(0, sobra - slotsQuase))

  return { atrasadas, quase, emBreve, feitas }
}

// Calcula status visual para remédio — considera horários de dose e QUASE
function calcularStatusRemedioDisplay(r: Remedio): StatusBadge {
  const agora = new Date()
  const doseInfo = parseDose(r.dose)

  // ── Remédio diário com horários definidos ──────────────────────────────────
  if (doseInfo && doseInfo.horarios.length > 0 && r.frequencia === 'DIARIO') {
    const hojeInicio = new Date(agora)
    hojeInicio.setHours(0, 0, 0, 0)
    const admHoje = r.administracoes.filter(a => new Date(a.administradoEm) >= hojeInicio).length

    // Slots que já passaram do horário + 15min de buffer
    const slotsPassados = doseInfo.horarios.filter(h => {
      const [hh, mm] = h.split(':').map(Number)
      const slot = new Date(agora)
      slot.setHours(hh, mm, 0, 0)
      return slot.getTime() + 15 * 60_000 < agora.getTime()
    }).length

    if (admHoje < slotsPassados) return 'ATRASADO'

    // Próximo slot ainda não passou — verificar se está chegando (≤60min)
    for (const h of doseInfo.horarios) {
      const [hh, mm] = h.split(':').map(Number)
      const slot = new Date(agora)
      slot.setHours(hh, mm, 0, 0)
      const diffMin = (slot.getTime() - agora.getTime()) / 60_000
      if (diffMin >= 0 && diffMin <= 60) return 'QUASE'
    }

    // Todas as doses de hoje administradas ou slots todos passados e em dia
    if (admHoje >= doseInfo.quantidade) return 'EM_DIA'
    return 'EM_BREVE'
  }

  // ── Frequências por intervalo de dias ──────────────────────────────────────
  const intervalo = INTERVALOS_DIAS_CLIENT[r.frequencia] ?? 1
  const ultima = r.administracoes[0]?.administradoEm ?? null
  let proxima: Date
  if (!ultima) {
    // Nunca administrado — comparar só por dia, não por hora
    const dataInicio = new Date(r.dataInicio)
    const hojeInicio = new Date(agora)
    hojeInicio.setHours(0, 0, 0, 0)
    const dataInicioNorm = new Date(dataInicio)
    dataInicioNorm.setHours(0, 0, 0, 0)
    if (dataInicioNorm < hojeInicio) return 'ATRASADO'
    const diffDias = (dataInicioNorm.getTime() - hojeInicio.getTime()) / 86_400_000
    if (diffDias === 0) return 'QUASE'
    if (diffDias <= 7) return 'EM_BREVE'
    return 'EM_DIA'
  }
  proxima = new Date(new Date(ultima).getTime() + intervalo * 86_400_000)
  const hojeNorm = new Date(agora)
  hojeNorm.setHours(0, 0, 0, 0)
  const proximaNorm = new Date(proxima)
  proximaNorm.setHours(0, 0, 0, 0)
  if (proximaNorm < hojeNorm) return 'ATRASADO'
  const diffDias = (proximaNorm.getTime() - hojeNorm.getTime()) / 86_400_000
  if (diffDias === 0) return 'QUASE'
  if (diffDias <= 7) return 'EM_BREVE'
  return 'EM_DIA'
}

// ─── Cuidado config helpers ────────────────────────────────────────────────────

type ConfigCuidado = { vezesPorDia: number; horarios: string[] }

function parseConfigCuidado(conf: string | null): ConfigCuidado | null {
  if (!conf) return null
  try {
    const p = JSON.parse(conf)
    if (typeof p.vezesPorDia === 'number' && Array.isArray(p.horarios)) return p
  } catch { /* */ }
  return null
}

function gerarHorariosDefaultCuidado(n: number): string[] {
  if (n === 1) return ['08:00']
  if (n === 2) return ['10:00', '21:00']
  if (n === 3) return ['08:00', '14:00', '20:00']
  if (n === 4) return ['08:00', '12:00', '17:00', '21:00']
  const arr: string[] = []
  for (let i = 0; i < n; i++) {
    const h = Math.round(8 + (i * 13) / Math.max(n - 1, 1))
    arr.push(`${Math.min(h, 22).toString().padStart(2, '0')}:00`)
  }
  return arr
}

function calcularProximoSlotCuidadoStr(c: Cuidado): string {
  const conf = parseConfigCuidado(c.configuracao)
  if (!conf || conf.horarios.length === 0) {
    if (!c.proximaExecucao) return '—'
    const proxima = new Date(c.proximaExecucao)
    const agora = new Date()
    const hojeInicio = new Date(agora); hojeInicio.setHours(0, 0, 0, 0)
    const amanha = new Date(hojeInicio); amanha.setDate(amanha.getDate() + 1)
    const proximaNorm = new Date(proxima); proximaNorm.setHours(0, 0, 0, 0)
    if (proximaNorm < hojeInicio) return 'Atrasado'
    if (proximaNorm.getTime() === hojeInicio.getTime()) return 'Hoje'
    const hora = proxima.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    if (proximaNorm.getTime() === amanha.getTime()) return `Amanhã, às ${hora}`
    const dataParte = proxima.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
    return `${dataParte}, às ${hora}`
  }
  const agora = new Date()
  const hojeInicio = new Date(agora); hojeInicio.setHours(0, 0, 0, 0)
  const execHoje = c.execucoes.filter(e => new Date(e.executadoEm) >= hojeInicio).length
  const dosesRestantes = conf.vezesPorDia - execHoje
  if (dosesRestantes > 0) {
    for (const h of conf.horarios) {
      const [hh, mm] = h.split(':').map(Number)
      const slot = new Date(agora)
      slot.setHours(hh, mm, 0, 0)
      if (slot > agora) return `Hoje às ${h}`
    }
  }
  return `Amanhã, às ${conf.horarios[0]}`
}

type DetalheSlotsC = { atrasadas: number; quase: number; emBreve: number; feitas: number } | null

function calcularDetalheSlotsCuidado(c: Cuidado): DetalheSlotsC {
  const conf = parseConfigCuidado(c.configuracao)
  if (!conf || conf.horarios.length === 0) return null
  const agora = new Date()
  const hojeInicio = new Date(agora); hojeInicio.setHours(0, 0, 0, 0)
  const execHoje = c.execucoes.filter(e => new Date(e.executadoEm) >= hojeInicio).length
  let slotsPassados = 0, slotsQuase = 0, slotsFuturos = 0
  for (const h of conf.horarios) {
    const [hh, mm] = h.split(':').map(Number)
    const slot = new Date(agora)
    slot.setHours(hh, mm, 0, 0)
    const diffMin = (slot.getTime() - agora.getTime()) / 60_000
    if (slot.getTime() + 15 * 60_000 < agora.getTime()) slotsPassados++
    else if (diffMin >= 0 && diffMin <= 60) slotsQuase++
    else slotsFuturos++
  }
  const feitas = Math.min(execHoje, conf.vezesPorDia)
  const atrasadas = Math.max(0, slotsPassados - execHoje)
  const sobra = Math.max(0, execHoje - slotsPassados)
  const quase = Math.max(0, slotsQuase - sobra)
  const emBreve = Math.max(0, slotsFuturos - Math.max(0, sobra - slotsQuase))
  return { atrasadas, quase, emBreve, feitas }
}

// Calcula status visual para cuidado — considera horários intradiários e QUASE
function calcularStatusCuidadoDisplay(c: Cuidado): StatusBadge {
  const conf = parseConfigCuidado(c.configuracao)
  if (conf && conf.horarios.length > 0) {
    const agora = new Date()
    const hojeInicio = new Date(agora); hojeInicio.setHours(0, 0, 0, 0)
    const execHoje = c.execucoes.filter(e => new Date(e.executadoEm) >= hojeInicio).length
    const slotsPassados = conf.horarios.filter(h => {
      const [hh, mm] = h.split(':').map(Number)
      const slot = new Date(agora); slot.setHours(hh, mm, 0, 0)
      return slot.getTime() + 15 * 60_000 < agora.getTime()
    }).length
    if (execHoje < slotsPassados) return 'ATRASADO'
    for (const h of conf.horarios) {
      const [hh, mm] = h.split(':').map(Number)
      const slot = new Date(agora); slot.setHours(hh, mm, 0, 0)
      const diffMin = (slot.getTime() - agora.getTime()) / 60_000
      if (diffMin >= 0 && diffMin <= 60) return 'QUASE'
    }
    if (execHoje >= conf.vezesPorDia) return 'EM_DIA'
    return 'EM_BREVE'
  }
  // Intervalo por dias
  if (!c.proximaExecucao) return 'ATRASADO'
  const agora = new Date()
  const hojeInicio = new Date(agora); hojeInicio.setHours(0, 0, 0, 0)
  const proximaNorm = new Date(c.proximaExecucao); proximaNorm.setHours(0, 0, 0, 0)
  if (proximaNorm < hojeInicio) return 'ATRASADO'
  const diffDias = (proximaNorm.getTime() - hojeInicio.getTime()) / 86_400_000
  if (diffDias <= 1) return 'QUASE'
  if (diffDias <= 7) return 'EM_BREVE'
  return 'EM_DIA'
}

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

function gerarHorariosDefault(n: number): string[] {
  // Distribui os horários de forma equilibrada ao longo do dia
  const slots: string[] = []
  if (n === 1) return ['08:00']
  if (n === 2) return ['08:00', '20:00']
  if (n === 3) return ['08:00', '14:00', '20:00']
  if (n === 4) return ['08:00', '12:00', '16:00', '20:00']
  // Para n > 4, distribui de 6h a 22h
  const inicio = 6
  const fim = 22
  const passo = Math.floor((fim - inicio) / (n - 1))
  for (let i = 0; i < n; i++) {
    const h = inicio + i * passo
    slots.push(`${String(h).padStart(2, '0')}:00`)
  }
  return slots
}

function AddRemedioForm({
  petId, membroId, onAdded, onCancel,
}: {
  petId: string; membroId: string
  onAdded: (r: Remedio) => void; onCancel: () => void
}) {
  const [nome, setNome] = useState('')
  const [numeroDoses, setNumeroDoses] = useState(1)
  const [horarios, setHorarios] = useState<string[]>(['08:00'])
  const [frequencia, setFrequencia] = useState('DIARIO')
  const [dataInicio, setDataInicio] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)

  function handleNumeroDoses(n: number) {
    const clamped = Math.max(1, Math.min(12, n))
    setNumeroDoses(clamped)
    // Ajusta os horários: mantém os existentes e completa/remove conforme necessário
    setHorarios(prev => {
      if (prev.length === clamped) return prev
      if (clamped > prev.length) {
        return gerarHorariosDefault(clamped)
      }
      return prev.slice(0, clamped)
    })
  }

  function updateHorario(idx: number, value: string) {
    setHorarios(prev => prev.map((h, i) => i === idx ? value : h))
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    if (horarios.some(h => !h)) { toast.error('Preencha todos os horários.'); return }
    setLoading(true)
    // Armazena dose como JSON estruturado
    const doseJson = JSON.stringify({ quantidade: numeroDoses, horarios })
    const res = await fetch(`/api/pets/${petId}/remedios`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, dose: doseJson, frequencia, dataInicio, membroId }),
    })
    setLoading(false)
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      toast.error(err.error ?? 'Erro ao salvar remédio.')
      return
    }
    const r = await res.json()
    toast.success('Remédio adicionado!')
    onAdded({ ...r, administracoes: [], dataFim: null })
  }

  const lbl: React.CSSProperties = { fontSize: '11px', fontWeight: 700, color: 'var(--ink4)', display: 'block', marginBottom: '4px', letterSpacing: '.3px' }

  return (
    <form onSubmit={salvar} style={{ ...card, background: 'var(--surface)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink)' }}>Novo remédio</div>

      {/* Nome */}
      <div>
        <label style={lbl}>NOME DO REMÉDIO</label>
        <input required value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Drontal Plus" style={inputStyle} />
      </div>

      {/* Doses por período + horários dinâmicos */}
      <div>
        <label style={lbl}>DOSES POR PERÍODO</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
          <button type="button" onClick={() => handleNumeroDoses(numeroDoses - 1)}
            style={{ ...btnGhost, width: '32px', height: '32px', padding: 0, fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
          <input
            type="number" min="1" max="12" required
            value={numeroDoses}
            onChange={e => handleNumeroDoses(Number(e.target.value))}
            style={{ ...inputStyle, width: '60px', textAlign: 'center', padding: '8px 4px' }}
          />
          <button type="button" onClick={() => handleNumeroDoses(numeroDoses + 1)}
            style={{ ...btnGhost, width: '32px', height: '32px', padding: 0, fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
          <span style={{ fontSize: '12px', color: 'var(--ink4)' }}>{numeroDoses === 1 ? 'dose' : 'doses'} por período</span>
        </div>

        {/* Horários dinâmicos */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {horarios.map((h, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--ink3)', minWidth: '52px', fontWeight: 600 }}>
                Dose {i + 1}
              </span>
              <input
                type="time" required value={h}
                onChange={e => updateHorario(i, e.target.value)}
                style={{ ...inputStyle, width: '120px' }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Frequência + Data início */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <div>
          <label style={lbl}>FREQUÊNCIA</label>
          <select required value={frequencia} onChange={e => setFrequencia(e.target.value)} style={inputStyle}>
            {FREQ_OPTIONS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
        </div>
        <div>
          <label style={lbl}>DATA DE INÍCIO</label>
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
  const [modo, setModo] = useState<'INTERVALO' | 'INTRADIARIO'>('INTERVALO')
  const [frequenciaDias, setFrequenciaDias] = useState('30')
  const [vezesPorDia, setVezesPorDia] = useState(1)
  const [horarios, setHorarios] = useState<string[]>(['08:00'])
  const [loading, setLoading] = useState(false)

  const tipoFinal = tipo === 'Outro' ? tipoCustom : tipo

  function handleVezesPorDia(n: number) {
    const clamped = Math.max(1, Math.min(12, n))
    setVezesPorDia(clamped)
    setHorarios(gerarHorariosDefaultCuidado(clamped))
  }

  function updateHorario(idx: number, val: string) {
    setHorarios(prev => prev.map((h, i) => i === idx ? val : h))
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    if (!tipoFinal.trim()) { toast.error('Informe o tipo de cuidado.'); return }
    setLoading(true)

    const configuracao = modo === 'INTRADIARIO'
      ? JSON.stringify({ vezesPorDia, horarios: horarios.slice(0, vezesPorDia) })
      : null

    const res = await fetch(`/api/pets/${petId}/cuidados`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tipo: tipoFinal,
        frequenciaDias: modo === 'INTRADIARIO' ? 1 : Number(frequenciaDias),
        configuracao,
        membroId,
      }),
    })
    setLoading(false)
    if (!res.ok) { toast.error('Erro ao salvar cuidado.'); return }
    const c = await res.json()
    toast.success('Cuidado adicionado!')
    onAdded({ ...c, execucoes: [] })
  }

  const lbl: React.CSSProperties = { fontSize: '11px', fontWeight: 700, color: 'var(--ink4)', display: 'block', marginBottom: '4px' }

  return (
    <form onSubmit={salvar} style={{ ...card, background: 'var(--surface)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink)', marginBottom: '2px' }}>Novo cuidado</div>

      <div>
        <label style={lbl}>TIPO</label>
        <select required value={tipo} onChange={e => setTipo(e.target.value)} style={inputStyle}>
          <option value="">Selecione…</option>
          {TIPOS_CUIDADO.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {tipo === 'Outro' && (
        <div>
          <label style={lbl}>DESCREVA</label>
          <input required value={tipoCustom} onChange={e => setTipoCustom(e.target.value)} placeholder="Ex: Hidratação do pelo" style={inputStyle} />
        </div>
      )}

      <div>
        <label style={{ ...lbl, marginBottom: '6px' }}>FREQUÊNCIA</label>
        <div style={{ display: 'flex', gap: '8px' }}>
          {(['INTERVALO', 'INTRADIARIO'] as const).map(m => (
            <button key={m} type="button" onClick={() => setModo(m)} style={{
              ...btnGhost,
              background: modo === m ? 'var(--amber)' : 'transparent',
              color: modo === m ? '#412402' : 'var(--ink3)',
              border: modo === m ? 'none' : '1px solid var(--border)',
              fontSize: '12px',
            }}>
              {m === 'INTERVALO' ? '📅 A cada N dias' : '🕐 N vezes por dia'}
            </button>
          ))}
        </div>
      </div>

      {modo === 'INTERVALO' && (
        <div>
          <label style={lbl}>A CADA QUANTOS DIAS</label>
          <input required type="number" min="1" value={frequenciaDias} onChange={e => setFrequenciaDias(e.target.value)} style={inputStyle} />
        </div>
      )}

      {modo === 'INTRADIARIO' && (
        <>
          <div>
            <label style={{ ...lbl, marginBottom: '6px' }}>VEZES POR DIA</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button type="button" onClick={() => handleVezesPorDia(vezesPorDia - 1)}
                style={{ ...btnGhost, padding: '4px 14px', fontSize: '16px' }}>−</button>
              <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--ink)', minWidth: '24px', textAlign: 'center' }}>{vezesPorDia}</span>
              <button type="button" onClick={() => handleVezesPorDia(vezesPorDia + 1)}
                style={{ ...btnGhost, padding: '4px 14px', fontSize: '16px' }}>+</button>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={lbl}>HORÁRIOS</label>
            {horarios.slice(0, vezesPorDia).map((h, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', color: 'var(--ink3)', minWidth: '60px' }}>{i + 1}ª vez</span>
                <input
                  type="time"
                  required
                  value={h}
                  onChange={e => updateHorario(i, e.target.value)}
                  style={{ ...inputStyle, width: '130px' }}
                />
              </div>
            ))}
          </div>
        </>
      )}

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
    if (!res.ok) { toast.error('Erro ao registrar.'); return }
    const adm = await res.json()
    const statusMsgs: Record<string, string> = {
      ATRASADO:  `${r.nome} registrado — dose atrasada.`,
      ADIANTADO: `${r.nome} registrado — dose adiantada.`,
      EXTRA:     `${r.nome} registrado — dose extra além das prescritas.`,
    }
    toast.success(adm.statusDose ? statusMsgs[adm.statusDose] ?? `${r.nome} administrado!` : `${r.nome} administrado!`)
    setRemedios(prev => prev.map(x =>
      x.id === r.id ? { ...x, administracoes: [{ ...adm, administradoEm: adm.administradoEm, statusDose: adm.statusDose ?? null, membro: adm.membro }, ...x.administracoes] } : x
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
        const status = calcularStatusRemedioDisplay(r)
        const isExpanded = expandido === r.id
        const proximaStr = calcularProximaDoseStr(r)
        const detalhe = calcularDetalheSlots(r)
        const dosesHoje = detalhe ? null : calcularDosesHoje(r) // fallback para frequências sem horários

        return (
          <div key={r.id} style={card}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink)' }}>{r.nome}</span>
                  <Badge status={status} />

                  {/* Badges granulares por slot — apenas para diário com horários */}
                  {detalhe && detalhe.atrasadas > 0 && (
                    <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, background: 'var(--coral-50)', color: 'var(--coral)' }}>
                      {detalhe.atrasadas} dose{detalhe.atrasadas > 1 ? 's' : ''} atrasada{detalhe.atrasadas > 1 ? 's' : ''}
                    </span>
                  )}
                  {detalhe && detalhe.quase > 0 && (
                    <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, background: '#FFF7ED', color: '#C2410C' }}>
                      {detalhe.quase} dose{detalhe.quase > 1 ? 's' : ''} quase na hora
                    </span>
                  )}
                  {detalhe && detalhe.emBreve > 0 && (
                    <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, background: '#FEF3C7', color: '#92400E' }}>
                      {detalhe.emBreve} dose{detalhe.emBreve > 1 ? 's' : ''} em breve
                    </span>
                  )}
                  {detalhe && detalhe.feitas > 0 && detalhe.atrasadas === 0 && detalhe.quase === 0 && detalhe.emBreve === 0 && (
                    <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, background: 'var(--teal-50)', color: 'var(--teal-800)' }}>
                      {detalhe.feitas}/{(parseDose(r.dose)?.quantidade ?? detalhe.feitas)} hoje ✓
                    </span>
                  )}

                  {/* Fallback para frequências sem horários: X/Y hoje */}
                  {dosesHoje && (
                    <span style={{
                      padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 700,
                      background: dosesHoje.tomadas >= dosesHoje.total ? 'var(--teal-50)' : '#FEF3C7',
                      color: dosesHoje.tomadas >= dosesHoje.total ? 'var(--teal-800)' : '#92400E',
                    }}>
                      {dosesHoje.tomadas}/{dosesHoje.total} hoje
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--ink3)' }}>
                  {formatDoseLabel(r.dose)} · {FREQ_OPTIONS.find(f => f.value === r.frequencia)?.label ?? r.frequencia}
                  {r.dataFim ? ` · até ${fmt(r.dataFim)}` : ''}
                </div>
                <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: 'var(--ink4)', marginTop: '3px' }}>
                  <span>Última: {ultima ? fmtHora(ultima) : 'nunca'}</span>
                  <span style={{
                    color: status === 'ATRASADO' ? 'var(--coral)' : status === 'QUASE' ? '#C2410C' : 'var(--teal-800)',
                    fontWeight: 600,
                  }}>
                    Próxima: {proximaStr}
                  </span>
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
                    {r.administracoes.slice(0, 8).map(a => {
                      const statusBadge: Record<string, { label: string; bg: string; color: string }> = {
                        ATRASADO:  { label: 'Atrasado',   bg: 'var(--coral-50)',  color: 'var(--coral)' },
                        ADIANTADO: { label: 'Adiantado',  bg: '#FEF3C7',          color: '#92400E' },
                        EXTRA:     { label: 'Dose extra', bg: '#EDE9FE',          color: '#5B21B6' },
                      }
                      const badge = a.statusDose ? statusBadge[a.statusDose] : null
                      return (
                        <div key={a.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', color: 'var(--ink3)', gap: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>💊 {fmtHora(a.administradoEm)}</span>
                            {badge && (
                              <span style={{ padding: '1px 7px', borderRadius: '20px', fontSize: '10px', fontWeight: 700, background: badge.bg, color: badge.color }}>
                                {badge.label}
                              </span>
                            )}
                          </div>
                          <span style={{ flexShrink: 0 }}>{a.membro.usuario.nome}</span>
                        </div>
                      )
                    })}
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
    // Para intradiário, execucoes[] drive o display — proximaExecucao vem do servidor no reload
    const conf = parseConfigCuidado(c.configuracao)
    const proxima = conf
      ? agora
      : new Date(Date.now() + c.frequenciaDias * 86_400_000).toISOString()
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
        const status = calcularStatusCuidadoDisplay(c)
        const isExpanded = expandido === c.id
        const detalhe = calcularDetalheSlotsCuidado(c)
        const conf = parseConfigCuidado(c.configuracao)
        const proximoStr = calcularProximoSlotCuidadoStr(c)

        return (
          <div key={c.id} style={card}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink)' }}>{c.tipo}</span>
                  <Badge status={status} />

                  {detalhe && detalhe.atrasadas > 0 && (
                    <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, background: 'var(--coral-50)', color: 'var(--coral)' }}>
                      {detalhe.atrasadas} vez{detalhe.atrasadas > 1 ? 'es' : ''} atrasada{detalhe.atrasadas > 1 ? 's' : ''}
                    </span>
                  )}
                  {detalhe && detalhe.quase > 0 && (
                    <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, background: '#FFF7ED', color: '#C2410C' }}>
                      {detalhe.quase} vez{detalhe.quase > 1 ? 'es' : ''} quase na hora
                    </span>
                  )}
                  {detalhe && detalhe.emBreve > 0 && (
                    <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, background: '#FEF3C7', color: '#92400E' }}>
                      {detalhe.emBreve} vez{detalhe.emBreve > 1 ? 'es' : ''} em breve
                    </span>
                  )}
                  {detalhe && detalhe.feitas > 0 && detalhe.atrasadas === 0 && detalhe.quase === 0 && detalhe.emBreve === 0 && (
                    <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, background: 'var(--teal-50)', color: 'var(--teal-800)' }}>
                      {detalhe.feitas}/{conf?.vezesPorDia ?? detalhe.feitas} hoje ✓
                    </span>
                  )}
                </div>

                <div style={{ fontSize: '12px', color: 'var(--ink3)' }}>
                  {conf
                    ? `${conf.vezesPorDia}x/dia · ${conf.horarios.join(', ')}`
                    : `A cada ${c.frequenciaDias} dias`}
                </div>
                <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: 'var(--ink4)', marginTop: '2px' }}>
                  <span>Última: {c.ultimaExecucao ? fmtHora(c.ultimaExecucao) : 'nunca'}</span>
                  <span style={{
                    color: status === 'ATRASADO' ? 'var(--coral)' : status === 'QUASE' ? '#C2410C' : 'var(--teal-800)',
                    fontWeight: 600,
                  }}>
                    Próxima: {proximoStr}
                  </span>
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
    <div style={{ width: '100%', maxWidth: '780px', margin: '0 auto', padding: '24px', boxSizing: 'border-box' }}>
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
