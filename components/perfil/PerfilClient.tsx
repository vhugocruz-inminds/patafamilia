'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { getInitials } from '@/lib/utils'

interface Props {
  usuario: {
    id?: string
    nome: string
    email: string
  }
  membro: {
    papel: 'ADMIN' | 'MEMBRO'
    entradaEm: string
    familia: {
      nome: string
      codigoConvite: string
      totalMembros: number
      membros: {
        id: string
        usuarioId: string
        nome: string
        email: string
        papel: 'ADMIN' | 'MEMBRO'
      }[]
    }
  } | null
}

const AVATAR_COLORS: [string, string][] = [
  ['#3C3489', '#CECBF6'],
  ['#085041', '#9FE1CB'],
  ['#4A1B0C', '#F0A58B'],
  ['#26215C', '#C5C2F5'],
  ['#4B1528', '#EDA8C0'],
]

function getAvatarColor(nome: string): [string, string] {
  const idx = nome.charCodeAt(0) % AVATAR_COLORS.length
  return AVATAR_COLORS[idx]
}

function formatarDataCompleta(dataIso: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(dataIso))
}

function getMensagemSaida(membro: NonNullable<Props['membro']>) {
  if (membro.papel === 'MEMBRO') {
    return 'Ao sair, você perderá acesso à família e precisará de um novo convite para voltar. Deseja continuar?'
  }

  return 'Você é o único membro desta família. Ao sair, a família e todos os dados dela serão apagados permanentemente. Deseja continuar?'
}

