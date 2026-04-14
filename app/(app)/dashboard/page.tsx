import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { saudacao, dataAtualPorExtenso, calcularStatusRemedio, calcularStatusCuidado, getInitials, formatarDataHora } from '@/lib/utils'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const usuario = await prisma.usuario.findUnique({
    where: { id: user.id },
    include: {
      membro: {
        include: {
          familia: {
            include: {
              membros: { include: { usuario: true }, orderBy: { entradaEm: 'asc' } },
              pets: {
                include: {
                  remedios: {
                    where: { ativo: true },
                    include: { administracoes: { orderBy: { administradoEm: 'desc' }, take: 1 } },
                  },
                  cuidados: { where: { ativo: true } },
                  passeios: { where: { tipo: 'AGENDADO' }, orderBy: { agendadoEm: 'asc' }, take: 5 },
                },
              },
            },
          },
        },
      },
    },
  })

  if (!usuario?.membro) redirect('/onboarding')

  const { familia } = usuario.membro
  const agora = new Date()
  const hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate())
  const amanha = new Date(hoje.getTime() + 86400000)

  // Pendências de hoje: remédios atrasados/em breve + cuidados atrasados
  const pendencias: { id: string; nome: string; petNome: string; petEmoji: string; tipo: 'remedio' | 'cuidado' | 'passeio'; status: string; hora?: string; entidadeId: string }[] = []

  for (const pet of familia.pets) {
    for (const remedio of pet.remedios) {
      const ultima = remedio.administracoes[0]?.administradoEm ?? null
      const status = calcularStatusRemedio(remedio.frequencia, ultima, remedio.dataInicio)
      if (status === 'ATRASADO' || status === 'EM_BREVE') {
        pendencias.push({ id: `rem-${remedio.id}`, nome: remedio.nome, petNome: pet.nome, petEmoji: pet.emoji, tipo: 'remedio', status, entidadeId: remedio.id })
      }
    }
    for (const cuidado of pet.cuidados) {
      const status = calcularStatusCuidado(cuidado.proximaExecucao)
      if (status === 'ATRASADO' || status === 'EM_BREVE') {
        pendencias.push({ id: `cui-${cuidado.id}`, nome: cuidado.tipo, petNome: pet.nome, petEmoji: pet.emoji, tipo: 'cuidado', status, entidadeId: cuidado.id })
      }
    }
    for (const passeio of pet.passeios) {
      if (passeio.agendadoEm && passeio.agendadoEm >= hoje && passeio.agendadoEm < amanha) {
        pendencias.push({ id: `pas-${passeio.id}`, nome: 'Passeio', petNome: pet.nome, petEmoji: pet.emoji, tipo: 'passeio', status: 'EM_BREVE', hora: formatarDataHora(passeio.agendadoEm), entidadeId: passeio.id })
      }
    }
  }

  // Atividade recente unificada
  const administracoes = await prisma.administracao.findMany({
    where: { remedio: { pet: { familiaId: familia.id } } },
    include: { remedio: { include: { pet: true } }, membro: { include: { usuario: true } } },
    orderBy: { administradoEm: 'desc' },
    take: 5,
  })
  const passeiosRecentes = await prisma.passeio.findMany({
    where: { pet: { familiaId: familia.id }, tipo: 'REALIZADO' },
    include: { pet: true, membro: { include: { usuario: true } } },
    orderBy: { realizadoEm: 'desc' },
    take: 3,
  })

  // KPIs
  const cuidadosNoMes = await prisma.administracao.count({
    where: {
      remedio: { pet: { familiaId: familia.id } },
      administradoEm: { gte: new Date(agora.getFullYear(), agora.getMonth(), 1) },
    },
  })

  const AVATAR_COLORS = ['#3C3489', '#085041', '#4A1B0C', '#26215C', '#4B1528']
  const AVATAR_COLORS_TEXT = ['#CECBF6', '#9FE1CB', '#F0A58B', '#C5C2F5', '#EDA8C0']

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-syne)', fontSize: '20px', fontWeight: 800, color: 'var(--ink)' }}>
            {saudacao()}, {usuario.nome.split(' ')[0]} 👋
          </div>
          <div style={{ fontSize: '13px', color: 'var(--ink3)', marginTop: '2px', textTransform: 'capitalize' }}>{dataAtualPorExtenso()}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Link href="/notificacoes" style={{ width: '34px', height: '34px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--card)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', textDecoration: 'none', color: 'var(--ink2)', position: 'relative' }}>
            🔔
          </Link>
        </div>
      </div>

      {/* KPI Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
        {[
          { icon: '🐾', label: 'Pets cadastrados', val: familia.pets.length, color: 'var(--ink)' },
          { icon: '👥', label: 'Membros da família', val: familia.membros.length, color: 'var(--ink)' },
          { icon: '⚠️', label: 'Pendências hoje', val: pendencias.filter(p => p.status === 'ATRASADO').length, color: 'var(--coral)', sub: pendencias.length > 0 ? `${pendencias.length} total` : undefined },
          { icon: '✅', label: 'Cuidados este mês', val: cuidadosNoMes, color: 'var(--teal)' },
        ].map((kpi, i) => (
          <div key={i} style={{ background: 'var(--card)', borderRadius: 'var(--r-lg)', border: '1px solid var(--border)', padding: '16px 18px' }}>
            <div style={{ fontSize: '18px', marginBottom: '8px' }}>{kpi.icon}</div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--ink4)', marginBottom: '6px' }}>{kpi.label}</div>
            <div style={{ fontFamily: 'var(--font-syne)', fontSize: '26px', fontWeight: 800, color: kpi.color, lineHeight: 1 }}>{kpi.val}</div>
            {kpi.sub && <div style={{ fontSize: '11px', color: 'var(--ink4)', marginTop: '4px' }}>{kpi.sub}</div>}
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
        {/* Coluna esquerda */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Pets */}
          <div style={{ background: 'var(--card)', borderRadius: 'var(--r-lg)', border: '1px solid var(--border)', padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink)' }}>Nossos pets</span>
              {familia.pets.length > 0 && <Link href={`/pets/${familia.pets[0].id}`} style={{ fontSize: '11px', fontWeight: 600, color: 'var(--amber)', textDecoration: 'none' }}>Ver detalhes →</Link>}
            </div>
            {familia.pets.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '16px', color: 'var(--ink4)' }}>Nenhum pet cadastrado ainda.</div>
            ) : (
              familia.pets.map(pet => {
                let alertas = 0
                for (const r of pet.remedios) {
                  if (calcularStatusRemedio(r.frequencia, r.administracoes[0]?.administradoEm ?? null, r.dataInicio) === 'ATRASADO') alertas++
                }
                return (
                  <Link key={pet.id} href={`/pets/${pet.id}`} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '10px', textDecoration: 'none', border: '1px solid transparent', marginBottom: '4px', background: 'transparent', transition: 'all .15s' }}>
                    <div style={{ width: '40px', height: '40px', background: 'var(--surface)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', border: '1px solid var(--border)', flexShrink: 0 }}>{pet.emoji}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink)' }}>{pet.nome}</div>
                      <div style={{ fontSize: '11px', color: 'var(--ink4)' }}>{(pet as typeof pet & { raca?: string }).raca || pet.especie || ''}</div>
                    </div>
                    {alertas > 0
                      ? <span style={{ background: 'var(--coral-50)', color: 'var(--coral-800)', fontSize: '11px', fontWeight: 600, borderRadius: '20px', padding: '3px 9px' }}>{alertas} alertas</span>
                      : <span style={{ background: 'var(--teal-50)', color: 'var(--teal-800)', fontSize: '11px', fontWeight: 600, borderRadius: '20px', padding: '3px 9px' }}>Em dia</span>
                    }
                  </Link>
                )
              })
            )}
            <Link href="/pets/novo" style={{ display: 'block', marginTop: '8px', padding: '10px', borderRadius: '10px', border: '1.5px dashed var(--border2)', textAlign: 'center', fontSize: '12px', fontWeight: 600, color: 'var(--ink4)', textDecoration: 'none' }}>
              + Adicionar novo pet
            </Link>
          </div>

          {/* Membros */}
          <div style={{ background: 'var(--card)', borderRadius: 'var(--r-lg)', border: '1px solid var(--border)', padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink)' }}>Membros</span>
              <Link href="/familia" style={{ fontSize: '11px', fontWeight: 600, color: 'var(--amber)', textDecoration: 'none' }}>Gerenciar →</Link>
            </div>
            {familia.membros.map((membro, i) => (
              <div key={membro.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: i < familia.membros.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: AVATAR_COLORS[i % AVATAR_COLORS.length], color: AVATAR_COLORS_TEXT[i % AVATAR_COLORS_TEXT.length], display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '11px', flexShrink: 0 }}>
                  {getInitials(membro.usuario.nome)}
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink)' }}>{membro.usuario.nome}{membro.usuarioId === user.id ? ' (você)' : ''}</div>
                  <div style={{ fontSize: '11px', color: 'var(--ink4)' }}>{membro.papel === 'ADMIN' ? 'Admin' : 'Membro'}</div>
                </div>
                <div style={{ marginLeft: 'auto', width: '7px', height: '7px', borderRadius: '50%', background: membro.usuarioId === user.id ? 'var(--teal)' : 'var(--border2)' }} />
              </div>
            ))}
          </div>
        </div>

        {/* Coluna direita */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Pendências */}
          <div style={{ background: 'var(--card)', borderRadius: 'var(--r-lg)', border: '1px solid var(--border)', padding: '18px 20px' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink)', marginBottom: '14px' }}>Pendências de hoje</div>
            {pendencias.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '16px', color: 'var(--teal)', fontSize: '13px' }}>✅ Tudo em dia!</div>
            ) : (
              pendencias.slice(0, 5).map((p, i) => {
                const tipoIcons = { remedio: '💊', cuidado: '🛁', passeio: '🚶' }
                const tipoBg = { remedio: 'var(--pink-50)', cuidado: 'var(--purple-50)', passeio: 'var(--teal-50)' }
                return (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 0', borderBottom: i < pendencias.length - 1 && i < 4 ? '1px solid var(--border)' : 'none' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: tipoBg[p.tipo], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0 }}>
                      {tipoIcons[p.tipo]}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink)' }}>{p.nome} — {p.petEmoji} {p.petNome}</div>
                      <div style={{ fontSize: '11px', color: p.status === 'ATRASADO' ? 'var(--coral)' : 'var(--ink4)', fontWeight: p.status === 'ATRASADO' ? 600 : 400 }}>
                        {p.status === 'ATRASADO' ? 'Atrasado' : p.hora || 'Em breve'}
                      </div>
                    </div>
                    <Link href={`/pets/${familia.pets.find(pt => pt.nome === p.petNome)?.id ?? ''}`} style={{ width: '26px', height: '26px', borderRadius: '50%', border: '1.5px solid var(--border2)', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: 'var(--teal)', textDecoration: 'none' }}>→</Link>
                  </div>
                )
              })
            )}
          </div>

          {/* Atividade recente */}
          <div style={{ background: 'var(--card)', borderRadius: 'var(--r-lg)', border: '1px solid var(--border)', padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink)' }}>Atividade recente</span>
              <Link href="/notificacoes" style={{ fontSize: '11px', fontWeight: 600, color: 'var(--amber)', textDecoration: 'none' }}>Ver mais →</Link>
            </div>
            <div style={{ paddingLeft: '20px', position: 'relative' }}>
              <div style={{ position: 'absolute', left: '5px', top: '5px', bottom: 0, width: '1.5px', background: 'var(--border)' }} />
              {administracoes.slice(0, 4).map((adm) => (
                <div key={adm.id} style={{ position: 'relative', marginBottom: '14px' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--teal)', position: 'absolute', left: '-20px', top: '3px', border: '2px solid var(--card)' }} />
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ink)' }}>{adm.remedio.nome} administrado</div>
                  <div style={{ fontSize: '11px', color: 'var(--ink4)' }}>{adm.remedio.pet.emoji} {adm.remedio.pet.nome} · {formatarDataHora(adm.administradoEm)}</div>
                  <div style={{ fontSize: '11px', color: 'var(--teal-800)', fontWeight: 600 }}>por {adm.membro.usuario.nome.split(' ')[0]}</div>
                </div>
              ))}
              {passeiosRecentes.slice(0, 2).map((pas) => (
                <div key={pas.id} style={{ position: 'relative', marginBottom: '14px' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--amber)', position: 'absolute', left: '-20px', top: '3px', border: '2px solid var(--card)' }} />
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ink)' }}>Passeio de {pas.duracaoMin} min{pas.local ? ` — ${pas.local}` : ''}</div>
                  <div style={{ fontSize: '11px', color: 'var(--ink4)' }}>{pas.pet.emoji} {pas.pet.nome} · {pas.realizadoEm ? formatarDataHora(pas.realizadoEm) : ''}</div>
                  <div style={{ fontSize: '11px', color: 'var(--teal-800)', fontWeight: 600 }}>por {pas.membro.usuario.nome.split(' ')[0]}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
