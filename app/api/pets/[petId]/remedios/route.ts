import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest, { params }: { params: Promise<{ petId: string }> }) {
  const { petId } = await params
  try {
    const { nome, dose, frequencia, dataInicio, membroId } = await req.json()
    const remedio = await prisma.remedio.create({
      data: { nome, dose, frequencia, dataInicio: new Date(dataInicio), petId },
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
            usuarioId: m.usuarioId, familiaId: pet.familiaId, tipo: 'NOVO_CUIDADO' as const,
            titulo: 'Novo remedio cadastrado',
            mensagem: `**${membro?.usuario.nome ?? 'Alguém'}** adicionou o remédio **${nome}** para ${pet.emoji} ${pet.nome}`,
            emoji: '💊',
          })),
        })
      }
    }
    return NextResponse.json(remedio)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
