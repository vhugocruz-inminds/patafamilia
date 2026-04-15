import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const agora = new Date()
  const intervalos: Record<string, number> = { DIARIO: 1, SEMANAL: 7, QUINZENAL: 15, MENSAL: 30, PERSONALIZADO: 1 }
  let count = 0

  // Remédios atrasados
  const remedios = await prisma.remedio.findMany({
    where: { ativo: true },
    include: {
      pet: { include: { familia: { include: { membros: true } } } },
      administracoes: { orderBy: { administradoEm: 'desc' }, take: 1 },
    },
  })

  for (const remedio of remedios) {
    const ultima = remedio.administracoes[0]?.administradoEm
    const intervalo = intervalos[remedio.frequencia] ?? 1
    const proxima = ultima
      ? new Date(ultima.getTime() + intervalo * 86_400_000)
      : remedio.dataInicio

    if (proxima < agora) {
      const membros = remedio.pet.familia.membros
      await prisma.notificacao.createMany({
        data: membros.map((m) => ({
          usuarioId: m.usuarioId,
          familiaId: remedio.pet.familiaId,
          tipo: 'ATRASADO' as const,
          titulo: 'Remédio atrasado',
          mensagem: `O remédio **${remedio.nome}** de ${remedio.pet.emoji} ${remedio.pet.nome} está atrasado!`,
          emoji: '⚠️',
        })),
      })
      count += membros.length
    }
  }

  // Cuidados atrasados
  const cuidados = await prisma.cuidado.findMany({
    where: { ativo: true, proximaExecucao: { lte: agora } },
    include: { pet: { include: { familia: { include: { membros: true } } } } },
  })

  for (const cuidado of cuidados) {
    const membros = cuidado.pet.familia.membros
    await prisma.notificacao.createMany({
      data: membros.map((m) => ({
        usuarioId: m.usuarioId,
        familiaId: cuidado.pet.familiaId,
        tipo: 'ATRASADO' as const,
        titulo: 'Cuidado atrasado',
        mensagem: `**${cuidado.tipo}** de ${cuidado.pet.emoji} ${cuidado.pet.nome} está atrasado!`,
        emoji: '🔔',
      })),
    })
    count += membros.length
  }

  return NextResponse.json({ ok: true, notificacoesCriadas: count })
}
