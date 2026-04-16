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
  const amanha = new Date(agora.getTime() + 86_400_000)
  // Janela de deduplicação: não reenviar lembrete nas últimas 20h
  const deduJanela = new Date(agora.getTime() - 20 * 3_600_000)
  let count = 0

  // ── Lembretes de cuidados (nas próximas 24h) ────────────────────────────────
  const cuidados = await prisma.cuidado.findMany({
    where: { ativo: true, proximaExecucao: { gte: agora, lte: amanha } },
    include: { pet: { include: { familia: { include: { membros: true } } } } },
  })

  for (const cuidado of cuidados) {
    const titulo = 'Lembrete de cuidado'
    const msgBase = `**${cuidado.tipo}** de ${cuidado.pet.emoji} ${cuidado.pet.nome} é amanhã!`

    const jaNotificado = await prisma.notificacao.count({
      where: {
        familiaId: cuidado.pet.familiaId,
        tipo: 'LEMBRETE',
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
        tipo: 'LEMBRETE' as const,
        titulo,
        mensagem: msgBase,
        emoji: '📅',
      })),
    })
    count += membros.length
  }

  // ── Lembretes de remédios (próximos 24h) ────────────────────────────────────
  const remedios = await prisma.remedio.findMany({
    where: { ativo: true },
    include: {
      pet: { include: { familia: { include: { membros: true } } } },
      administracoes: { orderBy: { administradoEm: 'desc' }, take: 1 },
    },
  })

  for (const remedio of remedios) {
    const ultima = remedio.administracoes[0]?.administradoEm ?? null
    const doseInfo = parseDose(remedio.dose)
    let proximaData: Date | null = null

    if (doseInfo && doseInfo.horarios.length > 0 && remedio.frequencia === 'DIARIO') {
      // Para remédios diários com horários: próxima dose é o primeiro slot amanhã
      const amanhaCedo = new Date(agora)
      amanhaCedo.setDate(agora.getDate() + 1)
      amanhaCedo.setHours(0, 0, 0, 0)

      // Verifica se há algum slot amanhã que cai dentro das próximas 24h
      for (const h of doseInfo.horarios) {
        const [hh, mm] = h.split(':').map(Number)
        const slot = new Date(amanhaCedo)
        slot.setHours(hh, mm, 0, 0)
        if (slot <= amanha) {
          proximaData = slot
          break
        }
      }
    } else {
      // Para frequências sem horários definidos
      const intervalo = INTERVALOS_DIAS[remedio.frequencia] ?? 1
      proximaData = ultima
        ? new Date(ultima.getTime() + intervalo * 86_400_000)
        : remedio.dataInicio
    }

    if (!proximaData) continue
    // Só envia lembrete se a próxima dose cai nas próximas 24h (mas ainda não passou)
    if (proximaData < agora || proximaData > amanha) continue

    const titulo = 'Lembrete de remédio'
    const msgBase = `**${remedio.nome}** de ${remedio.pet.emoji} ${remedio.pet.nome} é amanhã!`

    const jaNotificado = await prisma.notificacao.count({
      where: {
        familiaId: remedio.pet.familiaId,
        tipo: 'LEMBRETE',
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
        tipo: 'LEMBRETE' as const,
        titulo,
        mensagem: msgBase,
        emoji: '💊',
      })),
    })
    count += membros.length
  }

  return NextResponse.json({ ok: true, lembretesCriados: count })
}
