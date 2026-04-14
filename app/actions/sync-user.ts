'use server'

import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

export async function sincronizarUsuario() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    // Verificar se usuário já existe
    let usuario = await prisma.usuario.findUnique({
      where: { id: user.id },
    })

    // Se não existe, criar
    if (!usuario) {
      console.log(`📝 Criando usuário no banco: ${user.email}`)
      usuario = await prisma.usuario.create({
        data: {
          id: user.id,
          email: user.email || '',
          nome: user.user_metadata?.name || user.email?.split('@')[0] || 'Usuário',
          avatarUrl: user.user_metadata?.avatar_url,
        },
      })
    }

    return usuario
  } catch (error) {
    console.error('❌ Erro ao sincronizar usuário:', error)
    throw error
  }
}
