'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { ConfirmActionModal } from '@/components/ui/confirm-action-modal'
import { getInitials } from '@/lib/utils'

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

type AcaoPendente = {
  tipo: 'remover' | 'promover'
  membro: Membro
} | null

const AVATAR_COLORS = ['#3C3489', '#085041', '#4A1B0C', '#26215C', '#4B1528']
const AVATAR_COLORS_TEXT = ['#CECBF6', '#9FE1CB', '#F0A58B', '#C5C2F5', '#EDA8C0']

export default function FamiliaClient({
  familia,
  membros,
  usuarioAtualId,
  isAdmin,
}: Props) {
  const [emailConvite, setEmailConvite] = useState('')
  const [loadingConvite, setLoadingConvite] = useState(false)
  const [copiado, setCopiado] = useState(false)
  const [acaoPendente, setAcaoPendente] = useState<AcaoPendente>(null)
  const [processandoAcao, setProcessandoAcao] = useState(false)
  const router = useRouter()

  async function copiarTexto(texto: string) {
    try {
      await navigator.clipboard.writeText(texto)
    } catch {
      const el = document.createElement('textarea')
      el.value = texto
      el.style.position = 'fixed'
      el.style.opacity = '0'
      document.body.appendChild(el)
      el.focus()
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    }
  }

  async function copiarCodigo() {
    await copiarTexto(familia.codigoConvite)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
    toast.success('Código copiado!')
  }

  async function copiarLink() {
    await copiarTexto(`${window.location.origin}/convite/${familia.codigoConvite}`)
    toast.success('Link copiado!')
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

    if (res.ok) {
      toast.success('Convite enviado!')
      setEmailConvite('')
      return
    }

    toast.error('Erro ao enviar convite.')
  }

  async function removerMembro(membroId: string) {
    const res = await fetch(`/api/familia/membros/${membroId}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Membro removido.')
      router.refresh()
      return
    }

    toast.error('Erro ao remover membro.')
  }

  async function promoverAdmin(membroId: string) {
    const res = await fetch(`/api/familia/membros/${membroId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ papel: 'ADMIN' }),
    })
    if (res.ok) {
      toast.success('Membro promovido a admin.')
      router.refresh()
      return
    }

    toast.error('Erro ao promover membro.')
  }

  function abrirConfirmacaoRemocao(membroId: string) {
    const membro = membros.find((item) => item.id === membroId)
    if (!membro) return
    setAcaoPendente({ tipo: 'remover', membro })
  }

  function abrirConfirmacaoPromocao(membroId: string) {
    const membro = membros.find((item) => item.id === membroId)
    if (!membro) return
    setAcaoPendente({ tipo: 'promover', membro })
  }

  function fecharConfirmacaoAcao() {
    if (processandoAcao) return
    setAcaoPendente(null)
  }

  async function confirmarAcaoMembro() {
    if (!acaoPendente) return

    setProcessandoAcao(true)
    try {
      if (acaoPendente.tipo === 'remover') {
        await removerMembro(acaoPendente.membro.id)
      } else {
        await promoverAdmin(acaoPendente.membro.id)
      }
      setAcaoPendente(null)
    } finally {
      setProcessandoAcao(false)
    }
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', alignItems: 'start' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div
          style={{
            background: 'var(--card)',
            borderRadius: 'var(--r-lg)',
            border: '1px solid var(--border)',
            padding: '24px',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-syne)',
              fontSize: '16px',
              fontWeight: 700,
              color: 'var(--ink)',
              marginBottom: '18px',
            }}
          >
            Codigo de convite
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--ink4)',
                marginBottom: '5px',
                letterSpacing: '.3px',
              }}
            >
              CODIGO UNICO
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                value={familia.codigoConvite}
                readOnly
                style={{
                  flex: 1,
                  background: 'var(--surface)',
                  border: '1px solid var(--border2)',
                  borderRadius: '10px',
                  padding: '9px 12px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  fontWeight: 700,
                  letterSpacing: '2px',
                  color: 'var(--ink)',
                  outline: 'none',
                }}
              />
              <button
                onClick={copiarCodigo}
                style={{
                  padding: '8px 14px',
                  border: '1px solid var(--border2)',
                  borderRadius: '10px',
                  background: copiado ? 'var(--teal-50)' : 'transparent',
                  fontFamily: 'inherit',
                  fontWeight: 600,
                  fontSize: '12px',
                  cursor: 'pointer',
                  color: copiado ? 'var(--teal-800)' : 'var(--ink2)',
                  whiteSpace: 'nowrap',
                }}
              >
                {copiado ? 'OK Copiado' : 'Copiar'}
              </button>
            </div>
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--ink4)',
                marginBottom: '5px',
                letterSpacing: '.3px',
              }}
            >
              CONVIDAR POR E-MAIL
            </label>
            <form onSubmit={enviarConvite} style={{ display: 'flex', gap: '8px' }}>
              <input
                type="email"
                value={emailConvite}
                onChange={(e) => setEmailConvite(e.target.value)}
                placeholder="email@exemplo.com"
                style={{
                  flex: 1,
                  background: 'var(--surface)',
                  border: '1px solid var(--border2)',
                  borderRadius: '10px',
                  padding: '9px 12px',
                  fontSize: '13px',
                  fontFamily: 'inherit',
                  color: 'var(--ink)',
                  outline: 'none',
                }}
              />
              <button
                type="submit"
                disabled={loadingConvite}
                style={{
                  background: 'var(--amber)',
                  color: '#412402',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '8px 14px',
                  fontSize: '13px',
                  fontWeight: 700,
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  opacity: loadingConvite ? 0.7 : 1,
                }}
              >
                {loadingConvite ? '...' : 'Enviar'}
              </button>
            </form>
          </div>
        </div>

        <div
          style={{
            background: 'var(--teal-50)',
            borderRadius: 'var(--r-lg)',
            border: '1px solid #9FE1CB',
            padding: '16px 20px',
          }}
        >
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--teal-800)', marginBottom: '4px' }}>
            Link de convite
          </div>
          <div
            style={{
              fontSize: '12px',
              color: 'var(--teal-800)',
              opacity: 0.8,
              marginBottom: '10px',
            }}
          >
            Compartilhe este link diretamente com os membros.
          </div>
          <button
            onClick={copiarLink}
            style={{
              background: 'var(--teal)',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: 600,
              fontFamily: 'inherit',
              cursor: 'pointer',
            }}
          >
            Copiar link
          </button>
        </div>
      </div>

      <div
        style={{
          background: 'var(--card)',
          borderRadius: 'var(--r-lg)',
          border: '1px solid var(--border)',
          padding: '18px 20px',
        }}
      >
        <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink)', marginBottom: '14px' }}>
          Membros da familia ({membros.length})
        </div>
        {membros.map((m, i) => (
          <div
            key={m.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 0',
              borderBottom: i < membros.length - 1 ? '1px solid var(--border)' : 'none',
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: AVATAR_COLORS[i % AVATAR_COLORS.length],
                color: AVATAR_COLORS_TEXT[i % AVATAR_COLORS_TEXT.length],
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '13px',
                flexShrink: 0,
              }}
            >
              {getInitials(m.nome)}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink)' }}>
                {m.nome}
                {m.usuarioId === usuarioAtualId ? ' (voce)' : ''}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--ink4)' }}>
                {m.papel === 'ADMIN' ? 'Admin' : 'Membro'}
              </div>
            </div>
            <span
              style={{
                padding: '3px 9px',
                borderRadius: '20px',
                fontSize: '11px',
                fontWeight: 600,
                background: m.papel === 'ADMIN' ? 'var(--amber-50)' : 'var(--teal-50)',
                color: m.papel === 'ADMIN' ? 'var(--amber-800)' : 'var(--teal-800)',
              }}
            >
              {m.papel === 'ADMIN' ? 'Admin' : 'Ativo'}
            </span>
            {isAdmin && m.usuarioId !== usuarioAtualId && (
              <div style={{ display: 'flex', gap: '6px' }}>
                {m.papel !== 'ADMIN' && (
                  <button
                    onClick={() => abrirConfirmacaoPromocao(m.id)}
                    title="Promover a admin"
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '6px',
                      border: '1px solid var(--border)',
                      background: 'var(--surface)',
                      cursor: 'pointer',
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    ^
                  </button>
                )}
                <button
                  onClick={() => abrirConfirmacaoRemocao(m.id)}
                  title="Remover membro"
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '6px',
                    border: '1px solid var(--coral-50)',
                    background: 'var(--coral-50)',
                    cursor: 'pointer',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--coral)',
                  }}
                >
                  x
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <ConfirmActionModal
        open={Boolean(acaoPendente)}
        onClose={fecharConfirmacaoAcao}
        title={acaoPendente?.tipo === 'remover' ? 'Remover membro' : 'Promover a admin'}
        description={
          acaoPendente?.tipo === 'remover'
            ? `Voce esta prestes a remover ${acaoPendente?.membro.nome ?? ''} da familia.`
            : `${acaoPendente?.membro.nome ?? ''} passara a ter permissoes de administrador da familia.`
        }
        confirmLabel={acaoPendente?.tipo === 'remover' ? 'Remover membro' : 'Promover a admin'}
        onConfirm={confirmarAcaoMembro}
        loading={processandoAcao}
        closeDisabled={processandoAcao}
        tone={acaoPendente?.tipo === 'remover' ? 'danger' : 'teal'}
        icon={acaoPendente?.tipo === 'remover' ? '!' : '^'}
        noteTitle={acaoPendente?.tipo === 'remover' ? 'Confirmacao necessaria' : 'Novo nivel de acesso'}
        noteDescription={
          acaoPendente?.tipo === 'remover'
            ? 'Depois disso, a pessoa precisara de um novo convite para voltar.'
            : 'Admins podem gerenciar membros e configurar a familia.'
        }
      />
    </div>
  )
}
