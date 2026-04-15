import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const sucessorMembroId =
      typeof body?.sucessorMembroId === 'string' ? body.sucessorMembroId : null

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

    let sucessorEscolhido = null

    if (membroAtual.papel === 'ADMIN' && outrosMembros.length > 0) {
      if (!sucessorMembroId) {
        return NextResponse.json(
          { error: 'Escolha quem será o próximo admin antes de sair.' },
          { status: 400 }
        )
      }

      sucessorEscolhido = outrosMembros.find((membro) => membro.id === sucessorMembroId) ?? null

      if (!sucessorEscolhido) {
        return NextResponse.json(
          { error: 'O membro escolhido não pertence à sua família.' },
          { status: 400 }
        )
      }
    }

    let promotedMemberName: string | null = null

    await prisma.$transaction(async (tx) => {
      if (membroAtual.papel === 'ADMIN' && sucessorEscolhido) {
        if (sucessorEscolhido.papel !== 'ADMIN') {
          await tx.membro.update({
            where: { id: sucessorEscolhido.id },
            data: { papel: 'ADMIN' },
          })
        }

        await tx.notificacao.create({
          data: {
            usuarioId: sucessorEscolhido.usuarioId,
            familiaId: membroAtual.familiaId,
            tipo: 'PROMOVIDO',
            titulo: 'Você agora é admin',
            mensagem: `**${membroAtual.usuario.nome}** saiu da **${membroAtual.familia.nome}** e você assumiu a administração da família.`,
            emoji: '👑',
          },
        })

        promotedMemberName = sucessorEscolhido.usuario.nome
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
