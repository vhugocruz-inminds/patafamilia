import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { PapelMembro } from '@prisma/client'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { acao, nomeFamilia, codigo } = body

    // Verificar autenticação
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const usuario = await prisma.usuario.findUnique({
      where: { id: user.id },
      include: { membro: true }
    })

    if (!usuario) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    if (usuario.membro) {
      return NextResponse.json({ error: 'Usuário já possui uma família' }, { status: 400 })
    }

    if (acao === 'criar') {
      if (!nomeFamilia) {
        return NextResponse.json({ error: 'Nome da família é obrigatório' }, { status: 400 })
      }

      const familia = await prisma.familia.create({
        data: {
          nome: nomeFamilia
        }
      })

      const membro = await prisma.membro.create({
        data: {
          usuarioId: user.id,
          familiaId: familia.id,
          papel: PapelMembro.ADMIN,
          entrado: new Date()
        }
      })

      return NextResponse.json({ success: true, membro, familia })
    }

    if (acao === 'entrar') {
      if (!codigo) {
        return NextResponse.json({ error: 'Código de convite é obrigatório' }, { status: 400 })
      }

      const convite = await prisma.convite.findUnique({
        where: { codigo },
        include: { familia: true }
      })

      if (!convite) {
        return NextResponse.json({ error: 'Convite não encontrado ou expirado' }, { status: 404 })
      }

      if (convite.expirado) {
        return NextResponse.json({ error: 'Convite expirado' }, { status: 400 })
      }

      const membro = await prisma.membro.create({
        data: {
          usuarioId: user.id,
          familiaId: convite.familiaId,
          papel: PapelMembro.MEMBRO,
          entrado: new Date()
        }
      })

      return NextResponse.json({ success: true, membro, familia: convite.familia })
    }

    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido'
    console.error('❌ POST /api/familia:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
