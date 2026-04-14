import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

// PATCH /api/notificacoes/[id] — marca uma notificação como lida
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const notificacao = await prisma.notificacao.findUnique({ where: { id } })
    if (!notificacao || notificacao.usuarioId !== user.id) {
      return NextResponse.json({ error: 'Notificação não encontrada' }, { status: 404 })
    }

    const updated = await prisma.notificacao.update({
      where: { id },
      data: { lida: true },
    })

    return NextResponse.json(updated)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido'
    console.error('❌ PATCH /api/notificacoes/[id]:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
