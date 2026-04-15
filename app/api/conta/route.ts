import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function DELETE() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const membro = await prisma.membro.findUnique({
      where: { usuarioId: user.id },
      select: { id: true },
    })

    if (membro) {
      return NextResponse.json(
        { error: 'Saia da família antes de apagar sua conta.' },
        { status: 409 }
      )
    }

    const adminClient = createAdminClient()
    const { error } = await adminClient.auth.admin.deleteUser(user.id)

    if (error) {
      console.error('Supabase deleteUser failed:', error)
      return NextResponse.json({ error: 'Erro ao apagar conta' }, { status: 500 })
    }

    try {
      await prisma.usuario.delete({
        where: { id: user.id },
      })
    } catch (cleanupError) {
      console.error('Prisma cleanup after deleteUser failed:', cleanupError)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/conta failed:', error)
    return NextResponse.json({ error: 'Erro ao apagar conta' }, { status: 500 })
  }
}
