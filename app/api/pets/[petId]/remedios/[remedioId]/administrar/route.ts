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
  } catch { /* legacy text */ }
  return null
}

/**
 * Calcula o status de timing de uma administração.
 * Valores possíveis: null (no prazo), "ADIANTADO", "ATRASADO", "EXTRA"
 */
function calcularStatusDose(
  frequencia: string,
  dose: string,
  administracoesAnteriores: { administradoEm: Date }[],
  dataInicio: Date,
  agora: Date
): string | null {
  const hojeInicio = new Date(agora)
  hojeInicio.setHours(0, 0, 0, 0)

  const doseInfo = parseDose(dose)
  if (doseInfo && doseInfo.horarios.length > 0 && frequencia === 'DIARIO') {
    const admHoje = administracoesAnteriores.filter(a => a.administradoEm >= hojeInicio).length

    // Doses além das prescritas para hoje
    if (admHoje >= doseInfo.quantidade) return 'EXTRA'

    // Slot alvo desta administração
    const targetSlot = doseInfo.horarios[admHoje]
    const [hh, mm] = targetSlot.split(':').map(Number)
    const slotTime = new Date(agora)
    slotTime.setHours(hh, mm, 0, 0)

    const diffMin = (agora.getTime() - slotTime.getTime()) / 60_000
    if (diffMin > 15) return 'ATRASADO'
    if (diffMin < -60) return 'ADIANTADO'
    return null
  }

  // Frequência por intervalo de dias
  const intervalo = INTERVALOS_DIAS[frequencia] ?? 1
  const ultima = administracoesAnteriores[0]?.administradoEm ?? null
  const esperado = ultima
    ? new Date(ultima.getTime() + intervalo * 86_400_000)
    : dataInicio

  const diffMs = agora.getTime() - esperado.getTime()
  if (diffMs > 0) return 'ATRASADO'
  if (diffMs < -(intervalo * 86_400_000 * 0.5)) return 'ADIANTADO'
  return null
}

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
        administracoes: {
          where: { administradoEm: { gte: new Date(Date.now() - 31 * 86_400_000) } },
          orderBy: { administradoEm: 'desc' },
        },
        pet: true,
      },
    })
    if (!remedio) return NextResponse.json({ error: 'Remédio não encontrado' }, { status: 404 })

    const agora = new Date()
    const statusDose = calcularStatusDose(
      remedio.frequencia,
      remedio.dose,
      remedio.administracoes,
      remedio.dataInicio,
      agora
    )

    const adm = await prisma.administracao.create({
      data: { remedioId, membroId, statusDose },
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
