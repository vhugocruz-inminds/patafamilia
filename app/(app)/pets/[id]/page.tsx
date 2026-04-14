import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

function calcularIdade(dataNascimento: Date | null): string {
  if (!dataNascimento) return '—'
  const agora = new Date()
  const diff = agora.getTime() - dataNascimento.getTime()
  const anos = Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000))
  const meses = Math.floor((diff % (365.25 * 24 * 60 * 60 * 1000)) / (30.44 * 24 * 60 * 60 * 1000))
  if (anos > 0) return `${anos} ano${anos > 1 ? 's' : ''}${meses > 0 ? ` e ${meses} mes${meses > 1 ? 'es' : ''}` : ''}`
  return `${meses} mes${meses !== 1 ? 'es' : ''}`
}

function formatarData(d: Date | null): string {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('pt-BR')
}

export default async function PetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const usuario = await prisma.usuario.findUnique({
    where: { id: user.id },
    include: { membro: true },
  })
  if (!usuario?.membro) redirect('/onboarding')

  const pet = await prisma.pet.findUnique({
    where: { id },
    include: {
      remedios: {
        where: { ativo: true },
        include: { administracoes: { orderBy: { administradoEm: 'desc' }, take: 1 } },
      },
      cuidados: { where: { ativo: true } },
      passeios: { orderBy: { criadoEm: 'desc' }, take: 10 },
    },
  })

  if (!pet || pet.familiaId !== usuario.membro.familiaId) redirect('/dashboard')

  const label: React.CSSProperties = { fontSize: '11px', fontWeight: 700, color: 'var(--ink4)', letterSpacing: '.3px', marginBottom: '4px' }
  const value: React.CSSProperties = { fontSize: '14px', fontWeight: 600, color: 'var(--ink)' }
  const card: React.CSSProperties = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '20px' }

  return (
    <div style={{ padding: '24px', maxWidth: '720px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
        <Link href="/dashboard" style={{ color: 'var(--ink3)', textDecoration: 'none', fontSize: '20px' }}>←</Link>
        <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'var(--amber-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px' }}>
          {pet.emoji}
        </div>
        <div>
          <div style={{ fontFamily: 'var(--font-syne)', fontSize: '22px', fontWeight: 800, color: 'var(--ink)' }}>{pet.nome}</div>
          <div style={{ fontSize: '13px', color: 'var(--ink3)' }}>{pet.especie}{pet.raca ? ` · ${pet.raca}` : ''}</div>
        </div>
      </div>

      {/* Info Grid */}
      <div style={{ ...card, marginBottom: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '20px' }}>
          <div>
            <div style={label}>SEXO</div>
            <div style={value}>{pet.sexo || '—'}</div>
          </div>
          <div>
            <div style={label}>IDADE</div>
            <div style={value}>{calcularIdade(pet.dataNascimento)}</div>
          </div>
          <div>
            <div style={label}>NASCIMENTO</div>
            <div style={value}>{formatarData(pet.dataNascimento)}</div>
          </div>
          <div>
            <div style={label}>PESO</div>
            <div style={value}>{pet.peso ? `${pet.peso} kg` : '—'}</div>
          </div>
        </div>
      </div>

      {/* Remédios ativos */}
      <div style={{ ...card, marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div style={{ fontFamily: 'var(--font-syne)', fontSize: '15px', fontWeight: 700, color: 'var(--ink)' }}>
            💊 Medicamentos ativos
          </div>
        </div>
        {pet.remedios.length === 0 ? (
          <p style={{ fontSize: '13px', color: 'var(--ink4)', margin: 0 }}>Nenhum medicamento ativo.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {pet.remedios.map(r => {
              const ultima = r.administracoes[0]?.administradoEm
              return (
                <div key={r.id} style={{ padding: '12px', background: 'var(--surface)', borderRadius: 'var(--r)', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink)' }}>{r.nome}</div>
                  <div style={{ fontSize: '12px', color: 'var(--ink3)', marginTop: '2px' }}>
                    {r.dose} · {r.frequencia.toLowerCase()} · última: {ultima ? formatarData(ultima) : 'nunca'}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Cuidados ativos */}
      <div style={{ ...card, marginBottom: '16px' }}>
        <div style={{ fontFamily: 'var(--font-syne)', fontSize: '15px', fontWeight: 700, color: 'var(--ink)', marginBottom: '14px' }}>
          🩺 Cuidados ativos
        </div>
        {pet.cuidados.length === 0 ? (
          <p style={{ fontSize: '13px', color: 'var(--ink4)', margin: 0 }}>Nenhum cuidado cadastrado.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {pet.cuidados.map(c => (
              <div key={c.id} style={{ padding: '12px', background: 'var(--surface)', borderRadius: 'var(--r)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink)' }}>{c.tipo}</div>
                <div style={{ fontSize: '12px', color: 'var(--ink3)', marginTop: '2px' }}>
                  A cada {c.frequenciaDias} dias · próxima: {formatarData(c.proximaExecucao)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Últimos passeios */}
      <div style={card}>
        <div style={{ fontFamily: 'var(--font-syne)', fontSize: '15px', fontWeight: 700, color: 'var(--ink)', marginBottom: '14px' }}>
          🚶 Últimos passeios
        </div>
        {pet.passeios.length === 0 ? (
          <p style={{ fontSize: '13px', color: 'var(--ink4)', margin: 0 }}>Nenhum passeio registrado.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {pet.passeios.map(p => (
              <div key={p.id} style={{ padding: '12px', background: 'var(--surface)', borderRadius: 'var(--r)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink)' }}>
                  {p.tipo === 'AGENDADO' ? '📅 Agendado' : '✅ Realizado'}
                  {p.local ? ` — ${p.local}` : ''}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--ink3)', marginTop: '2px' }}>
                  {p.realizadoEm ? formatarData(p.realizadoEm) : p.agendadoEm ? formatarData(p.agendadoEm) : ''}
                  {p.duracaoMin ? ` · ${p.duracaoMin} min` : ''}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
