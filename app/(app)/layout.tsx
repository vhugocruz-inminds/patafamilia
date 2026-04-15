import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import SidebarClient from '@/components/layout/SidebarClient'
import { createClient } from '@/lib/supabase/server'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  await prisma.usuario.upsert({
    where: { id: user.id },
    update: {},
    create: {
      id: user.id,
      email: user.email!,
      nome: user.user_metadata?.nome ?? user.user_metadata?.full_name ?? user.email!.split('@')[0],
    },
  })

  const usuario = await prisma.usuario.findUnique({
    where: { id: user.id },
    include: {
      membro: {
        include: {
          familia: {
            include: {
              pets: {
                select: {
                  id: true,
                  nome: true,
                  emoji: true,
                  remedios: {
                    where: { ativo: true },
                    select: {
                      id: true,
                      frequencia: true,
                      dataInicio: true,
                      administracoes: {
                        orderBy: { administradoEm: 'desc' },
                        take: 1,
                        select: { administradoEm: true },
                      },
                    },
                  },
                  cuidados: {
                    where: { ativo: true },
                    select: { id: true, proximaExecucao: true },
                  },
                },
              },
            },
          },
        },
      },
    },
  })

  if (!usuario?.membro) redirect('/perfil')

  const agora = new Date()
  const intervalos: Record<string, number> = {
    DIARIO: 1,
    SEMANAL: 7,
    QUINZENAL: 15,
    MENSAL: 30,
    PERSONALIZADO: 1,
  }

  const pets = usuario.membro.familia.pets.map((pet) => {
    let alertas = 0

    for (const remedio of pet.remedios) {
      const ultima = remedio.administracoes[0]?.administradoEm ?? null
      const intervalo = intervalos[remedio.frequencia] ?? 1
      const proxima = ultima
        ? new Date(ultima.getTime() + intervalo * 86_400_000)
        : remedio.dataInicio

      if (proxima <= agora) alertas++
    }

    for (const cuidado of pet.cuidados) {
      if (cuidado.proximaExecucao && cuidado.proximaExecucao <= agora) alertas++
    }

    return { id: pet.id, nome: pet.nome, emoji: pet.emoji, alertas }
  })

  const naoLidas = await prisma.notificacao.count({
    where: { usuarioId: user.id, lida: false },
  })

  return (
    <SidebarClient
      usuario={{ id: usuario.id, nome: usuario.nome, papel: usuario.membro.papel }}
      familia={{ nome: usuario.membro.familia.nome }}
      pets={pets}
      naoLidas={naoLidas}
    >
      {children}
    </SidebarClient>
  )
}
