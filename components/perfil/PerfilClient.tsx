'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { getInitials } from '@/lib/utils'
import { ConfirmActionModal } from '@/components/ui/confirm-action-modal'

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

type ConfirmacaoSaida = {
  titulo: string
  mensagem: string
} | null

type ConfirmacaoExclusaoConta = {
  texto: string
  erro: string | null
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

function getMensagemSaida(membro: NonNullable<Props['membro']>): ConfirmacaoSaida {
  if (membro.papel === 'MEMBRO') {
    return {
      titulo: 'Sair da familia',
      mensagem:
        'Ao sair, voce perdera acesso a familia e precisara de um novo convite para voltar.',
    }
  }

  return {
    titulo: 'Apagar familia ao sair',
    mensagem:
      'Voce e o unico membro desta familia. Ao sair, a familia e todos os dados dela serao apagados permanentemente.',
  }
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--surface)',
  border: '1px solid var(--border2)',
  borderRadius: '10px',
  padding: '10px 12px',
  fontSize: '14px',
  fontFamily: 'inherit',
  color: 'var(--ink)',
  outline: 'none',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '11px',
  fontWeight: 700,
  color: 'var(--ink4)',
  marginBottom: '6px',
  letterSpacing: '.3px',
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
  const [confirmacaoSaida, setConfirmacaoSaida] = useState<ConfirmacaoSaida>(null)
  const [confirmacaoExclusaoConta, setConfirmacaoExclusaoConta] =
    useState<ConfirmacaoExclusaoConta | null>(null)
  const [modoFamilia, setModoFamilia] = useState<'criar' | 'entrar'>('criar')
  const [nomeFamilia, setNomeFamilia] = useState('')
  const [codigoConvite, setCodigoConvite] = useState('')
  const [salvandoFamilia, setSalvandoFamilia] = useState(false)
  const [avatarBg, avatarColor] = getAvatarColor(nome || usuario.nome)

  const nomeAlterado = nome.trim() !== usuario.nome
  const semFamilia = !membro
  const outrosMembros = membro?.familia.membros.filter((item) => item.email !== usuario.email) ?? []

  function abrirModalSucessor() {
    setSucessorSelecionadoId((atual) => atual || outrosMembros[0]?.id || '')
    setModalSucessorAberto(true)
  }

  function fecharModalSucessor() {
    if (saindoFamilia) return
    setModalSucessorAberto(false)
    setSucessorSelecionadoId('')
  }

  function fecharConfirmacaoSaida() {
    if (saindoFamilia) return
    setConfirmacaoSaida(null)
  }

  function abrirConfirmacaoExclusaoConta() {
    setConfirmacaoExclusaoConta({ texto: '', erro: null })
  }

  function fecharConfirmacaoExclusaoConta() {
    if (apagandoConta) return
    setConfirmacaoExclusaoConta(null)
  }

  async function salvarPerfil(e: React.FormEvent) {
    e.preventDefault()

    if (!nome.trim()) {
      toast.error('Informe um nome valido.')
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

  async function salvarFamilia(e: React.FormEvent) {
    e.preventDefault()

    if (modoFamilia === 'criar' && !nomeFamilia.trim()) {
      toast.error('Informe o nome da familia.')
      return
    }

    if (modoFamilia === 'entrar' && !codigoConvite.trim()) {
      toast.error('Informe o codigo de convite.')
      return
    }

    setSalvandoFamilia(true)
    try {
      const res = await fetch('/api/familia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          modoFamilia === 'criar'
            ? { acao: 'criar', nomeFamilia: nomeFamilia.trim() }
            : { acao: 'entrar', codigo: codigoConvite.trim().toUpperCase() }
        ),
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao configurar familia')
      }

      setNomeFamilia('')
      setCodigoConvite('')
      toast.success(
        modoFamilia === 'criar'
          ? 'Familia criada com sucesso.'
          : 'Voce entrou na familia com sucesso.'
      )
      router.replace('/dashboard')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao configurar familia')
    } finally {
      setSalvandoFamilia(false)
    }
  }

  async function sairDaFamilia() {
    if (!membro) return

    if (membro.papel === 'ADMIN' && membro.familia.totalMembros > 1) {
      abrirModalSucessor()
      return
    }

    setConfirmacaoSaida(getMensagemSaida(membro))
  }

  async function confirmarSaidaDaFamilia() {
    if (!membro) return

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
        throw new Error(data.error || 'Erro ao sair da familia')
      }

      setModalSucessorAberto(false)
      setSucessorSelecionadoId('')
      setConfirmacaoSaida(null)
      toast.success(data.message || 'Voce saiu da familia.')
      router.replace('/perfil')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao sair da familia')
    } finally {
      setSaindoFamilia(false)
    }
  }

  async function apagarConta() {
    if (membro) return

    abrirConfirmacaoExclusaoConta()
  }

  async function confirmarApagarConta() {
    if (membro || !confirmacaoExclusaoConta) return

    if (confirmacaoExclusaoConta.texto !== 'APAGAR') {
      setConfirmacaoExclusaoConta((atual) =>
        atual
          ? { ...atual, erro: 'Digite APAGAR exatamente como aparece para confirmar.' }
          : atual
      )
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
      setConfirmacaoExclusaoConta(null)
      toast.success('Sua conta foi apagada.')
      router.replace('/login')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao apagar conta')
      setApagandoConta(false)
    } finally {
      setApagandoConta(false)
    }
  }

  return (
    <>
      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-syne)', fontSize: '22px', fontWeight: 800, color: 'var(--ink)' }}>
            {semFamilia ? 'Sua conta' : 'Seu perfil'}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--ink3)', marginTop: '4px' }}>
            {semFamilia
              ? 'Voce nao faz parte de nenhuma familia agora. Atualize seus dados e crie uma nova familia ou entre em uma existente.'
              : 'Veja suas informacoes, acompanhe sua familia e gerencie sua conta.'}
          </div>
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

            {semFamilia && (
              <div
                style={{
                  background: 'var(--teal-50)',
                  border: '1px solid #9FE1CB',
                  borderRadius: '12px',
                  padding: '14px',
                  marginBottom: '18px',
                }}
              >
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--teal-800)', marginBottom: '4px' }}>
                  Conta sem familia
                </div>
                <div style={{ fontSize: '12px', color: 'var(--teal-800)', lineHeight: 1.6 }}>
                  Seus dados pessoais continuam aqui. Quando quiser, voce pode criar uma nova familia ou entrar em outra por convite.
                </div>
              </div>
            )}

            <form onSubmit={salvarPerfil} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={labelStyle}>NOME</label>
                <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Seu nome" style={inputStyle} />
              </div>

              <div>
                <label style={labelStyle}>E-MAIL</label>
                <input value={usuario.email} readOnly style={{ ...inputStyle, border: '1px solid var(--border)', color: 'var(--ink3)', opacity: 0.85 }} />
                <div style={{ fontSize: '11px', color: 'var(--ink4)', marginTop: '6px' }}>
                  O e-mail fica somente para visualizacao nesta versao.
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
                  {salvando ? 'Salvando...' : 'Salvar alteracoes'}
                </button>
              </div>
            </form>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ background: 'var(--card)', borderRadius: 'var(--r-lg)', border: '1px solid var(--border)', padding: '24px' }}>
              <div style={{ fontFamily: 'var(--font-syne)', fontSize: '16px', fontWeight: 700, color: 'var(--ink)', marginBottom: '16px' }}>
                {semFamilia ? 'Nova familia' : 'Familia'}
              </div>

              {membro ? (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '18px' }}>
                    {[
                      { label: 'Familia atual', value: membro.familia.nome },
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
                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--amber-800)', marginBottom: '4px' }}>Codigo de convite</div>
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
                    {saindoFamilia ? 'Saindo da familia...' : 'Sair da familia'}
                  </button>

                  {membro.papel === 'ADMIN' && membro.familia.totalMembros > 1 && (
                    <div style={{ fontSize: '11px', color: 'var(--ink4)', marginTop: '10px' }}>
                      Voce vai escolher quem assume como admin antes de sair.
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div style={{ background: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--border)', padding: '16px', marginBottom: '16px' }}>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink)', marginBottom: '6px' }}>
                      Escolha como quer voltar
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--ink4)' }}>
                      Crie sua propria familia ou use um codigo de convite para entrar em uma familia existente.
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                    {(['criar', 'entrar'] as const).map((modo) => (
                      <button
                        key={modo}
                        type="button"
                        onClick={() => setModoFamilia(modo)}
                        style={{
                          flex: 1,
                          padding: '8px 10px',
                          borderRadius: '10px',
                          border: `1px solid ${modoFamilia === modo ? 'var(--amber)' : 'var(--border)'}`,
                          background: modoFamilia === modo ? 'var(--amber-50)' : 'var(--card)',
                          color: modoFamilia === modo ? 'var(--amber-800)' : 'var(--ink3)',
                          fontFamily: 'inherit',
                          fontWeight: 700,
                          fontSize: '13px',
                          cursor: 'pointer',
                        }}
                      >
                        {modo === 'criar' ? 'Criar familia' : 'Entrar por convite'}
                      </button>
                    ))}
                  </div>

                  <form onSubmit={salvarFamilia} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {modoFamilia === 'criar' ? (
                      <div>
                        <label style={labelStyle}>NOME DA FAMILIA</label>
                        <input value={nomeFamilia} onChange={(e) => setNomeFamilia(e.target.value)} placeholder="Ex: Familia Costa" style={inputStyle} />
                      </div>
                    ) : (
                      <div>
                        <label style={labelStyle}>CODIGO DE CONVITE</label>
                        <input value={codigoConvite} onChange={(e) => setCodigoConvite(e.target.value.toUpperCase())} placeholder="Ex: ABCD1234" style={{ ...inputStyle, letterSpacing: '2px', fontWeight: 700 }} />
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={salvandoFamilia}
                      style={{
                        width: '100%',
                        background: 'var(--amber)',
                        color: '#412402',
                        border: 'none',
                        borderRadius: '10px',
                        padding: '11px 14px',
                        fontSize: '13px',
                        fontWeight: 800,
                        fontFamily: 'inherit',
                        cursor: salvandoFamilia ? 'wait' : 'pointer',
                        opacity: salvandoFamilia ? 0.8 : 1,
                      }}
                    >
                      {salvandoFamilia
                        ? 'Salvando...'
                        : modoFamilia === 'criar'
                          ? 'Criar familia'
                          : 'Entrar na familia'}
                    </button>
                  </form>
                </>
              )}
            </div>

            <div style={{ background: 'var(--card)', borderRadius: 'var(--r-lg)', border: '1px solid var(--border)', padding: '24px' }}>
              <div style={{ fontFamily: 'var(--font-syne)', fontSize: '16px', fontWeight: 700, color: 'var(--ink)', marginBottom: '8px' }}>
                Conta
              </div>
              <div style={{ fontSize: '12px', color: 'var(--ink4)', marginBottom: '18px', lineHeight: 1.6 }}>
                Apagar a conta remove seu acesso permanentemente. Antes disso, voce precisa sair da sua familia atual.
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
                  Saia da familia primeiro para liberar esta acao.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <ConfirmActionModal
        open={Boolean(confirmacaoSaida)}
        onClose={fecharConfirmacaoSaida}
        title={confirmacaoSaida?.titulo ?? ''}
        description={confirmacaoSaida?.mensagem ?? ''}
        confirmLabel="Confirmar saida"
        onConfirm={confirmarSaidaDaFamilia}
        loading={saindoFamilia}
        loadingLabel="Saindo..."
        closeDisabled={saindoFamilia}
        noteTitle="Confirmacao necessaria"
        noteDescription="Esta acao altera permanentemente a situacao da sua familia."
      />

      <ConfirmActionModal
        open={modalSucessorAberto && Boolean(membro)}
        onClose={fecharModalSucessor}
        title="Escolha o proximo admin"
        description="Antes de sair da familia, escolha qual membro vai assumir a administracao."
        confirmLabel="Confirmar e sair"
        onConfirm={confirmarSaidaDaFamilia}
        confirmDisabled={!sucessorSelecionadoId}
        loading={saindoFamilia}
        loadingLabel="Saindo..."
        closeDisabled={saindoFamilia}
        tone="warning"
        icon="^"
        maxWidth="560px"
      >
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
              </button>
            )
          })}
        </div>
      </ConfirmActionModal>

      <ConfirmActionModal
        open={Boolean(confirmacaoExclusaoConta && !membro)}
        onClose={fecharConfirmacaoExclusaoConta}
        title="Apagar conta permanentemente"
        description={
          <>
            Esta acao remove sua conta de forma definitiva. Para continuar, digite{' '}
            <strong>APAGAR</strong> no campo abaixo.
          </>
        }
        confirmLabel="Apagar conta"
        onConfirm={confirmarApagarConta}
        loading={apagandoConta}
        loadingLabel="Apagando..."
        closeDisabled={apagandoConta}
        noteTitle="Atencao"
        noteDescription="Depois de confirmar, nao sera possivel recuperar seus dados da conta."
      >
        <div style={{ marginBottom: '18px' }}>
          <label style={labelStyle}>DIGITE APAGAR</label>
          <input
            value={confirmacaoExclusaoConta?.texto ?? ''}
            onChange={(event) =>
              setConfirmacaoExclusaoConta({
                texto: event.target.value,
                erro: null,
              })
            }
            placeholder="APAGAR"
            style={{
              ...inputStyle,
              letterSpacing: '1px',
              fontWeight: 700,
              border: confirmacaoExclusaoConta?.erro ? '1px solid #D85A30' : inputStyle.border,
            }}
          />
          {confirmacaoExclusaoConta?.erro && (
            <div style={{ fontSize: '11px', color: '#D85A30', marginTop: '6px' }}>
              {confirmacaoExclusaoConta.erro}
            </div>
          )}
        </div>
      </ConfirmActionModal>
    </>
  )
}
