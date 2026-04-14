import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import SidebarClient from '@/components/layout/SidebarClient'
import { sincronizarUsuario } from '@/app/actions/sync-user'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      console.log('❌ AppLayout: Sem user, redirecionando para /login')
      redirect('/login')
    }

    // Sincronizar usuário no banco (cria se não existir)
    await sincronizarUsuario()

    // Buscar dados do usuário + família + pets
    const usuario = await prisma.usuario.findUnique({
      where: { id: user.id },
      include: {
        membro: {
          include: {
            familia: {
              include: {
                pets: {
                  select: {
                    id: true, nome: true, emoji: true,
                    remedios: {
                      where: { ativo: true },
                      select: {
                        id: true, frequencia: true, dataInicio: true,
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

    if (!usuario) {
      console.log('❌ AppLayout: Usuário não encontrado no banco, redirecionando para /login')
      redirect('/login')
    }
    if (!usuario.membro) {
      console.log('⚠️ AppLayout: Usuário sem membro, redirecionando para /onboarding-alt')
      redirect('/onboarding-alt')
    }

    // Calcular badges de alerta por pet
    const pets = usuario.membro.familia.pets.map(pet => {
      let alertas = 0
      const agora = new Date()
      for (const remedio of pet.remedios) {
        const ultima = remedio.administracoes[0]?.administradoEm ?? null
        const intervalos: Record<string, number> = { DIARIO: 1, SEMANAL: 7, QUINZENAL: 15, MENSAL: 30, PERSONALIZADO: 1 }
        const intervalo = intervalos[remedio.frequencia] ?? 1
        let proxima: Date
        if (!ultima) { proxima = remedio.dataInicio }
        else { proxima = new Date(ultima.getTime() + intervalo * 86400000) }
        if (proxima <= agora) alertas++
      }
      for (const cuidado of pet.cuidados) {
        if (cuidado.proximaExecucao && cuidado.proximaExecucao <= agora) alertas++
      }
      return { id: pet.id, nome: pet.nome, emoji: pet.emoji, alertas }
    })

    // Contar notificações não lidas
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
  } catch (error) {
    console.error('❌ AppLayout Error:', error)
    redirect('/login')
  }
}
