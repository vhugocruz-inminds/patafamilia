import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

// GET /api/notificacoes — lista notificações do usuário
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const notificacoes = await prisma.notificacao.findMany({
      where: { usuarioId: user.id },
      orderBy: { criadaEm: 'desc' },
      take: 50,
    })

    return NextResponse.json(notificacoes)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido'
    console.error('❌ GET /api/notificacoes:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// PATCH /api/notificacoes — marca todas as notificações como lidas
export async function PATCH() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    await prisma.notificacao.updateMany({
      where: { usuarioId: user.id, lida: false },
      data: { lida: true },
    })

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido'
    console.error('❌ PATCH /api/notificacoes:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
