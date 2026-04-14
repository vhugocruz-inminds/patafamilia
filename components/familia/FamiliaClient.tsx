'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { getInitials } from '@/lib/utils'
import { useRouter } from 'next/navigation'

interface Membro {
  id: string
  usuarioId: string
  nome: string
  email: string
  papel: string
  entradaEm: string
}

interface Props {
  familia: { id: string; nome: string; codigoConvite: string }
  membros: Membro[]
  usuarioAtualId: string
  isAdmin: boolean
}

const AVATAR_COLORS = ['#3C3489', '#085041', '#4A1B0C', '#26215C', '#4B1528']
const AVATAR_COLORS_TEXT = ['#CECBF6', '#9FE1CB', '#F0A58B', '#C5C2F5', '#EDA8C0']

export default function FamiliaClient({ familia, membros, usuarioAtualId, isAdmin }: Props) {
  const [emailConvite, setEmailConvite] = useState('')
  const [loadingConvite, setLoadingConvite] = useState(false)
  const [copiado, setCopiado] = useState(false)
  const router = useRouter()

  function copiarCodigo() {
    navigator.clipboard.writeText(familia.codigoConvite)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
    toast.success('Código copiado!')
  }

  async function enviarConvite(e: React.FormEvent) {
    e.preventDefault()
    if (!emailConvite) return
    setLoadingConvite(true)
    const res = await fetch('/api/familia/convite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: emailConvite, familiaId: familia.id }),
    })
    setLoadingConvite(false)
    if (res.ok) { toast.success('Convite enviado!'); setEmailConvite('') }
    else toast.error('Erro ao enviar convite.')
  }

  async function removerMembro(membroId: string) {
    if (!confirm('Remover este membro da família?')) return
    const res = await fetch(`/api/familia/membros/${membroId}`, { method: 'DELETE' })
    if (res.ok) { toast.success('Membro removido.'); router.refresh() }
    else toast.error('Erro ao remover membro.')
  }

  async function promoverAdmin(membroId: string) {
    if (!confirm('Promover este membro a admin?')) return
    const res = await fetch(`/api/familia/membros/${membroId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ papel: 'ADMIN' }),
    })
    if (res.ok) { toast.success('Membro promovido a admin.'); router.refresh() }
    else toast.error('Erro ao promover membro.')
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', alignItems: 'start' }}>
      {/* Esquerda: configurações */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Código de convite */}
        <div style={{ background: 'var(--card)', borderRadius: 'var(--r-lg)', border: '1px solid var(--border)', padding: '24px' }}>
          <div style={{ fontFamily: 'var(--font-syne)', fontSize: '16px', fontWeight: 700, color: 'var(--ink)', marginBottom: '18px' }}>Código de convite</div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--ink4)', marginBottom: '5px', letterSpacing: '.3px' }}>CÓDIGO ÚNICO</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input value={familia.codigoConvite} readOnly style={{ flex: 1, background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: '10px', padding: '9px 12px', fontSize: '14px', fontFamily: 'inherit', fontWeight: 700, letterSpacing: '2px', color: 'var(--ink)', outline: 'none' }} />
              <button onClick={copiarCodigo} style={{ padding: '8px 14px', border: '1px solid var(--border2)', borderRadius: '10px', background: copiado ? 'var(--teal-50)' : 'transparent', fontFamily: 'inherit', fontWeight: 600, fontSize: '12px', cursor: 'pointer', color: copiado ? 'var(--teal-800)' : 'var(--ink2)', whiteSpace: 'nowrap' }}>
                {copiado ? '✓ Copiado' : 'Copiar'}
              </button>
            </div>
          </div>

          {/* Convidar por email */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--ink4)', marginBottom: '5px', letterSpacing: '.3px' }}>CONVIDAR POR E-MAIL</label>
            <form onSubmit={enviarConvite} style={{ display: 'flex', gap: '8px' }}>
              <input
                type="email"
                value={emailConvite}
                onChange={e => setEmailConvite(e.target.value)}
                placeholder="email@exemplo.com"
                style={{ flex: 1, background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: '10px', padding: '9px 12px', fontSize: '13px', fontFamily: 'inherit', color: 'var(--ink)', outline: 'none' }}
              />
              <button type="submit" disabled={loadingConvite} style={{ background: 'var(--amber)', color: '#412402', border: 'none', borderRadius: '10px', padding: '8px 14px', fontSize: '13px', fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', whiteSpace: 'nowrap', opacity: loadingConvite ? 0.7 : 1 }}>
                {loadingConvite ? '...' : 'Enviar'}
              </button>
            </form>
          </div>
        </div>

        {/* Link de convite */}
        <div style={{ background: 'var(--teal-50)', borderRadius: 'var(--r-lg)', border: '1px solid #9FE1CB', padding: '16px 20px' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--teal-800)', marginBottom: '4px' }}>🔗 Link de convite</div>
          <div style={{ fontSize: '12px', color: 'var(--teal-800)', opacity: 0.8, marginBottom: '10px' }}>Compartilhe este link diretamente com os membros</div>
          <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/convite/${familia.codigoConvite}`); toast.success('Link copiado!') }} style={{ background: 'var(--teal)', color: '#fff', border: 'none', borderRadius: '8px', padding: '6px 14px', fontSize: '12px', fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>
            Copiar link
          </button>
        </div>
      </div>

      {/* Direita: membros */}
      <div style={{ background: 'var(--card)', borderRadius: 'var(--r-lg)', border: '1px solid var(--border)', padding: '18px 20px' }}>
        <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink)', marginBottom: '14px' }}>Membros da família ({membros.length})</div>
        {membros.map((m, i) => (
          <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 0', borderBottom: i < membros.length - 1 ? '1px solid var(--border)' : 'none' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: AVATAR_COLORS[i % AVATAR_COLORS.length], color: AVATAR_COLORS_TEXT[i % AVATAR_COLORS_TEXT.length], display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '13px', flexShrink: 0 }}>
              {getInitials(m.nome)}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink)' }}>{m.nome}{m.usuarioId === usuarioAtualId ? ' (você)' : ''}</div>
              <div style={{ fontSize: '11px', color: 'var(--ink4)' }}>{m.papel === 'ADMIN' ? 'Admin' : 'Membro'}</div>
            </div>
            <span style={{ padding: '3px 9px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, background: m.papel === 'ADMIN' ? 'var(--amber-50)' : 'var(--teal-50)', color: m.papel === 'ADMIN' ? 'var(--amber-800)' : 'var(--teal-800)' }}>
              {m.papel === 'ADMIN' ? 'Admin' : 'Ativo'}
            </span>
            {isAdmin && m.usuarioId !== usuarioAtualId && (
              <div style={{ display: 'flex', gap: '6px' }}>
                {m.papel !== 'ADMIN' && (
                  <button onClick={() => promoverAdmin(m.id)} title="Promover a admin" style={{ width: '28px', height: '28px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>⬆</button>
                )}
                <button onClick={() => removerMembro(m.id)} title="Remover membro" style={{ width: '28px', height: '28px', borderRadius: '6px', border: '1px solid var(--coral-50)', background: 'var(--coral-50)', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--coral)' }}>✕</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
