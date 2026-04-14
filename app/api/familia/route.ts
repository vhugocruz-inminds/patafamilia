import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { PapelMembro } from '@prisma/client'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { acao, nomeFamilia, codigo } = body

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const usuario = await prisma.usuario.findUnique({
      where: { id: user.id },
      include: { membro: true },
    })

    if (!usuario) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    if (usuario.membro) {
      return NextResponse.json({ error: 'Usuário já possui uma família' }, { status: 400 })
    }

    // ── Criar família ──
    if (acao === 'criar') {
      if (!nomeFamilia) {
        return NextResponse.json({ error: 'Nome da família é obrigatório' }, { status: 400 })
      }

      const codigoConvite = 'FAM-' + Math.random().toString(36).substring(2, 8).toUpperCase()

      const familia = await prisma.familia.create({
        data: { nome: nomeFamilia, codigoConvite },
      })

      const membro = await prisma.membro.create({
        data: {
          usuarioId: user.id,
          familiaId: familia.id,
          papel: PapelMembro.ADMIN,
        },
      })

      return NextResponse.json({ success: true, membro, familia })
    }

    // ── Entrar em família via código de convite ──
    if (acao === 'entrar') {
      if (!codigo) {
        return NextResponse.json({ error: 'Código de convite é obrigatório' }, { status: 400 })
      }

      const familia = await prisma.familia.findUnique({
        where: { codigoConvite: codigo },
      })

      if (!familia) {
        return NextResponse.json({ error: 'Código de convite inválido' }, { status: 404 })
      }

      const membro = await prisma.membro.create({
        data: {
          usuarioId: user.id,
          familiaId: familia.id,
          papel: PapelMembro.MEMBRO,
        },
      })

      return NextResponse.json({ success: true, membro, familia })
    }

    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido'
    console.error('❌ POST /api/familia:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
