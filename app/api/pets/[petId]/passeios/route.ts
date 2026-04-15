import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ petId: string }> }
) {
  const { petId } = await params
  const { tipo, duracaoMin, local, observacoes, realizadoEm, agendadoEm, membroId } = await req.json()

  try {
    const passeio = await prisma.passeio.create({
      data: {
        petId,
        membroId,
        tipo,
        duracaoMin: duracaoMin ?? null,
        local: local ?? null,
        observacoes: observacoes ?? null,
        realizadoEm: realizadoEm ? new Date(realizadoEm) : null,
        agendadoEm: agendadoEm ? new Date(agendadoEm) : null,
      },
      include: { membro: { include: { usuario: true } }, pet: true },
    })

    const pet = await prisma.pet.findUnique({
      where: { id: petId },
      include: { familia: { include: { membros: true } } },
    })
    if (pet) {
      const outros = pet.familia.membros.filter((m) => m.id !== membroId)
      if (outros.length > 0) {
        await prisma.notificacao.createMany({
          data: outros.map((m) => ({
            usuarioId: m.usuarioId,
            familiaId: pet.familiaId,
            tipo: tipo === 'REALIZADO' ? ('NOVO_REGISTRO' as const) : ('NOVO_CUIDADO' as const),
            titulo: tipo === 'REALIZADO' ? 'Passeio registrado' : 'Passeio agendado',
            mensagem:
              tipo === 'REALIZADO'
                ? `**${passeio.membro.usuario.nome}** registrou passeio${duracaoMin ? ` de ${duracaoMin} min` : ''}${local ? ` em ${local}` : ''} com ${pet.emoji} ${pet.nome}`
                : `**${passeio.membro.usuario.nome}** agendou passeio para ${pet.emoji} ${pet.nome}`,
            emoji: '🚶',
          })),
        })
      }
    }

    return NextResponse.json(passeio)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
