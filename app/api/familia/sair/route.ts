import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const membroAtual = await prisma.membro.findUnique({
      where: { usuarioId: user.id },
      include: {
        usuario: true,
        familia: {
          include: {
            membros: {
              include: { usuario: true },
              orderBy: { entradaEm: 'asc' },
            },
          },
        },
      },
    })

    if (!membroAtual) {
      return NextResponse.json({ error: 'Você não pertence a nenhuma família' }, { status: 400 })
    }

    const membros = membroAtual.familia.membros
    const outrosMembros = membros.filter((membro) => membro.usuarioId !== user.id)

    if (membroAtual.papel === 'ADMIN' && membros.length === 1) {
      await prisma.familia.delete({
        where: { id: membroAtual.familiaId },
      })

      return NextResponse.json({
        success: true,
        mode: 'familia_apagada',
        message: 'Sua família foi apagada porque você era o único membro.',
      })
    }

    let promotedMemberName: string | null = null

    await prisma.$transaction(async (tx) => {
      if (membroAtual.papel === 'ADMIN') {
        const existeOutroAdmin = outrosMembros.some((membro) => membro.papel === 'ADMIN')

        if (!existeOutroAdmin) {
          const membroPromovido = outrosMembros[0]

          if (!membroPromovido) {
            throw new Error('Não foi possível encontrar outro membro para promover.')
          }

          await tx.membro.update({
            where: { id: membroPromovido.id },
            data: { papel: 'ADMIN' },
          })

          await tx.notificacao.create({
            data: {
              usuarioId: membroPromovido.usuarioId,
              familiaId: membroAtual.familiaId,
              tipo: 'PROMOVIDO',
              titulo: 'Você agora é admin',
              mensagem: `**${membroAtual.usuario.nome}** saiu da **${membroAtual.familia.nome}** e você assumiu a administração da família.`,
              emoji: '👑',
            },
          })

          promotedMemberName = membroPromovido.usuario.nome
        }
      }

      await tx.membro.delete({
        where: { id: membroAtual.id },
      })
    })

    return NextResponse.json({
      success: true,
      mode: 'saiu_da_familia',
      promotedMemberName,
      message: promotedMemberName
        ? `${promotedMemberName} agora é admin da família.`
        : 'Você saiu da família com sucesso.',
    })
  } catch (error) {
    console.error('POST /api/familia/sair failed:', error)
    return NextResponse.json({ error: 'Erro ao sair da família' }, { status: 500 })
  }
}
