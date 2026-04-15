import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isDuplicateAdministracao } from '@/lib/utils'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ petId: string; remedioId: string }> }
) {
  const { petId, remedioId } = await params
  const { membroId } = await req.json()

  try {
    const remedio = await prisma.remedio.findUnique({
      where: { id: remedioId },
      include: {
        administracoes: { orderBy: { administradoEm: 'desc' }, take: 1 },
        pet: true,
      },
    })
    if (!remedio) return NextResponse.json({ error: 'Remédio não encontrado' }, { status: 404 })

    // Verificar duplicata (< 50% do intervalo prescrito)
    const ultima = remedio.administracoes[0]
    if (ultima && isDuplicateAdministracao(remedio.frequencia, ultima.administradoEm)) {
      return NextResponse.json(
        { error: 'Este remédio já foi administrado recentemente. Verifique o histórico antes de repetir.' },
        { status: 409 }
      )
    }

    const adm = await prisma.administracao.create({
      data: { remedioId, membroId },
      include: { membro: { include: { usuario: true } } },
    })

    // Notificar outros membros da família
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
            tipo: 'NOVO_REGISTRO' as const,
            titulo: 'Remédio administrado',
            mensagem: `**${adm.membro.usuario.nome}** registrou **${remedio.nome}** para ${pet.emoji} ${pet.nome}`,
            emoji: '💊',
          })),
        })
      }
    }

    return NextResponse.json(adm)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