export default function PerfilClient({ usuario, membro }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [nome, setNome] = useState(usuario.nome)
  const [salvando, setSalvando] = useState(false)
  const [saindoFamilia, setSaindoFamilia] = useState(false)
  const [apagandoConta, setApagandoConta] = useState(false)
  const [modalSucessorAberto, setModalSucessorAberto] = useState(false)
  const [sucessorSelecionadoId, setSucessorSelecionadoId] = useState('')
  const [avatarBg, avatarColor] = getAvatarColor(nome || usuario.nome)

  const nomeAlterado = nome.trim() !== usuario.nome
  const outrosMembros =
    membro?.familia.membros.filter((item) => item.email !== usuario.email) ?? []

  function abrirModalSucessor() {
    setSucessorSelecionadoId((atual) => atual || outrosMembros[0]?.id || '')
    setModalSucessorAberto(true)
  }

  function fecharModalSucessor() {
    if (saindoFamilia) {
      return
    }

    setModalSucessorAberto(false)
    setSucessorSelecionadoId('')
  }

  async function salvarPerfil(e: React.FormEvent) {
    e.preventDefault()

    if (!nome.trim()) {
      toast.error('Informe um nome válido.')
      return
    }

    setSalvando(true)
    try {
      const res = await fetch('/api/perfil', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome }),
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao salvar perfil')
      }

      toast.success('Perfil atualizado com sucesso.')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar perfil')
    } finally {
      setSalvando(false)
    }
  }

  async function sairDaFamilia() {
    if (!membro) {
      return
    }

    if (membro.papel === 'ADMIN' && membro.familia.totalMembros > 1) {
      abrirModalSucessor()
      return
    }

    if (!window.confirm(getMensagemSaida(membro))) {
      return
    }

    await confirmarSaidaDaFamilia()
  }

  async function confirmarSaidaDaFamilia() {
    if (!membro) {
      return
    }

    const body =
      membro.papel === 'ADMIN' && membro.familia.totalMembros > 1
        ? { sucessorMembroId: sucessorSelecionadoId }
        : {}

    setSaindoFamilia(true)
    try {
      const res = await fetch('/api/familia/sair', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao sair da família')
      }

      setModalSucessorAberto(false)
      setSucessorSelecionadoId('')
      toast.success(data.message || 'Você saiu da família.')
      router.replace('/perfil')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao sair da família')
    } finally {
      setSaindoFamilia(false)
    }
  }

  async function apagarConta() {
    if (membro) {
      return
    }

    const confirmacao = window.prompt('Digite APAGAR para confirmar a exclusão permanente da sua conta.')

    if (confirmacao !== 'APAGAR') {
      toast.error('Confirmação inválida. Sua conta não foi apagada.')
      return
    }

    setApagandoConta(true)
    try {
      const res = await fetch('/api/conta', { method: 'DELETE' })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao apagar conta')
      }

      await supabase.auth.signOut()
      toast.success('Sua conta foi apagada.')
      router.replace('/login')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao apagar conta')
      setApagandoConta(false)
    }
  }

  return (
    <>
      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-syne)', fontSize: '22px', fontWeight: 800, color: 'var(--ink)' }}>Seu perfil</div>
            <div style={{ fontSize: '13px', color: 'var(--ink3)', marginTop: '4px' }}>
              Veja suas informações, acompanhe sua família e gerencie sua conta.
            </div>
          </div>
          {!membro && (
            <Link
              href="/onboarding"
              style={{
                textDecoration: 'none',
                background: 'var(--amber)',
                color: '#412402',
                borderRadius: '10px',
                padding: '10px 14px',
                fontSize: '13px',
                fontWeight: 700,
              }}
            >
              Criar ou entrar em uma família
            </Link>
          )}
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '16px',
            alignItems: 'start',
          }}
        >
          <div style={{ background: 'var(--card)', borderRadius: 'var(--r-lg)', border: '1px solid var(--border)', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: avatarBg,
                  color: avatarColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                  fontWeight: 800,
                  flexShrink: 0,
                }}
              >
                {getInitials(nome || usuario.nome)}
              </div>
              <div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--ink)' }}>{usuario.nome}</div>
                <div style={{ fontSize: '12px', color: 'var(--ink4)' }}>{usuario.email}</div>
              </div>
            </div>

            <form onSubmit={salvarPerfil} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--ink4)', marginBottom: '6px', letterSpacing: '.3px' }}>
                  NOME
                </label>
                <input
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Seu nome"
                  style={{
                    width: '100%',
                    background: 'var(--surface)',
                    border: '1px solid var(--border2)',
                    borderRadius: '10px',
                    padding: '10px 12px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    color: 'var(--ink)',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--ink4)', marginBottom: '6px', letterSpacing: '.3px' }}>
                  E-MAIL
                </label>
                <input
                  value={usuario.email}
                  readOnly
                  style={{
                    width: '100%',
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: '10px',
                    padding: '10px 12px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    color: 'var(--ink3)',
                    outline: 'none',
                    opacity: 0.85,
                  }}
                />
                <div style={{ fontSize: '11px', color: 'var(--ink4)', marginTop: '6px' }}>
                  O e-mail fica somente para visualização nesta versão.
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="submit"
                  disabled={salvando || !nomeAlterado}
                  style={{
                    background: nomeAlterado ? 'var(--amber)' : 'var(--border)',
                    color: nomeAlterado ? '#412402' : 'var(--ink4)',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '10px 16px',
                    fontSize: '13px',
                    fontWeight: 700,
                    fontFamily: 'inherit',
                    cursor: salvando || !nomeAlterado ? 'not-allowed' : 'pointer',
                    opacity: salvando ? 0.8 : 1,
                  }}
                >
                  {salvando ? 'Salvando...' : 'Salvar alterações'}
                </button>
              </div>
            </form>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ background: 'var(--card)', borderRadius: 'var(--r-lg)', border: '1px solid var(--border)', padding: '24px' }}>
              <div style={{ fontFamily: 'var(--font-syne)', fontSize: '16px', fontWeight: 700, color: 'var(--ink)', marginBottom: '16px' }}>
                Família
              </div>

              {membro ? (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '18px' }}>
                    {[
                      { label: 'Família atual', value: membro.familia.nome },
                      { label: 'Seu papel', value: membro.papel === 'ADMIN' ? 'Admin' : 'Membro' },
                      { label: 'Entrada', value: formatarDataCompleta(membro.entradaEm) },
                      { label: 'Membros', value: `${membro.familia.totalMembros} pessoa${membro.familia.totalMembros > 1 ? 's' : ''}` },
                    ].map((item) => (
                      <div key={item.label} style={{ background: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--border)', padding: '12px' }}>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ink4)', marginBottom: '6px', letterSpacing: '.3px' }}>
                          {item.label.toUpperCase()}
                        </div>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ink)' }}>{item.value}</div>
                      </div>
                    ))}
                  </div>

                  <div style={{ background: 'var(--amber-50)', border: '1px solid #F6D699', borderRadius: '12px', padding: '14px', marginBottom: '16px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--amber-800)', marginBottom: '4px' }}>Código de convite</div>
                    <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--ink)', letterSpacing: '2px' }}>{membro.familia.codigoConvite}</div>
                  </div>

                  <button
                    type="button"
                    onClick={sairDaFamilia}
                    disabled={saindoFamilia}
                    style={{
                      width: '100%',
                      background: '#FFF3F0',
                      color: 'var(--coral)',
                      border: '1px solid #F4C3B6',
                      borderRadius: '10px',
                      padding: '11px 14px',
                      fontSize: '13px',
                      fontWeight: 700,
                      fontFamily: 'inherit',
                      cursor: saindoFamilia ? 'wait' : 'pointer',
                    }}
                  >
                    {saindoFamilia ? 'Saindo da família...' : 'Sair da família'}
                  </button>

                  {membro.papel === 'ADMIN' && membro.familia.totalMembros > 1 && (
                    <div style={{ fontSize: '11px', color: 'var(--ink4)', marginTop: '10px' }}>
                      Você vai escolher quem assume como admin antes de sair.
                    </div>
                  )}
                </>
              ) : (
                <div style={{ background: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--border)', padding: '16px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink)', marginBottom: '6px' }}>Você está sem família no momento.</div>
                  <div style={{ fontSize: '12px', color: 'var(--ink4)' }}>
                    Quando quiser, você pode criar uma nova família ou entrar em outra usando um código de convite.
                  </div>
                </div>
              )}
            </div>

            <div style={{ background: 'var(--card)', borderRadius: 'var(--r-lg)', border: '1px solid var(--border)', padding: '24px' }}>
              <div style={{ fontFamily: 'var(--font-syne)', fontSize: '16px', fontWeight: 700, color: 'var(--ink)', marginBottom: '8px' }}>
                Conta
              </div>
              <div style={{ fontSize: '12px', color: 'var(--ink4)', marginBottom: '18px', lineHeight: 1.6 }}>
                Apagar a conta remove seu acesso permanentemente. Antes disso, você precisa sair da sua família atual.
              </div>

              <button
                type="button"
                onClick={apagarConta}
                disabled={Boolean(membro) || apagandoConta}
                style={{
                  width: '100%',
                  background: membro ? 'var(--border)' : '#D85A30',
                  color: membro ? 'var(--ink4)' : '#fff',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '11px 14px',
                  fontSize: '13px',
                  fontWeight: 700,
                  fontFamily: 'inherit',
                  cursor: membro || apagandoConta ? 'not-allowed' : 'pointer',
                  opacity: apagandoConta ? 0.8 : 1,
                }}
              >
                {apagandoConta ? 'Apagando conta...' : 'Apagar conta'}
              </button>

              {membro && (
                <div style={{ fontSize: '11px', color: 'var(--ink4)', marginTop: '10px' }}>
                  Saia da família primeiro para liberar essa ação.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {modalSucessorAberto && membro && (
        <div
          onClick={fecharModalSucessor}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(24,24,27,.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            zIndex: 1000,
          }}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '560px',
              background: 'var(--card)',
              borderRadius: '18px',
              border: '1px solid var(--border)',
              boxShadow: '0 20px 50px rgba(0,0,0,.22)',
              padding: '24px',
            }}
          >
            <div style={{ fontFamily: 'var(--font-syne)', fontSize: '18px', fontWeight: 700, color: 'var(--ink)', marginBottom: '8px' }}>
              Escolha o próximo admin
            </div>
            <div style={{ fontSize: '13px', color: 'var(--ink3)', lineHeight: 1.6, marginBottom: '18px' }}>
              Antes de sair da família, escolha qual membro vai assumir a administração.
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '18px' }}>
              {outrosMembros.map((item) => {
                const selecionado = sucessorSelecionadoId === item.id

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSucessorSelecionadoId(item.id)}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      background: selecionado ? 'var(--amber-50)' : 'var(--surface)',
                      border: `1px solid ${selecionado ? 'var(--amber)' : 'var(--border)'}`,
                      borderRadius: '14px',
                      padding: '14px 16px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                    }}
                  >
                    <div
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '50%',
                        background: '#26215C',
                        color: '#C5C2F5',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      {getInitials(item.nome)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink)' }}>{item.nome}</div>
                      <div style={{ fontSize: '12px', color: 'var(--ink4)' }}>{item.email}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {item.papel === 'ADMIN' && (
                        <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--amber-800)', background: 'var(--amber-50)', borderRadius: '999px', padding: '4px 8px' }}>
                          Já é admin
                        </span>
                      )}
                      <span
                        style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '50%',
                          border: `2px solid ${selecionado ? 'var(--amber)' : 'var(--border2)'}`,
                          background: selecionado ? 'var(--amber)' : 'transparent',
                          flexShrink: 0,
                        }}
                      />
                    </div>
                  </button>
                )
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={fecharModalSucessor}
                disabled={saindoFamilia}
                style={{
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1px solid var(--border2)',
                  background: 'transparent',
                  color: 'var(--ink3)',
                  fontSize: '13px',
                  fontWeight: 700,
                  fontFamily: 'inherit',
                  cursor: saindoFamilia ? 'not-allowed' : 'pointer',
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmarSaidaDaFamilia}
                disabled={!sucessorSelecionadoId || saindoFamilia}
                style={{
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'var(--amber)',
                  color: '#412402',
                  fontSize: '13px',
                  fontWeight: 800,
                  fontFamily: 'inherit',
                  cursor: !sucessorSelecionadoId || saindoFamilia ? 'not-allowed' : 'pointer',
                  opacity: !sucessorSelecionadoId || saindoFamilia ? 0.65 : 1,
                }}
              >
                {saindoFamilia ? 'Saindo...' : 'Confirmar e sair'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
