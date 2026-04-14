import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

// PATCH /api/familia/membros/[id] — promover membro a admin
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: membroId } = await params
    const { papel } = await req.json()

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    // Verificar se quem faz a ação é ADMIN
    const admin = await prisma.membro.findUnique({ where: { usuarioId: user.id } })
    if (!admin || admin.papel !== 'ADMIN') {
      return NextResponse.json({ error: 'Apenas admins podem alterar papéis' }, { status: 403 })
    }

    const membro = await prisma.membro.findUnique({ where: { id: membroId } })
    if (!membro || membro.familiaId !== admin.familiaId) {
      return NextResponse.json({ error: 'Membro não encontrado' }, { status: 404 })
    }

    const updated = await prisma.membro.update({
      where: { id: membroId },
      data: { papel: papel || 'ADMIN' },
    })

    return NextResponse.json(updated)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido'
    console.error('❌ PATCH /api/familia/membros/[id]:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// DELETE /api/familia/membros/[id] — remover membro da família
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: membroId } = await params

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const admin = await prisma.membro.findUnique({ where: { usuarioId: user.id } })
    if (!admin || admin.papel !== 'ADMIN') {
      return NextResponse.json({ error: 'Apenas admins podem remover membros' }, { status: 403 })
    }

    const membro = await prisma.membro.findUnique({ where: { id: membroId } })
    if (!membro || membro.familiaId !== admin.familiaId) {
      return NextResponse.json({ error: 'Membro não encontrado' }, { status: 404 })
    }

    // Não permitir remover a si mesmo
    if (membro.usuarioId === user.id) {
      return NextResponse.json({ error: 'Você não pode remover a si mesmo' }, { status: 400 })
    }

    await prisma.membro.delete({ where: { id: membroId } })

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido'
    console.error('❌ DELETE /api/familia/membros/[id]:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
