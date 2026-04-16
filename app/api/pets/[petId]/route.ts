import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ petId: string }> }
) {
  const { petId } = await params

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
    const body = await req.json()
    const { nome, emoji, especie, raca, sexo, dataNascimento, peso } = body

    const updated = await prisma.pet.update({
      where: { id: petId },
      data: {
        ...(nome !== undefined && { nome }),
        ...(emoji !== undefined && { emoji }),
        ...(especie !== undefined && { especie }),
        ...(raca !== undefined && { raca: raca || null }),
        ...(sexo !== undefined && { sexo: sexo || null }),
        ...(dataNascimento !== undefined && { dataNascimento: dataNascimento ? new Date(dataNascimento) : null }),
        ...(peso !== undefined && { peso: peso ? Number(peso) : null }),
      },
    })

    return NextResponse.json(updated)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
