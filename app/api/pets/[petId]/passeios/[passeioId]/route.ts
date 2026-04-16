import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

// PATCH — marcar passeio agendado como realizado
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ petId: string; passeioId: string }> }
) {
  const { petId, passeioId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const usuario = await prisma.usuario.findUnique({
    where: { id: user.id },
    include: { membro: true },
  })
  if (!usuario?.membro) return NextResponse.json({ error: 'Sem família' }, { status: 403 })

  const pet = await prisma.pet.findUnique({ where: { id: petId } })
  if (!pet || pet.familiaId !== usuario.membro.familiaId) {
    return NextResponse.json({ error: 'Pet não encontrado' }, { status: 404 })
  }

  try {
    const { duracaoMin, local, observacoes, realizadoEm } = await req.json()

    const updated = await prisma.passeio.update({
      where: { id: passeioId },
      data: {
        tipo: 'REALIZADO',
        realizadoEm: realizadoEm ? new Date(realizadoEm) : new Date(),
        ...(duracaoMin !== undefined && { duracaoMin: duracaoMin ?? null }),
        ...(local !== undefined && { local: local || null }),
        ...(observacoes !== undefined && { observacoes: observacoes || null }),
      },
      include: { membro: { include: { usuario: true } }, pet: true },
    })

    // Notificar outros membros
    const petComFamilia = await prisma.pet.findUnique({
      where: { id: petId },
      include: { familia: { include: { membros: true } } },
    })
    if (petComFamilia) {
      const membroId = usuario.membro.id
      const outros = petComFamilia.familia.membros.filter((m) => m.id !== membroId)
      if (outros.length > 0) {
        await prisma.notificacao.createMany({
          data: outros.map((m) => ({
            usuarioId: m.usuarioId,
            familiaId: petComFamilia.familiaId,
            tipo: 'NOVO_REGISTRO' as const,
            titulo: 'Passeio realizado',
            mensagem: `**${usuario.nome}** registrou passeio${duracaoMin ? ` de ${duracaoMin} min` : ''}${local ? ` em ${local}` : ''} com ${petComFamilia.emoji} ${petComFamilia.nome}`,
            emoji: '🚶',
          })),
        })
      }
    }

    return NextResponse.json(updated)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// DELETE — remover passeio
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ petId: string; passeioId: string }> }
) {
  const { petId, passeioId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const usuario = await prisma.usuario.findUnique({
    where: { id: user.id },
    include: { membro: true },
  })
  if (!usuario?.membro) return NextResponse.json({ error: 'Sem família' }, { status: 403 })

  const pet = await prisma.pet.findUnique({ where: { id: petId } })
  if (!pet || pet.familiaId !== usuario.membro.familiaId) {
    return NextResponse.json({ error: 'Pet não encontrado' }, { status: 404 })
  }

  try {
    await prisma.passeio.delete({ where: { id: passeioId } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
