import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { nome } = await req.json()
    const nomeNormalizado = typeof nome === 'string' ? nome.trim() : ''

    if (nomeNormalizado.length < 2) {
      return NextResponse.json({ error: 'Informe um nome válido' }, { status: 400 })
    }

    if (nomeNormalizado.length > 80) {
      return NextResponse.json({ error: 'O nome deve ter no máximo 80 caracteres' }, { status: 400 })
    }

    const usuario = await prisma.usuario.update({
      where: { id: user.id },
      data: { nome: nomeNormalizado },
      select: { id: true, nome: true, email: true },
    })

    return NextResponse.json(usuario)
  } catch (error) {
    console.error('PATCH /api/perfil failed:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
