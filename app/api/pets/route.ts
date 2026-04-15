import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })

    const body = await req.json()
    const { nome, especie, raca, sexo, dataNascimento, peso, emoji } = body

    const membro = await prisma.membro.findUnique({ where: { usuarioId: user.id } })
    if (!membro) return NextResponse.json({ error: 'Usuario sem familia' }, { status: 400 })

    const pet = await prisma.pet.create({
      data: {
        nome, especie,
        raca: raca || null,
        sexo: sexo || null,
        dataNascimento: dataNascimento ? new Date(dataNascimento) : null,
        peso: peso ? parseFloat(String(peso)) : null,
        emoji: emoji || '🐾',
        familiaId: membro.familiaId,
      },
    })
    return NextResponse.json(pet)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
