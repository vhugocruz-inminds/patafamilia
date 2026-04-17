import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const INTERVALOS_DIAS: Record<string, number> = {
  DIARIO: 1, SEMANAL: 7, QUINZENAL: 15, MENSAL: 30, PERSONALIZADO: 1,
}

type DoseInfo = { quantidade: number; horarios: string[] }
function parseDose(dose: string): DoseInfo | null {
  try {
    const p = JSON.parse(dose)
    if (typeof p.quantidade === 'number' && Array.isArray(p.horarios)) return p
  } catch { /* */ }
  return null
}

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const agora = new Date()
  // Janela de deduplicação: não reenviar notificação ATRASADO para o mesmo item
  // se já foi enviada nas últimas 20 horas (evita spam no dia seguinte)
  const deduJanela = new Date(agora.getTime() - 20 * 3_600_000)
  let count = 0

  // ── Remédios atrasados ──────────────────────────────────────────────────────
  const remedios = await prisma.remedio.findMany({
    where: { ativo: true },
    include: {
      pet: { include: { familia: { include: { membros: true } } } },
      administracoes: { orderBy: { administradoEm: 'desc' }, take: 5 },
    },
  })

  for (const remedio of remedios) {
    const ultima = remedio.administracoes[0]?.administradoEm ?? null
    const doseInfo = parseDose(remedio.dose)
    let isAtrasado = false

    if (doseInfo && doseInfo.horarios.length > 0 && remedio.frequencia === 'DIARIO') {
      // Tracking intradiário: verifica se algum slot de hoje passou sem administração
      const hojeInicio = new Date(agora)
      hojeInicio.setHours(0, 0, 0, 0)

      const admHoje = remedio.administracoes.filter(
        a => a.administradoEm >= hojeInicio
      ).length

      const slotsPassados = doseInfo.horarios.filter(h => {
        const [hh, mm] = h.split(':').map(Number)
        const slot = new Date(agora)
        slot.setHours(hh, mm, 0, 0)
        // Buffer de 15 min após o slot para considerar atrasado
        return slot.getTime() + 15 * 60_000 < agora.getTime()
      }).length

      isAtrasado = admHoje < slotsPassados
    } else {
      // Tracking simples por intervalo de dias
      const intervalo = INTERVALOS_DIAS[remedio.frequencia] ?? 1
      const proxima = ultima
        ? new Date(ultima.getTime() + intervalo * 86_400_000)
        : remedio.dataInicio
      isAtrasado = proxima < agora
    }

    if (!isAtrasado) continue

    // Deduplicação: já existe notificação ATRASADO nas últimas 20h para este remédio?
    const titulo = 'Remédio atrasado'
    const msgBase = `O remédio **${remedio.nome}** de ${remedio.pet.emoji} ${remedio.pet.nome} está atrasado!`
    const jaNotificado = await prisma.notificacao.count({
      where: {
        familiaId: remedio.pet.familiaId,
        tipo: 'ATRASADO',
        titulo,
        mensagem: msgBase,
        criadaEm: { gte: deduJanela },
      },
    })
    if (jaNotificado > 0) continue

    const membros = remedio.pet.familia.membros
    await prisma.notificacao.createMany({
      data: membros.map(m => ({
        usuarioId: m.usuarioId,
        familiaId: remedio.pet.familiaId,
        tipo: 'ATRASADO' as const,
        titulo,
        mensagem: msgBase,
        emoji: '⚠️',
      })),
    })
    count += membros.length
  }

  // ── Cuidados atrasados ──────────────────────────────────────────────────────
  const cuidados = await prisma.cuidado.findMany({
    where: { ativo: true },
    include: {
      pet: { include: { familia: { include: { membros: true } } } },
      execucoes: { orderBy: { executadoEm: 'desc' }, take: 10 },
    },
  })

  for (const cuidado of cuidados) {
    let isAtrasado = false

    if (cuidado.configuracao) {
      try {
        const conf = JSON.parse(cuidado.configuracao) as { vezesPorDia: number; horarios: string[] }
        if (Array.isArray(conf.horarios) && conf.horarios.length > 0) {
          const hojeInicio = new Date(agora)
          hojeInicio.setHours(0, 0, 0, 0)
          const execHoje = cuidado.execucoes.filter(e => e.executadoEm >= hojeInicio).length
          const slotsPassados = conf.horarios.filter(h => {
            const [hh, mm] = h.split(':').map(Number)
            const slot = new Date(agora)
            slot.setHours(hh, mm, 0, 0)
            return slot.getTime() + 15 * 60_000 < agora.getTime()
          }).length
          isAtrasado = execHoje < slotsPassados
        }
      } catch { /* */ }
    } else {
      isAtrasado = cuidado.proximaExecucao !== null && cuidado.proximaExecucao < agora
    }

    if (!isAtrasado) continue

    const titulo = 'Cuidado atrasado'
    const msgBase = `**${cuidado.tipo}** de ${cuidado.pet.emoji} ${cuidado.pet.nome} está atrasado!`

    const jaNotificado = await prisma.notificacao.count({
      where: {
        familiaId: cuidado.pet.familiaId,
        tipo: 'ATRASADO',
        titulo,
        mensagem: msgBase,
        criadaEm: { gte: deduJanela },
      },
    })
    if (jaNotificado > 0) continue

    const membros = cuidado.pet.familia.membros
    await prisma.notificacao.createMany({
      data: membros.map(m => ({
        usuarioId: m.usuarioId,
        familiaId: cuidado.pet.familiaId,
        tipo: 'ATRASADO' as const,
        titulo,
        mensagem: msgBase,
        emoji: '🔔',
      })),
    })
    count += membros.length
  }

  return NextResponse.json({ ok: true, notificacoesCriadas: count })
}
