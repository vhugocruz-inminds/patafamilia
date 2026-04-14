'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getInitials } from '@/lib/utils'
import { PapelMembro } from '@prisma/client'

interface Props {
  usuario: { id: string; nome: string; papel: PapelMembro }
  familia: { nome: string }
  pets: { id: string; nome: string; emoji: string; alertas: number }[]
  naoLidas: number
  children: React.ReactNode
}

const AVATAR_COLORS: [string, string][] = [
  ['#3C3489', '#CECBF6'],
  ['#085041', '#9FE1CB'],
  ['#4A1B0C', '#F0A58B'],
  ['#26215C', '#C5C2F5'],
  ['#4B1528', '#EDA8C0'],
]

function getAvatarColor(nome: string): [string, string] {
  const idx = nome.charCodeAt(0) % AVATAR_COLORS.length
  return AVATAR_COLORS[idx]
}

export default function SidebarClient({ usuario, familia, pets, naoLidas, children }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [badgeNaoLidas, setBadgeNaoLidas] = useState(naoLidas)
  const [avatarBg, avatarColor] = getAvatarColor(usuario.nome)

  // Realtime: ouvir novas notificações
  useEffect(() => {
    const channel = supabase
      .channel('notificacoes-sidebar')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notificacoes',
        filter: `usuario_id=eq.${usuario.id}`,
      }, () => {
        setBadgeNaoLidas(prev => prev + 1)
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'notificacoes',
        filter: `usuario_id=eq.${usuario.id}`,
      }, () => {
        setBadgeNaoLidas(prev => Math.max(0, prev - 1))
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [usuario.id, supabase])

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  const sb: React.CSSProperties = {
    width: '232px',
    background: '#18181B',
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
    height: '100vh',
    position: 'sticky',
    top: 0,
    overflowY: 'auto',
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Sidebar */}
      <aside style={sb}>
        {/* Logo */}
        <div style={{ padding: '22px 20px 16px', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
          <div style={{ width: '32px', height: '32px', background: '#EF9F27', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>🐾</div>
          <div>
            <div style={{ fontFamily: 'var(--font-syne)', fontSize: '17px', fontWeight: 800, color: '#fff' }}>PataFamília</div>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,.35)', fontWeight: 500 }}>{familia.nome}</div>
          </div>
        </div>

        {/* Geral */}
        <div style={{ padding: '20px 12px 8px' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,.28)', letterSpacing: '1.2px', padding: '0 8px', marginBottom: '6px' }}>GERAL</div>
          <SbItem href="/dashboard" icon="⊞" label="Início" active={isActive('/dashboard')} />
          <SbItem href="/notificacoes" icon="🔔" label="Notificações" active={isActive('/notificacoes')} badge={badgeNaoLidas} />
        </div>

        {/* Pets */}
        <div style={{ padding: '0 12px 8px' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,.28)', letterSpacing: '1.2px', padding: '0 8px', marginBottom: '6px' }}>NOSSOS PETS</div>
          {pets.map((pet, i) => {
            const dotColors = ['#EF9F27', '#1D9E75', '#7F77DD', '#D4537E', '#D85A30']
            return (
              <Link
                key={pet.id}
                href={`/pets/${pet.id}`}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', borderRadius: '8px',
                  textDecoration: 'none',
                  background: isActive(`/pets/${pet.id}`) ? 'rgba(239,159,39,.14)' : 'transparent',
                  color: isActive(`/pets/${pet.id}`) ? '#EF9F27' : 'rgba(255,255,255,.5)',
                  fontSize: '13px', fontWeight: 500, marginBottom: '2px', transition: 'all .15s',
                }}
              >
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: dotColors[i % dotColors.length], flexShrink: 0 }} />
                <span style={{ fontSize: '14px' }}>{pet.emoji}</span>
                <span style={{ flex: 1 }}>{pet.nome}</span>
                {pet.alertas > 0 && (
                  <span style={{ background: '#D85A30', color: '#fff', fontSize: '10px', fontWeight: 700, borderRadius: '20px', padding: '2px 7px' }}>{pet.alertas}</span>
                )}
              </Link>
            )
          })}
          <Link href="/pets/novo" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', borderRadius: '8px', textDecoration: 'none', color: 'rgba(255,255,255,.25)', fontSize: '12px', fontWeight: 500 }}>
            <span style={{ fontSize: '15px', width: '20px', textAlign: 'center' }}>＋</span>
            Adicionar pet
          </Link>
        </div>

        {/* Família */}
        <div style={{ padding: '0 12px 8px' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,.28)', letterSpacing: '1.2px', padding: '0 8px', marginBottom: '6px' }}>FAMÍLIA</div>
          <SbItem href="/familia" icon="👥" label="Membros" active={isActive('/familia')} />
        </div>

        {/* Footer */}
        <div style={{ marginTop: 'auto', padding: '14px 12px', borderTop: '1px solid rgba(255,255,255,.06)' }}>
          <button
            onClick={handleSignOut}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', borderRadius: '8px', background: 'transparent', border: 'none', cursor: 'pointer' }}
          >
            <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: avatarBg, color: avatarColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '11px', flexShrink: 0 }}>
              {getInitials(usuario.nome)}
            </div>
            <div style={{ textAlign: 'left', flex: 1 }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>{usuario.nome}</div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,.35)' }}>{usuario.papel === 'ADMIN' ? 'Admin' : 'Membro'}</div>
            </div>
            <span style={{ color: 'rgba(255,255,255,.25)', fontSize: '14px' }}>↗</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', minWidth: 0 }}>
        {children}
      </main>
    </div>
  )
}

function SbItem({
  href,
  icon,
  label,
  active,
  badge,
}: {
  href: string
  icon: string
  label: string
  active: boolean
  badge?: number
}) {
  return (
    <Link
      href={href}
      style={{
        display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', borderRadius: '8px',
        color: active ? '#EF9F27' : 'rgba(255,255,255,.5)', textDecoration: 'none',
        background: active ? 'rgba(239,159,39,.14)' : 'transparent',
        borderLeft: `2px solid ${active ? '#EF9F27' : 'transparent'}`,
        fontSize: '13px', fontWeight: 500, marginBottom: '2px', transition: 'all .15s',
      }}
    >
      <span style={{ fontSize: '15px', width: '20px', textAlign: 'center', flexShrink: 0 }}>{icon}</span>
      <span style={{ flex: 1 }}>{label}</span>
      {badge !== undefined && badge > 0 && (
        <span style={{ background: '#D85A30', color: '#fff', fontSize: '10px', fontWeight: 700, borderRadius: '20px', padding: '2px 7px' }}>{badge}</span>
      )}
    </Link>
  )
}
