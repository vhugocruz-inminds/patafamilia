import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  
  // Rotas públicas (acessíveis sem autenticação)
  const authRoutes = ['/login', '/cadastro', '/reset-senha']
  const isPublicRoute = authRoutes.some((r) => pathname.startsWith(r)) ||
                       pathname.startsWith('/api') ||
                       pathname.startsWith('/convite') ||
                       pathname === '/'

  // Se não está logado E tenta acessar rota protegida → login
  if (!user && !isPublicRoute) {
    console.log('❌ Sem autenticação, redirecionando para /login')
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Se está logado E tenta acessar rota de auth → dashboard
  if (user && (pathname.startsWith('/login') || pathname.startsWith('/cadastro') || pathname === '/')) {
    console.log('✓ Autenticado, redirecionando para /dashboard')
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

