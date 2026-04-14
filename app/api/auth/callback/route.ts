import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // Upsert usuario no banco
      await prisma.usuario.upsert({
        where: { id: data.user.id },
        update: {
          email: data.user.email!,
          nome:
            data.user.user_metadata?.nome ||
            data.user.user_metadata?.full_name ||
            data.user.email!.split('@')[0],
        },
        create: {
          id: data.user.id,
          email: data.user.email!,
          nome:
            data.user.user_metadata?.nome ||
            data.user.user_metadata?.full_name ||
            data.user.email!.split('@')[0],
        },
      })

      // Verificar se tem família
      const membro = await prisma.membro.findUnique({ where: { usuarioId: data.user.id } })
      if (!membro) {
        return NextResponse.redirect(`${origin}/onboarding`)
      }
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`)
}
