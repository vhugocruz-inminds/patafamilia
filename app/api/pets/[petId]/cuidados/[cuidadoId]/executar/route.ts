import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function calcularProximaAposExecucao(cuidado: { frequenciaDias: number; configuracao: string | null }): Date {
  const agora = new Date()
  if (cuidado.configuracao) {
    try {
      const conf = JSON.parse(cuidado.configuracao) as { vezesPorDia: number; horarios: string[] }
      if (Array.isArray(conf.horarios) && conf.horarios.length > 0) {
        // Próximo slot após agora
        for (const h of conf.horarios) {
          const [hh, mm] = h.split(':').map(Number)
          const slot = new Date(agora)
          slot.setHours(hh, mm, 0, 0)
          if (slot > agora) return slot
        }
        // Todos os slots de hoje passaram — primeiro slot amanhã
        const amanha = new Date(agora)
        amanha.setDate(amanha.getDate() + 1)
        const [hh, mm] = conf.horarios[0].split(':').map(Number)
        amanha.setHours(hh, mm, 0, 0)
        return amanha
      }
    } catch { /* */ }
  }
  return new Date(agora.getTime() + cuidado.frequenciaDias * 86_400_000)
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ petId: string; cuidadoId: string }> }
) {
  const { petId, cuidadoId } = await params
  const { membroId } = await req.json()

  try {
    const cuidado = await prisma.cuidado.findUnique({ where: { id: cuidadoId } })
    if (!cuidado) return NextResponse.json({ error: 'Cuidado não encontrado' }, { status: 404 })

    const agora = new Date()
    const proxima = calcularProximaAposExecucao(cuidado)

    const [execucao] = await prisma.$transaction([
      prisma.execucao.create({
        data: { cuidadoId, membroId },
        include: { membro: { include: { usuario: true } } },
      }),
      prisma.cuidado.update({
        where: { id: cuidadoId },
        data: { ultimaExecucao: agora, proximaExecucao: proxima },
      }),
    ])

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
            titulo: 'Cuidado realizado',
            mensagem: `**${execucao.membro.usuario.nome}** realizou **${cuidado.tipo}** em ${pet.emoji} ${pet.nome}`,
            emoji: '✅',
          })),
        })
      }
    }

    return NextResponse.json(execucao)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
