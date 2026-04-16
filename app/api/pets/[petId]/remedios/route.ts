import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest, { params }: { params: Promise<{ petId: string }> }) {
  const { petId } = await params
  try {
    const { nome, dose, frequencia, dataInicio, membroId } = await req.json()

    const FREQUENCIAS_VALIDAS = ['DIARIO', 'SEMANAL', 'QUINZENAL', 'MENSAL', 'PERSONALIZADO']
    if (!nome || !dose || !frequencia || !dataInicio) {
      return NextResponse.json({ error: 'Campos obrigatórios ausentes: nome, dose, frequencia, dataInicio' }, { status: 400 })
    }
    if (!FREQUENCIAS_VALIDAS.includes(frequencia)) {
      return NextResponse.json({ error: `Frequência inválida: "${frequencia}". Use: ${FREQUENCIAS_VALIDAS.join(', ')}` }, { status: 400 })
    }

    const dataInicioDate = new Date(dataInicio)
    if (isNaN(dataInicioDate.getTime())) {
      return NextResponse.json({ error: `Data de início inválida: "${dataInicio}"` }, { status: 400 })
    }

    const remedio = await prisma.remedio.create({
      data: { nome, dose, frequencia, dataInicio: dataInicioDate, ativo: true, petId },
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
    const msg = e instanceof Error ? e.message : 'Erro interno'
    console.error('POST /remedios:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
