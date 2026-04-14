import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { nome, nomePet, especie, raca, sexo, dataNascimento, peso, emoji } = body

    const petNome = nome || nomePet
    if (!petNome || !especie) {
      return NextResponse.json({ error: 'Nome e espécie são obrigatórios' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const usuario = await prisma.usuario.findUnique({
      where: { id: user.id },
      include: { membro: true }
    })

    if (!usuario || !usuario.membro) {
      return NextResponse.json({ error: 'Usuário não possui uma família' }, { status: 400 })
    }

    const pet = await prisma.pet.create({
      data: {
        nome: petNome,
        especie,
        raca: raca || null,
        sexo: sexo || null,
        dataNascimento: dataNascimento ? new Date(dataNascimento) : null,
        peso: peso ? parseFloat(String(peso)) : null,
        emoji: emoji || '🐕',
        familiaId: usuario.membro.familiaId,
      }
    })

    return NextResponse.json(pet)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido'
    console.error('❌ POST /api/pet:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
