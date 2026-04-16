import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

// DELETE — desativar remédio (soft delete)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ petId: string; remedioId: string }> }
) {
  const { petId, remedioId } = await params

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
    await prisma.remedio.update({
      where: { id: remedioId },
      data: { ativo: false },
    })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// PATCH — editar remédio
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ petId: string; remedioId: string }> }
) {
  const { petId, remedioId } = await params

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
    const { nome, dose, frequencia, dataInicio, dataFim } = await req.json()
    const updated = await prisma.remedio.update({
      where: { id: remedioId },
      data: {
        ...(nome !== undefined && { nome }),
        ...(dose !== undefined && { dose }),
        ...(frequencia !== undefined && { frequencia }),
        ...(dataInicio !== undefined && { dataInicio: new Date(dataInicio) }),
        ...(dataFim !== undefined && { dataFim: dataFim ? new Date(dataFim) : null }),
      },
    })
    return NextResponse.json(updated)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
