import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function calcularProximaIntraday(horarios: string[]): Date {
  const agora = new Date()
  for (const h of horarios) {
    const [hh, mm] = h.split(':').map(Number)
    const slot = new Date(agora)
    slot.setHours(hh, mm, 0, 0)
    if (slot > agora) return slot
  }
  // Todos os slots de hoje passaram — primeiro slot amanhã
  const amanha = new Date(agora)
  amanha.setDate(amanha.getDate() + 1)
  const [hh, mm] = horarios[0].split(':').map(Number)
  amanha.setHours(hh, mm, 0, 0)
  return amanha
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ petId: string }> }
) {
  const { petId } = await params
  const { tipo, frequenciaDias, configuracao, membroId } = await req.json()

  try {
    let proxima: Date
    if (configuracao) {
      try {
        const conf = JSON.parse(configuracao)
        if (Array.isArray(conf.horarios) && conf.horarios.length > 0) {
          proxima = calcularProximaIntraday(conf.horarios)
        } else {
          proxima = new Date()
          proxima.setDate(proxima.getDate() + Number(frequenciaDias))
        }
      } catch {
        proxima = new Date()
        proxima.setDate(proxima.getDate() + Number(frequenciaDias))
      }
    } else {
      proxima = new Date()
      proxima.setDate(proxima.getDate() + Number(frequenciaDias))
    }

    const cuidado = await prisma.cuidado.create({
      data: {
        petId,
        tipo,
        frequenciaDias: Number(frequenciaDias),
        configuracao: configuracao ?? null,
        proximaExecucao: proxima,
      },
    })

    const pet = await prisma.pet.findUnique({
      where: { id: petId },
      include: { familia: { include: { membros: true } } },
    })
    if (pet && membroId) {
      const membro = await prisma.membro.findUnique({ where: { id: membroId }, include: { usuario: true } })
      const outros = pet.familia.membros.filter((m) => m.id !== membroId)
      if (outros.length > 0) {
        await prisma.notificacao.createMany({
          data: outros.map((m) => ({
            usuarioId: m.usuarioId,
            familiaId: pet.familiaId,
            tipo: 'NOVO_CUIDADO' as const,
            titulo: 'Novo cuidado cadastrado',
            mensagem: `**${membro?.usuario.nome ?? 'Alguém'}** adicionou **${tipo}** para ${pet.emoji} ${pet.nome}`,
            emoji: '🛁',
          })),
        })
      }
    }

    return NextResponse.json(cuidado)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
