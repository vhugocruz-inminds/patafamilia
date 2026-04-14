import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/familia/convite?codigo=XXX — busca info da família pelo código de convite
export async function GET(req: NextRequest) {
  try {
    const codigo = req.nextUrl.searchParams.get('codigo')
    if (!codigo) {
      return NextResponse.json({ error: 'Código não informado' }, { status: 400 })
    }

    const familia = await prisma.familia.findUnique({
      where: { codigoConvite: codigo },
      select: { id: true, nome: true, codigoConvite: true, _count: { select: { membros: true, pets: true } } },
    })

    if (!familia) {
      return NextResponse.json({ error: 'Convite inválido' }, { status: 404 })
    }

    return NextResponse.json({
      familia: {
        id: familia.id,
        nome: familia.nome,
        codigoConvite: familia.codigoConvite,
        totalMembros: familia._count.membros,
        totalPets: familia._count.pets,
      },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido'
    console.error('❌ GET /api/familia/convite:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// POST /api/familia/convite — envia convite por e-mail (cria notificação)
export async function POST(req: NextRequest) {
  try {
    const { email, familiaId } = await req.json()
    if (!email || !familiaId) {
      return NextResponse.json({ error: 'Email e familiaId são obrigatórios' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    // Verificar se quem envia é admin da família
    const remetente = await prisma.membro.findUnique({
      where: { usuarioId: user.id },
      include: { familia: true },
    })

    if (!remetente || remetente.familiaId !== familiaId) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    // Verificar se o convidado já tem conta
    const convidado = await prisma.usuario.findUnique({
      where: { email },
      include: { membro: true },
    })

    if (convidado?.membro) {
      if (convidado.membro.familiaId === familiaId) {
        return NextResponse.json({ error: 'Este usuário já faz parte da família' }, { status: 400 })
      }
      // Usuário existe mas está em outra família — criar notificação de convite
      await prisma.notificacao.create({
        data: {
          tipo: 'NOVO_MEMBRO',
          titulo: 'Convite para família',
          mensagem: `Você foi convidado para a família ${remetente.familia.nome}. Use o código: ${remetente.familia.codigoConvite}`,
          emoji: '👨‍👩‍👧‍👦',
          usuarioId: convidado.id,
          familiaId,
        },
      })
      return NextResponse.json({ success: true, message: 'Notificação enviada ao usuário' })
    }

    // Usuário não tem conta — por enquanto retorna o link de convite
    return NextResponse.json({
      success: true,
      message: 'Convite disponível via link',
      link: `/convite/${remetente.familia.codigoConvite}`,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido'
    console.error('❌ POST /api/familia/convite:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
