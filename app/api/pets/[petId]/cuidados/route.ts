import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ petId: string }> }
) {
  const { petId } = await params
  const { tipo, frequenciaDias, membroId } = await req.json()

  try {
    const proxima = new Date()
    proxima.setDate(proxima.getDate() + Number(frequenciaDias))

    const cuidado = await prisma.cuidado.create({
      data: { petId, tipo, frequenciaDias: Number(frequenciaDias), proximaExecucao: proxima },
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
