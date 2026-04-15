import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { gerarCodigoConvite } from '@/lib/utils'
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

    const body = await req.json()
    const { acao } = body
    const usuarioId = user.id

    if (acao === 'criar') {
      const { nomeFamilia } = body
      const existente = await prisma.membro.findUnique({ where: { usuarioId } })
      if (existente) return NextResponse.json({ error: 'Usuário já pertence a uma família' }, { status: 400 })
      const familia = await prisma.familia.create({
        data: { nome: nomeFamilia, codigoConvite: gerarCodigoConvite(), membros: { create: { usuarioId, papel: 'ADMIN' } } },
      })
      return NextResponse.json(familia)
    }

    if (acao === 'entrar') {
      const { codigo } = body
      const existente = await prisma.membro.findUnique({ where: { usuarioId } })
      if (existente) return NextResponse.json({ error: 'Usuário já pertence a uma família' }, { status: 400 })
      const familia = await prisma.familia.findUnique({ where: { codigoConvite: codigo } })
      if (!familia) return NextResponse.json({ error: 'Código inválido' }, { status: 404 })
      const usuario = await prisma.usuario.findUnique({ where: { id: usuarioId } })
      const membro = await prisma.membro.create({ data: { usuarioId, familiaId: familia.id, papel: 'MEMBRO' } })
      const outros = await prisma.membro.findMany({ where: { familiaId: familia.id, usuarioId: { not: usuarioId } } })
      if (outros.length > 0) {
        await prisma.notificacao.createMany({
          data: outros.map(m => ({ usuarioId: m.usuarioId, familiaId: familia.id, tipo: 'NOVO_MEMBRO' as const, titulo: 'Novo membro', mensagem: `**${usuario?.nome ?? 'Alguém'}** entrou na **${familia.nome}**`, emoji: '🎉' })),
        })
      }
      return NextResponse.json(membro)
    }

    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
