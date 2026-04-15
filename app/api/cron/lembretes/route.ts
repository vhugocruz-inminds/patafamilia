import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const agora = new Date()
  const amanha = new Date(agora.getTime() + 86_400_000)
  let count = 0

  const cuidados = await prisma.cuidado.findMany({
    where: { ativo: true, proximaExecucao: { gte: agora, lte: amanha } },
    include: { pet: { include: { familia: { include: { membros: true } } } } },
  })

  for (const cuidado of cuidados) {
    const membros = cuidado.pet.familia.membros
    await prisma.notificacao.createMany({
      data: membros.map((m) => ({
        usuarioId: m.usuarioId,
        familiaId: cuidado.pet.familiaId,
        tipo: 'LEMBRETE' as const,
        titulo: 'Lembrete de cuidado',
        mensagem: `**${cuidado.tipo}** de ${cuidado.pet.emoji} ${cuidado.pet.nome} é amanhã!`,
        emoji: '📅',
      })),
    })
    count += membros.length
  }

  return NextResponse.json({ ok: true, lembretesCriados: count })
}
